import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { vesselsApi } from '@/api/directories';
import type { CreateVesselDTO, UpdateVesselDto, VesselDTO, VesselListWithCisternNumberDTO } from '@/types/vessels';

export const vesselsKeys = {
  all: ['directories', 'vessels'] as const,
  byId: (id: string) => [...vesselsKeys.all, id] as const,
};

export const useVessels = () => {
  return useQuery({
    queryKey: vesselsKeys.all,
    queryFn: async () => {
      // vesselsApi.getAll may return different shapes depending on backend (paginated object or direct array).
      // Be resilient: handle array, { vessels: [...] }, { items: [...] }.
      const response = await vesselsApi.getAll(1, 1000);

      type PossibleResponse = unknown;

      const resp: PossibleResponse = response as unknown;

      if (Array.isArray(resp)) {
        return resp as VesselListWithCisternNumberDTO[];
      }

      if (typeof resp === 'object' && resp !== null) {
        const asObj = resp as Record<string, unknown>;
        if (Array.isArray(asObj.vessels)) {
          return asObj.vessels as VesselListWithCisternNumberDTO[];
        }
        if (Array.isArray(asObj.items)) {
          return asObj.items as VesselListWithCisternNumberDTO[];
        }
      }

      return [] as VesselListWithCisternNumberDTO[];
    },
  });
};

export const useVessel = (id: string) => {
  return useQuery({
    queryKey: vesselsKeys.byId(id),
    queryFn: () => vesselsApi.getById(id),
    enabled: !!id,
  });
};

export const useCreateVessel = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateVesselDTO): Promise<VesselListWithCisternNumberDTO> => {
      const id = await vesselsApi.create(data);
      // Return a mock VesselListWithCisternNumberDTO with minimal required data
      return {
        id,
        serialNumber: data.serialNumber,
        buildDate: data.buildDate,
        manufacturer: data.manufacturer,
        wagonModelId: data.wagonModelId,
        pressure: data.pressure,
        capacity: data.capacity,
        railwayCisternIdAndNumberDto: { id: data.railwayCisternId, number: '' },
      } as VesselListWithCisternNumberDTO;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vesselsKeys.all });
    },
  });
};

export const useUpdateVessel = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateVesselDto }): Promise<VesselListWithCisternNumberDTO> => {
      await vesselsApi.update(id, data);
      // Return a mock VesselListWithCisternNumberDTO with minimal required data
      return {
        id,
        serialNumber: data.serialNumber,
        buildDate: data.buildDate,
        manufacturer: data.manufacturer,
        wagonModelId: data.wagonModelId,
        pressure: data.pressure,
        capacity: data.capacity,
        railwayCisternIdAndNumberDto: { id: data.railwayCisternId, number: '' },
      } as VesselListWithCisternNumberDTO;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vesselsKeys.all });
    },
  });
};

export const useDeleteVessel = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: vesselsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vesselsKeys.all });
    },
  });
};