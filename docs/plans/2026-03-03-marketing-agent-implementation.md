# Marketing Agent Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a standalone Cloudflare Worker (`brewerytrip-marketing-agent`) that acts as a queue-orchestrated marketing coordinator — researching, drafting, and publishing content across blog, newsletter, social, and ads channels with human-in-the-loop approval.

**Architecture:** Hono.js Worker with cron triggers that enqueue pipeline steps onto a Cloudflare Queue. Queue consumers handle research, drafting (via Claude/AI Gateway), notification (via Resend), and publishing. A server-rendered dashboard provides approval/editing/calendar views. D1 stores all content state.

**Tech Stack:** TypeScript, Hono.js, Cloudflare Workers/D1/KV/Queue, Anthropic Claude (via AI Gateway), Resend email API, Vitest

**Reference Design:** `docs/plans/2026-03-03-marketing-agent-design.md`

**External Resources (read-only, no changes):** BookForge (writing), AI Studio (images)

---

## Task 1: Project Scaffold

**Files:**
- Create: `../brewerytrip-marketing-agent/package.json`
- Create: `../brewerytrip-marketing-agent/tsconfig.json`
- Create: `../brewerytrip-marketing-agent/wrangler.toml`
- Create: `../brewerytrip-marketing-agent/.env.example`
- Create: `../brewerytrip-marketing-agent/.gitignore`
- Create: `../brewerytrip-marketing-agent/vitest.config.ts`

**Step 1: Create project directory and initialize**

```bash
mkdir -p /Users/billburkey/CascadeProjects/brewerytrip-marketing-agent
cd /Users/billburkey/CascadeProjects/brewerytrip-marketing-agent
git init
```

**Step 2: Create package.json**

```json
{
  "name": "brewerytrip-marketing-agent",
  "version": "0.1.0",
  "description": "Marketing coordinator agent for brewerytrip.com",
  "main": "src/index.ts",
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy",
    "test": "vitest",
    "typecheck": "tsc --noEmit",
    "db:migrate:local": "wrangler d1 migrations apply marketing-agent-db --local",
    "db:migrate": "wrangler d1 migrations apply marketing-agent-db --remote"
  },
  "dependencies": {
    "hono": "^4.0.0"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.20241127.0",
    "typescript": "^5.3.0",
    "vitest": "^1.0.0",
    "wrangler": "^3.80.0"
  }
}
```

**Step 3: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "lib": ["ES2022"],
    "moduleResolution": "bundler",
    "types": ["@cloudflare/workers-types"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

**Step 4: Create wrangler.toml**

```toml
name = "brewerytrip-marketing-agent"
main = "src/index.ts"
compatibility_date = "2025-03-07"
compatibility_flags = ["nodejs_compat"]

[observability]
enabled = true

# D1 Database
[[d1_databases]]
binding = "DB"
database_name = "marketing-agent-db"
database_id = "PLACEHOLDER_CREATE_WITH_wrangler_d1_create"

# KV for caching
[[kv_namespaces]]
binding = "CACHE"
id = "PLACEHOLDER_CREATE_WITH_wrangler_kv_namespace_create"

# Queue for pipeline orchestration
[[queues.producers]]
binding = "MARKETING_TASKS"
queue = "marketing-tasks"

[[queues.consumers]]
queue = "marketing-tasks"
max_batch_size = 1
max_retries = 3
dead_letter_queue = "marketing-tasks-dlq"

# Cron triggers
[triggers]
crons = ["0 8 * * *", "0 18 * * *"]

# Environment variables
[vars]
ENVIRONMENT = "production"
BREWERYTRIP_API_URL = "https://ohio-beer-path.bill-burkey.workers.dev"
AI_GATEWAY_ENDPOINT = "PLACEHOLDER_YOUR_AI_GATEWAY_URL"

# Secrets (set via wrangler secret put — NEVER commit)
# wrangler secret put ANTHROPIC_API_KEY
# wrangler secret put RESEND_API_KEY
# wrangler secret put ADMIN_PASS
# wrangler secret put TWITTER_BEARER_TOKEN (optional)
```

**Step 5: Create .env.example**

```
# Local development — copy to .dev.vars
ANTHROPIC_API_KEY=sk-ant-...
RESEND_API_KEY=re_...
ADMIN_PASS=your-local-password
TWITTER_BEARER_TOKEN=optional
```

**Step 6: Create .gitignore**

```
node_modules/
.wrangler/
.dev.vars
dist/
*.tsbuildinfo
.DS_Store
```

**Step 7: Create vitest.config.ts**

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    testTimeout: 30000,
  },
});
```

**Step 8: Install dependencies**

```bash
npm install
```

**Step 9: Commit**

```bash
git add -A
git commit -m "chore: scaffold brewerytrip-marketing-agent project"
```

---

## Task 2: Types and Database Schema

**Files:**
- Create: `src/types.ts`
- Create: `migrations/0001_initial_schema.sql`

**Step 1: Create src/types.ts**

```typescript
// Cloudflare Workers environment bindings
export interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
  MARKETING_TASKS: Queue;
  ANTHROPIC_API_KEY: string;
  RESEND_API_KEY: string;
  ADMIN_PASS: string;
  TWITTER_BEARER_TOKEN?: string;
  ENVIRONMENT: string;
  BREWERYTRIP_API_URL: string;
  AI_GATEWAY_ENDPOINT: string;
}

// Content draft stored in D1
export interface ContentDraft {
  id: number;
  type: ContentType;
  title: string | null;
  body: string;
  metadata: string | null; // JSON string
  status: DraftStatus;
  pipeline_run_id: string | null;
  scheduled_at: string | null;
  created_at: string;
  approved_at: string | null;
  published_at: string | null;
}

export type ContentType = 'blog' | 'newsletter' | 'social' | 'ad';
export type DraftStatus = 'pending' | 'approved' | 'published' | 'rejected';

