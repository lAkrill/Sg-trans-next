import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { documentsApi } from '@/api/directories';

// Query keys
export const documentsKeys = {
  all: ['directories', 'documents'] as const,
  allWithoutPagination: () => [...documentsKeys.all, 'all'] as const,
  list: (pageNumber: number, pageSize: number) => [...documentsKeys.all, 'list', pageNumber, pageSize] as const,
  byId: (id: string) => [...documentsKeys.all, id] as const,
};

// Hooks
export const useDocuments = (pageNumber = 1, pageSize = 10) => {
  return useQuery({
    queryKey: documentsKeys.list(pageNumber, pageSize),
    queryFn: () => documentsApi.getAll(pageNumber, pageSize),
  });
};

export const useAllDocuments = () => {
  return useQuery({
    queryKey: documentsKeys.allWithoutPagination(),
    queryFn: documentsApi.getAllWithoutPagination,
  });
};

export const useDocument = (id: string) => {
  return useQuery({
    queryKey: documentsKeys.byId(id),
    queryFn: () => documentsApi.getById(id),
    enabled: !!id,
  });
};

export const useCreateDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: documentsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentsKeys.all });
    },
  });
};

export const useUpdateDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof documentsApi.update>[1] }) =>
      documentsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentsKeys.all });
    },
  });
};

export const useDeleteDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: documentsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentsKeys.all });
    },
  });
};
