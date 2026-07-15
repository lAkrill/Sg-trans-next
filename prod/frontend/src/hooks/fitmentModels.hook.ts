import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fitmentModelsApi, convertToSelectOptions } from '@/api/directories';
import type { SelectOption } from '@/types/directories';

export const fitmentModelsKeys = {
  all: ['directories', 'fitmentModels'] as const,
  byId: (id: string) => [...fitmentModelsKeys.all, id] as const,
};

export const useFitmentModels = () => {
  return useQuery({
    queryKey: fitmentModelsKeys.all,
    queryFn: fitmentModelsApi.getAll,
  });
};

export const useFitmentModel = (id: string) => {
  return useQuery({
    queryKey: fitmentModelsKeys.byId(id),
    queryFn: () => fitmentModelsApi.getById(id),
    enabled: !!id,
  });
};

export const useCreateFitmentModel = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fitmentModelsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fitmentModelsKeys.all });
    },
  });
};

export const useUpdateFitmentModel = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof fitmentModelsApi.update>[1] }) =>
      fitmentModelsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fitmentModelsKeys.all });
    },
  });
};

export const useDeleteFitmentModel = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fitmentModelsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fitmentModelsKeys.all });
    },
  });
};

export const useFitmentModelOptions = (): { data: SelectOption[] | undefined; isLoading: boolean; error: Error | null } => {
  const { data, isLoading, error } = useFitmentModels();

  return {
    data: data ? convertToSelectOptions.fitmentModels(data) : undefined,
    isLoading,
    error,
  };
};
