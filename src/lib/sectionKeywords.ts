/**
 * Seasonal keyword list rules for admin curated sections.
 *
 * Keywords are additive: every keyword an admin adds is kept alongside the ones
 * already saved, and removals happen one keyword at a time. Comparison is
 * case-insensitive so "Eid" and "eid" never occupy two chips.
 */

/** Split a keyword box value into clean terms. Accepts commas, semicolons and new lines. */
export function parseKeywordInput(text: string): string[] {
  return text
    .split(/[,\n;]/)
    .map((term) => term.trim().replace(/\s+/g, " "))
    .filter((term) => term.length > 0);
}

/**
 * Add incoming keywords to an existing saved list.
 * Already-saved terms are reported as duplicates and never re-added.
 */
export function mergeKeywords(
  existing: string[],
  incoming: string[],
): { merged: string[]; added: string[]; duplicates: string[] } {
  const seen = new Set(existing.map((k) => k.toLowerCase()));
  const merged = [...existing];
  const added: string[] = [];
  const duplicates: string[] = [];

  for (const raw of incoming) {
    const term = raw.trim().replace(/\s+/g, " ");
    if (!term) continue;
    const key = term.toLowerCase();
    if (seen.has(key)) {
      if (!duplicates.includes(term)) duplicates.push(term);
      continue;
    }
    seen.add(key);
    merged.push(term);
    added.push(term);
  }

  return { merged, added, duplicates };
}

/** Remove a single keyword, matching case-insensitively. Other keywords are kept. */
export function removeKeywordFrom(existing: string[], keyword: string): string[] {
  const key = keyword.trim().toLowerCase();
  return existing.filter((k) => k.trim().toLowerCase() !== key);
}
