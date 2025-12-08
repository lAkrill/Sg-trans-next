import { api } from '@/lib/api';
import type {
  RailwayCisternDetailDTO,
  RailwayCisternListDTO,
  CreateRailwayCisternDTO,
  UpdateRailwayCisternDTO,
  CisternsFilter,
  PaginatedCisternsResponse,
  FilteredCisternsResponse,
  RailwayCisternFilterSortDTO,
  SavedFilter,
  CreateSavedFilterDTO,
  UpdateSavedFilterDTO,
  FilteredCisternsApiResponse,
  RailwayCisternIdAndNumberDTO,
} from '@/types/cisterns';

const CISTERNS_ENDPOINT = '/api/railway-cisterns';

export const cisternsApi = {
  // Get paginated list of cisterns
  getAll: async (filter?: CisternsFilter): Promise<PaginatedCisternsResponse> => {
    const params = new URLSearchParams();
    
    // Note: search is not supported by /detailed/paged endpoint
    // if (filter?.search) params.append('search', filter.search);
    if (filter?.manufacturerId) params.append('manufacturerId', filter.manufacturerId);
    if (filter?.typeId) params.append('typeId', filter.typeId);
    if (filter?.ownerId) params.append('ownerId', filter.ownerId);
    if (filter?.affiliationId) params.append('affiliationId', filter.affiliationId);
    if (filter?.page) params.append('page', filter.page.toString());
    if (filter?.pageSize) params.append('pageSize', filter.pageSize.toString());

    const queryString = params.toString();
    const url = queryString ? `${CISTERNS_ENDPOINT}/detailed/paged?${queryString}` : `${CISTERNS_ENDPOINT}/detailed/paged`;
    
    const response = await api.get<PaginatedCisternsResponse>(url);
    return response.data;
  },

  // Get cistern by ID
  getById: async (id: string): Promise<RailwayCisternDetailDTO> => {
    const response = await api.get<RailwayCisternDetailDTO>(`${CISTERNS_ENDPOINT}/${id}`);
    return response.data;
  },

  // Create new cistern
  create: async (data: CreateRailwayCisternDTO): Promise<RailwayCisternDetailDTO> => {
    const response = await api.post<RailwayCisternDetailDTO>(CISTERNS_ENDPOINT, data);
    return response.data;
  },

  // Update cistern
  update: async (id: string, data: UpdateRailwayCisternDTO): Promise<RailwayCisternDetailDTO> => {
    const response = await api.put<RailwayCisternDetailDTO>(`${CISTERNS_ENDPOINT}/${id}`, data);
    return response.data;
  },

  // Delete cistern
  delete: async (id: string): Promise<void> => {
    await api.delete(`${CISTERNS_ENDPOINT}/${id}`);
  },

  // Search cisterns by number prefix
  search: async (prefix: string): Promise<RailwayCisternDetailDTO[]> => {
    if (!prefix.trim()) {
      return [];
    }
    const response = await api.get<RailwayCisternDetailDTO[]>(`${CISTERNS_ENDPOINT}/detailed/search?prefix=${encodeURIComponent(prefix)}`);
    return response.data;
  },

  // Get all cistern numbers
  getAllNumbers: async (): Promise<string[]> => {
    const response = await api.get<string[]>(`${CISTERNS_ENDPOINT}/numbers`);
    return response.data;
  },

  // Get all cistern IDs and numbers
  getAllIdAndNumbers: async (): Promise<RailwayCisternIdAndNumberDTO[]> => {
    const response = await api.get<RailwayCisternIdAndNumberDTO[]>(
      `${CISTERNS_ENDPOINT}/id-numbers`
    );
    return response.data;
  },

  // Advanced filter with pagination
  filterWithPagination: async (filterData: RailwayCisternFilterSortDTO): Promise<FilteredCisternsResponse> => {
    const response = await api.post<FilteredCisternsApiResponse>(`${CISTERNS_ENDPOINT}/filter`, filterData);
    const apiData = response.data;

    console.log('API Filter Response:', apiData);
    
    // Transform API response to match expected format
    return {
      railwayCisterns: apiData.items,
      totalCount: apiData.totalCount,
      currentPage: apiData.pageNumber,
      pageSize: apiData.pageSize,
      totalPages: apiData.totalPages,
    };
  },

  // Filter by saved filter
  filterBySaved: async (filterId: string): Promise<RailwayCisternListDTO[]> => {
    const response = await api.get<RailwayCisternListDTO[]>(`${CISTERNS_ENDPOINT}/filter/saved/${filterId}`);
    return response.data;
  },
};

// Saved filters API
export const savedFiltersApi = {
  // Get all saved filters for current user
  getAll: async (): Promise<SavedFilter[]> => {
    const response = await api.get<SavedFilter[]>('/api/saved-filters');
    return response.data;
  },

  // Get saved filter by ID
  getById: async (id: string): Promise<SavedFilter> => {
    const response = await api.get<SavedFilter>(`/api/saved-filters/${id}`);
    return response.data;
  },

  // Get filters by type
  getByType: async (typeId: string): Promise<SavedFilter[]> => {
    const response = await api.get<SavedFilter[]>(`/api/saved-filters/by-type/${typeId}`);
    return response.data;
  },

  // Create new saved filter
  create: async (data: CreateSavedFilterDTO): Promise<SavedFilter> => {
    const response = await api.post<SavedFilter>('/api/saved-filters', data);
    return response.data;
  },

  // Update saved filter
  update: async (id: string, data: UpdateSavedFilterDTO): Promise<void> => {
    await api.put(`/api/saved-filters/${id}`, data);
  },

  // Delete saved filter
  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/saved-filters/${id}`);
  },
};
