import { api } from "@/lib/api";

const DISLOCATION_LAST_ENDPOINT = '/api/dislocations/last-location/by-number';
const DISLOCATION_ALL_ENDPOINT = '/api/dislocations/locations/by-number';

export interface CisternLastLocation {
  id: string;
  dateOpr: string;
  lat: number;
  lon: number;
  dateRas: string;
  numCistern: string;
  codeStationOpr: string;
  nameStationOpr: string;
  roadDislocation: string;
  operationShort: string;
  operationNote: string;
  codeStationOut: string;
  nameStationOut: string;
  codeStationEnd: string;
  nameStationEnd: string;
  codeShip: string;
  nameShip: string;
}

export interface CisternAllLocation {
  id: string;
  dateOpr: string;
  lat: number;
  lon: number;
  dateRas: string;
  numCistern: string;
  codeStationOpr: string;
  nameStationOpr: string;
  roadDislocation: string;
  operationShort: string;
  operationNote: string;
  codeStationOut: string;
  nameStationOut: string;
  codeStationEnd: string;
  nameStationEnd: string;
  codeShip: string;
  nameShip: string;
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
