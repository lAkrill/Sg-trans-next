import { api } from '@/lib/api';
import type {
  AffiliationDTO,
  CreateAffiliationDTO,
  UpdateAffiliationDTO,
  DepotDTO,
  CreateDepotDTO,
  UpdateDepotDTO,
  ManufacturerDTO,
  CreateManufacturerDTO,
  UpdateManufacturerDTO,
  OwnerDTO,
  CreateOwnerDTO,
  UpdateOwnerDTO,
  WagonTypeDTO,
  CreateWagonTypeDTO,
  UpdateWagonTypeDTO,
  LocationDTO,
  CreateLocationDTO,
  UpdateLocationDTO,
  FilterTypeDTO,
  CreateFilterTypeDTO,
  UpdateFilterTypeDTO,
  PartTypeDTO,
  CreatePartTypeDTO,
  UpdatePartTypeDTO,
  PartStatusDTO,
  CreatePartStatusDTO,
  UpdatePartStatusDTO,
  RepairTypeDTO,
  CreateRepairTypeDTO,
  UpdateRepairTypeDTO,
  RegistrarDTO,
  CreateRegistrarDTO,
  UpdateRegistrarDTO,
  WagonModelDTO,
  CreateWagonModelDTO,
  UpdateWagonModelDTO,
  StampNumberDTO,
  CreateStampNumberDTO,
  UpdateStampNumberDTO,
  PartDTO,
  PaginatedPartsResponse,
  CreateWheelPairDTO,
  CreateSideFrameDTO,
  CreateBolsterDTO,
  CreateCouplerDTO,
  CreateShockAbsorberDTO,
  UpdateWheelPairDTO,
  UpdateSideFrameDTO,
  UpdateBolsterDTO,
  UpdateCouplerDTO,
  UpdateShockAbsorberDTO,
  PartEquipmentDTO,
  LastEquipmentDTO,
  PaginatedPartEquipmentResponse,
  PartFilterSortDTO,
  PartFilterSortWithoutPaginationDTO,
  PaginatedFilteredPartsResponse,
  DocumentDTO,
  CreateDocumentDTO,
  UpdateDocumentDTO,
  PaginatedDocumentsResponse,
  StationDTO,
  CreateStationDTO,
  UpdateStationDTO,
  PaginatedStationsResponse,
} from '@/types/directories';
import { CreateVesselDTO, PaginatedVesselsResponse, UpdateVesselDto, VesselDTO } from '@/types/vessels';

// Generic CRUD operations for directories
const createDirectoryApi = <T, CreateT, UpdateT>(endpoint: string) => ({
  getAll: async (): Promise<T[]> => {
    const response = await api.get(`/api/${endpoint}`);
    return response.data;
  },

  getById: async (id: string): Promise<T> => {
    const response = await api.get(`/api/${endpoint}/${id}`);
    return response.data;
  },

  create: async (data: CreateT): Promise<T> => {
    const response = await api.post(`/api/${endpoint}`, data);
    return response.data;
  },

  update: async (id: string, data: UpdateT): Promise<T> => {
    const response = await api.put(`/api/${endpoint}/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/${endpoint}/${id}`);
  },
});

// Affiliations API
export const affiliationsApi = createDirectoryApi<
  AffiliationDTO,
  CreateAffiliationDTO,
  UpdateAffiliationDTO
>('affiliations');

// Depots API
export const depotsApi = {
  ...createDirectoryApi<DepotDTO, CreateDepotDTO, UpdateDepotDTO>('depots'),
  
  search: async (searchTerm?: string): Promise<{ id: string; shortName: string }[]> => {
    const params = searchTerm ? `?searchTerm=${encodeURIComponent(searchTerm)}` : '';
    const response = await api.get(`/api/depots/search${params}`);
    return response.data;
  },
};

// Manufacturers API
export const manufacturersApi = createDirectoryApi<
  ManufacturerDTO,
  CreateManufacturerDTO,
  UpdateManufacturerDTO
>('manufacturers');

// Owners API
export const ownersApi = createDirectoryApi<
  OwnerDTO,
  CreateOwnerDTO,
  UpdateOwnerDTO
>('owners');

// WagonTypes API
export const wagonTypesApi = createDirectoryApi<
  WagonTypeDTO,
  CreateWagonTypeDTO,
  UpdateWagonTypeDTO
>('wagon-types');

// Locations API
export const locationsApi = createDirectoryApi<
  LocationDTO,
  CreateLocationDTO,
  UpdateLocationDTO
>('locations');

// FilterTypes API
export const filterTypesApi = createDirectoryApi<
  FilterTypeDTO,
  CreateFilterTypeDTO,
  UpdateFilterTypeDTO
>('filter-types');