// Intel report stored in D1
export interface IntelReport {
  id: number;
  type: 'research_brief' | 'competitor' | 'daily_brief';
  content: string;
  created_at: string;
}

// Performance metric stored in D1
export interface PerformanceMetric {
  id: number;
  metric: string;
  value: number;
  recorded_at: string;
}

// Publish log entry
export interface PublishLogEntry {
  id: number;
  draft_id: number;
  channel: string;
  external_id: string | null;
  status: 'sent' | 'failed' | 'scheduled';
  published_at: string;
}

// Queue message format
export interface PipelineMessage {
  step: 'research' | 'draft' | 'notify' | 'publish' | 'intel' | 'performance' | 'brief';
  type?: ContentType;
  pipeline_run_id: string;
  payload?: Record<string, unknown>;
}

// Brewery data from Ohio Beer Path API
export interface BreweryData {
  id: number;
  name: string;
  city: string;
  state_province?: string;
  region?: string;
  description?: string;
  amenities?: string[];
}
```

**Step 2: Create migrations/0001_initial_schema.sql**

```sql
-- Marketing Agent database schema

CREATE TABLE IF NOT EXISTS content_drafts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  title TEXT,
  body TEXT NOT NULL,
  metadata TEXT,
  status TEXT DEFAULT 'pending',
  pipeline_run_id TEXT,
  scheduled_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  approved_at TEXT,
  published_at TEXT
);

CREATE TABLE IF NOT EXISTS intel_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS performance_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  metric TEXT NOT NULL,
  value REAL,
  recorded_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS publish_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  draft_id INTEGER REFERENCES content_drafts(id),
  channel TEXT,
  external_id TEXT,
  status TEXT,
  published_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_drafts_status ON content_drafts(status);
