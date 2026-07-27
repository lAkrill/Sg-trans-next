import { useQuery } from "@tanstack/react-query";
import { historyActionsApi } from "@/api/history-actions";
import type {
  HistoryActionFitment,
  HistoryActionPart,
  HistoryActionRailway,
} from "@/api/history-actions";

export const historyActionsKeys = {
  all: ["history-actions"] as const,
  byCistern: (cisternId: string) =>
    [...historyActionsKeys.all, "cistern", cisternId] as const,
  byFitment: (fitmentId: string) =>
    [...historyActionsKeys.all, "fitment", fitmentId] as const,
  byPart: (partId: string) =>
    [...historyActionsKeys.all, "part", partId] as const,
};

export const useCisternHistoryActions = (cisternId: string) => {
  return useQuery<HistoryActionRailway[]>({
    queryKey: historyActionsKeys.byCistern(cisternId),
    queryFn: () => historyActionsApi.getByCisternId(cisternId),
    enabled: !!cisternId,
    staleTime: 30_000,
  });
};

export const useFitmentHistoryActions = (fitmentId: string) => {
  return useQuery<HistoryActionFitment[]>({
    queryKey: historyActionsKeys.byFitment(fitmentId),
    queryFn: () => historyActionsApi.getByFitmentId(fitmentId),
    enabled: !!fitmentId,
    staleTime: 30_000,
  });
};

export const usePartHistoryActions = (partId: string) => {
  return useQuery<HistoryActionPart[]>({
    queryKey: historyActionsKeys.byPart(partId),
    queryFn: () => historyActionsApi.getByPartId(partId),
    enabled: !!partId,
    staleTime: 30_000,
  });
};