// PartTypes API
export const partTypesApi = createDirectoryApi<
  PartTypeDTO,
  CreatePartTypeDTO,
  UpdatePartTypeDTO
>('part-types');

// PartStatuses API
export const partStatusesApi = createDirectoryApi<
  PartStatusDTO,
  CreatePartStatusDTO,
  UpdatePartStatusDTO
>('part-statuses');

// RepairTypes API
export const repairTypesApi = createDirectoryApi<
  RepairTypeDTO,
  CreateRepairTypeDTO,
  UpdateRepairTypeDTO
>('repair-types');

// Registrars API
export const registrarsApi = createDirectoryApi<
  RegistrarDTO,
  CreateRegistrarDTO,
  UpdateRegistrarDTO
>('registrars');

// WagonModels API
export const wagonModelsApi = createDirectoryApi<
  WagonModelDTO,
  CreateWagonModelDTO,
  UpdateWagonModelDTO
>('wagon-models');

// StampNumbers API
export const stampNumbersApi = createDirectoryApi<
  StampNumberDTO,
  CreateStampNumberDTO,
  UpdateStampNumberDTO
>('stamp-numbers');

// Helper functions to convert DTOs to SelectOptions
export const convertToSelectOptions = {
  manufacturers: (manufacturers: ManufacturerDTO[]) =>
    manufacturers.map(m => ({ value: m.id, label: m.name })),

  wagonTypes: (types: WagonTypeDTO[]) =>
    types.map(t => ({ value: t.id, label: t.name })),

  wagonModels: (models: WagonModelDTO[]) =>
    models.map(m => ({ value: m.id, label: m.name })),

  affiliations: (affiliations: AffiliationDTO[]) =>
    affiliations.map(a => ({ value: a.id, label: a.value })),

  owners: (owners: OwnerDTO[]) =>
    owners.map(o => ({ value: o.id, label: o.name })),

  depots: (depots: DepotDTO[]) =>
    depots.map(d => ({ value: d.id, label: d.shortName || d.name })),

  registrars: (registrars: RegistrarDTO[]) =>
    registrars.map(r => ({ value: r.id, label: r.name })),

  stampNumbers: (stampNumbers: StampNumberDTO[]) =>
    stampNumbers.map(s => ({ value: s.id, label: s.value })),

  partTypes: (partTypes: PartTypeDTO[]) =>
    partTypes.map(pt => ({ value: pt.id, label: `${pt.name} [${pt.code}]` })),

  partStatuses: (partStatuses: PartStatusDTO[]) =>
    partStatuses.map(ps => ({ value: ps.id, label: ps.name })),

  vessels: (vessels: { id: string; serialNumber?: string; manufacturer?: string }[]) =>
    vessels.map(v => ({ value: v.id, label: `${v.serialNumber ?? ''} (${v.manufacturer ?? ''})` })),
};

//Vessels API
export const vesselsApi = {
  getAll: async (pageNumber = 1, pageSize = 10): Promise<PaginatedVesselsResponse> => {
    const params = new URLSearchParams({
      pageNumber: pageNumber.toString(),
      pageSize: pageSize.toString(),
    });
    const response = await api.get(`/api/vessels?${params.toString()}`);
    return response.data;
  },

  getById: async (id: string): Promise<VesselDTO> => {
    const response = await api.get(`/api/vessels/${id}`);
    return response.data;
  },

  create: async (data: CreateVesselDTO): Promise<string> => {
    const response = await api.post('/api/vessels', data);
    return response.data;
  },

  update: async (id: string, data: UpdateVesselDto): Promise<void> => {
    await api.put(`/api/vessels/${id}`, data);
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/vessels/${id}`);
  },
};

// Parts API
export const partsApi = {
  getAll: async (pageNumber = 1, pageSize = 10, typeId?: string): Promise<PaginatedPartsResponse> => {
    const params = new URLSearchParams({
      pageNumber: pageNumber.toString(),
      pageSize: pageSize.toString(),
    });
    if (typeId) {
      params.append('typeId', typeId);
    }
    const response = await api.get(`/api/parts?${params.toString()}`);
    return response.data;
  },

  getById: async (id: string): Promise<PartDTO> => {
    const response = await api.get(`/api/parts/${id}`);
    return response.data;
  },

  createWheelPair: async (data: CreateWheelPairDTO): Promise<string> => {
    const response = await api.post('/api/parts/wheel-pairs', data);
    return response.data;
  },

  createSideFrame: async (data: CreateSideFrameDTO): Promise<string> => {
    const response = await api.post('/api/parts/side-frames', data);
    return response.data;
  },

  createBolster: async (data: CreateBolsterDTO): Promise<string> => {
    const response = await api.post('/api/parts/bolsters', data);
    return response.data;
  },

  createCoupler: async (data: CreateCouplerDTO): Promise<string> => {
    const response = await api.post('/api/parts/couplers', data);
    return response.data;
  },

  createShockAbsorber: async (data: CreateShockAbsorberDTO): Promise<string> => {
    const response = await api.post('/api/parts/shock-absorbers', data);
    return response.data;
  },

  updateWheelPair: async (id: string, data: UpdateWheelPairDTO): Promise<void> => {
    await api.put(`/api/parts/wheel-pairs/${id}`, data);
  },

  updateSideFrame: async (id: string, data: UpdateSideFrameDTO): Promise<void> => {
    await api.put(`/api/parts/side-frames/${id}`, data);
  },

  updateBolster: async (id: string, data: UpdateBolsterDTO): Promise<void> => {
    await api.put(`/api/parts/bolsters/${id}`, data);
  },

  updateCoupler: async (id: string, data: UpdateCouplerDTO): Promise<void> => {
    await api.put(`/api/parts/couplers/${id}`, data);
  },

  updateShockAbsorber: async (id: string, data: UpdateShockAbsorberDTO): Promise<void> => {
    await api.put(`/api/parts/shock-absorbers/${id}`, data);
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/parts/${id}`);
  },

  getInstallationHistory: async (partId: string): Promise<PartEquipmentDTO[]> => {
    const response = await api.get(`/api/part-equipments/by-part/${partId}`);
    return response.data;
  },
};

