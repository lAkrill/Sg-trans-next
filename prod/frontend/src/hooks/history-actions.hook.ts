import { useQuery } from "@tanstack/react-query";
import { historyActionsApi } from "@/api/history-actions";
import type { HistoryActionRailway } from "@/api/history-actions";

export const historyActionsKeys = {
  all: ["history-actions"] as const,
  byCistern: (cisternId: string) =>
    [...historyActionsKeys.all, "cistern", cisternId] as const,
};

export const useCisternHistoryActions = (cisternId: string) => {
  return useQuery<HistoryActionRailway[]>({
    queryKey: historyActionsKeys.byCistern(cisternId),
    queryFn: () => historyActionsApi.getByCisternId(cisternId),
    enabled: !!cisternId,
    staleTime: 30_000,
  });
};
