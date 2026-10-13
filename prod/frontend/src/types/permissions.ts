export interface PermissionName {
  id: number;
  name: string | null;
  description: string | null;
}

export interface RolePermission {
  roleId: number;
  permissionId: number;
  access: number;
}

export interface RolePermissionSetting {
  roleId: number;
  permissionId: number;
  permissionName: string | null;
  access: number;
}
