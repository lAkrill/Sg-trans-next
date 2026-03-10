import { useQuery } from "@tanstack/react-query";
import { CisternRepairs } from "@/api/repairs";
import type {
  RepairsInFilterSortDTO,
  RepairsOutFilterSortDTO,
  PaginatedRepairsResponse,
} from "@/types/repairs";
import type { RepairsIn, RepairsOut } from "@/api/repairs";

export const repairsKeys = {
  all: ["repairs"] as const,
  in: () => [...repairsKeys.all, "in"] as const,
  out: () => [...repairsKeys.all, "out"] as const,
  matching: () => [...repairsKeys.all, "matching"] as const,
  filterIn: (data: RepairsInFilterSortDTO) =>
    [...repairsKeys.in(), "filter", data] as const,
  filterOut: (data: RepairsOutFilterSortDTO) =>
    [...repairsKeys.out(), "filter", data] as const,
};

export const useRepairsInFilter = (
  filterData: RepairsInFilterSortDTO,
  enabled: boolean = true
) => {
  return useQuery<PaginatedRepairsResponse<RepairsIn>>({
    queryKey: repairsKeys.filterIn(filterData),
    queryFn: () => CisternRepairs.filterRepairsIn(filterData),
    enabled,
    staleTime: 30000,
  });
};

export const useRepairsOutFilter = (
  filterData: RepairsOutFilterSortDTO,
  enabled: boolean = true
) => {
  return useQuery<PaginatedRepairsResponse<RepairsOut>>({
    queryKey: repairsKeys.filterOut(filterData),
    queryFn: () => CisternRepairs.filterRepairsOut(filterData),
    enabled,
    staleTime: 30000,
  });
};
