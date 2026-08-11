import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { employeesApi, convertToSelectOptions } from '@/api/directories';
import type { SelectOption } from '@/types/directories';

export const employeesKeys = {
  all: ['directories', 'employees'] as const,
  byId: (id: string) => [...employeesKeys.all, id] as const,
};

export const useEmployees = () => {
  return useQuery({
    queryKey: employeesKeys.all,
    queryFn: employeesApi.getAll,
  });
};

export const useEmployee = (id: string) => {
  return useQuery({
    queryKey: employeesKeys.byId(id),
    queryFn: () => employeesApi.getById(id),
    enabled: !!id,
  });
};

export const useCreateEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: employeesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeesKeys.all });
    },
  });
};

export const useUpdateEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof employeesApi.update>[1] }) =>
      employeesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeesKeys.all });
    },
  });
};

export const useDeleteEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: employeesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeesKeys.all });
    },
  });
};

export const useEmployeeOptions = (): {
  data: SelectOption[] | undefined;
  isLoading: boolean;
  error: Error | null;
} => {
  const { data, isLoading, error } = useEmployees();
  return {
    data: data ? convertToSelectOptions.employees(data) : undefined,
    isLoading,
    error,
  };
};