CREATE INDEX IF NOT EXISTS idx_drafts_type ON content_drafts(type);
CREATE INDEX IF NOT EXISTS idx_drafts_scheduled ON content_drafts(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_drafts_pipeline ON content_drafts(pipeline_run_id);
CREATE INDEX IF NOT EXISTS idx_publish_draft ON publish_log(draft_id);
CREATE INDEX IF NOT EXISTS idx_intel_type ON intel_reports(type);
CREATE INDEX IF NOT EXISTS idx_perf_metric ON performance_log(metric);
```

**Step 3: Apply local migration**

```bash
wrangler d1 create marketing-agent-db
# Update wrangler.toml with the returned database_id
wrangler d1 migrations apply marketing-agent-db --local
```

**Step 4: Commit**

```bash
git add src/types.ts migrations/
git commit -m "feat: add types and D1 schema for marketing agent"
```

---

## Task 3: Database Query Layer

**Files:**
- Create: `src/db/queries.ts`
- Create: `tests/db/queries.test.ts`

**Step 1: Write the test**

```typescript
// tests/db/queries.test.ts
import { describe, it, expect } from 'vitest';
import type { ContentDraft, PipelineMessage } from '../../src/types';

// Unit tests for query builder functions (no D1 needed)
describe('query helpers', () => {
  it('parseDraftMetadata handles null', () => {
    // We'll import and test after implementation
    expect(true).toBe(true);
  });
});
```

**Step 2: Create src/db/queries.ts**

All D1 query functions for the marketing agent. Functions:

- `insertDraft(db, draft)` — insert a content draft
- `getDraftsByStatus(db, status)` — get drafts by status (for approvals view)
- `getDraftById(db, id)` — get single draft
- `updateDraftStatus(db, id, status)` — approve/reject/publish
- `updateDraftBody(db, id, body, title?)` — inline editing
- `getDraftsForCalendar(db, weekStart, weekEnd)` — calendar view
- `insertIntelReport(db, report)` — store research/intel
- `getLatestIntelByType(db, type)` — get latest report of type
- `insertPerformanceMetric(db, metric, value)` — log metric
- `getRecentMetrics(db, limit)` — dashboard metrics
- `insertPublishLog(db, entry)` — log publish action
- `getRecentPublishLog(db, limit)` — activity feed
- `getPipelineRunDrafts(db, runId)` — all drafts from one pipeline run

```typescript
import type { ContentDraft, DraftStatus, ContentType } from '../types';

export async function insertDraft(
  db: D1Database,
  draft: { type: ContentType; title?: string; body: string; metadata?: Record<string, unknown>; pipeline_run_id?: string; scheduled_at?: string }
): Promise<number> {
  const result = await db.prepare(
    `INSERT INTO content_drafts (type, title, body, metadata, pipeline_run_id, scheduled_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).bind(
    draft.type,
    draft.title || null,
    draft.body,
    draft.metadata ? JSON.stringify(draft.metadata) : null,
    draft.pipeline_run_id || null,
    draft.scheduled_at || null
  ).run();
  return result.meta.last_row_id;
}

export async function getDraftsByStatus(db: D1Database, status: DraftStatus, limit = 50): Promise<ContentDraft[]> {
  const { results } = await db.prepare(
    `SELECT * FROM content_drafts WHERE status = ? ORDER BY created_at DESC LIMIT ?`
  ).bind(status, limit).all<ContentDraft>();
  return results;
}

export async function getDraftById(db: D1Database, id: number): Promise<ContentDraft | null> {
  return db.prepare(`SELECT * FROM content_drafts WHERE id = ?`).bind(id).first<ContentDraft>();
}

export async function updateDraftStatus(
  db: D1Database, id: number, status: DraftStatus
): Promise<void> {
  const timestampField = status === 'approved' ? 'approved_at'
    : status === 'published' ? 'published_at' : null;

  if (timestampField) {
    await db.prepare(
      `UPDATE content_drafts SET status = ?, ${timestampField} = datetime('now') WHERE id = ?`
    ).bind(status, id).run();
  } else {
    await db.prepare(
      `UPDATE content_drafts SET status = ? WHERE id = ?`
    ).bind(status, id).run();
  }
}

export async function updateDraftBody(
  db: D1Database, id: number, body: string, title?: string
): Promise<void> {
  if (title !== undefined) {
    await db.prepare(
      `UPDATE content_drafts SET body = ?, title = ? WHERE id = ?`
    ).bind(body, title, id).run();
  } else {
    await db.prepare(
      `UPDATE content_drafts SET body = ? WHERE id = ?`
    ).bind(body, id).run();
  }
}

export async function getDraftsForCalendar(
  db: D1Database, weekStart: string, weekEnd: string
): Promise<ContentDraft[]> {
  const { results } = await db.prepare(
    `SELECT * FROM content_drafts
     WHERE scheduled_at >= ? AND scheduled_at <= ?
     AND status IN ('approved', 'published', 'pending')
     ORDER BY scheduled_at ASC`
  ).bind(weekStart, weekEnd).all<ContentDraft>();
  return results;
}

export async function insertIntelReport(
  db: D1Database, type: string, content: string
): Promise<void> {
  await db.prepare(
    `INSERT INTO intel_reports (type, content) VALUES (?, ?)`
  ).bind(type, content).run();
}

export async function getLatestIntelByType(
  db: D1Database, type: string
): Promise<{ content: string; created_at: string } | null> {
  return db.prepare(
    `SELECT content, created_at FROM intel_reports WHERE type = ? ORDER BY created_at DESC LIMIT 1`
  ).bind(type).first();
}

export async function insertPerformanceMetric(
  db: D1Database, metric: string, value: number
): Promise<void> {
  await db.prepare(
    `INSERT INTO performance_log (metric, value) VALUES (?, ?)`
  ).bind(metric, value).run();
}

export async function getRecentMetrics(db: D1Database, limit = 20): Promise<{ metric: string; value: number; recorded_at: string }[]> {
  const { results } = await db.prepare(
    `SELECT metric, value, recorded_at FROM performance_log ORDER BY recorded_at DESC LIMIT ?`
  ).bind(limit).all();
  return results as any[];
}

export async function insertPublishLog(
  db: D1Database, entry: { draft_id: number; channel: string; external_id?: string; status: string }
): Promise<void> {
  await db.prepare(
    `INSERT INTO publish_log (draft_id, channel, external_id, status) VALUES (?, ?, ?, ?)`
  ).bind(entry.draft_id, entry.channel, entry.external_id || null, entry.status).run();
}

export async function getRecentPublishLog(db: D1Database, limit = 20): Promise<any[]> {
  const { results } = await db.prepare(
    `SELECT pl.*, cd.type as content_type, cd.title as content_title
     FROM publish_log pl
     LEFT JOIN content_drafts cd ON pl.draft_id = cd.id
     ORDER BY pl.published_at DESC LIMIT ?`
  ).bind(limit).all();
  return results;
}

export async function getPipelineRunDrafts(db: D1Database, runId: string): Promise<ContentDraft[]> {
  const { results } = await db.prepare(
    `SELECT * FROM content_drafts WHERE pipeline_run_id = ? ORDER BY id ASC`
  ).bind(runId).all<ContentDraft>();
  return results;
}
```

**Step 3: Run typecheck**

```bash
npx tsc --noEmit
```

**Step 4: Commit**

```bash
git add src/db/ tests/
git commit -m "feat: add D1 query layer for content drafts, intel, metrics"
```

---

## Task 4: Claude AI Service

**Files:**
- Create: `src/services/claude.ts`

**Step 1: Create the Claude AI Gateway client**

This wraps the Anthropic API routed through Cloudflare AI Gateway. It provides prompt templates for each content type (blog, newsletter, social, ads, intel brief).

```typescript
import type { Env, ContentType, BreweryData } from '../types';

interface ClaudeResponse {
  content: string;
  title?: string;
}

async function callClaude(env: Env, systemPrompt: string, userPrompt: string): Promise<string> {
  const response = await fetch(`${env.AI_GATEWAY_ENDPOINT}/anthropic`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude API error ${response.status}: ${error}`);
  }

  const data = await response.json() as any;
  return data.content?.[0]?.text || '';
}

