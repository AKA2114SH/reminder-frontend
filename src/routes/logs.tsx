import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { NotificationApi, taskApi, type Task } from "@/lib/api/client";
import { RefreshCw, Search, XCircle, Mail, Smartphone, MessageSquare } from "lucide-react";

export const Route = createFileRoute("/logs")({
  head: () => ({ meta: [{ title: "Logs — BAAP Notify" }] }),
  component: LogsPage,
});

const pollingIntervalLogs = Number(import.meta.env.VITE_POLLING_INTERVAL_LOGS) || 15000;

function LogsPage() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [channel, setChannel] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);

  // Debounce search query input (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
      setPage(1); // Reset page on search change
    }, 300);
    return () => clearTimeout(handler);
  }, [query]);

  // Reset page when other filters change
  useEffect(() => {
    setPage(1);
  }, [status, channel, startDate, endDate]);

  const isVisible = () => typeof document !== "undefined" && document.visibilityState === "visible";

  const logsQ = useQuery({
    queryKey: ["tasks-list", page, status, channel, startDate, endDate],
    queryFn: async () => {
      const res = await taskApi.getTasks({
        page,
        limit: 20,
        channel: channel === "ALL" ? undefined : channel,
        status: status === "ALL" ? undefined : status,
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
      });
      return res;
    },
    refetchInterval: () => (autoRefresh && isVisible() ? pollingIntervalLogs : false),
  });

  const logs = logsQ.data?.data || [];
  const pagination = logsQ.data?.pagination || {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  };

  // Perform local sub-filtering only if search query is active
  const filteredLogs = debouncedQuery
    ? logs.filter((l) => {
        const q = debouncedQuery.toLowerCase();
        const matchesId = l.id.toLowerCase().includes(q);
        const matchesRecipient = (l.recipient || "").toLowerCase().includes(q);
        return matchesId || matchesRecipient;
      })
    : logs;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Logs & tracking</h1>
          <p className="text-sm text-muted-foreground">Search, filter, and inspect delivery attempts.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch id="ar" checked={autoRefresh} onCheckedChange={setAutoRefresh} />
            <Label htmlFor="ar" className="text-sm">Auto-refresh</Label>
          </div>
          <Button variant="outline" size="sm" onClick={() => logsQ.refetch()} disabled={logsQ.isFetching}>
            <RefreshCw className={`mr-2 h-4 w-4 ${logsQ.isFetching ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Showing {filteredLogs.length} of {pagination.total} matching tasks
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search ID or recipient…"
                className="pl-8"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue placeholder="All statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All statuses</SelectItem>
                <SelectItem value="QUEUED">Queued</SelectItem>
                <SelectItem value="PROCESSING">Processing</SelectItem>
                <SelectItem value="ENRICHED">Enriched</SelectItem>
                <SelectItem value="SENT_TO_PROVIDER">Sent to Provider</SelectItem>
                <SelectItem value="DELIVERED">Delivered</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
                <SelectItem value="SCHEDULED">Scheduled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={channel} onValueChange={setChannel}>
              <SelectTrigger><SelectValue placeholder="All channels" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All channels</SelectItem>
                <SelectItem value="EMAIL">Email</SelectItem>
                <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                <SelectItem value="SMS">SMS</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs">Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {logsQ.isError ? (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="pt-6 text-center space-y-4">
            <XCircle className="mx-auto h-10 w-10 text-destructive/80" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-destructive">Failed to Load Logs</p>
              <p className="text-xs text-muted-foreground">
                {(logsQ.error as any)?.message || "A network error occurred while contacting the server."}
              </p>
            </div>
            <Button onClick={() => logsQ.refetch()} variant="outline" className="gap-2 border-destructive/40 text-destructive hover:bg-destructive/10">
              <RefreshCw className="h-3.5 w-3.5" /> Retry Connection
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task ID</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Latency</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logsQ.isLoading ? (
                    <TableRowSkeleton />
                  ) : filteredLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                        No matching task logs found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLogs.map((l) => {
                      let channelIcon = <Mail className="mr-1.5 h-3.5 w-3.5 text-muted-foreground inline" />;
                      if (l.channel === "WHATSAPP") {
                        channelIcon = <Smartphone className="mr-1.5 h-3.5 w-3.5 text-muted-foreground inline" />;
                      } else if (l.channel === "SMS") {
                        channelIcon = <MessageSquare className="mr-1.5 h-3.5 w-3.5 text-muted-foreground inline" />;
                      }

                      const latency = l.lastAttempt?.latencyMs !== undefined && l.lastAttempt?.latencyMs !== null
                        ? `${l.lastAttempt.latencyMs}ms`
                        : "—";

                      return (
                        <TableRow
                          key={l.id}
                          className="cursor-pointer hover:bg-muted/40"
                          onClick={() => setSelected(l.id)}
                        >
                          <TableCell className="font-mono text-xs font-semibold">
                            {l.id.slice(0, 12)}…
                          </TableCell>
                          <TableCell className="text-xs">
                            {channelIcon}
                            {l.channel}
                          </TableCell>
                          <TableCell className="text-xs font-medium">{l.provider}</TableCell>
                          <TableCell className="max-w-xs truncate text-xs">{l.recipient || "—"}</TableCell>
                          <TableCell><StatusBadge status={l.status} /></TableCell>
                          <TableCell className="text-xs font-mono">{latency}</TableCell>
                          <TableCell className="text-xs text-muted-foreground font-mono">
                            {l.createdAt ? format(new Date(l.createdAt), "MMM d, HH:mm") : "—"}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Footer */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-border">
                <div className="text-xs text-muted-foreground">
                  Showing page <span className="font-semibold">{pagination.page}</span> of{" "}
                  <span className="font-semibold">{pagination.totalPages}</span> ({pagination.total} total items)
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!pagination.hasPreviousPage || logsQ.isFetching}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!pagination.hasNextPage || logsQ.isFetching}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <TaskDetailSheet taskId={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function TableRowSkeleton() {
  return (
    <>
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <TableRow key={i} className="animate-pulse">
          <TableCell><div className="h-4 w-24 bg-muted rounded" /></TableCell>
          <TableCell><div className="h-4 w-16 bg-muted rounded" /></TableCell>
          <TableCell><div className="h-4 w-16 bg-muted rounded" /></TableCell>
          <TableCell><div className="h-4 w-32 bg-muted rounded" /></TableCell>
          <TableCell><div className="h-6 w-20 bg-muted rounded-full" /></TableCell>
          <TableCell><div className="h-4 w-12 bg-muted rounded" /></TableCell>
          <TableCell><div className="h-4 w-20 bg-muted rounded" /></TableCell>
        </TableRow>
      ))}
    </>
  );
}

function TaskDetailSheet({ taskId, onClose }: { taskId: string | null; onClose: () => void }) {
  const q = useQuery({
    queryKey: ["status", taskId],
    queryFn: () => NotificationApi.status(taskId!),
    enabled: !!taskId,
  });

  return (
    <Sheet open={!!taskId} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Task detail</SheetTitle>
          <SheetDescription className="font-mono text-xs break-all">{taskId}</SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          {q.isLoading && <p className="text-sm text-muted-foreground">Loading details…</p>}
          {q.isError && <p className="text-sm text-destructive">Failed to load task details.</p>}
          {q.data && (
            <>
              <div className="flex items-center gap-2">
                <StatusBadge status={q.data.status} />
                <span className="text-sm text-muted-foreground">{q.data.channel} · {q.data.provider}</span>
              </div>
              {q.data.attempts && q.data.attempts.length > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-semibold">Delivery attempts</h3>
                  <ol className="space-y-2">
                    {q.data.attempts.map((a, i) => (
                      <li key={i} className="rounded-md border bg-muted/40 p-3 text-xs">
                        <div className="flex justify-between font-medium">
                          <span>Attempt #{a.attemptNumber ?? a.attempt ?? i + 1}</span>
                          <StatusBadge status={a.status} />
                        </div>
                        <div className="mt-2 text-muted-foreground font-mono grid grid-cols-2 gap-1 text-[10px]">
                          <span>Latency: {a.latencyMs !== undefined ? `${a.latencyMs}ms` : "—"}</span>
                          <span>Timestamp: {a.createdAt ? format(new Date(a.createdAt), "PPpp") : "—"}</span>
                        </div>
                        {a.error && <div className="mt-2 text-destructive font-semibold">Error: {a.error}</div>}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
              <div>
                <h3 className="mb-2 text-sm font-semibold">Raw payload & response</h3>
                <pre className="max-h-64 overflow-auto rounded-md bg-muted/50 p-3 text-xs font-mono">
                  {JSON.stringify(q.data, null, 2)}
                </pre>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}