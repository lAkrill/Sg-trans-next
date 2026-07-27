import { api } from "@/lib/api";

export interface ActionLog {
  id: string;
  userId: string;
  dateTime: string;
  ip: string | null;
  api: string;
  note: string | null;
}

export interface PaginatedActionLogResponse {
  items: ActionLog[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface ActionLogParams {
  page?: number;
  pageSize?: number;
}

export const actionLogApi = {
  getAll: async (
    params: ActionLogParams = {}
  ): Promise<PaginatedActionLogResponse> => {
    const { page = 1, pageSize = 25 } = params;
    const response = await api.get<PaginatedActionLogResponse>("/api/ActionLog", {
      params: { page, pageSize },
    });
    return response.data;
  },

  getById: async (id: string): Promise<ActionLog> => {
    const response = await api.get<ActionLog>(`/api/ActionLog/${id}`);
    return response.data;
  },
};