// Part Equipment API
export const partEquipmentApi = {
  getAll: async (pageNumber = 1, pageSize = 10, cisternId?: string): Promise<PaginatedPartEquipmentResponse> => {
    const params = new URLSearchParams({
      pageNumber: pageNumber.toString(),
      pageSize: pageSize.toString(),
    });
    if (cisternId) {
      params.append('cisternId', cisternId);
    }
    const response = await api.get(`/api/part-equipments?${params.toString()}`);
    return response.data;
  },

  getById: async (id: string): Promise<PartEquipmentDTO> => {
    const response = await api.get(`/api/part-equipments/${id}`);
    return response.data;
  },

  getByCistern: async (cisternId: string): Promise<PartEquipmentDTO[]> => {
    const response = await api.get(`/api/part-equipments/by-cistern/${cisternId}`);
    return response.data;
  },

  getLastByCistern: async (cisternId: string): Promise<LastEquipmentDTO[]> => {
    const response = await api.get(`/api/part-equipments/last-by-cistern/${cisternId}`);
    return response.data;
  },
};

// Parts Filter API
export const partsFilterApi = {
  filter: async (request: PartFilterSortDTO): Promise<PaginatedFilteredPartsResponse> => {
    const response = await api.post('/api/parts/filter', request);
    return response.data;
  },

  filterAll: async (request: PartFilterSortWithoutPaginationDTO): Promise<Record<string, unknown>[]> => {
    const response = await api.post('/api/parts/filter/all', request);
    return response.data;
  },

  getBySavedFilter: async (filterId: string): Promise<Record<string, unknown>[]> => {
    const response = await api.get(`/api/parts/filter/saved/${filterId}`);
    return response.data;
  },
};

// Documents API
export const documentsApi = {
  getAll: async (pageNumber = 1, pageSize = 10): Promise<PaginatedDocumentsResponse> => {
    const params = new URLSearchParams({
      pageNumber: pageNumber.toString(),
      pageSize: pageSize.toString(),
    });
    const response = await api.get(`/api/documents?${params.toString()}`);
    return response.data;
  },

  getById: async (id: string): Promise<DocumentDTO> => {
    const response = await api.get(`/api/documents/${id}`);
    return response.data;
  },

  create: async (data: CreateDocumentDTO): Promise<string> => {
    const response = await api.post('/api/documents', data);
    return response.data;
  },

  update: async (id: string, data: UpdateDocumentDTO): Promise<void> => {
    await api.put(`/api/documents/${id}`, data);
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/documents/${id}`);
  },
};

// Stations API
export const stationsApi = {
  getAll: async (pageNumber = 1, pageSize = 10): Promise<PaginatedStationsResponse> => {
    const params = new URLSearchParams({
      pageNumber: pageNumber.toString(),
      pageSize: pageSize.toString(),
    });
    const response = await api.get(`/api/stations?${params.toString()}`);
    return response.data;
  },

  getById: async (id: string): Promise<StationDTO> => {
    const response = await api.get(`/api/stations/${id}`);
    return response.data;
  },

  create: async (data: CreateStationDTO): Promise<string> => {
    const response = await api.post('/api/stations', data);
    return response.data;
  },

  update: async (id: string, data: UpdateStationDTO): Promise<void> => {
    await api.put(`/api/stations/${id}`, data);
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/stations/${id}`);
  },
};
