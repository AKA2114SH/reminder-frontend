import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { format, subDays } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAnalyticsTasks } from "@/lib/api/analytics";
import { MetricCard } from "@/components/analytics/MetricCard";
import { ChartSkeleton } from "@/components/analytics/ChartSkeleton";
import { DeliveryOverTimeChart } from "@/components/analytics/DeliveryOverTimeChart";
import { ChannelDistributionChart } from "@/components/analytics/ChannelDistributionChart";
import { ProviderPerformanceChart } from "@/components/analytics/ProviderPerformanceChart";
import { ChannelBreakdownTable } from "@/components/analytics/ChannelBreakdownTable";
import { DateRangePicker } from "@/components/analytics/DateRangePicker";
import { transformTimeSeriesData, transformProviderData, calculateSuccessRate } from "@/lib/utils/analytics-transformers";
import { Download, RefreshCw, XCircle, BarChart3, Mail, CheckCircle2, AlertOctagon, TrendingUp } from "lucide-react";

interface AnalyticsSearch {
  days?: number;
}

export const Route = createFileRoute("/analytics")({
  validateSearch: (search: Record<string, unknown>): AnalyticsSearch => {
    return {
      days: search.days ? Number(search.days) : undefined,
    };
  },
  head: () => ({ meta: [{ title: "Analytics — BAAP Notify" }] }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  
  const days = search.days || Number(import.meta.env.VITE_DEFAULT_ANALYTICS_DAYS) || 7;

  const setDays = (d: number) => {
    navigate({ search: { days: d } });
  };

  // Build stable date ranges to prevent constant query key busting
  const endDateStr = format(new Date(), "yyyy-MM-dd");
  const startDateStr = format(subDays(new Date(), days), "yyyy-MM-dd");

  const tasksQuery = useAnalyticsTasks(startDateStr, endDateStr);

  const handleRetry = () => {
    tasksQuery.refetch();
  };

  const isError = tasksQuery.isError;
  const isLoading = tasksQuery.isLoading;

  // Transform time-series and provider data
  const timeSeriesData = useMemo(() => {
    return tasksQuery.data ? transformTimeSeriesData(tasksQuery.data, days) : [];
  }, [tasksQuery.data, days]);

  const providerData = useMemo(() => {
    return tasksQuery.data ? transformProviderData(tasksQuery.data) : [];
  }, [tasksQuery.data]);

  const handleExportCSV = () => {
    if (!tasksQuery.data || tasksQuery.data.length === 0) return;

    const headers = ["Task ID", "Channel", "Provider", "Recipient", "Status", "Success Rate", "Created At", "Sent At", "Delivered At"];
    const csvRows = [
      headers.join(","),
      ...tasksQuery.data.map((t) => {
        const isSuccess = t.status === "DELIVERED" || t.status === "SENT_TO_PROVIDER" || t.status === "SENT";
        return [
          t.id,
          t.channel,
          t.provider,
          t.recipient || "",
          t.status,
          isSuccess ? "100%" : "0%",
          t.createdAt || "",
          t.sentAt || "",
          t.deliveredAt || "",
        ]
          .map((val) => `"${String(val).replace(/"/g, '""')}"`)
          .join(",");
      }),
    ];

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `notification-analytics-${days}d.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isError) {
    const errorMsg =
      (summaryQuery.error as any)?.message ||
      (channelStatsQuery.error as any)?.message ||
      (tasksQuery.error as any)?.message ||
      "Failed to communicate with the analytics endpoint.";

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground">Delivery performance breakdown.</p>
        </div>
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="pt-6 text-center space-y-4">
            <XCircle className="mx-auto h-10 w-10 text-destructive/85" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-destructive">Analytics Fetch Error</p>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">{errorMsg}</p>
            </div>
            <Button onClick={handleRetry} variant="outline" className="gap-2 border-destructive/40 hover:bg-destructive/10 text-destructive">
              <RefreshCw className="h-3.5 w-3.5" /> Retry Fetch
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const rawTasks = tasksQuery.data || [];

  // Pre-calculate counts dynamically from filtered tasksQuery data
  const filteredMetrics = useMemo(() => {
    if (!tasksQuery.data) {
      return {
        total: 0,
        delivered: 0,
        sentToProvider: 0,
        failed: 0,
        successRate: 0,
      };
    }

    const total = tasksQuery.data.length;
    let delivered = 0;
    let sentToProvider = 0;
    let failed = 0;

    tasksQuery.data.forEach((t) => {
      const s = (t.status || "").toUpperCase();
      if (s === "DELIVERED") {
        delivered++;
      } else if (s === "SENT_TO_PROVIDER" || s === "SENT") {
        sentToProvider++;
      } else if (s === "FAILED") {
        failed++;
      }
    });

    const successful = delivered + sentToProvider;
    const successRate = total > 0 ? (successful / total) * 100 : 0;

    return {
      total,
      delivered,
      sentToProvider,
      failed,
      successRate,
    };
  }, [tasksQuery.data]);

  // Formulate data format for Pie chart from filtered tasksQuery data
  const channelPieData = useMemo(() => {
    if (!tasksQuery.data) return [];
    const channelMap = new Map<string, number>();

    tasksQuery.data.forEach((t) => {
      const ch = (t.channel || "UNKNOWN").toUpperCase();
      channelMap.set(ch, (channelMap.get(ch) || 0) + 1);
    });

    return Array.from(channelMap.entries()).map(([channel, count]) => ({
      channel,
      count,
    }));
  }, [tasksQuery.data]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground">Delivery performance breakdown.</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <DateRangePicker value={days} onChange={setDays} />
          <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={rawTasks.length === 0}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            Print PDF
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          [1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <div className="p-6 space-y-3">
                <div className="h-3 w-16 bg-muted rounded" />
                <div className="h-8 w-24 bg-muted rounded" />
              </div>
            </Card>
          ))
        ) : (
          <>
            <MetricCard
              label="Total Tasks"
              value={filteredMetrics.total.toLocaleString()}
              icon={<BarChart3 className="h-4 w-4" />}
            />
            <MetricCard
              label="Delivered"
              value={filteredMetrics.delivered.toLocaleString()}
              icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
              tone="success"
            />
            <MetricCard
              label="Failed"
              value={filteredMetrics.failed.toLocaleString()}
              icon={<AlertOctagon className="h-4 w-4 text-rose-500" />}
              tone={filteredMetrics.failed > 0 ? "destructive" : "default"}
            />
            <MetricCard
              label="Success Rate"
              value={`${filteredMetrics.successRate.toFixed(1)}%`}
              icon={<TrendingUp className="h-4 w-4 text-blue-500" />}
              tone="info"
              hint={`${(filteredMetrics.delivered + filteredMetrics.sentToProvider).toLocaleString()} successful out of ${filteredMetrics.total.toLocaleString()}`}
            />
          </>
        )}
      </div>

      {/* Main Delivery Trend Line Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Delivery over time</CardTitle>
          <CardDescription>Visualizing sent, delivered, and failed daily volumes</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          {isLoading ? (
            <ChartSkeleton height={280} />
          ) : (
            <DeliveryOverTimeChart data={timeSeriesData} />
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Channel Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Channel distribution</CardTitle>
            <CardDescription>Breakdown of notifications across channels</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {isLoading ? (
              <div className="h-full flex items-center justify-center">
                <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <ChannelDistributionChart data={channelPieData} />
            )}
          </CardContent>
        </Card>

        {/* Provider Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Provider performance</CardTitle>
            <CardDescription>Delivery comparisons grouped by service provider</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {isLoading ? (
              <div className="h-full flex items-center justify-center">
                <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <ProviderPerformanceChart data={providerData} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Share Breakdown Table */}
      <Card>
        <CardHeader>
          <CardTitle>Channel breakdown</CardTitle>
          <CardDescription>Comprehensive shares and volume breakdowns</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <div className="h-8 bg-muted rounded" />
              <div className="h-8 bg-muted rounded" />
              <div className="h-8 bg-muted rounded" />
            </div>
          ) : (
            <ChannelBreakdownTable data={channelPieData} totalTasks={filteredMetrics.total} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}