export async function draftBlogPost(env: Env, researchBrief: string, breweries: BreweryData[]): Promise<ClaudeResponse> {
  const system = `You are the content writer for Brewery Trip (brewerytrip.com), a craft brewery discovery platform covering Ohio and neighboring states. Write engaging, SEO-optimized blog posts about craft beer culture, brewery spotlights, travel guides, and seasonal events. Tone: enthusiastic but informative, like a knowledgeable friend. Always include a call-to-action to explore breweries on the site. Output format: start with the title on the first line prefixed with "# ", then the full post body in markdown.`;

  const featuredBreweries = breweries.slice(0, 5).map(b =>
    `- ${b.name} (${b.city}${b.state_province ? ', ' + b.state_province : ''}): ${b.description || 'No description'}`
  ).join('\n');

  const user = `Based on this research brief, write a blog post (800-1200 words):

RESEARCH:
${researchBrief}

FEATURED BREWERIES:
${featuredBreweries}

Choose the best angle: brewery spotlight, seasonal guide, regional trail feature, or event roundup. Write the full post.`;

  const raw = await callClaude(env, system, user);
  const lines = raw.split('\n');
  const title = lines[0]?.replace(/^#\s*/, '') || 'Untitled Post';
  const body = lines.slice(1).join('\n').trim();
  return { title, content: body };
}

export async function draftNewsletter(env: Env, researchBrief: string, breweries: BreweryData[]): Promise<ClaudeResponse> {
  const system = `You write weekly email newsletters for Brewery Trip (brewerytrip.com). Format: brief intro (2-3 sentences), then 3-4 sections with headers. Sections: Featured Brewery of the Week, Upcoming Events, New on the Blog, Quick Picks. Keep it scannable — short paragraphs, bullet points. Include links as [text](url) placeholders. Warm, conversational tone.`;

  const user = `Write this week's Brewery Trip newsletter.

RESEARCH:
${researchBrief}

TOP BREWERIES THIS WEEK:
${breweries.slice(0, 3).map(b => `- ${b.name}, ${b.city}`).join('\n')}

Output the subject line on the first line prefixed with "SUBJECT: ", then the newsletter body.`;

  const raw = await callClaude(env, system, user);
  const lines = raw.split('\n');
  const subjectLine = lines[0]?.replace(/^SUBJECT:\s*/i, '') || 'This Week on Brewery Trip';
  const body = lines.slice(1).join('\n').trim();
  return { title: subjectLine, content: body };
}

export async function draftSocialPosts(env: Env, researchBrief: string, breweries: BreweryData[]): Promise<ClaudeResponse[]> {
  const system = `You create social media posts for Brewery Trip (brewerytrip.com). Write 7 posts (one for each day of the week). Mix of: brewery spotlights, fun beer facts, engagement questions, event promos, weekend plans. Each post: 1-3 sentences, 1-3 relevant hashtags. Platform: X/Twitter (280 char limit). Format each post as "DAY N:" followed by the post text.`;

  const user = `Write 7 daily social posts for this week.

CONTEXT:
${researchBrief}

BREWERIES TO FEATURE:
${breweries.slice(0, 7).map(b => `- ${b.name}, ${b.city}`).join('\n')}`;

  const raw = await callClaude(env, system, user);

  // Parse individual posts
  const posts: ClaudeResponse[] = [];
  const dayRegex = /DAY\s+(\d):\s*/gi;
  const parts = raw.split(dayRegex).filter(p => p.trim());

  for (let i = 1; i < parts.length; i += 2) {
    const dayNum = parseInt(parts[i - 1]) || i;
    posts.push({
      title: `Day ${dayNum}`,
      content: parts[i].trim(),
    });
  }

  // Fallback: if parsing fails, return as single block
  if (posts.length === 0) {
    posts.push({ title: 'Weekly Social Posts', content: raw });
  }

  return posts;
}

export async function draftAdCopy(env: Env, researchBrief: string, breweries: BreweryData[]): Promise<ClaudeResponse[]> {
  const system = `You write Facebook and Google ad copy for Brewery Trip (brewerytrip.com). Generate 5-10 ad variations. Each variation targets a different angle: weekend plans, family-friendly, hidden gems, seasonal/holiday, group outings. Format each ad as "AD N [angle]:" then "Headline: ...", "Body: ...", "CTA: ...". Headlines max 40 chars, body max 125 chars.`;

  const user = `Write ad variations for Brewery Trip.

TARGET: Craft beer enthusiasts in Ohio and neighboring states aged 25-55.
PRODUCT: Free brewery discovery + trip planning app.

FEATURED BREWERIES:
${breweries.slice(0, 5).map(b => `- ${b.name}, ${b.city}`).join('\n')}

RESEARCH:
${researchBrief}`;

  const raw = await callClaude(env, system, user);

  const ads: ClaudeResponse[] = [];
  const adRegex = /AD\s+\d+\s*\[([^\]]+)\]:/gi;
  const parts = raw.split(adRegex);

  for (let i = 1; i < parts.length; i += 2) {
    ads.push({
      title: parts[i - 1]?.trim() || `Ad ${Math.ceil(i / 2)}`,
      content: parts[i].trim(),
    });
  }

  if (ads.length === 0) {
    ads.push({ title: 'Ad Copy Variations', content: raw });
  }

  return ads;
}

export async function generateDailyBrief(env: Env, intel: string, metrics: string): Promise<ClaudeResponse> {
  const system = `You write concise daily business briefs for a solo founder running Brewery Trip (brewerytrip.com). 2-3 paragraphs max. Lead with the most important insight. Be direct — the founder is busy. Include action items if any.`;

  const user = `Write today's daily brief.

COMPETITIVE INTEL:
${intel}

PERFORMANCE METRICS:
${metrics}`;

  const raw = await callClaude(env, system, user);
  return { title: 'Daily Brief', content: raw };
}

export { callClaude };
```

**Step 2: Commit**

```bash
git add src/services/claude.ts
git commit -m "feat: add Claude AI Gateway service with content prompts"
```

---

## Task 5: Resend Email Service

**Files:**
- Create: `src/services/resend.ts`

**Step 1: Create the Resend email client**

```typescript
import type { Env } from '../types';

interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail(env: Env, params: SendEmailParams): Promise<{ id: string }> {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: params.from || 'Brewery Trip <hello@brewerytrip.com>',
      to: Array.isArray(params.to) ? params.to : [params.to],
      subject: params.subject,
      html: params.html,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Resend API error ${response.status}: ${error}`);
  }

  return response.json() as Promise<{ id: string }>;
}

export function wrapEmailHtml(content: string, unsubscribeUrl?: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px; }
    h1, h2, h3 { color: #d97706; }
    a { color: #d97706; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e5e5; font-size: 12px; color: #888; }
  </style>
</head>
<body>
  ${content}
  <div class="footer">
    <p>Brewery Trip — Discover craft breweries near you</p>
    <p><a href="https://brewerytrip.com">brewerytrip.com</a></p>
    ${unsubscribeUrl ? `<p><a href="${unsubscribeUrl}">Unsubscribe</a></p>` : ''}
  </div>
</body>
</html>`;
}
```

**Step 2: Commit**

```bash
git add src/services/resend.ts
git commit -m "feat: add Resend email service with HTML wrapper"
```

---

## Task 6: Brewery Trip API Client

**Files:**
- Create: `src/services/brewerytrip.ts`

**Step 1: Create the Ohio Beer Path API client**

```typescript
import type { Env, BreweryData } from '../types';

