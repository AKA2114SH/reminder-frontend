import { useQuery } from "@tanstack/react-query";
import { taskApi } from "./client";

const pollingIntervalAnalytics = Number(import.meta.env.VITE_POLLING_INTERVAL_ANALYTICS) || 30000;

export function useAnalyticsSummary() {
  const isVisible = () => typeof document !== "undefined" && document.visibilityState === "visible";
  return useQuery({
    queryKey: ["analytics-summary"],
    queryFn: async () => {
      const res = await taskApi.getSummary();
      return res.data;
    },
    refetchInterval: () => (isVisible() ? pollingIntervalAnalytics : false),
  });
}

export function useAnalyticsChannelStats() {
  const isVisible = () => typeof document !== "undefined" && document.visibilityState === "visible";
  return useQuery({
    queryKey: ["analytics-channel-stats"],
    queryFn: async () => {
      const res = await taskApi.getStats();
      return res.data;
    },
    refetchInterval: () => (isVisible() ? pollingIntervalAnalytics : false),
  });
}

export function useAnalyticsTasks(startDate: string, endDate: string) {
  const isVisible = () => typeof document !== "undefined" && document.visibilityState === "visible";
  return useQuery({
    queryKey: ["analytics-tasks", startDate, endDate],
    queryFn: () => taskApi.getTasksForAnalytics(startDate, endDate),
    refetchInterval: () => (isVisible() ? pollingIntervalAnalytics : false),
    enabled: !!startDate && !!endDate,
  });
}
