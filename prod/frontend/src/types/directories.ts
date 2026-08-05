// Базовые типы для справочников
export interface BaseEntity {
  id: string;
  createdAt?: string;
  updatedAt?: string;
  createdId?: string;
}

// Affiliation (Принадлежность)
export interface AffiliationDTO extends BaseEntity {
  value: string;
}

export interface CreateAffiliationDTO {
  value: string;
}

export interface UpdateAffiliationDTO {
  value: string;
}

// Depot (Депо)
export interface DepotDTO extends BaseEntity {
  name: string;
  code: string;
  location?: string;
  shortName?: string;
}

export interface CreateDepotDTO {
  name: string;
  code: string;
  location?: string;
  shortName?: string;
}

export interface UpdateDepotDTO {
  name: string;
  code: string;
  location?: string;
  shortName?: string;
}

// Document (Документ)
export interface DocumentDTO {
  id: string;
  number: string;
  type: number | null;
  date: string;
  author?: string | null;
  price?: number | null;
  note?: string | null;
  file?: string | null;
}

export interface CreateDocumentDTO {
  number: string;
  type: number | null;
  date: string;
  author?: string | null;
  price?: number | null;
  note?: string | null;
  file?: string | null;
}

export interface UpdateDocumentDTO {
  number: string;
  type: number | null;
  date: string;
  author?: string | null;
  price?: number | null;
  note?: string | null;
  file?: string | null;
}

// DocumentsRegulatory (Нормативные документы)
export interface DocumentsRegulatoryDTO {
  id: string;
  name: string;
  number?: string | null;
  date: string;
  file?: string | null;
  url?: string | null;
  updatedAt?: string;
  creatorId?: string;
}

export interface CreateDocumentsRegulatoryDTO {
  name: string;
  number?: string | null;
  date: string;
  file?: string | null;
  url?: string | null;
}

export interface UpdateDocumentsRegulatoryDTO {
  name: string;
  number?: string | null;
  date: string;
  file?: string | null;
  url?: string | null;
}

// Scrapmetal (Металлолом)
export interface ScrapmetalDTO {
  id: string;
  partId?: string | null;
  weight: number;
  date: string;
  code: number;
  note?: string | null;
  documentId?: string | null;
  updatedAt?: string;
  creatorId?: string;
}

export interface CreateScrapmetalDTO {
  partId?: string | null;
  weight: number;
  date: string;
  code: number;
  note?: string | null;
  documentId?: string | null;
}

export interface UpdateScrapmetalDTO {
  partId?: string | null;
  weight: number;
  date: string;
  code: number;
  note?: string | null;
  documentId?: string | null;
}

// Station (Станция)
export interface StationDTO {
  id: string;
  name: string;
  code?: string;
  osmId?: string;
  uicRef?: string;
  lat?: number;
  lon?: number;
  iso3166?: string;
  type?: string;
  operator?: string;
  country?: string;
  region?: string;
  division?: string;
  railway?: string;
}

export interface CreateStationDTO {
  name: string;
  code?: string;
  osmId?: string;
  uicRef?: string;
  lat?: number;
  lon?: number;
  iso3166?: string;
  type?: string;
  operator?: string;
  country?: string;
  region?: string;
  division?: string;
  railway?: string;
}

export interface UpdateStationDTO {
  name: string;
  code?: string;
  osmId?: string;
  uicRef?: string;
  lat?: number;
  lon?: number;
  iso3166?: string;
  type?: string;
  operator?: string;
  country?: string;
  region?: string;
  division?: string;
  railway?: string;
}

// Manufacturer (Производитель)
export interface ManufacturerDTO extends BaseEntity {
  name: string;
  country: string;
  shortName: string;
  code: number;
}

export interface CreateManufacturerDTO {
  name: string;
  country: string;
  shortName: string;
  code: number;
}

export interface UpdateManufacturerDTO {
  name: string;
  country: string;
  shortName: string;
  code: number;
}