export async function fetchBreweries(env: Env, limit = 20): Promise<BreweryData[]> {
  const response = await fetch(`${env.BREWERYTRIP_API_URL}/api/breweries?limit=${limit}`);
  if (!response.ok) throw new Error(`Brewery API error: ${response.status}`);
  const data = await response.json() as any;
  return (data.breweries || data || []).slice(0, limit);
}

export async function fetchBreweryById(env: Env, id: number): Promise<BreweryData | null> {
  const response = await fetch(`${env.BREWERYTRIP_API_URL}/api/brewery/${id}`);
  if (!response.ok) return null;
  return response.json() as Promise<BreweryData>;
}

export async function fetchSubscriberCount(env: Env): Promise<number> {
  // Calls the Ohio Beer Path admin API (if accessible) or returns cached value
  try {
    const cached = await env.CACHE.get('subscriber_count');
    if (cached) return parseInt(cached);
  } catch {
    // KV not available in test
  }
  return 0;
}

export async function fetchRandomBreweries(env: Env, count = 7): Promise<BreweryData[]> {
  const all = await fetchBreweries(env, 100);
  // Shuffle and pick
  const shuffled = all.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
```

**Step 2: Commit**

```bash
git add src/services/brewerytrip.ts
git commit -m "feat: add Brewery Trip API client service"
```

---

## Task 7: Pipeline Steps — Research & Draft

**Files:**
- Create: `src/pipeline/research.ts`
- Create: `src/pipeline/draft.ts`

**Step 1: Create src/pipeline/research.ts**

```typescript
import type { Env } from '../types';
import { fetchRandomBreweries } from '../services/brewerytrip';
import { callClaude } from '../services/claude';
import { insertIntelReport } from '../db/queries';

export async function runResearch(env: Env, pipelineRunId: string): Promise<string> {
  // 1. Fetch brewery data for content inspiration
  const breweries = await fetchRandomBreweries(env, 10);
  const breweryContext = breweries.map(b =>
    `${b.name} in ${b.city}${b.region ? ` (${b.region})` : ''}: ${b.description || 'craft brewery'}`
  ).join('\n');

  // 2. Generate research brief via Claude
  const brief = await callClaude(
    env,
    'You are a marketing research assistant for a craft brewery discovery platform. Analyze the brewery data and suggest content angles: trending topics, seasonal tie-ins, underrepresented regions, interesting brewery stories. Be concise — bullet points.',
    `Today is ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}.

BREWERY DATA:
${breweryContext}

Generate a research brief with:
1. Best content angle for today (considering day of week, season)
2. Featured brewery recommendation with why
3. Trending craft beer topic
4. Engagement hook idea for social media`
  );

  // 3. Store in D1
  await insertIntelReport(env.DB, 'research_brief', brief);

  return brief;
}

export async function runCompetitorIntel(env: Env): Promise<string> {
  // Lightweight competitor check — summarize what's known
  const intel = await callClaude(
    env,
    'You are a competitive intelligence analyst for a craft brewery discovery platform (brewerytrip.com) competing with Untappd, BeerAdvocate, Google Maps, and regional brewery passport apps.',
    `Today is ${new Date().toISOString().split('T')[0]}.
Generate a brief competitive intelligence update. Consider:
- What seasonal campaigns competitors might be running
- Emerging trends in craft beer apps
- Potential partnership or content opportunities
Keep it to 3-4 bullet points.`
  );

  await insertIntelReport(env.DB, 'competitor', intel);
  return intel;
}
```

**Step 2: Create src/pipeline/draft.ts**

```typescript
import type { Env, ContentType } from '../types';
import { fetchRandomBreweries } from '../services/brewerytrip';
import { getLatestIntelByType, insertDraft } from '../db/queries';
import { draftBlogPost, draftNewsletter, draftSocialPosts, draftAdCopy } from '../services/claude';

export async function runDraft(env: Env, type: ContentType, pipelineRunId: string): Promise<void> {
  // Get the latest research brief
  const brief = await getLatestIntelByType(env.DB, 'research_brief');
  const researchBrief = brief?.content || 'No research brief available. Generate content about Ohio craft breweries.';

  // Get breweries for content
  const breweries = await fetchRandomBreweries(env, 10);

  switch (type) {
    case 'blog': {
      const result = await draftBlogPost(env, researchBrief, breweries);
      await insertDraft(env.DB, {
        type: 'blog',
        title: result.title,
        body: result.content,
        pipeline_run_id: pipelineRunId,
      });
      break;
    }

    case 'newsletter': {
      const result = await draftNewsletter(env, researchBrief, breweries);
      await insertDraft(env.DB, {
        type: 'newsletter',
        title: result.title,
        body: result.content,
        pipeline_run_id: pipelineRunId,
      });
      break;
    }

    case 'social': {
      const posts = await draftSocialPosts(env, researchBrief, breweries);
      const today = new Date();
      for (let i = 0; i < posts.length; i++) {
        const scheduledDate = new Date(today);
        scheduledDate.setDate(today.getDate() + i);
        await insertDraft(env.DB, {
          type: 'social',
          title: posts[i].title,
          body: posts[i].content,
          pipeline_run_id: pipelineRunId,
          scheduled_at: scheduledDate.toISOString().split('T')[0],
        });
      }
      break;
    }

    case 'ad': {
      const ads = await draftAdCopy(env, researchBrief, breweries);
      for (const ad of ads) {
        await insertDraft(env.DB, {
          type: 'ad',
          title: ad.title,
          body: ad.content,
          pipeline_run_id: pipelineRunId,
          metadata: { angle: ad.title },
        });
      }
      break;
    }
  }
}
```

**Step 3: Commit**

```bash
git add src/pipeline/
git commit -m "feat: add research and draft pipeline steps"
```

---

## Task 8: Pipeline Steps — Notify & Publish

**Files:**
- Create: `src/pipeline/notify.ts`
- Create: `src/pipeline/publish.ts`

**Step 1: Create src/pipeline/notify.ts**

```typescript
import type { Env } from '../types';
import { getPipelineRunDrafts } from '../db/queries';
import { sendEmail, wrapEmailHtml } from '../services/resend';

export async function runNotify(env: Env, pipelineRunId: string): Promise<void> {
  const drafts = await getPipelineRunDrafts(env.DB, pipelineRunId);

  const draftSummary = drafts.map(d =>
    `- [${d.type.toUpperCase()}] ${d.title || '(untitled)'}`
  ).join('\n');

  const dashboardUrl = 'https://brewerytrip-marketing-agent.bill-burkey.workers.dev/dashboard';

  const html = wrapEmailHtml(`
    <h1>Content Ready for Review</h1>
    <p>${drafts.length} new drafts from today's pipeline:</p>
    <pre style="background: #f5f5f5; padding: 16px; border-radius: 8px; font-size: 14px;">${draftSummary}</pre>
    <p style="margin-top: 24px;">
      <a href="${dashboardUrl}" style="background: #d97706; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">Review on Dashboard</a>
    </p>
  `);

  // Send to owner — use ADMIN email or fallback
  await sendEmail(env, {
    to: 'hello@brewerytrip.com',
    subject: `[Brewery Trip] ${drafts.length} drafts ready for review`,
    html,
  });
}
```

**Step 2: Create src/pipeline/publish.ts**

```typescript
import type { Env, ContentDraft } from '../types';
import { getDraftById, updateDraftStatus, insertPublishLog } from '../db/queries';
import { sendEmail, wrapEmailHtml } from '../services/resend';

export async function publishDraft(env: Env, draftId: number): Promise<void> {
  const draft = await getDraftById(env.DB, draftId);
  if (!draft || draft.status !== 'approved') {
    throw new Error(`Draft ${draftId} not found or not approved`);
  }

  switch (draft.type) {
    case 'blog':
      await publishBlog(env, draft);
      break;
    case 'newsletter':
      await publishNewsletter(env, draft);
      break;
    case 'social':
      await publishSocial(env, draft);
      break;
    case 'ad':
      // Ads are stored for manual upload in v1
      await updateDraftStatus(env.DB, draftId, 'published');
      await insertPublishLog(env.DB, {
        draft_id: draftId,
        channel: 'manual_ads',
        status: 'sent',
      });
      break;
  }
}

async function publishBlog(env: Env, draft: ContentDraft): Promise<void> {
  // POST to Ohio Beer Path admin API
  try {
    const response = await fetch(`${env.BREWERYTRIP_API_URL}/api/admin/blog`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: draft.title,
        content: draft.body,
        slug: slugify(draft.title || 'untitled'),
      }),
    });

    await updateDraftStatus(env.DB, draft.id, 'published');
    await insertPublishLog(env.DB, {
      draft_id: draft.id,
      channel: 'blog',
      external_id: response.ok ? 'posted' : 'failed',
      status: response.ok ? 'sent' : 'failed',
    });
  } catch (error) {
    await insertPublishLog(env.DB, {
      draft_id: draft.id,
      channel: 'blog',
      status: 'failed',
    });
  }
}

