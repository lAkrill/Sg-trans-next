// Railway Cistern types based on backend DTOs

import { VesselListDTO } from "./vessels";

export interface RailwayCisternListDTO {
  id: string;
  number: string;
  manufacturerName: string;
  buildDate: string;
  typeName: string;
  modelName: string;
  ownerName: string;
  registrationNumber: string;
  registrationDate: string;
  affiliationValue: string;
}

export interface RailwayCisternDetailDTO {
  id: string;
  number: string;
  manufacturer: {
    id: string;
    name: string;
  };
  buildDate: string;
  tareWeight: number;
  loadCapacity: number;
  length: number;
  axleCount: number;
  volume: number;
  fillingVolume?: number;
  initialTareWeight?: number;
  type: {
    id: string;
    name: string;
  };
  model: {
    id: string;
    name: string;
  };
  commissioningDate?: string;
  serialNumber: string;
  registrationNumber: string;
  registrationDate: string;
  registrar: {
    id: string;
    name: string;
  };
  notes: string;
  owner: {
    id: string;
    name: string;
  };
  techConditions?: string;
  pripiska?: string;
  reRegistrationDate?: string;
  pressure: number;
  testPressure: number;
  rent?: string;
  affiliation: {
    id: string;
    value: string;
  };
  serviceLifeYears: number;
  periodMajorRepair?: string;
  periodPeriodicTest?: string;
  periodIntermediateTest?: string;
  periodDepotRepair?: string;
  dangerClass: number;
  substance: string;
  tareWeight2: number;
  tareWeight3: number;
  createdAt: string;
  updatedAt: string;
  vessels: VesselListDTO[]
}

export interface RailwayCisternListDTO {
  id: string;
  number: string;
  manufacturerName: string;
  buildDate: string;
  typeName: string;
  modelName: string;
  ownerName: string;
  registrationNumber: string;
  registrationDate: string;
  affiliationValue: string;
  axleCount: number;
}

export interface CreateRailwayCisternDTO {
  number: string;
  manufacturerId: string;
  buildDate: string;
  tareWeight: number;
  loadCapacity: number;
  length: number;
  axleCount: number;
  volume: number;
  fillingVolume?: number;
  initialTareWeight?: number;
  typeId: string;
  modelId?: string;
  commissioningDate?: string;
  serialNumber: string;
  registrationNumber: string;
  registrationDate: string;
  registrarId?: string;
  notes: string;
  ownerId?: string;
  techConditions?: string;
  pripiska?: string;
  reRegistrationDate?: string;
  pressure: number;
  testPressure: number;
  rent?: string;
  affiliationId: string;
  serviceLifeYears: number;
  periodMajorRepair?: string;
  periodPeriodicTest?: string;
  periodIntermediateTest?: string;
  periodDepotRepair?: string;
  dangerClass: number;
  substance: string;
  tareWeight2: number;
  tareWeight3: number;
}

export interface UpdateRailwayCisternDTO extends CreateRailwayCisternDTO {
  id: string;
}

// Pagination and filtering
export interface CisternsFilter {
  search?: string;
  manufacturerId?: string;
  typeId?: string;
  ownerId?: string;
  affiliationId?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedCisternsResponse {
  railwayCisterns: RailwayCisternDetailDTO[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
}

export interface FilteredCisternsResponse {
  railwayCisterns: RailwayCisternListDTO[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
}

// Response type from filter API
export interface FilteredCisternsApiResponse {
  items: RailwayCisternListDTO[];
  pageNumber: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

// Advanced filtering types
export interface DateRange {
  from?: string;
  to?: string;
}

export interface NumberRange {
  from?: number;
  to?: number;
}

export interface FilterCriteria {
  numbers?: string[];
  numberPrefix?: string;
  manufacturerIds?: string[];
  buildDate?: DateRange;
  tareWeight?: NumberRange;
  loadCapacity?: NumberRange;
  length?: NumberRange;
  axleCounts?: number[];
  volume?: NumberRange;
  fillingVolume?: NumberRange;
  initialTareWeight?: NumberRange;
  typeIds?: string[];
  modelIds?: string[];
  commissioningDate?: DateRange;
  serialNumbers?: string[];
  registrationNumbers?: string[];
  registrationDate?: DateRange;
  registrarIds?: string[];
  ownerIds?: string[];
  techConditions?: string[];
  prispiski?: string[];
  reRegistrationDate?: DateRange;
  pressure?: NumberRange;
  testPressure?: NumberRange;
  rents?: string[];
  affiliationIds?: string[];
  serviceLifeYears?: NumberRange;
  periodMajorRepair?: NumberRange;
  periodPeriodicTest?: NumberRange;
  periodIntermediateTest?: NumberRange;
  periodDepotRepair?: NumberRange;
  dangerClasses?: number[];
  substances?: string[];
  tareWeight2?: NumberRange;
  tareWeight3?: NumberRange;
  createdAt?: DateRange;
  updatedAt?: DateRange;
}

export interface SortCriteria {
  fieldName: string;
  descending: boolean;
}

export interface RailwayCisternFilterSortDTO {
  filters?: FilterCriteria;
  sortFields?: SortCriteria[];
  selectedColumns?: string[];
  page?: number;
  pageSize?: number;
}

export interface RailwayCisternFilterSortWithoutPaginationDTO {
  filters?: FilterCriteria;
  sortFields?: SortCriteria[];
  selectedColumns?: string[];
}

// Saved filters
export interface FilterType {
  id: string;
  name: string;
}

export interface SavedFilter {
  id: string;
  name: string;
  filters?: FilterCriteria;
  sortFields?: SortCriteria[];
  selectedColumns?: string[];
  userId: string;
  filterTypeId: string;
  filterType: FilterType;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSavedFilterDTO {
  name: string;
  filters?: FilterCriteria;
  sortFields?: SortCriteria[];
  selectedColumns?: string[];
  filterTypeId: string;
}

export type UpdateSavedFilterDTO = CreateSavedFilterDTO;