// Owner (Собственник)
export interface OwnerDTO extends BaseEntity {
  name: string;
  unp: string;
  shortName: string;
  address: string;
  treatRepairs: boolean;
}

export interface CreateOwnerDTO {
  name: string;
  unp: string;
  shortName: string;
  address: string;
  treatRepairs: boolean;
}

export interface UpdateOwnerDTO {
  name: string;
  unp: string;
  shortName: string;
  address: string;
  treatRepairs: boolean;
}

// WagonType (Тип вагона)
export interface WagonTypeDTO extends BaseEntity {
  name: string;
  type: string;
}

export interface CreateWagonTypeDTO {
  name: string;
  type: string;
}

export interface UpdateWagonTypeDTO {
  name: string;
  type: string;
}

// CisternStatus (Статус цистерны)
export interface CisternStatusDTO extends BaseEntity {
  name: string;
}

export interface CreateCisternStatusDTO {
  name: string;
}

export interface UpdateCisternStatusDTO {
  name: string;
}

// Location (Местоположение)
export interface LocationDTO extends BaseEntity {
  name: string;
  code?: string;
}

export interface CreateLocationDTO {
  name: string;
  code?: string;
}

export interface UpdateLocationDTO {
  name: string;
  code?: string;
}

// FilterType (Тип фильтра)
export interface FilterTypeDTO extends BaseEntity {
  name: string;
  description?: string;
}

export interface CreateFilterTypeDTO {
  name: string;
  description?: string;
}

export interface UpdateFilterTypeDTO {
  name: string;
  description?: string;
}

// PartType (Тип детали)
export interface PartTypeDTO extends BaseEntity {
  name: string;
  code: number;
  description?: string;
  weight?: number;
}

export interface CreatePartTypeDTO {
  name: string;
  code: number;
  description?: string;
  weight?: number;
}

export interface UpdatePartTypeDTO {
  name: string;
  code: number;
  description?: string;
  weight?: number;
}

// PartStatus (Статус детали)
export interface PartStatusDTO extends BaseEntity {
  name: string;
  code: number;
  color?: string;
}

export interface CreatePartStatusDTO {
  name: string;
  code: number;
  color?: string;
}

export interface UpdatePartStatusDTO {
  name: string;
  code: number;
  color?: string;
}

// RepairType (Тип ремонта)
export interface RepairTypeDTO extends BaseEntity {
  name: string;
  description?: string;
  code: string;
  shortName: string;
  portalName: string;
}

export interface CreateRepairTypeDTO {
  name: string;
  description?: string;
}

export interface UpdateRepairTypeDTO {
  name: string;
  description?: string;
}

// Registrar (Регистратор)
export interface RegistrarDTO extends BaseEntity {
  name: string;
  code?: string;
}

export interface CreateRegistrarDTO {
  name: string;
  code?: string;
}

export interface UpdateRegistrarDTO {
  name: string;
  code?: string;
}

// WagonModel (Модель вагона)
export interface WagonModelDTO extends BaseEntity {
  name: string;
  majorRep: number;
  depoRep: number;
  intermediateTest: number;
  periodicTest: number;
  pprRep: number;
  fileImage?: string | null;
  fileRE?: string | null;
  fileTU?: string | null;
  firstName: string;
  lastName: string;
}

export interface CreateWagonModelDTO {
  name: string;
  majorRep: number;
  depoRep: number;
  intermediateTest: number;
  periodicTest: number;
  pprRep: number;
  fileImage?: string | null;
  fileRE?: string | null;
  fileTU?: string | null;
}

export interface UpdateWagonModelDTO {
  name: string;
  majorRep: number;
  depoRep: number;
  intermediateTest: number;
  periodicTest: number;
  pprRep: number;
  fileImage?: string | null;
  fileRE?: string | null;
  fileTU?: string | null;
}