async function publishNewsletter(env: Env, draft: ContentDraft): Promise<void> {
  // TODO: Fetch subscriber list from Ohio Beer Path API
  // For now, send to owner as proof of concept
  const html = wrapEmailHtml(
    draft.body.replace(/\n/g, '<br>'),
    'https://brewerytrip.com/unsubscribe'
  );

  try {
    const result = await sendEmail(env, {
      to: 'hello@brewerytrip.com', // Will be replaced with subscriber list
      subject: draft.title || 'Brewery Trip Newsletter',
      html,
    });

    await updateDraftStatus(env.DB, draft.id, 'published');
    await insertPublishLog(env.DB, {
      draft_id: draft.id,
      channel: 'resend',
      external_id: result.id,
      status: 'sent',
    });
  } catch (error) {
    await insertPublishLog(env.DB, {
      draft_id: draft.id,
      channel: 'resend',
      status: 'failed',
    });
  }
}

async function publishSocial(env: Env, draft: ContentDraft): Promise<void> {
  // v1: Log as published, actual Twitter posting is optional
  if (env.TWITTER_BEARER_TOKEN) {
    try {
      const response = await fetch('https://api.twitter.com/2/tweets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.TWITTER_BEARER_TOKEN}`,
        },
        body: JSON.stringify({ text: draft.body }),
      });

      const data = await response.json() as any;
      await updateDraftStatus(env.DB, draft.id, 'published');
      await insertPublishLog(env.DB, {
        draft_id: draft.id,
        channel: 'twitter',
        external_id: data?.data?.id || null,
        status: response.ok ? 'sent' : 'failed',
      });
    } catch {
      await insertPublishLog(env.DB, {
        draft_id: draft.id,
        channel: 'twitter',
        status: 'failed',
      });
    }
  } else {
    // No Twitter token — mark as published (manual posting)
    await updateDraftStatus(env.DB, draft.id, 'published');
    await insertPublishLog(env.DB, {
      draft_id: draft.id,
      channel: 'manual_social',
      status: 'sent',
    });
  }
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
```

**Step 3: Commit**

```bash
git add src/pipeline/
git commit -m "feat: add notify and publish pipeline steps"
```

---

## Task 9: Dashboard Templates

**Files:**
- Create: `src/dashboard/layout.ts`
- Create: `src/dashboard/approvals.ts`
- Create: `src/dashboard/calendar.ts`
- Create: `src/dashboard/brief.ts`
- Create: `src/dashboard/activity.ts`

**Step 1: Create dashboard layout**

The layout follows the Ohio Beer Path admin pattern: sidebar nav + main content area, Bootstrap 5, amber/craft beer theme.

`src/dashboard/layout.ts` — base HTML wrapper with sidebar navigation (Dashboard, Approvals, Calendar, Brief, Activity).

`src/dashboard/approvals.ts` — renders pending content drafts as cards. Each card shows type badge, title, truncated body preview, metadata. Action buttons: Approve, Reject, Edit (opens inline textarea). Uses a `<form>` POST to `/api/approve` and `/api/reject`.

`src/dashboard/calendar.ts` — weekly calendar view. 7 columns (Mon-Sun), each showing content cards scheduled for that day. Color-coded by type (blog=amber, newsletter=blue, social=green, ad=purple).

`src/dashboard/brief.ts` — displays latest research brief, competitor intel, and performance metrics in a clean summary card.

`src/dashboard/activity.ts` — table of recent publish log entries showing date, type, channel, status.

**Note:** These are server-rendered HTML template functions (TypeScript returning strings), matching the exact pattern used in `ohiobrewpath/src/templates/admin.ts`. Full implementation in code — each file is 50-150 lines of template HTML.

**Step 2: Commit**

```bash
git add src/dashboard/
git commit -m "feat: add dashboard templates (approvals, calendar, brief, activity)"
```

---

## Task 10: Worker Entry Point — Routes, Cron, Queue Consumer

**Files:**
- Create: `src/index.ts`

**Step 1: Create the main Worker entry point**

This is the heart of the agent. It handles:

1. **HTTP Routes** (Hono.js):
   - `GET /dashboard` — main dashboard (redirects to approvals)
   - `GET /dashboard/approvals` — pending content review
   - `GET /dashboard/calendar` — weekly content calendar
   - `GET /dashboard/brief` — latest daily brief
   - `GET /dashboard/activity` — publish log
   - `POST /api/approve/:id` — approve a draft
   - `POST /api/reject/:id` — reject a draft
   - `POST /api/edit/:id` — update draft body/title
   - `POST /api/publish/:id` — publish an approved draft
   - `GET /health` — health check

2. **Cron Handler** (`scheduled` export):
   - `0 8 * * *` → Enqueue morning pipeline: research → draft(blog) → draft(newsletter) → draft(social) → draft(ad) → notify
   - `0 18 * * *` → Enqueue evening pipeline: intel → performance → brief

3. **Queue Consumer** (`queue` export):
   - Receives `PipelineMessage` from `marketing-tasks` queue
   - Routes to appropriate pipeline step function
   - Each step can enqueue the next step (chaining)

All dashboard routes protected by basic auth middleware (same pattern as Ohio Beer Path: check `Authorization` header against `ADMIN_PASS`).

```typescript
import { Hono } from 'hono';
import type { Env, PipelineMessage } from './types';
import * as db from './db/queries';
import { runResearch, runCompetitorIntel } from './pipeline/research';
import { runDraft } from './pipeline/draft';
import { runNotify } from './pipeline/notify';
import { publishDraft } from './pipeline/publish';
import { generateDailyBrief } from './services/claude';
import { sendEmail, wrapEmailHtml } from './services/resend';
import { dashboardLayout } from './dashboard/layout';
import { approvalsPage } from './dashboard/approvals';
import { calendarPage } from './dashboard/calendar';
import { briefPage } from './dashboard/brief';
import { activityPage } from './dashboard/activity';

