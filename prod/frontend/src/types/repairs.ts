// Repairs filter types (aligned with backend DTOs)

export interface DateTimeRange {
  from?: string; // ISO datetime string
  to?: string;
}

export interface RepairsInFilterCriteria {
  cisternNumbers?: string[];
  cisternIds?: string[];
  typeRepairIds?: string[];
  depotNames?: string[];
  depotIds?: string[];
  vu23?: string[];
  roadCodes?: string[];
  roadNames?: string[];
  stationCodes?: string[];
  stationNames?: string[];
  stationIds?: string[];
  dateIn?: DateTimeRange;
  adminRoadCodes?: string[];
}

export interface RepairsOutFilterCriteria {
  cisternNumbers?: string[];
  cisternIds?: string[];
  typeRepairIds?: string[];
  depotNames?: string[];
  depotIds?: string[];
  vu36?: string[];
  roadCodes?: string[];
  roadNames?: string[];
  dateIn?: DateTimeRange;
  dateOut?: DateTimeRange;
}

export interface RepairsSortCriteria {
  fieldName: string;
  descending: boolean;
}

export interface RepairsInFilterSortDTO {
  filters?: RepairsInFilterCriteria;
  sortFields?: RepairsSortCriteria[];
  selectedColumns?: string[];
  page: number;
  pageSize: number;
}

export interface RepairsOutFilterSortDTO {
  filters?: RepairsOutFilterCriteria;
  sortFields?: RepairsSortCriteria[];
  selectedColumns?: string[];
  page: number;
  pageSize: number;
}

export interface IntRange {
  from?: number;
  to?: number;
}

export interface RepairsMatchingFilterCriteria {
  cisternIds?: string[];
  repairInIds?: string[];
  repairOutIds?: string[];
  dateTime?: DateTimeRange;
  repairPeriod?: IntRange;
}

export interface RepairsMatchingFilterSortDTO {
  filters?: RepairsMatchingFilterCriteria;
  sortFields?: RepairsSortCriteria[];
  selectedColumns?: string[];
  page: number;
  pageSize: number;
}

export interface RepairsMatchingFilterSortWithoutPaginationDTO {
  filters?: RepairsMatchingFilterCriteria;
  sortFields?: RepairsSortCriteria[];
  selectedColumns?: string[];
}

export interface PaginatedRepairsResponse<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
}
