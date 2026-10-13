import { api } from '@/lib/api';
import type { PermissionName, RolePermission, RolePermissionSetting } from '@/types/permissions';

export const permissionsApi = {
  getAllNames: async (): Promise<PermissionName[]> => {
    const response = await api.get<PermissionName[]>('/api/permissions/name/all');
    return response.data;
  },

  getByRoleId: async (roleId: number): Promise<RolePermissionSetting[]> => {
    const response = await api.get<RolePermissionSetting[]>(`/api/permissions/role/${roleId}`);
    return response.data;
  },

  create: async (data: RolePermission): Promise<void> => {
    await api.post('/api/permissions', data);
  },

  update: async (data: RolePermission[]): Promise<void> => {
    await api.put('/api/permissions', data);
  },
};
