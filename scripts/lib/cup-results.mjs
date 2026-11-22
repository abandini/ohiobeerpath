// Reads an Ohio Craft Brewers Cup winners page (ohiocraftbrewerscup.com) into one record per category.
// The page is a run of text cells: a category heading (sometimes split in two after a slash, "BELGIAN/" + "FRENCH SAISON"),
// then "Gold", an entry, "Silver", an entry, "Bronze", an entry. Comparison is on whole cells after normalizing: entities
// decoded, runs of whitespace made one space, upper case. Nothing is matched by "contains" or "starts with".
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&#39;|&#039;|&apos;|&rsquo;|’/g, "'").replace(/&nbsp;| /g, ' ').replace(/&mdash;/g, '—').replace(/&ndash;/g, '–');
export const norm = (s) => decode(String(s)).replace(/\s+/g, ' ').trim().toUpperCase();

export function parseCupResults(html) {
  const cells = String(html).replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, ' ').split(/<[^>]+>/).map(norm).filter(Boolean);
  const records = [];
  for (let i = 1; i + 5 < cells.length; i++) {
    if (cells[i] !== 'GOLD' || cells[i + 2] !== 'SILVER' || cells[i + 4] !== 'BRONZE') continue;
    const category = i >= 2 && cells[i - 2].endsWith('/') ? cells[i - 2] + cells[i - 1] : cells[i - 1];
    records.push({ category, Gold: cells[i + 1], Silver: cells[i + 3], Bronze: cells[i + 5] });
  }
  return records;
}

/** True only when a record with exactly this category has exactly this entry in the claimed medal slot. */
export function hasMedal(records, { category, medal, printed }) {
  const cat = norm(category), want = norm(printed);
  return records.some((r) => r.category === cat && r[medal] === want);
}
