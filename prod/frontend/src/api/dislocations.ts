import { api } from "@/lib/api";

const DISLOCATION_LAST_ENDPOINT = '/api/dislocations/last-location/by-number';
const DISLOCATION_ALL_ENDPOINT = '/api/dislocations/locations/by-number';

export interface CisternLastLocation {
  id: string;
  dateOpr: string;
  nameStationOpr: string;
  lat: number;
  lon: number;
}

export interface CisternAllLocation {
    id: string;
    dateRas: string;
    dateOpr: string;
    numCistern: string;
    codeStationOpr: string;
    nameStationOpr: string;
    operationShort: string;
    codeStationOut: string;
    nameStationOut: string;
}


export const CisternDislocation= {
  getLastLocation: async (Num: string): Promise<CisternLastLocation> => {
    const response = await api.get<CisternLastLocation>(`${DISLOCATION_LAST_ENDPOINT}/${Num}`);
    return response.data;
  },

  getAllLocation: async (Num: string): Promise<CisternAllLocation[]> => {
    const response = await api.get<CisternAllLocation[]>(`${DISLOCATION_ALL_ENDPOINT}/${Num}`);
    return response.data;
  },
};
