/** Битовая маска доступа: Delete | Update | Create | Read. Полный доступ — 0b1111 (15). */
export const AccessFlag = {
  Read: 1,
  Create: 2,
  Update: 4,
  Delete: 8,
} as const;

export const ACCESS_COLUMNS = [
  { flag: AccessFlag.Read, label: 'Чтение' },
  { flag: AccessFlag.Create, label: 'Создание' },
  { flag: AccessFlag.Update, label: 'Изменение' },
  { flag: AccessFlag.Delete, label: 'Удаление' },
] as const;

export type AccessMap = Record<number, number>;

export function hasAccess(access: number, flag: number): boolean {
  return (access & flag) === flag;
}

export function setAccessFlag(access: number, flag: number, enabled: boolean): number {
  return enabled ? access | flag : access & ~flag;
}

export function columnAccessState(accesses: number[], flag: number): boolean | 'indeterminate' {
  if (accesses.length === 0) return false;
  const enabledCount = accesses.filter((access) => hasAccess(access, flag)).length;
  if (enabledCount === 0) return false;
  if (enabledCount === accesses.length) return true;
  return 'indeterminate';
}

export function accessMapsEqual(left: AccessMap, right: AccessMap): boolean {
  const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
  for (const key of keys) {
    const id = Number(key);
    if ((left[id] ?? 0) !== (right[id] ?? 0)) return false;
  }
  return true;
}

export function buildRoleAccessMap(
  permissionIds: number[],
  settings: { permissionId: number; access: number }[],
): AccessMap {
  const granted = new Map(settings.map((setting) => [setting.permissionId, setting.access]));
  const accessMap: AccessMap = {};
  for (const permissionId of permissionIds) {
    accessMap[permissionId] = granted.get(permissionId) ?? 0;
  }
  return accessMap;
}