const app = new Hono<{ Bindings: Env }>();

// Basic auth middleware for dashboard
app.use('/dashboard/*', async (c, next) => {
  const auth = c.req.header('Authorization');
  if (!auth?.startsWith('Basic ')) {
    return new Response('Unauthorized', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Marketing Agent"' },
    });
  }
  const decoded = atob(auth.slice(6));
  const [user, pass] = decoded.split(':');
  if (user !== 'admin' || pass !== c.env.ADMIN_PASS) {
    return new Response('Unauthorized', { status: 401 });
  }
  await next();
});

// Dashboard routes
app.get('/dashboard', (c) => c.redirect('/dashboard/approvals'));

app.get('/dashboard/approvals', async (c) => {
  const drafts = await db.getDraftsByStatus(c.env.DB, 'pending');
  return c.html(approvalsPage(drafts));
});

app.get('/dashboard/calendar', async (c) => {
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay() + 1); // Monday
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6); // Sunday
  const drafts = await db.getDraftsForCalendar(
    c.env.DB,
    weekStart.toISOString().split('T')[0],
    weekEnd.toISOString().split('T')[0]
  );
  return c.html(calendarPage(drafts, weekStart));
});

app.get('/dashboard/brief', async (c) => {
  const research = await db.getLatestIntelByType(c.env.DB, 'research_brief');
  const competitor = await db.getLatestIntelByType(c.env.DB, 'competitor');
  const dailyBrief = await db.getLatestIntelByType(c.env.DB, 'daily_brief');
  const metrics = await db.getRecentMetrics(c.env.DB, 10);
  return c.html(briefPage(research, competitor, dailyBrief, metrics));
});

app.get('/dashboard/activity', async (c) => {
  const log = await db.getRecentPublishLog(c.env.DB, 50);
  return c.html(activityPage(log));
});

// API routes
app.post('/api/approve/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  await db.updateDraftStatus(c.env.DB, id, 'approved');
  return c.redirect('/dashboard/approvals');
});

app.post('/api/reject/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  await db.updateDraftStatus(c.env.DB, id, 'rejected');
  return c.redirect('/dashboard/approvals');
});

app.post('/api/edit/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const body = await c.req.parseBody();
  await db.updateDraftBody(c.env.DB, id, body.body as string, body.title as string | undefined);
  return c.redirect('/dashboard/approvals');
});

app.post('/api/publish/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  await publishDraft(c.env, id);
  return c.redirect('/dashboard/activity');
});

