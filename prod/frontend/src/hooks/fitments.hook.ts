import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fitmentsApi } from '@/api/directories';

export const fitmentsKeys = {
  all: ['directories', 'fitments'] as const,
  byId: (id: string) => [...fitmentsKeys.all, id] as const,
};

export const useFitments = () => {
  return useQuery({
    queryKey: fitmentsKeys.all,
    queryFn: fitmentsApi.getAll,
  });
};

export const useFitment = (id: string) => {
  return useQuery({
    queryKey: fitmentsKeys.byId(id),
    queryFn: () => fitmentsApi.getById(id),
    enabled: !!id,
  });
};

export const useCreateFitment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fitmentsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fitmentsKeys.all });
    },
  });
};

export const useUpdateFitment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof fitmentsApi.update>[1] }) =>
      fitmentsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fitmentsKeys.all });
    },
  });
};

export const useDeleteFitment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fitmentsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fitmentsKeys.all });
    },
  });
};
