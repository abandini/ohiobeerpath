# Marketing Agent Design — brewerytrip-marketing-agent

**Date:** 2026-03-03
**Status:** Approved
**Author:** Bill Burkey + Claude

## Overview

A standalone Cloudflare Worker that acts as a Full Marketing Coordinator for brewerytrip.com. It researches, drafts, and queues content across 4 channels (blog, newsletter, social, ads) with human-in-the-loop approval via a dashboard.

## Architecture

Queue-orchestrated pipeline. Cron triggers kick off daily workflows, Cloudflare Queues chain multi-step tasks, D1 stores all drafts and state, Claude (via AI Gateway) generates content.

```
┌─────────────────────────────────────────────────┐
│              Cron Triggers (Daily)               │
│  8 AM: content-pipeline  │  6 PM: intel-report   │
└────────────┬─────────────┴──────────┬────────────┘
             │                        │
             ▼                        ▼
┌─────────────────────────────────────────────────┐
│            Worker (src/index.ts)                 │
│  Routes: /dashboard, /api/approve, /api/publish  │
│  Queue Producer: enqueues pipeline steps         │
└────────────┬────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────┐
│         Queue: marketing-tasks                   │
│  Messages: { step, type, payload }               │
└────┬──────────┬──────────┬──────────┬───────────┘
     │          │          │          │
     ▼          ▼          ▼          ▼
 research    draft      notify    publish
```

Each queue step gets up to 15 minutes CPU. Steps are independently retryable.

## Cloudflare Bindings

| Binding | Type | Purpose |
|---------|------|---------|
| `DB` | D1 | Content drafts, intel, performance, publish logs |
| `CACHE` | KV | Rate limits, cached research data |
| `IMAGES` | R2 | Shared with Ohio Beer Path for blog images |
| `MARKETING_TASKS` | Queue | Pipeline orchestration |
| AI Gateway | External | Routes Claude API calls via Cloudflare |

## External Integrations

| Service | Purpose | Auth |
|---------|---------|------|
| Anthropic Claude (via AI Gateway) | Content generation | `ANTHROPIC_API_KEY` secret |
| Resend | Email sending (brewerytrip.com) | `RESEND_API_KEY` secret |
| X/Twitter API | Social posting (v1 optional) | `TWITTER_BEARER_TOKEN` secret |
| Ohio Beer Path API | Blog publishing, brewery data | Internal (same Cloudflare account) |
| BookForge | Long-form content writing (read-only) | Existing project, no changes |
| AI Studio | Image generation (read-only) | Existing project, no changes |

## Daily Workflows

### Morning Pipeline (8 AM UTC)

| Step | Queue Message | What Happens | Output |
|------|--------------|--------------|--------|
| 1. Research | `{step: "research"}` | Fetch brewery data from Ohio Beer Path API, check trending topics, pull competitor content | Research brief in D1 |
| 2. Draft Blog | `{step: "draft", type: "blog"}` | Claude generates blog post (brewery spotlight, seasonal guide, event roundup, or trail feature) | Blog draft (status: `pending`) |
| 3. Draft Newsletter | `{step: "draft", type: "newsletter"}` | Claude creates weekly email: featured breweries, events, blog teaser | Newsletter draft |
| 4. Draft Social | `{step: "draft", type: "social"}` | Claude generates 7 social posts (1/day): highlights, promos, facts, engagement | 7 social drafts |
| 5. Draft Ads | `{step: "draft", type: "ads"}` | Claude generates 5-10 ad variations targeting different angles (weekend, family, hidden gems, seasonal) | Ad copy drafts |
| 6. Notify | `{step: "notify"}` | Sends email via Resend: "X drafts ready for review" with dashboard link | Notification to owner |

### Evening Pipeline (6 PM UTC)

| Step | What Happens | Output |
|------|--------------|--------|
| 1. Competitive Intel | Check competitor sites for new features, content, pricing | Intel report in D1 |
| 2. Performance Check | Pull subscriber growth, blog traffic from Ohio Beer Path | Performance snapshot |
| 3. Daily Brief | Claude synthesizes intel + metrics into summary | Brief emailed to owner |

## Approval Flow

1. All generated content starts with status `pending`
2. Owner reviews on dashboard — can edit inline, approve, or reject
3. Approved content gets status `approved` and a `scheduled_at` timestamp
4. Publish step runs on schedule or immediately:
   - Blog → POST to Ohio Beer Path `/api/admin/blog`
   - Email → Resend API to all verified subscribers
   - Social → X/Twitter API (v1), others queued for manual posting
   - Ads → Stored for manual upload to Meta/Google Ads (v1)

