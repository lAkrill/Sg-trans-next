/** Типы деталей, исключённые из проекта */
const EXCLUDED_PART_TYPE_NAME_FRAGMENTS = ["эластомер"] as const;

export function isExcludedPartType(name?: string | null): boolean {
  if (!name) return false;
  const normalized = name.toLowerCase();
  return EXCLUDED_PART_TYPE_NAME_FRAGMENTS.some((fragment) =>
    normalized.includes(fragment)
  );
}

export function filterAllowedPartTypes<T extends { name?: string | null }>(
  partTypes: T[]
): T[] {
  return partTypes.filter((partType) => !isExcludedPartType(partType.name));
}
