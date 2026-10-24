// Shared template utility functions

// Generate a consistent hash code from a string
export const hashCode = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash;
};

// Serialize an object for a <script type="application/ld+json"> block. JSON.stringify
// leaves "</script>" intact, so a brewery description or review containing it would
// terminate the block early; escape "</" the way the HTML spec recommends.
export const jsonLd = (data: unknown): string =>
  JSON.stringify(data).replace(/<\//g, '<\\/').replace(/<!--/g, '\\u003c!--');

// Escape a string for use inside a double-quoted HTML attribute (meta content, href).
export const escapeAttr = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

// Trim a meta description to the ~160-character budget search engines display,
// cutting at a word boundary. Shorter strings are returned unchanged.
export const truncateDescription = (text: string, max = 160): string => {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const atWord = cut.lastIndexOf(' ');
  return (atWord > max * 0.6 ? cut.slice(0, atWord) : cut).replace(/[\s,;:.-]+$/, '') + '…';
};

/** Escape text for an HTML text node. */
export const escapeHtml = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/** Only http(s) URLs may be rendered as links; anything else (javascript:, data:, junk) is dropped. */
export const safeHttpUrl = (value?: string | null): string => {
  if (!value) return '';
  try {
    const u = new URL(value.trim());
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.href : '';
  } catch {
    return '';
  }
};

/** Hostname for display, or '' when the URL is not a valid http(s) URL. */
export const hostOf = (value?: string | null): string => {
  const safe = safeHttpUrl(value);
  if (!safe) return '';
  return new URL(safe).hostname.replace(/^www\./, '');
};

/** True only for a real calendar date in YYYY-MM-DD form (2026-02-30 is rejected). */
export const isCalendarDate = (iso?: string | null): boolean => {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const d = new Date(iso + 'T00:00:00Z');
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === iso;
};

export interface SourcedQuote { quote: string; sourceUrl: string; host: string; checkedAt: string }

/**
 * The one provenance gate. A quote is shown anywhere only when all three are present and valid:
 * nonblank text, an http(s) source URL, and a real check date. Everything else renders as listing facts.
 */
export const sourcedQuote = (row: { about_quote?: string | null; about_source_url?: string | null; about_checked_at?: string | null }): SourcedQuote | null => {
  const quote = (row.about_quote || '').trim();
  const sourceUrl = safeHttpUrl(row.about_source_url);
  const checkedAt = (row.about_checked_at || '').trim();
  if (!quote || !sourceUrl || !isCalendarDate(checkedAt)) return null;
  return { quote, sourceUrl, host: hostOf(sourceUrl), checkedAt };
};

/** Shorten a quote at a word boundary for cards and meta descriptions. */
export const excerpt = (text: string, max: number): string =>
  text.length <= max ? text : text.slice(0, max - 3).replace(/\s+\S*$/, '') + '…';

/**
 * Same-origin image path under /images/ with a conservative key allowlist (letters, digits, '-', '_', '.', '/'),
 * no '..' segments and no empty segments. Returns '' for anything else. Safe to place inside CSS url('…') and HTML
 * attributes because no quote, paren, backslash, whitespace or entity character can survive the allowlist.
 */
export const safeImagePath = (value?: string | null): string => {
  if (typeof value !== 'string') return '';
  const v = value.trim();
  if (!/^\/images\/[A-Za-z0-9_\-./]+$/.test(v)) return '';
  const segments = v.slice('/images/'.length).split('/');
  if (segments.some(s => s === '' || s === '.' || s === '..')) return '';
  return v;
};