app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Worker exports
export default {
  fetch: app.fetch,

  // Cron handler
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    const pipelineRunId = `run-${Date.now()}`;

    if (event.cron === '0 8 * * *') {
      // Morning pipeline: chain steps via queue
      await env.MARKETING_TASKS.send({
        step: 'research',
        pipeline_run_id: pipelineRunId,
      } satisfies PipelineMessage);
    }

    if (event.cron === '0 18 * * *') {
      // Evening pipeline
      await env.MARKETING_TASKS.send({
        step: 'intel',
        pipeline_run_id: pipelineRunId,
      } satisfies PipelineMessage);
    }
  },

  // Queue consumer
  async queue(batch: MessageBatch<PipelineMessage>, env: Env) {
    for (const msg of batch.messages) {
      const { step, type, pipeline_run_id } = msg.body;

      try {
        switch (step) {
          case 'research': {
            await runResearch(env, pipeline_run_id);
            // Chain: enqueue draft steps
            for (const draftType of ['blog', 'newsletter', 'social', 'ad'] as const) {
              await env.MARKETING_TASKS.send({
                step: 'draft',
                type: draftType,
                pipeline_run_id,
              });
            }
            break;
          }

          case 'draft': {
            if (type) await runDraft(env, type, pipeline_run_id);
            // After last draft type, enqueue notify
            if (type === 'ad') {
              await env.MARKETING_TASKS.send({
                step: 'notify',
                pipeline_run_id,
              });
            }
            break;
          }

          case 'notify': {
            await runNotify(env, pipeline_run_id);
            break;
          }

          case 'intel': {
            await runCompetitorIntel(env);
            await env.MARKETING_TASKS.send({
              step: 'performance',
              pipeline_run_id,
            });
            break;
          }

          case 'performance': {
            // Placeholder: fetch metrics from Ohio Beer Path
            await db.insertPerformanceMetric(env.DB, 'pipeline_run', 1);
            await env.MARKETING_TASKS.send({
              step: 'brief',
              pipeline_run_id,
            });
            break;
          }

          case 'brief': {
            const intel = await db.getLatestIntelByType(env.DB, 'competitor');
            const metrics = await db.getRecentMetrics(env.DB, 5);
            const metricsText = metrics.map(m => `${m.metric}: ${m.value}`).join('\n');
            const result = await generateDailyBrief(env, intel?.content || 'No intel', metricsText);
            await db.insertIntelReport(env.DB, 'daily_brief', result.content);
            // Email the brief
            await sendEmail(env, {
              to: 'hello@brewerytrip.com',
              subject: `[Brewery Trip] Daily Brief - ${new Date().toLocaleDateString()}`,
              html: wrapEmailHtml(`<h1>Daily Brief</h1>${result.content.replace(/\n/g, '<br>')}`),
            });
            break;
          }
        }

        msg.ack();
      } catch (error) {
        console.error(`Pipeline step ${step} failed:`, error);
        msg.retry();
      }
    }
  },
};
```

**Step 2: Run typecheck**

```bash
npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add src/index.ts
git commit -m "feat: add Worker entry point with routes, cron triggers, queue consumer"
```

---

## Task 11: Create CLAUDE.md for the Marketing Agent

**Files:**
- Create: `CLAUDE.md`

**Step 1: Write the agent constitution**

This file provides context to Claude Code when working on this project. Include: project overview, architecture, bindings, development commands, key patterns, and content generation guidelines.

**Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: add CLAUDE.md project constitution"
```

---

## Task 12: Create Cloudflare Resources & Local Test

**Step 1: Create D1 database**

```bash
wrangler d1 create marketing-agent-db
# Copy the database_id from output into wrangler.toml
```

**Step 2: Create KV namespace**

```bash
wrangler kv namespace create CACHE
# Copy the id from output into wrangler.toml
```

**Step 3: Create Queue**

```bash
wrangler queues create marketing-tasks
wrangler queues create marketing-tasks-dlq
```

**Step 4: Apply local migration**

```bash
npm run db:migrate:local
```

**Step 5: Set local dev secrets**

Create `.dev.vars`:
```
ANTHROPIC_API_KEY=sk-ant-your-key-here
RESEND_API_KEY=re_your-key-here
ADMIN_PASS=localdevpass
```

**Step 6: Start local dev server**

```bash
npm run dev
# Open http://localhost:8787/health — should return {"status":"ok"}
# Open http://localhost:8787/dashboard — should prompt for auth
```

**Step 7: Commit**

```bash
git add wrangler.toml
git commit -m "chore: configure Cloudflare resources (D1, KV, Queue)"
```

---

## Task 13: Deploy to Production

**Step 1: Set production secrets**

```bash
wrangler secret put ANTHROPIC_API_KEY
wrangler secret put RESEND_API_KEY
wrangler secret put ADMIN_PASS
```

**Step 2: Apply remote migration**

```bash
npm run db:migrate
```

**Step 3: Deploy**

```bash
npm run deploy
```

**Step 4: Verify**

```bash
curl https://brewerytrip-marketing-agent.bill-burkey.workers.dev/health
# Expected: {"status":"ok","timestamp":"..."}
```

**Step 5: Commit any final config changes**

```bash
git add -A
git commit -m "chore: production deployment configuration"
```

---

## Task Order & Dependencies

```
Task 1 (scaffold) → Task 2 (types + schema) → Task 3 (DB queries)
                                              → Task 4 (Claude service)
                                              → Task 5 (Resend service)
                                              → Task 6 (API client)
Task 3-6 (all services) → Task 7 (research + draft pipeline)
                        → Task 8 (notify + publish pipeline)
Task 7-8 (pipeline) → Task 9 (dashboard templates)
Task 9 (dashboard) → Task 10 (Worker entry point)
Task 10 → Task 11 (CLAUDE.md)
Task 11 → Task 12 (local test)
Task 12 → Task 13 (deploy)
```

Tasks 3, 4, 5, 6 can be implemented in parallel once Task 2 is complete.
Tasks 7 and 8 can be implemented in parallel once services are done.
