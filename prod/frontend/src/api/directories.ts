import { api } from '@/lib/api';
import { filterAllowedPartTypes } from '@/lib/parts/part-types';
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
  FitmentDTO,
  CreateFitmentDTO,
  UpdateFitmentDTO,
  FitmentTypeDTO,
  CreateFitmentTypeDTO,
  UpdateFitmentTypeDTO,
  FitmentModelDTO,
  CreateFitmentModelDTO,
  UpdateFitmentModelDTO,
  PersonalWagonDateRepDTO,
  CreatePersonalWagonDateRepDTO,
  UpdatePersonalWagonDateRepDTO,
  StampNumberDTO,
  CreateStampNumberDTO,
  UpdateStampNumberDTO,
  PartDTO,
  PaginatedPartsResponse,
  CreatePartDTO,
  UpdatePartDTO,
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
  FitmentEquipmentDTO,
  CreateFitmentEquipmentDTO,
  PaginatedFitmentEquipmentResponse,
  PartFilterSortDTO,
  PartFilterSortWithoutPaginationDTO,
  PaginatedFilteredPartsResponse,
  FitmentFilterSortWithoutPaginationDTO,
  DocumentDTO,
  CreateDocumentDTO,
  UpdateDocumentDTO,
  PaginatedDocumentsResponse,
  StationDTO,
  CreateStationDTO,
  UpdateStationDTO,
  PaginatedStationsResponse,
  UpdateCisternStatusDTO,
  CisternStatusDTO,
  CreateCisternStatusDTO,
} from '@/types/directories';
import { CreateVesselDTO, PaginatedVesselsResponse, UpdateVesselDto, VesselDTO } from '@/types/vessels';

// Generic CRUD operations for directories
const createDirectoryApi = <T, CreateT, UpdateT>(endpoint: string) => ({
  getAll: async (): Promise<T[]> => {
    const response = await api.get(`/api/${endpoint}/all`);
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

// CisternStatuses API
export const cisternStatusesApi = createDirectoryApi<
  CisternStatusDTO,
  CreateCisternStatusDTO,
  UpdateCisternStatusDTO
>('railway-cistern-status');

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

// FitmentTypes API
export const fitmentTypesApi = createDirectoryApi<
  FitmentTypeDTO,
  CreateFitmentTypeDTO,
  UpdateFitmentTypeDTO
>('FitmentTypes');

// FitmentModels API
export const fitmentModelsApi = createDirectoryApi<
  FitmentModelDTO,
  CreateFitmentModelDTO,
  UpdateFitmentModelDTO
>('FitmentModels');

// Fitments API
export const fitmentsApi = createDirectoryApi<
  FitmentDTO,
  CreateFitmentDTO,
  UpdateFitmentDTO
>('Fitments');

// PersonalWagonDateReps API
export const personalWagonDateRepsApi = createDirectoryApi<
  PersonalWagonDateRepDTO,
  CreatePersonalWagonDateRepDTO,
  UpdatePersonalWagonDateRepDTO
>('personal-cis-repair-periods');

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

  cisternStatuses: (cisternStatuses: CisternStatusDTO[]) =>
    cisternStatuses.map(cs => ({ value: cs.id, label: cs.name })),
  
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
    filterAllowedPartTypes(partTypes).map(pt => ({
      value: pt.id,
      label: `${pt.name} [${pt.code}]`,
    })),

  partStatuses: (partStatuses: PartStatusDTO[]) =>
    partStatuses.map(ps => ({ value: ps.id, label: ps.name })),

  fitmentTypes: (fitmentTypes: FitmentTypeDTO[]) =>
    fitmentTypes.map(ft => ({ value: ft.id, label: `${ft.name} [${ft.code}]` })),

  fitmentModels: (fitmentModels: FitmentModelDTO[]) =>
    fitmentModels.map(fm => ({ value: fm.id, label: fm.name })),

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

  create: async (data: CreatePartDTO): Promise<string> => {
    const response = await api.post('/api/parts', data);
    return response.data;
  },

  update: async (id: string, data: UpdatePartDTO): Promise<void> => {
    await api.put(`/api/parts/${id}`, data);
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

// Fitments API
// export const fitmentsApi = {
//   getAll: async(): Promise<FitmentDTO[]> => {
//     const response = await api.get(`/api/Fitments/all`);
//     return response.data;
//   },
// };

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

// Fitment Equipment API (Привязка арматуры)
export const fitmentEquipmentApi = {
  getAll: async (pageNumber = 1, pageSize = 10): Promise<PaginatedFitmentEquipmentResponse> => {
    const params = new URLSearchParams({
      pageNumber: pageNumber.toString(),
      pageSize: pageSize.toString(),
    });
    const response = await api.get(`/api/fitment-equipments?${params.toString()}`);
    return response.data;
  },

  getById: async (id: string): Promise<FitmentEquipmentDTO> => {
    const response = await api.get(`/api/fitment-equipments/${id}`);
    return response.data;
  },

  create: async (data: CreateFitmentEquipmentDTO): Promise<void> => {
    await api.post('/api/fitment-equipments', data);
  },

  getLastByFitment: async (fitmentId: string): Promise<FitmentEquipmentDTO | null> => {
    try {
      const response = await api.get(`/api/fitment-equipments/last-by-fitment/${fitmentId}`);
      return response.data ?? null;
    } catch (err: unknown) {
      const status =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { status?: number } }).response?.status
          : undefined;
      if (status === 404) return null;
      throw err;
    }
  },

  getByCistern: async (cisternId: string): Promise<FitmentEquipmentDTO[]> => {
    const response = await api.get(`/api/fitment-equipments/by-cistern/${cisternId}`);
    return response.data;
  },

  getLastByCistern: async (cisternId: string): Promise<FitmentEquipmentDTO[]> => {
    const response = await api.get(`/api/fitment-equipments/last-by-cistern/${cisternId}`);
    return response.data;
  },
};

// Parts Filter API
export const partsFilterApi = {
  filter: async (request: PartFilterSortDTO): Promise<PaginatedFilteredPartsResponse> => {
    const response = await api.post('/api/parts/filter', request);
    return response.data;
  },

  filterAll: async (request: PartFilterSortWithoutPaginationDTO): Promise<PartDTO[]> => {
    const response = await api.post('/api/parts/filter/all', request);
    return response.data;
  },

  getBySavedFilter: async (filterId: string): Promise<Record<string, unknown>[]> => {
    const response = await api.get(`/api/parts/filter/saved/${filterId}`);
    return response.data;
  },
};

// Fitments Filter API
export const fitmentsFilterApi = {
  filterAll: async (request: FitmentFilterSortWithoutPaginationDTO): Promise<FitmentDTO[]> => {
    const response = await api.post('/api/fitments/filter/all', request);
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

  getAllWithoutPagination: async (): Promise<DocumentDTO[]> => {
    const response = await api.get('/api/documents/all');
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
