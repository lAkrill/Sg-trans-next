import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { permissionsApi } from '@/api/permissions';
import type { RolePermission } from '@/types/permissions';

export const permissionKeys = {
  all: ['permissions'] as const,
  names: () => [...permissionKeys.all, 'names'] as const,
  role: (roleId: number) => [...permissionKeys.all, 'role', roleId] as const,
};

export const usePermissionNames = () => {
  return useQuery({
    queryKey: permissionKeys.names(),
    queryFn: permissionsApi.getAllNames,
  });
};

export const useRolePermissions = (roleId: number) => {
  return useQuery({
    queryKey: permissionKeys.role(roleId),
    queryFn: () => permissionsApi.getByRoleId(roleId),
    enabled: Number.isInteger(roleId) && roleId > 0,
  });
};

export const useSaveRolePermissions = (roleId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      creates,
      updates,
    }: {
      creates: RolePermission[];
      updates: RolePermission[];
    }) => {
      if (updates.length > 0) {
        await permissionsApi.update(updates);
      }
      for (const permission of creates) {
        await permissionsApi.create(permission);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: permissionKeys.role(roleId) });
    },
  });
};
