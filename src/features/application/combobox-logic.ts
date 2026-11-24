/** Pure search and keyboard logic behind the searchable country and calling-code pickers. */

/** Lower-case, accent-free, trimmed: "Côte d'Ivoire" and "cote" should find each other. */
export function normalizeForSearch(text: string): string {
  return text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();
}

/**
 * Options whose label contains the query, with labels that START with it listed first and the original order
 * kept within each group. An empty query returns everything.
 */
export function filterOptions<T extends { readonly label: string }>(options: readonly T[], query: string): T[] {
  const q = normalizeForSearch(query);
  if (!q) return [...options];
  const startsWith: T[] = [];
  const contains: T[] = [];
  for (const option of options) {
    const label = normalizeForSearch(option.label);
    if (label.startsWith(q)) startsWith.push(option);
    else if (label.includes(q)) contains.push(option);
  }
  return [...startsWith, ...contains];
}

/** The next highlighted index for an arrow key, wrapping at both ends; -1 means nothing is highlighted yet. */
export function moveActive(current: number, delta: 1 | -1, length: number): number {
  if (length === 0) return -1;
  if (current < 0) return delta === 1 ? 0 : length - 1;
  return (current + delta + length) % length;
}
