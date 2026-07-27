import { api } from "@/lib/api";

export interface HistoryActionRailway {
  id: string;
  cisternId: string;
  date: string;
  email: string;
  firstName: string;
  lastName: string;
  note: string;
}

export interface HistoryActionFitment {
  id: string;
  fitmentId: string;
  date: string;
  email: string;
  firstName: string;
  lastName: string;
  note: string;
}

export interface HistoryActionPart {
  id: string;
  partId: string;
  date: string;
  email: string;
  firstName: string;
  lastName: string;
  note: string;
}

export const historyActionsApi = {
  getByCisternId: async (cisternId: string): Promise<HistoryActionRailway[]> => {
    const response = await api.get<HistoryActionRailway[]>(
      `/api/history-actions-railway/byCisternId/${cisternId}`
    );
    return response.data;
  },

  getByFitmentId: async (fitmentId: string): Promise<HistoryActionFitment[]> => {
    const response = await api.get<HistoryActionFitment[]>(
      `/api/history-actions-fitment/byFitmentId/${fitmentId}`
    );
    return response.data;
  },

  getByPartId: async (partId: string): Promise<HistoryActionPart[]> => {
    const response = await api.get<HistoryActionPart[]>(
      `/api/history-actions-part/byPartId/${partId}`
    );
    return response.data;
  },
};