## Database Schema

```sql
CREATE TABLE content_drafts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,              -- 'blog' | 'newsletter' | 'social' | 'ad'
  title TEXT,
  body TEXT NOT NULL,
  metadata TEXT,                   -- JSON: target_platform, ad_angle, etc.
  status TEXT DEFAULT 'pending',   -- pending | approved | published | rejected
  pipeline_run_id TEXT,
  scheduled_at TEXT,               -- for content calendar
  created_at TEXT DEFAULT (datetime('now')),
  approved_at TEXT,
  published_at TEXT
);

CREATE TABLE intel_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,              -- 'research_brief' | 'competitor' | 'daily_brief'
  content TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE performance_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  metric TEXT NOT NULL,            -- 'subscribers' | 'blog_views' | 'email_opens'
  value REAL,
  recorded_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE publish_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  draft_id INTEGER REFERENCES content_drafts(id),
  channel TEXT,                    -- 'blog' | 'resend' | 'twitter' | 'facebook_ads'
  external_id TEXT,
  status TEXT,                     -- 'sent' | 'failed' | 'scheduled'
  published_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_drafts_status ON content_drafts(status);
CREATE INDEX idx_drafts_type ON content_drafts(type);
CREATE INDEX idx_drafts_scheduled ON content_drafts(scheduled_at);
CREATE INDEX idx_publish_draft ON publish_log(draft_id);
```

## Dashboard

Server-rendered HTML at `/dashboard` (same pattern as Ohio Beer Path admin). Protected by basic auth.

### Views:
1. **Pending Approvals** — cards for each draft with preview, inline editing, approve/reject buttons
2. **Content Calendar** — weekly view showing scheduled content across all channels (blog, email, social, ads), each day as a column
3. **Today's Brief** — latest research summary + performance metrics
4. **Recent Activity** — publish log showing what went out, when, to which channel
5. **Pipeline Status** — current queue state (running/idle/error/last run time)

## Project Structure

```
brewerytrip-marketing-agent/
├── src/
│   ├── index.ts              # Worker entry: routes + cron + queue consumer
│   ├── types.ts              # TypeScript types
│   ├── pipeline/
│   │   ├── research.ts       # Step 1: data gathering + competitor intel
│   │   ├── draft.ts          # Step 2: Claude content generation (all types)
│   │   ├── notify.ts         # Step 3: email notification to owner
│   │   └── publish.ts        # Step 4: send to external platforms
│   ├── services/
│   │   ├── claude.ts         # AI Gateway client wrapper
│   │   ├── resend.ts         # Email sending via Resend
│   │   ├── twitter.ts        # X/Twitter posting
│   │   └── brewerytrip.ts    # Ohio Beer Path API client
│   ├── dashboard/
│   │   ├── layout.ts         # Dashboard HTML layout
│   │   ├── approvals.ts      # Pending content view
│   │   ├── calendar.ts       # Weekly content calendar
│   │   ├── brief.ts          # Daily brief view
│   │   └── activity.ts       # Publish log view
│   └── db/
│       └── queries.ts        # D1 query functions
├── migrations/
│   └── 0001_initial_schema.sql
├── wrangler.toml
├── .env.example
├── CLAUDE.md
├── package.json
└── tsconfig.json
```

## Secrets (wrangler secret put)

- `ANTHROPIC_API_KEY` — Claude API key
- `RESEND_API_KEY` — Resend email service
- `TWITTER_BEARER_TOKEN` — X/Twitter API (optional for v1)
- `ADMIN_PASS` — Dashboard authentication

## Cost Estimate

| Component | Monthly Cost |
|-----------|-------------|
| Cloudflare Workers (paid plan) | $5 |
| D1 + KV + Queue | Included in Workers paid |
| Claude API (~4 pipeline runs/day) | $60-120 |
| Resend (free tier, 3,000 emails/month) | $0 |
| **Total** | **$65-125/month** |

## Evolution Path

This agent is the first "department" of the company OS:
1. **v1 (this design):** Marketing Coordinator — content + email + social + ads
2. **v2:** Add Sales Agent (lead gen, CRM) as separate Worker with shared queue patterns
3. **v3:** Supervisor dashboard aggregating all department agents
4. **v4:** Migrate to Cloudflare Agents SDK when it reaches v1.0 for stateful inter-agent coordination
