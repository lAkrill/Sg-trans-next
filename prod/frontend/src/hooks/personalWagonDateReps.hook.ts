import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { personalWagonDateRepsApi } from '@/api/directories';

export const personalWagonDateRepsKeys = {
  all: ['directories', 'personalWagonDateReps'] as const,
  byId: (id: string) => [...personalWagonDateRepsKeys.all, id] as const,
};

export const usePersonalWagonDateReps = () => {
  return useQuery({
    queryKey: personalWagonDateRepsKeys.all,
    queryFn: personalWagonDateRepsApi.getAll,
  });
};

export const usePersonalWagonDateRep = (id: string) => {
  return useQuery({
    queryKey: personalWagonDateRepsKeys.byId(id),
    queryFn: () => personalWagonDateRepsApi.getById(id),
    enabled: !!id,
  });
};

export const useCreatePersonalWagonDateRep = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: personalWagonDateRepsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: personalWagonDateRepsKeys.all });
    },
  });
};

export const useUpdatePersonalWagonDateRep = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof personalWagonDateRepsApi.update>[1] }) =>
      personalWagonDateRepsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: personalWagonDateRepsKeys.all });
    },
  });
};

export const useDeletePersonalWagonDateRep = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: personalWagonDateRepsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: personalWagonDateRepsKeys.all });
    },
  });
};
