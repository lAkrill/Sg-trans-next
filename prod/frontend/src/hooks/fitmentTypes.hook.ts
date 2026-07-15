import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fitmentTypesApi, convertToSelectOptions } from '@/api/directories';
import type { SelectOption } from '@/types/directories';

export const fitmentTypesKeys = {
  all: ['directories', 'fitmentTypes'] as const,
  byId: (id: string) => [...fitmentTypesKeys.all, id] as const,
};

export const useFitmentTypes = () => {
  return useQuery({
    queryKey: fitmentTypesKeys.all,
    queryFn: fitmentTypesApi.getAll,
  });
};

export const useFitmentType = (id: string) => {
  return useQuery({
    queryKey: fitmentTypesKeys.byId(id),
    queryFn: () => fitmentTypesApi.getById(id),
    enabled: !!id,
  });
};

export const useCreateFitmentType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fitmentTypesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fitmentTypesKeys.all });
    },
  });
};

export const useUpdateFitmentType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof fitmentTypesApi.update>[1] }) =>
      fitmentTypesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fitmentTypesKeys.all });
    },
  });
};

export const useDeleteFitmentType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fitmentTypesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fitmentTypesKeys.all });
    },
  });
};

export const useFitmentTypeOptions = (): { data: SelectOption[] | undefined; isLoading: boolean; error: Error | null } => {
  const { data, isLoading, error } = useFitmentTypes();

  return {
    data: data ? convertToSelectOptions.fitmentTypes(data) : undefined,
    isLoading,
    error,
  };
};
