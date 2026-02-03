import { api } from "@/lib/api";

import { DepotDTO, StationDTO, RepairTypeDTO} from "../types/directories";
import { RailwayCisternListDTO} from "../types/cisterns";


const REPIN_LAST_ENDPOINT = '/api/RepairsIn/latest/byCisternNumber';
const REPIN_ALL_ENDPOINT = '/api/RepairsIn/byCisternNumber';
const REPOUT_LAST_ENDPOINT = '/api/RepairsOut/latest/byCisternNumber';
const REPOUT_ALL_ENDPOINT = '/api/RepairsOut/byCisternNumber';

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

export const CisternRepairs= {
  getLastRepairsIn: async (Num: string): Promise<RepairsIn> => {
    const response = await api.get<RepairsIn>(`${REPIN_LAST_ENDPOINT}/${Num}`);
    return response.data;
  },

  getAllRepairsIn: async (Num: string): Promise<RepairsIn[]> => {
    const response = await api.get<RepairsIn[]>(`${REPIN_ALL_ENDPOINT}/${Num}?skip=0&take=50`);
    return response.data;
  },

  getLastRepairsOut: async (Num: string): Promise<RepairsOut> => {
    const response = await api.get<RepairsOut>(`${REPOUT_LAST_ENDPOINT}/${Num}`);
    return response.data;
  },

  getAllRepairsOut: async (Num: string): Promise<RepairsOut[]> => {
    const response = await api.get<RepairsOut[]>(`${REPOUT_ALL_ENDPOINT}/${Num}?skip=0&take=50`);
    return response.data;
  },
};
