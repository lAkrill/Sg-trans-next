import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { partTypesApi, convertToSelectOptions } from '@/api/directories';
import { filterAllowedPartTypes } from '@/lib/parts/part-types';
import type { SelectOption } from '@/types/directories';

// Query keys
export const partTypesKeys = {
  all: ['directories', 'partTypes'] as const,
  byId: (id: string) => [...partTypesKeys.all, id] as const,
};

// Hooks
export const usePartTypes = () => {
  return useQuery({
    queryKey: partTypesKeys.all,
    queryFn: partTypesApi.getAll,
    select: filterAllowedPartTypes,
  });
};

export const usePartType = (id: string) => {
  return useQuery({
    queryKey: partTypesKeys.byId(id),
    queryFn: () => partTypesApi.getById(id),
    enabled: !!id,
  });
};

export const useCreatePartType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: partTypesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: partTypesKeys.all });
    },
  });
};

export const useUpdatePartType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof partTypesApi.update>[1] }) =>
      partTypesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: partTypesKeys.all });
    },
  });
};

export const useDeletePartType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: partTypesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: partTypesKeys.all });
    },
  });
};

// Helper hook for select options
export const usePartTypeOptions = (): { data: SelectOption[] | undefined; isLoading: boolean; error: Error | null } => {
  const { data, isLoading, error } = usePartTypes();
  return {
    data: data ? convertToSelectOptions.partTypes(data) : undefined,
    isLoading,
    error,
  };
};