// FitmentType (Тип арматуры)
export interface FitmentTypeDTO extends BaseEntity {
  name: string;
  code: number;
}

export interface CreateFitmentTypeDTO {
  name: string;
  code: number;
}

export interface UpdateFitmentTypeDTO {
  name: string;
  code: number;
}

// FitmentModel (Модель арматуры)
export interface FitmentModelDTO extends BaseEntity {
  name: string;
}

export interface CreateFitmentModelDTO {
  name: string;
}

export interface UpdateFitmentModelDTO {
  name: string;
}

// Fitment (Арматура)
export interface FitmentDTO extends BaseEntity {
  fitmentTypeId: string;
  serialNumber: string;
  passportNumber: string;
  buildDate: string;
  lastRepairDate?: string;
  periodRep: number;
  serviceLifeYears: number;
  modelId: string;
  manufacturerId?: string;
  depotId?: string | null;
  code?: number;
  locationDepoId?: string | null;
  locationCisternId?: string | null;
  fitmentType: FitmentTypeDTO;
  model: FitmentModelDTO;
  depot?: DepotDTO;
  locationDepo?: DepotDTO;
  locationCistern?: {
    id: string;
    number: string;
  };
}

export interface CreateFitmentDTO {
  fitmentTypeId: string;
  serialNumber: string;
  passportNumber: string;
  buildDate: string;
  lastRepairDate?: string | null;
  periodRep: number;
  serviceLifeYears: number;
  modelId: string;
  depotId: string | null;
  code: number;
  locationDepoId: string | null;
  locationCisternId: string | null;
}

export interface UpdateFitmentDTO {
  fitmentTypeId: string;
  serialNumber: string;
  passportNumber: string;
  buildDate: string;
  lastRepairDate?: string | null;
  periodRep: number;
  serviceLifeYears: number;
  modelId: string;
  depotId: string | null;
  code: number;
  locationDepoId: string | null;
  locationCisternId: string | null;
}

// PersonalWagonDateRep (Персональные периоды ремонта вагона)
export interface PersonalWagonDateRepDTO extends BaseEntity {
  cisternId: string;
  cisternNum: string;
  majorRep: number;
  depoRep: number;
  intermediateTest: number;
  periodicTest: number;
  pprRep: number;
}

export interface CreatePersonalWagonDateRepDTO {
  cisternNum: string;
  cisternId: string;
  majorRep: number;
  depoRep: number;
  intermediateTest: number;
  periodicTest: number;
  pprRep: number;
}

export interface UpdatePersonalWagonDateRepDTO {
  cisternNum: string;
  cisternId: string;
  majorRep: number;
  depoRep: number;
  intermediateTest: number;
  periodicTest: number;
  pprRep: number;
}

// StampNumber (Номер клейма)
export interface StampNumberDTO extends BaseEntity {
  value: string;
  description?: string;
}

export interface CreateStampNumberDTO {
  value: string;
  description?: string;
}

export interface UpdateStampNumberDTO {
  value: string;
  description?: string;
}

// Parts (Детали)
export interface PartDTO extends BaseEntity {
  id: string;
  partType: PartTypeDTO;
  depot?: DepotDTO;
  stampNumber: StampNumberDTO;
  serialNumber?: string;
  manufactureYear?: string | { year: number; month: number; day: number }; // DateOnly может прийти как объект
  currentLocation?: { id: string; number: string };
  status: PartStatusDTO;
  notes?: string;
  model?: string | null;
  createdAt: string;
  updatedAt: string;
  // wheelPair?: WheelPairDTO;
  // sideFrame?: SideFrameDTO;
  // bolster?: BolsterDTO;
  // coupler?: CouplerDTO;
  // shockAbsorber?: ShockAbsorberDTO;
  code?: number;
  documentId?: string;
  document?: DocumentDTO;
  extendedUntil?: string;
  file?: string;
}

// Fitments (Арматура)

