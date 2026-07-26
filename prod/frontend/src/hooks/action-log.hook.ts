import { useQuery } from "@tanstack/react-query";
import {
  actionLogApi,
  type PaginatedActionLogResponse,
} from "@/api/action-log";

export const actionLogKeys = {
  all: ["action-log"] as const,
  list: (page: number, pageSize: number) =>
    [...actionLogKeys.all, "list", page, pageSize] as const,
  byId: (id: string) => [...actionLogKeys.all, "byId", id] as const,
};

export const useActionLogs = (page: number, pageSize: number) => {
  return useQuery<PaginatedActionLogResponse>({
    queryKey: actionLogKeys.list(page, pageSize),
    queryFn: () => actionLogApi.getAll({ page, pageSize }),
    staleTime: 30_000,
  });
};
