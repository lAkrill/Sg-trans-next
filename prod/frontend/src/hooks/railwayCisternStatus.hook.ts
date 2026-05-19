import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cisternStatusesApi, convertToSelectOptions } from '@/api/directories';
import type { SelectOption } from '@/types/directories';

// Query keys
export const cisternStatusesKeys = {
  all: ['directories', 'cisternStatuses'] as const,
  byId: (id: string) => [...cisternStatusesKeys.all, id] as const,
};

// Hooks
export const useCisternStatuses = () => {
  return useQuery({
    queryKey: cisternStatusesKeys.all,
    queryFn: cisternStatusesApi.getAll,
  });
};

export const useCisternStatus = (id: string) => {
  return useQuery({
    queryKey: cisternStatusesKeys.byId(id),
    queryFn: () => cisternStatusesApi.getById(id),
    enabled: !!id,
  });
};

export const useCreateCisternStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cisternStatusesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cisternStatusesKeys.all });
    },
  });
};

export const useUpdateCisternStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof cisternStatusesApi.update>[1] }) =>
      cisternStatusesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cisternStatusesKeys.all });
    },
  });
};

export const useDeleteCisternStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cisternStatusesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cisternStatusesKeys.all });
    },
  });
};

// Helper hook for select options
export const useCisternStatusOptions = (): { data: SelectOption[] | undefined; isLoading: boolean; error: Error | null } => {
  const { data, isLoading, error } = useCisternStatuses();
  return {
    data: data ? convertToSelectOptions.cisternStatuses(data) : undefined,
    isLoading,
    error,
  };
};
