import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cisternsApi, savedFiltersApi } from '@/api/cisterns';
import type { 
  CisternsFilter,
  RailwayCisternDetailDTO,
  RailwayCisternListDTO,
  CreateRailwayCisternDTO,
  UpdateRailwayCisternDTO,
  RailwayCisternFilterSortDTO,
  SavedFilter,
  CreateSavedFilterDTO,
  UpdateSavedFilterDTO,
  FilteredCisternsResponse,
  RailwayCisternIdAndNumberDTO,
} from '@/types/cisterns';

// Query keys
export const cisternsKeys = {
  all: ['cisterns'] as const,
  lists: () => [...cisternsKeys.all, 'list'] as const,
  list: (filter?: CisternsFilter) => [...cisternsKeys.lists(), filter] as const,
  details: () => [...cisternsKeys.all, 'detail'] as const,
  detail: (id: string) => [...cisternsKeys.details(), id] as const,
  search: () => [...cisternsKeys.all, 'search'] as const,
  searchResults: (prefix: string) => [...cisternsKeys.search(), prefix] as const,
  numbers: () => [...cisternsKeys.all, 'numbers'] as const,
  allNumbers: () => [...cisternsKeys.numbers(), 'all'] as const,
  numberSearch: (prefix: string) => [...cisternsKeys.numbers(), 'search', prefix] as const,
};

// Get paginated cisterns
export const useCisterns = (filter?: CisternsFilter) => {
  return useQuery({
    queryKey: cisternsKeys.list(filter),
    queryFn: () => cisternsApi.getAll(filter),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get cistern by ID
export const useCistern = (id: string) => {
  return useQuery({
    queryKey: cisternsKeys.detail(id),
    queryFn: () => cisternsApi.getById(id),
    enabled: !!id,
    staleTime: 0, // Don't use stale data, always fetch fresh when ID changes
    refetchOnWindowFocus: false,
    refetchOnMount: true, // Always refetch when component mounts
  });
};

// Create cistern
export const useCreateCistern = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRailwayCisternDTO) => cisternsApi.create(data),
    onSuccess: () => {
      // Invalidate and refetch cisterns list
      queryClient.invalidateQueries({ queryKey: cisternsKeys.lists() });
    },
  });
};

// Update cistern
export const useUpdateCistern = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRailwayCisternDTO }) => 
      cisternsApi.update(id, data),
    onSuccess: (data, variables) => {
      // Invalidate and refetch cisterns list
      queryClient.invalidateQueries({ queryKey: cisternsKeys.lists() });
      // Update the specific cistern in cache
      queryClient.setQueryData(cisternsKeys.detail(variables.id), data);
    },
  });
};

// Delete cistern
export const useDeleteCistern = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => cisternsApi.delete(id),
    onSuccess: () => {
      // Invalidate and refetch cisterns list
      queryClient.invalidateQueries({ queryKey: cisternsKeys.lists() });
    },
  });
};

// Search cisterns by number prefix
export const useSearchCisterns = (prefix: string, enabled: boolean = true) => {
  return useQuery<RailwayCisternDetailDTO[]>({
    queryKey: ['cisterns', 'search', prefix],
    queryFn: () => cisternsApi.search(prefix),
    enabled: enabled && prefix.length > 0,
    staleTime: 30000, // 30 seconds
  });
};

// Get all cistern numbers for autocomplete
export const useCisternNumbers = () => {
  return useQuery<string[]>({
    queryKey: cisternsKeys.allNumbers(),
    queryFn: () => cisternsApi.getAllNumbers(),
    staleTime: 10 * 60 * 1000, // 10 minutes - numbers don't change often
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
};

// Get all cistern IDs and numbers for select dropdowns
export const useCisternIdAndNumbers = () => {
  return useQuery<RailwayCisternIdAndNumberDTO[]>({
    queryKey: [...cisternsKeys.all, 'id-numbers'],
    queryFn: () => cisternsApi.getAllIdAndNumbers(),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
};

// Advanced filter with pagination
export const useCisternFilterWithPagination = (filterData: RailwayCisternFilterSortDTO, enabled: boolean = true) => {
  return useQuery<FilteredCisternsResponse>({
    queryKey: ['cisterns', 'filter', 'paginated', filterData],
    queryFn: () => cisternsApi.filterWithPagination(filterData),
    enabled,
    staleTime: 30000, // 30 seconds
  });
};

// Filter by saved filter
export const useCisternFilterBySaved = (filterId: string, enabled: boolean = true) => {
  return useQuery<RailwayCisternListDTO[]>({
    queryKey: ['cisterns', 'filter', 'saved', filterId],
    queryFn: () => cisternsApi.filterBySaved(filterId),
    enabled: enabled && !!filterId,
    staleTime: 30000, // 30 seconds
  });
};

// Saved filters hooks
export const useSavedFilters = () => {
  return useQuery<SavedFilter[]>({
    queryKey: ['saved-filters'],
    queryFn: () => savedFiltersApi.getAll(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useSavedFilter = (id: string) => {
  return useQuery<SavedFilter>({
    queryKey: ['saved-filters', id],
    queryFn: () => savedFiltersApi.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useSavedFiltersByType = (typeId: string) => {
  return useQuery<SavedFilter[]>({
    queryKey: ['saved-filters', 'by-type', typeId],
    queryFn: () => savedFiltersApi.getByType(typeId),
    enabled: !!typeId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCreateSavedFilter = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSavedFilterDTO) => savedFiltersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-filters'] });
    },
  });
};

export const useUpdateSavedFilter = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSavedFilterDTO }) => 
      savedFiltersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-filters'] });
    },
  });
};

export const useDeleteSavedFilter = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => savedFiltersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-filters'] });
    },
  });
};
