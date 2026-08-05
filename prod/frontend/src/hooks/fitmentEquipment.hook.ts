import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fitmentEquipmentApi } from '@/api/directories';
import type { CreateFitmentEquipmentDTO } from '@/types/directories';

export const fitmentEquipmentKeys = {
  all: ['directories', 'fitment-equipments'] as const,
  byId: (id: string) => [...fitmentEquipmentKeys.all, id] as const,
  filtered: (pageNumber: number, pageSize: number, operations?: number[]) =>
    [...fitmentEquipmentKeys.all, { pageNumber, pageSize, operations }] as const,
  lastByFitment: (fitmentId: string) =>
    [...fitmentEquipmentKeys.all, 'last-by-fitment', fitmentId] as const,
  byCistern: (cisternId: string) =>
    [...fitmentEquipmentKeys.all, 'by-cistern', cisternId] as const,
  lastByCistern: (cisternId: string) =>
    [...fitmentEquipmentKeys.all, 'last-by-cistern', cisternId] as const,
};

export const useFitmentEquipments = (
  pageNumber = 1,
  pageSize = 10,
  operations?: number[],
) => {
  return useQuery({
    queryKey: fitmentEquipmentKeys.filtered(pageNumber, pageSize, operations),
    queryFn: () => fitmentEquipmentApi.getAll(pageNumber, pageSize, operations),
  });
};

export const useFitmentEquipmentById = (id: string) => {
  return useQuery({
    queryKey: fitmentEquipmentKeys.byId(id),
    queryFn: () => fitmentEquipmentApi.getById(id),
    enabled: !!id,
  });
};

export const useLastFitmentEquipmentByFitment = (fitmentId: string) => {
  return useQuery({
    queryKey: fitmentEquipmentKeys.lastByFitment(fitmentId),
    queryFn: () => fitmentEquipmentApi.getLastByFitment(fitmentId),
    enabled: !!fitmentId,
  });
};

export const useFitmentEquipmentsByCistern = (cisternId: string) => {
  return useQuery({
    queryKey: fitmentEquipmentKeys.byCistern(cisternId),
    queryFn: () => fitmentEquipmentApi.getByCistern(cisternId),
    enabled: !!cisternId,
  });
};

export const useLastFitmentEquipmentsByCistern = (cisternId: string) => {
  return useQuery({
    queryKey: fitmentEquipmentKeys.lastByCistern(cisternId),
    queryFn: () => fitmentEquipmentApi.getLastByCistern(cisternId),
    enabled: !!cisternId,
  });
};

export const useCreateFitmentEquipment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateFitmentEquipmentDTO) => fitmentEquipmentApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fitmentEquipmentKeys.all });
    },
  });
};
