import { api } from "@/lib/api";

import { DepotDTO, StationDTO, RepairTypeDTO } from "../types/directories";
import { RailwayCisternListDTO } from "../types/cisterns";
import type {
  RepairsInFilterSortDTO,
  RepairsOutFilterSortDTO,
  PaginatedRepairsResponse,
} from "@/types/repairs";

const REPIN_LAST_NUM_ENDPOINT = "/api/RepairsIn/latest/byCisternNumber";
const REPIN_ALL_NUM_ENDPOINT = '/api/RepairsIn/byCisternNumberAll';
const REPOUT_LAST_NUM_ENDPOINT = '/api/RepairsOut/latest/byCisternNumber';
const REPOUT_ALL_NUM_ENDPOINT = '/api/RepairsOut/byCisternNumberAll';
const REPIN_ALL_ENDPOINT = '/api/RepairsIn/all';
const REPOUT_ALL_ENDPOINT = '/api/RepairsOut/all';

export interface RepairsIn {
  
    id: string;
    cisternNumber: string;
    cisternId: string;
    typeRepairId: string;
    depotName: string;
    depotCode: string;
    depotId: string;
    vU23: string;
    roadCode: string;
    roadName: string;
    stationCode: string;
    stationName: string;
    stationId: string;
    dateIn: string;
    defectCode: string [];
    defectName: string [];
    adminRoadCode: string;
    cistern: RailwayCisternListDTO;
    repairType: RepairTypeDTO;
    depot: DepotDTO;
    station: StationDTO;
  
}

export interface RepairsOut {
  
  id: string;
  cisternNumber: string;
  cisternId: string;
  typeRepairId: string;
  vU36: string;
  depotName: string;
  depotCode: string;
  depotId: string;
  dateIn: string;
  dateOut: string;
  modernCode: string [];
  roadCode: string;
  roadName: string;
  modernName: string [];
  cistern: RailwayCisternListDTO;
  repairType: RepairTypeDTO;
  depot: DepotDTO;

}

export interface RepairsMatching {
  id: string;
  cisternId: string;
  repairInId: string;
  repairOutId: string;
  dateTime: string;
  cistern: RailwayCisternListDTO;
  repairIn: RepairsIn;
  repairOut: RepairsOut;
}


export const CisternRepairs= {
  getLastRepairsNumIn: async (Num: string): Promise<RepairsIn> => {
    const response = await api.get<RepairsIn>(`${REPIN_LAST_NUM_ENDPOINT}/${Num}`);
    return response.data;
  },

  getAllRepairsNumIn: async (Num: string): Promise<RepairsIn[]> => {
    const response = await api.get<RepairsIn[]>(`${REPIN_ALL_NUM_ENDPOINT}/${Num}`);
    return response.data;
  },

  getLastRepairsNumOut: async (Num: string): Promise<RepairsOut> => {
    const response = await api.get<RepairsOut>(`${REPOUT_LAST_NUM_ENDPOINT}/${Num}`);
    return response.data;
  },

  getAllRepairsNumOut: async (Num: string): Promise<RepairsOut[]> => {
    const response = await api.get<RepairsOut[]>(`${REPOUT_ALL_NUM_ENDPOINT}/${Num}`);
    return response.data;
  },

  getAllRepairsIn: async (): Promise<RepairsIn[]> => {
    const response = await api.get<RepairsIn[]>(`${REPIN_ALL_ENDPOINT}`);
    return response.data;
  },

  getAllRepairsOut: async (): Promise<RepairsOut[]> => {
    const response = await api.get<RepairsOut[]>(`${REPOUT_ALL_ENDPOINT}`);
    return response.data;
  },

  getAllRepairsMatching: async (): Promise<RepairsMatching[]> => {
    const response = await api.get<RepairsMatching[]>(`/api/RepairsMatching/all`);
    return response.data;
  },
 
  getRepairsMatchingById: async (id: string): Promise<RepairsMatching[]> => {
    const response = await api.get<RepairsMatching[]>(`/api/RepairsMatching/byCisternId/${id}`);
    return response.data;
  },

  filterRepairsIn: async (
    filterData: RepairsInFilterSortDTO
  ): Promise<PaginatedRepairsResponse<RepairsIn>> => {
    const response = await api.post<PaginatedRepairsResponse<RepairsIn>>(
      "/api/repairs-in/filter",
      filterData
    );
    return response.data;
  },

  filterRepairsOut: async (
    filterData: RepairsOutFilterSortDTO
  ): Promise<PaginatedRepairsResponse<RepairsOut>> => {
    const response = await api.post<PaginatedRepairsResponse<RepairsOut>>(
      "/api/repairs-out/filter",
      filterData
    );
    return response.data;
  },
};
