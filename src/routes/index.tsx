import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { taskApi, type Task, type SummaryStats, type ChannelStats } from "@/lib/api/client";
import {
  Activity,
  Calendar,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RefreshCw,
  Mail,
  MessageSquare,
  Smartphone,
  TrendingUp,
} from "lucide-react";
import { format } from "date-fns";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { MetricCard } from "@/components/analytics/MetricCard";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Dashboard — BAAP Notify" }] }),
  component: Index,
});

const pollingInterval = Number(import.meta.env.VITE_POLLING_INTERVAL_DASHBOARD) || 10000;

function Index() {
  const isVisible = () => typeof document !== "undefined" && document.visibilityState === "visible";

  const summaryQ = useQuery({
    queryKey: ["task-summary"],
    queryFn: async () => {
      const res = await taskApi.getSummary();
      return res.data;
    },
    refetchInterval: () => (isVisible() ? pollingInterval : false),
  });

  const statsQ = useQuery({
    queryKey: ["task-stats"],
    queryFn: async () => {
      const res = await taskApi.getStats();
      return res.data;
    },
    refetchInterval: () => (isVisible() ? pollingInterval : false),
  });

  const recentQ = useQuery({
    queryKey: ["recent-tasks"],
    queryFn: async () => {
      const res = await taskApi.getRecent(10);
      return res.data;
    },
    refetchInterval: () => (isVisible() ? pollingInterval : false),
  });

  const handleRetry = () => {
    summaryQ.refetch();
    statsQ.refetch();
    recentQ.refetch();
  };

  const isError = summaryQ.isError || statsQ.isError || recentQ.isError;
  const isLoading = summaryQ.isLoading || statsQ.isLoading || recentQ.isLoading;

  if (isError) {
    const errorMsg =
      (summaryQ.error as any)?.message ||
      (statsQ.error as any)?.message ||
      (recentQ.error as any)?.message ||
      "Failed to fetch task metrics from the backend.";

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Real-time notification delivery overview.</p>
        </div>
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="pt-6 text-center space-y-4">
            <XCircle className="mx-auto h-10 w-10 text-destructive/80" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-destructive">API Connection Error</p>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">{errorMsg}</p>
            </div>
            <Button onClick={handleRetry} variant="outline" className="gap-2 border-destructive/40 hover:bg-destructive/10 text-destructive">
              <RefreshCw className="h-3.5 w-3.5" /> Retry Connection
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-end">
          <div className="space-y-2">
            <div className="h-7 w-32 bg-muted rounded animate-pulse" />
            <div className="h-4 w-64 bg-muted rounded animate-pulse" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <div className="h-3.5 w-20 bg-muted rounded" />
                <div className="h-4 w-4 bg-muted rounded-full" />
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="h-7 w-16 bg-muted rounded" />
                <div className="h-3 w-28 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="animate-pulse md:col-span-1">
            <CardHeader>
              <div className="h-5 w-28 bg-muted rounded" />
              <div className="h-4 w-44 bg-muted rounded mt-2" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 w-24 bg-muted rounded" />
                  <div className="h-2 w-full bg-muted rounded-full" />
                </div>
              ))}
            </CardContent>
          </Card>
          <Card className="animate-pulse md:col-span-2">
            <CardHeader>
              <div className="h-5 w-32 bg-muted rounded" />
              <div className="h-4 w-48 bg-muted rounded mt-2" />
            </CardHeader>
            <CardContent className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b">
                  <div className="space-y-2">
                    <div className="h-4 w-36 bg-muted rounded" />
                    <div className="h-3.5 w-24 bg-muted rounded" />
                  </div>
                  <div className="h-6 w-16 bg-muted rounded-full" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const summary = summaryQ.data || {
    total: 0,
    today: 0,
    sentToProvider: 0,
    delivered: 0,
    failed: 0,
    processing: 0,
    scheduled: 0,
    byChannel: [],
    deliveryRate: 0,
    successRate: 0,
  };

  const channelStats = statsQ.data || [];
  const recentTasks = recentQ.data || [];

  // Calculate stats values
  const totalTasks = summary.total;
  const todayTasks = summary.today;
  const sentTasks = summary.sentToProvider + summary.delivered;
  const failedTasks = summary.failed;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Real-time notification delivery overview.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/logs">View logs</Link>
          </Button>
          <Button asChild>
            <Link to="/send">
              Send notification <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Total tasks"
          value={summary.total.toLocaleString()}
          icon={<Activity className="h-4 w-4" />}
          hint="All channels combined"
        />
        <MetricCard
          label="Sent"
          value={summary.sentToProvider.toLocaleString()}
          icon={<Calendar className="h-4 w-4 text-indigo-500" />}
          hint="Sent to provider"
          tone="info"
        />
        <MetricCard
          label="Delivered"
          value={summary.delivered.toLocaleString()}
          icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
          hint="Delivered to recipient"
          tone="success"
        />
        <MetricCard
          label="Success Rate"
          value={`${(summary.successRate ?? 0).toFixed(1)}%`}
          icon={<TrendingUp className="h-4 w-4 text-blue-500" />}
          hint="Sent + Delivered"
          tone="info"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Channel Distribution */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Channel Mix</CardTitle>
            <CardDescription>Breakdown of notification tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {channelStats.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">No channel activity data available.</div>
            ) : (
              channelStats.map((item) => {
                const percentage = totalTasks > 0 ? (item.total / totalTasks) * 100 : 0;
                
                // Icon selection
                let channelIcon = <span>📧</span>;
                let colorClass = "bg-primary";
                if (item.channel === "WHATSAPP") {
                  channelIcon = <span>📱</span>;
                  colorClass = "bg-emerald-500";
                } else if (item.channel === "SMS") {
                  channelIcon = <span>💬</span>;
                  colorClass = "bg-sky-500";
                }

                return (
                  <div key={item.channel} className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="flex items-center gap-2 font-medium">
                        {channelIcon}
                        {item.channel}
                      </span>
                      <span className="text-muted-foreground font-mono">
                        {item.total.toLocaleString()} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                      <span>Sent: {item.sent + item.delivered}</span>
                      <span>Failed: {item.failed}</span>
                      <span>Proc: {item.processing}</span>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="md:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest 10 notifications</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/logs">See all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentTasks.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">No recent notifications.</div>
            ) : (
              <ul className="divide-y divide-border">
                {recentTasks.map((t) => {
                  let channelIcon = <Mail className="h-3.5 w-3.5" />;
                  if (t.channel === "WHATSAPP") {
                    channelIcon = <Smartphone className="h-3.5 w-3.5" />;
                  } else if (t.channel === "SMS") {
                    channelIcon = <MessageSquare className="h-3.5 w-3.5" />;
                  }

                  return (
                    <li key={t.id} className="flex items-center justify-between gap-3 py-3">
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">{channelIcon}</span>
                          <span className="truncate text-sm font-medium">{t.recipient || "Unknown Recipient"}</span>
                        </div>
                        <div className="truncate text-xs text-muted-foreground font-mono">
                          ID: {t.id} · Provider: {t.provider}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="hidden text-xs text-muted-foreground sm:inline font-mono">
                          {t.createdAt ? format(new Date(t.createdAt), "MMM d, HH:mm") : ""}
                        </span>
                        <StatusBadge status={t.status} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
