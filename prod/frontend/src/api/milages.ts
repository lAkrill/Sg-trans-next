import { api } from "@/lib/api";

const MILAGES_LAST_ENDPOINT = '/api/milage-cisterns/last/by-cistern-number';
const MILAGES_ALL_ENDPOINT = '/api/milage-cisterns/by-cistern-number';

export interface CisternMilage {
    id: string,
    cisternId: string,
    cisternNumber: string,
    milage: number,
    milageNorm: number,
    repairTypeId: string,
    repairDate: string,
    inputModeCode: number,
    inputDate: string
}


export const CisternMilages= {
  getLastMilage: async (Num: string): Promise<CisternMilage> => {
    const response = await api.get<CisternMilage>(`${MILAGES_LAST_ENDPOINT}/${Num}`);
    return response.data;
  },

  getAllMilage: async (Num: string): Promise<CisternMilage[]> => {
    const response = await api.get<CisternMilage[]>(`${MILAGES_ALL_ENDPOINT}/${Num}`);
    return response.data;
  },
};
