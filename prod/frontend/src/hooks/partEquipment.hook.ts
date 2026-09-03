import { useQuery } from '@tanstack/react-query';
import { partEquipmentApi } from '@/api/directories';

// Query keys
export const partEquipmentKeys = {
  all: ['directories', 'part-equipments'] as const,
  byId: (id: string) => [...partEquipmentKeys.all, id] as const,
  filtered: (pageNumber: number, pageSize: number, cisternId?: string) => 
    [...partEquipmentKeys.all, { pageNumber, pageSize, cisternId }] as const,
  byCistern: (cisternId: string) => [...partEquipmentKeys.all, 'by-cistern', cisternId] as const,
  lastByCistern: (cisternId: string) => [...partEquipmentKeys.all, 'last-by-cistern', cisternId] as const,
  byDocument: (documentId: string) => [...partEquipmentKeys.all, 'by-document', documentId] as const,
};

// Hooks
export const usePartEquipments = (pageNumber = 1, pageSize = 10, cisternId?: string) => {
  return useQuery({
    queryKey: partEquipmentKeys.filtered(pageNumber, pageSize, cisternId),
    queryFn: () => partEquipmentApi.getAll(pageNumber, pageSize, cisternId),
  });
};

export const usePartEquipmentById = (id: string) => {
  return useQuery({
    queryKey: partEquipmentKeys.byId(id),
    queryFn: () => partEquipmentApi.getById(id),
    enabled: !!id,
  });
};

export const usePartEquipmentsByCistern = (cisternId: string) => {
  return useQuery({
    queryKey: partEquipmentKeys.byCistern(cisternId),
    queryFn: () => partEquipmentApi.getByCistern(cisternId),
    enabled: !!cisternId,
  });
};

export const useLastPartEquipmentsByCistern = (cisternId: string) => {
  return useQuery({
    queryKey: partEquipmentKeys.lastByCistern(cisternId),
    queryFn: () => partEquipmentApi.getLastByCistern(cisternId),
    enabled: !!cisternId,
  });
};

export const usePartEquipmentsByDocument = (documentId: string) => {
  return useQuery({
    queryKey: partEquipmentKeys.byDocument(documentId),
    queryFn: () => partEquipmentApi.getByDocument(documentId),
    enabled: !!documentId,
  });
};
