import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { documentsRegulatoryApi } from '@/api/directories';

export const documentsRegulatoryKeys = {
  all: ['directories', 'documentsRegulatory'] as const,
  byId: (id: string) => [...documentsRegulatoryKeys.all, id] as const,
};

export const useDocumentsRegulatory = () => {
  return useQuery({
    queryKey: documentsRegulatoryKeys.all,
    queryFn: documentsRegulatoryApi.getAll,
  });
};

export const useDocumentsRegulatoryById = (id: string) => {
  return useQuery({
    queryKey: documentsRegulatoryKeys.byId(id),
    queryFn: () => documentsRegulatoryApi.getById(id),
    enabled: !!id,
  });
};

export const useCreateDocumentsRegulatory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: documentsRegulatoryApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentsRegulatoryKeys.all });
    },
  });
};

export const useUpdateDocumentsRegulatory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof documentsRegulatoryApi.update>[1];
    }) => documentsRegulatoryApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentsRegulatoryKeys.all });
    },
  });
};

export const useDeleteDocumentsRegulatory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: documentsRegulatoryApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentsRegulatoryKeys.all });
    },
  });
};
