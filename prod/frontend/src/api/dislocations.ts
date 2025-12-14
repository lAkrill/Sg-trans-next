import { api } from "@/lib/api";

const DISLOCATION_ENDPOINT = '/api/dislocations/last-location/by-number';

export interface CisternLastLocation {
  id: string;
  dateOpr: string;
  nameStationOpr: string;
  lat: number;
  lon: number;
}

export const CisternDislocation= {
  getLastLocation: async (Num: string): Promise<CisternLastLocation> => {
    const response = await api.get<CisternLastLocation>(`${DISLOCATION_ENDPOINT}/${Num}`);
    return response.data;
  },
};
