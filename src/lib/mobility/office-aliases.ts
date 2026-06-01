/** Known office name variants that refer to the same organization. */
const OFFICE_ALIAS_GROUPS: string[][] = [
  ['Cavite Police Provincial Office', 'Cavite PPO'],
];

function normalizeOfficeKey(value: string): string {
  return value.trim().toLowerCase();
}

function addVariant(variants: Set<string>, value: string) {
  const trimmed = value.trim();
  if (trimmed) {
    variants.add(trimmed);
  }
}

/**
 * Expands an office to equivalent names used in vehicle_data / personnel imports.
 * e.g. "Cavite Police Provincial Office" also matches "Cavite PPO".
 */
export function expandOfficeAliases(office: string): string[] {
  const trimmed = office.trim();
  if (!trimmed) {
    return [];
  }

  const variants = new Set<string>();
  addVariant(variants, trimmed);

  const fullPpoMatch = trimmed.match(/^(.+?)\s+Police Provincial Office$/i);
  if (fullPpoMatch) {
    addVariant(variants, `${fullPpoMatch[1].trim()} PPO`);
  }

  const shortPpoMatch = trimmed.match(/^(.+?)\s+PPO$/i);
  if (shortPpoMatch) {
    addVariant(variants, `${shortPpoMatch[1].trim()} Police Provincial Office`);
  }

  const key = normalizeOfficeKey(trimmed);
  for (const group of OFFICE_ALIAS_GROUPS) {
    const normalizedGroup = group.map(normalizeOfficeKey);
    if (normalizedGroup.includes(key)) {
      for (const alias of group) {
        addVariant(variants, alias);
      }
    }
  }

  return [...variants];
}
