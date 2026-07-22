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

export const historyActionsApi = {
  getByCisternId: async (cisternId: string): Promise<HistoryActionRailway[]> => {
    const response = await api.get<HistoryActionRailway[]>(
      `/api/history-actions-railway/byCisternId/${cisternId}`
    );
    return response.data;
  },
};
