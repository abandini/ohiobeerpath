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
