import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import {
  NotificationApi,
  PROVIDERS_BY_CHANNEL,
  normalizeList,
  type Channel,
  type CronJob,
} from "@/lib/api/client";
import { Plus, Play, Pause, Trash2, Clock } from "lucide-react";

export const Route = createFileRoute("/scheduler")({
  head: () => ({ meta: [{ title: "Scheduler — BAAP Notify" }] }),
  component: SchedulerPage,
});

const PRESETS: Array<{ label: string; expr: string }> = [
  { label: "Every 5 minutes", expr: "*/5 * * * *" },
  { label: "Every 15 minutes", expr: "*/15 * * * *" },
  { label: "Hourly", expr: "0 * * * *" },
  { label: "Daily 09:00", expr: "0 9 * * *" },
  { label: "Weekly (Mon 09:00)", expr: "0 9 * * 1" },
];

function SchedulerPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const listQ = useQuery({
    queryKey: ["cron"],
    queryFn: () => NotificationApi.cron.list(),
    refetchInterval: 15_000,
  });
  const jobs = normalizeList<CronJob>(listQ.data);

  const del = useMutation({
    mutationFn: (id: string) => NotificationApi.cron.remove(id),
    onSuccess: () => {
      toast.success("Job deleted");
      qc.invalidateQueries({ queryKey: ["cron"] });
    },
    onError: (e: any) => toast.error("Delete failed", { description: e?.error }),
  });
  const pause = useMutation({
    mutationFn: (id: string) => NotificationApi.cron.pause(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cron"] }),
  });
  const resume = useMutation({
    mutationFn: (id: string) => NotificationApi.cron.resume(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cron"] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Scheduler</h1>
          <p className="text-sm text-muted-foreground">Recurring notification jobs (CRON).</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> New job</Button>
          </DialogTrigger>
          <CreateJobDialog onClose={() => setOpen(false)} />
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Jobs</CardTitle>
          <CardDescription>{jobs.length} scheduled</CardDescription>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              {listQ.isLoading ? "Loading…" : "No jobs yet."}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Expression</TableHead>
                  <TableHead>Next run</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((j) => (
                  <TableRow key={j.id}>
                    <TableCell className="font-medium">{j.name}</TableCell>
                    <TableCell>{j.channel}</TableCell>
                    <TableCell>{j.provider}</TableCell>
                    <TableCell className="font-mono text-xs">{j.expression}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {j.nextRunAt ? new Date(j.nextRunAt).toLocaleString() : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={j.status === "ACTIVE" ? "default" : "secondary"}>{j.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        {j.status === "ACTIVE" ? (
                          <Button size="sm" variant="ghost" onClick={() => pause.mutate(j.id)}>
                            <Pause className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button size="sm" variant="ghost" onClick={() => resume.mutate(j.id)}>
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="ghost">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Cron Job?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete the CRON job "{j.name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => del.mutate(j.id)}
                                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CreateJobDialog({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [channel, setChannel] = useState<Channel>("EMAIL");
  const [provider, setProvider] = useState("msg91");
  const [expression, setExpression] = useState("0 9 * * *");
  const [payload, setPayload] = useState<string>(
    JSON.stringify(
      { to: "user@example.com", content: { templateId: "global_otp", variables: { otp: "123456", company_name: "BAAP" } } },
      null,
      2,
    ),
  );

  const create = useMutation({
    mutationFn: () => {
      let parsed: any;
      try {
        parsed = JSON.parse(payload);
      } catch {
        throw { error: "Payload is not valid JSON" };
      }
      return NotificationApi.cron.create({
        name,
        channel,
        provider,
        expression,
        payload: parsed,
        status: "ACTIVE",
      });
    },
    onSuccess: () => {
      toast.success("Job created");
      qc.invalidateQueries({ queryKey: ["cron"] });
      onClose();
    },
    onError: (e: any) => toast.error("Create failed", { description: e?.error ?? "Unknown" }),
  });

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>New CRON job</DialogTitle>
        <DialogDescription>Schedule a recurring notification.</DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-2">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Daily digest" />
          </div>
          <div className="space-y-2">
            <Label>Channel</Label>
            <Select value={channel} onValueChange={(v) => { setChannel(v as Channel); setProvider(PROVIDERS_BY_CHANNEL[v as Channel][0]); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="EMAIL">Email</SelectItem>
                <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                <SelectItem value="SMS">SMS</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Provider</Label>
            <Select value={provider} onValueChange={setProvider}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PROVIDERS_BY_CHANNEL[channel].map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Expression</Label>
            <div className="flex gap-2">
              <Input value={expression} onChange={(e) => setExpression(e.target.value)} className="font-mono" />
            </div>
            <div className="flex flex-wrap gap-1">
              {PRESETS.map((p) => (
                <button
                  key={p.expr}
                  type="button"
                  onClick={() => setExpression(p.expr)}
                  className="rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                >
                  <Clock className="mr-1 inline h-3 w-3" />
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Payload (JSON)</Label>
          <Textarea rows={10} value={payload} onChange={(e) => setPayload(e.target.value)} className="font-mono text-xs" />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button disabled={!name || create.isPending} onClick={() => create.mutate()}>
          {create.isPending ? "Creating…" : "Create job"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}