export interface FitmentModelDTO
{
  id: string;
  name: string;
  updatedAt: string;
  creatorId: string;
}

export interface FitmentTypeDTO
{
  id: string;
  name: string;
  code: number;
  updatedAt: string;
  creatorId: string;
}

// export interface FitmentDTO
// {
//   id: string;
//   fitmentTypeId: string;
//   serialNumber: string;
//   passportNumber: string;
//   buildDate: string;
//   lastRepairDate?: string;
//   periodRep: number;
//   serviceLifeYears: number;
//   updatedAt: string;
//   creatorId: string;
//   fitmentType: FitmentTypeDTO;
//   model: FitmentModelDTO;
//   manufacturer?: ManufacturerDTO;
// }


export interface WheelPairDTO {
  thicknessLeft?: number;
  thicknessRight?: number;
  wheelType?: string;
}

export interface SideFrameDTO {
  serviceLifeYears?: number;
  extendedUntil?: string | { year: number; month: number; day: number }; // DateOnly может прийти как объект
}

export interface BolsterDTO {
  serviceLifeYears?: number;
  extendedUntil?: string | { year: number; month: number; day: number }; // DateOnly может прийти как объект
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface CouplerDTO {
  // Автосцепка не имеет специфичных полей
}

export interface ShockAbsorberDTO {
  model?: string;
  manufacturerCode?: string;
  nextRepairDate?: string | { year: number; month: number; day: number }; // DateOnly может прийти как объект
  serviceLifeYears?: number;
}

export interface CreatePartDTO {
  partTypeId: string;
  depotId: string | null;
  stampNumberId: string;
  serialNumber: string;
  manufactureYear: string | null;
  currentLocation: string | null;
  statusId: string;
  notes: string;
  code: number;
  documentId: string | null;
  serviceLifeYears: number | null;
  extendedUntil: string | null;
  model: string | null;
  file: string | null;
}

export interface UpdatePartDTO {
  depotId: string | null;
  stampNumberId: string;
  serialNumber: string;
  manufactureYear: string | null;
  currentLocation: string | null;
  statusId: string;
  notes: string;
  code: number;
  documentId: string | null;
  serviceLifeYears: number | null;
  extendedUntil: string | null;
  model: string | null;
  file: string | null;
}

export interface CreateWheelPairDTO {
  partTypeId: string;
  depotId?: string;
  stampNumberId: string;
  serialNumber?: string;
  manufactureYear?: string;
  statusId: string;
  notes?: string;
  thicknessLeft?: number;
  thicknessRight?: number;
  wheelType?: string;
}

export interface CreateSideFrameDTO {
  partTypeId: string;
  depotId?: string;
  stampNumberId: string;
  serialNumber?: string;
  manufactureYear?: string;
  statusId: string;
  notes?: string;
  serviceLifeYears?: number;
  extendedUntil?: string;
}

export interface CreateBolsterDTO {
  partTypeId: string;
  depotId?: string;
  stampNumberId: string;
  serialNumber?: string;
  manufactureYear?: string;
  statusId: string;
  notes?: string;
  serviceLifeYears?: number;
  extendedUntil?: string;
}

export interface CreateCouplerDTO {
  partTypeId: string;
  depotId?: string;
  stampNumberId: string;
  serialNumber?: string;
  manufactureYear?: string;
  statusId: string;
  notes?: string;
}

export interface CreateShockAbsorberDTO {
  partTypeId: string;
  depotId?: string;
  stampNumberId: string;
  serialNumber?: string;
  manufactureYear?: string;
  statusId: string;
  notes?: string;
  model?: string;
  manufacturerCode?: string;
  nextRepairDate?: string;
  serviceLifeYears?: number;
}

export interface UpdateWheelPairDTO {
  depotId?: string;
  stampNumberId: string;
  serialNumber?: string;
  manufactureYear?: string | number;
  currentLocation?: string;
  statusId: string;
  notes?: string;
  thicknessLeft?: number;
  thicknessRight?: number;
  wheelType?: string;
}

export interface UpdateSideFrameDTO {
  depotId?: string;
  stampNumberId: string;
  serialNumber?: string;
  manufactureYear?: string | number;
  currentLocation?: string;
  statusId: string;
  notes?: string;
  serviceLifeYears?: number;
  extendedUntil?: string;
}

export interface UpdateBolsterDTO {
  depotId?: string;
  stampNumberId: string;
  serialNumber?: string;
  manufactureYear?: string | number;
  currentLocation?: string;
  statusId: string;
  notes?: string;
  serviceLifeYears?: number;
  extendedUntil?: string;
}

export interface UpdateCouplerDTO {
  depotId?: string;
  stampNumberId: string;
  serialNumber?: string;
  manufactureYear?: string | number;
  currentLocation?: string;
  statusId: string;
  notes?: string;
}

export interface UpdateShockAbsorberDTO {
  depotId?: string;
  stampNumberId: string;
  serialNumber?: string;
  manufactureYear?: string | number;
  currentLocation?: string;
  statusId: string;
  notes?: string;
  model?: string;
  manufacturerCode?: string;
  nextRepairDate?: string;
  serviceLifeYears?: number;
}

// Пагинированный ответ для деталей
export interface PaginatedPartsResponse {
  items: PartDTO[];
  pageNumber: number;
  totalPages: number;
  totalCount: number;
}

// Информация о клейме
export interface StampInfoDTO {
  value: string;
}

// Информация о детали
export interface PartInfoDTO {
  partId: string;
  serialNumber?: string;
  manufactureYear?: string;
  stampInfo?: StampInfoDTO;
}

// PartEquipment (Оборудование деталей)
export interface PartEquipmentDTO {
  id: string;
  operation: number;
  defectsId?: string;
  adminOwnerId?: string;
  partsId?: string;
  jobDate?: string;
  jobTypeId?: string;
  thicknessLeft?: number;
  thicknessRight?: number;
  truckType?: number;
  notes?: string;
  documentsId?: number;
  documentDate?: string;
  railwayCistern?: {
    id: string;
    number: string;
    model: string;
    owner?: unknown;
  };
  equipmentType?: {
    id: string;
    name: string;
    code: number;
    partTypeId: string;
    partTypeName: string;
  };
  jobDepot?: {
    id: string;
    name: string;
    code: string;
    location?: string;
    shortName: string;
    createdAt: string;
  };
  depot?: {
    id: string;
    name: string;
    code: string;
    location?: string;
    shortName: string;
    createdAt: string;
  };
  repairType?: {
    id: string;
    name: string;
    code: string;
    description: string;
  };
  part?: PartInfoDTO;
  document?: DocumentDTO;
}

export interface LastEquipmentDTO {
  equipmentTypeId: string;
  equipmentTypeName: string;
  lastEquipment: PartEquipmentDTO;
}

export interface PaginatedPartEquipmentResponse {
  items: PartEquipmentDTO[];
  pageNumber: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
}

// FitmentEquipment (Привязка арматуры)
export interface FitmentEquipmentRailwayCisternDTO {
  id: string;
  number: string;
  model: string;
  owner: string;
}

export interface FitmentEquipmentFitmentInfoDTO {
  id: string;
  serialNumber: string;
  passportNumber: string;
  fitmentTypeName: string;
}

export interface FitmentEquipmentUserDTO {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface FitmentEquipmentDepotDTO {
  id: string;
  name: string;
  code: string;
  location: string;
  shortName: string;
  createdAt: string;
}

export interface FitmentEquipmentDocumentDTO {
  id: string;
  number: string;
  type: number;
  date: string;
  author: string;
  price: number;
  note: string;
}

export interface FitmentEquipmentDTO {
  id: string;
  railwayCisternsId?: string | null;
  operation: number;
  fitmentId: string;
  jobUserId: string;
  testUserId: string;
  depoId: string;
  date: string;
  documentId: string;
  railwayCistern?: FitmentEquipmentRailwayCisternDTO | null;
  fitment?: FitmentEquipmentFitmentInfoDTO | null;
  jobUser?: FitmentEquipmentUserDTO | null;
  testUser?: FitmentEquipmentUserDTO | null;
  depot?: FitmentEquipmentDepotDTO | null;
  document?: FitmentEquipmentDocumentDTO | null;
}

export interface CreateFitmentEquipmentDTO {
  railwayCisternsId?: string | null;
  operation: number;
  fitmentId: string;
  jobUserId?: string;
  testUserId?: string;
  depoId?: string;
  date?: string;
  documentId?: string;
}

export interface PaginatedFitmentEquipmentResponse {
  items: FitmentEquipmentDTO[];
  pageNumber: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

// Paginated response for Documents
export interface PaginatedDocumentsResponse {
  items: DocumentDTO[];
  pageNumber: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
}

// Paginated response for Stations
export interface PaginatedStationsResponse {
  items: StationDTO[];
  pageNumber: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
}

// Simple option type for selects
export interface SelectOption {
  value: string;
  label: string;
}

// Range types for filters
export interface DateRange {
  from?: string;
  to?: string;
}

export interface DateTimeRange {
  from?: string;
  to?: string;
}

export interface DecimalRange {
  from?: number;
  to?: number;
}

export interface IntRange {
  from?: number;
  to?: number;
}

// Sort criteria
export interface SortCriteria {
  fieldName: string;
  descending: boolean;
}

// Part filter criteria
export interface PartFilterCriteria {
  partTypeIds?: string[];
  depotIds?: string[];
  stampNumbers?: string[];
  serialNumbers?: string[];
  manufactureYear?: DateRange;
  locations?: string[];
  currentLocationIds?: string[];
  statusIds?: string[];
  serviceLifeYears?: IntRange;
  extendedUntil?: DateRange;
  models?: string[];
  createdAt?: DateTimeRange;
  updatedAt?: DateTimeRange;
  code?: IntRange;
  documentId?: string;
  documentNumbers?: string[];
  documentTypes?: number[];
  documentDate?: DateRange;
}

// Filter and sort request DTOs
export interface PartFilterSortDTO {
  filters?: PartFilterCriteria;
  sortFields?: SortCriteria[];
  selectedColumns?: string[];
  page: number;
  pageSize: number;
}

export interface PartFilterSortWithoutPaginationDTO {
  filters?: PartFilterCriteria;
  sortFields?: SortCriteria[];
  selectedColumns?: string[];
}

// Fitment filter criteria
export interface FitmentFilterCriteria {
  fitmentTypeIds?: string[];
  serialNumbers?: string[];
  passportNumbers?: string[];
  buildDate?: DateRange;
  lastRepairDate?: DateRange;
  periodRep?: IntRange;
  serviceLifeYears?: IntRange;
  modelIds?: string[];
  depotIds?: string[];
  creatorIds?: string[];
  updatedAt?: DateTimeRange;
  code?: IntRange;
  locationCisternIds?: string[];
  locationDepoIds?: string[];
}

export interface FitmentFilterSortWithoutPaginationDTO {
  filters?: FitmentFilterCriteria;
  sortFields?: SortCriteria[];
}

// Paginated response for filtered parts
export interface PaginatedFilteredPartsResponse {
  items: Record<string, unknown>[];
  pageNumber: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
}

// Part Installation History (История установок детали)
export interface PartInstallationDTO {
  id: string;
  partId: string;
  wagonId?: string;
  wagonNumber?: string;
  installedAt: string;
  installedBy?: string;
  removedAt?: string;
  removedBy?: string;
  fromLocationId?: string;
  fromLocationName?: string;
  toLocationId: string;
  toLocationName: string;
  notes?: string;
}
