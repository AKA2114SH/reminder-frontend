import type { Task } from "../api/client";
import { format, subDays } from "date-fns";

export function generateDateRange(days: number): Date[] {
  const dates: Date[] = [];
  for (let i = days - 1; i >= 0; i--) {
    dates.push(subDays(new Date(), i));
  }
  return dates;
}

export function transformTimeSeriesData(tasks: Task[], days: number) {
  const dates = generateDateRange(days);
  const map = new Map<string, { date: string; sent: number; delivered: number; failed: number; total: number }>();
  
  dates.forEach((d) => {
    const formatted = format(d, "MMM d");
    map.set(formatted, { date: formatted, sent: 0, delivered: 0, failed: 0, total: 0 });
  });

  tasks.forEach((t) => {
    if (!t.createdAt) return;
    const dateStr = format(new Date(t.createdAt), "MMM d");
    const entry = map.get(dateStr);
    if (entry) {
      entry.total++;
      const s = (t.status || "").toUpperCase();
      if (s === "SENT_TO_PROVIDER" || s === "SENT") {
        entry.sent++;
      } else if (s === "DELIVERED") {
        entry.delivered++;
      } else if (s === "FAILED") {
        entry.failed++;
      }
    }
  });

  return Array.from(map.values()).map((entry) => {
    const successful = entry.sent + entry.delivered;
    const successRate = entry.total > 0 ? (successful / entry.total) * 100 : 0;
    return {
      ...entry,
      successRate: Number(successRate.toFixed(1)),
    };
  });
}

export function transformProviderData(tasks: Task[]) {
  const providerMap = new Map<string, { delivered: number; failed: number; total: number }>();
  
  tasks.forEach((task) => {
    const provider = task.provider || "unknown";
    if (!providerMap.has(provider)) {
      providerMap.set(provider, { delivered: 0, failed: 0, total: 0 });
    }
    const entry = providerMap.get(provider)!;
    entry.total++;
    
    const s = (task.status || "").toUpperCase();
    if (s === "DELIVERED") entry.delivered++;
    if (s === "FAILED") entry.failed++;
  });
  
  return Array.from(providerMap.entries()).map(([provider, data]) => ({
    provider: provider === "unknown" ? "Unknown" : provider,
    ...data
  }));
}

export function calculateSuccessRate(delivered: number, total: number): number {
  if (!total) return 0;
  return (delivered / total) * 100;
}
