import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { scrapmetalApi } from '@/api/directories';

export const scrapmetalKeys = {
  all: ['directories', 'scrapmetal'] as const,
  byId: (id: string) => [...scrapmetalKeys.all, id] as const,
  byDocument: (documentId: string) => [...scrapmetalKeys.all, 'document', documentId] as const,
};

export const useScrapmetal = () => {
  return useQuery({
    queryKey: scrapmetalKeys.all,
    queryFn: scrapmetalApi.getAll,
  });
};

export const useScrapmetalById = (id: string) => {
  return useQuery({
    queryKey: scrapmetalKeys.byId(id),
    queryFn: () => scrapmetalApi.getById(id),
    enabled: !!id,
  });
};

export const useScrapmetalByDocumentId = (documentId: string) => {
  return useQuery({
    queryKey: scrapmetalKeys.byDocument(documentId),
    queryFn: () => scrapmetalApi.getByDocumentId(documentId),
    enabled: !!documentId,
  });
};

export const useCreateScrapmetal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: scrapmetalApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scrapmetalKeys.all });
    },
  });
};

export const useUpdateScrapmetal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof scrapmetalApi.update>[1];
    }) => scrapmetalApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scrapmetalKeys.all });
    },
  });
};

export const useDeleteScrapmetal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: scrapmetalApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scrapmetalKeys.all });
    },
  });
};
