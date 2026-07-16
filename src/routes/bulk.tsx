import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import Papa from "papaparse";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { NotificationApi, PROVIDERS_BY_CHANNEL, TEMPLATES, type Channel } from "@/lib/api/client";
import { UploadCloud, FileDown, X } from "lucide-react";

export const Route = createFileRoute("/bulk")({
  head: () => ({ meta: [{ title: "Bulk Upload — BAAP Notify" }] }),
  component: BulkPage,
});

interface Row {
  recipient: string;
  name?: string;
  _valid: boolean;
  _reason?: string;
}

function validateRecipient(r: string, channel: Channel) {
  if (!r) return { ok: false, reason: "Empty" };
  if (channel === "EMAIL") {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r) ? { ok: true } : { ok: false, reason: "Invalid email" };
  }
  return /^\d{7,15}$/.test(r) ? { ok: true } : { ok: false, reason: "Invalid phone" };
}

function BulkPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [channel, setChannel] = useState<Channel>("EMAIL");
  const [provider, setProvider] = useState<string>("msg91");
  const [templateId, setTemplateId] = useState<string>("global_otp");
  const [subject, setSubject] = useState("");
  const [taskId, setTaskId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const templates = TEMPLATES.filter((t) => t.channel.includes(channel));

  const handleFile = (f: File) => {
    if (f.size > 10 * 1024 * 1024) {
      toast.error("File too large", { description: "Max 10MB" });
      return;
    }
    setFile(f);
    setProgress(20);
    Papa.parse(f, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const seen = new Set<string>();
        const parsed: Row[] = (res.data as any[]).map((r) => {
          const recipient = String(r.recipient ?? r.email ?? r.phone ?? "").trim();
          const v = validateRecipient(recipient, channel);
          let valid = v.ok;
          let reason = v.reason;
          if (valid && seen.has(recipient)) {
            valid = false;
            reason = "Duplicate";
          }
          seen.add(recipient);
          return { recipient, name: r.name?.trim(), _valid: valid, _reason: reason };
        });
        setRows(parsed);
        setProgress(100);
      },
      error: () => {
        toast.error("Failed to parse CSV");
        setProgress(0);
      },
    });
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const validCount = rows.filter((r) => r._valid).length;
  const invalidCount = rows.length - validCount;
  const dupCount = rows.filter((r) => r._reason === "Duplicate").length;

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("No file");
      const form = new FormData();
      form.append("file", file);
      form.append("channel", channel);
      form.append("provider", provider);
      form.append(
        "content",
        JSON.stringify({
          templateId,
          ...(subject ? { subject } : {}),
        }),
      );
      return NotificationApi.bulkCsv(form);
    },
    onSuccess: (r) => {
      setTaskId(r.taskId);
      toast.success("Bulk upload accepted", { description: `Task ${r.taskId?.slice(0, 8)}…` });
    },
    onError: (e: any) => toast.error("Upload failed", { description: e?.error ?? "Unknown error" }),
  });

  const statusQ = useQuery({
    queryKey: ["bulk-status", taskId],
    queryFn: () => NotificationApi.bulkStatus(taskId!),
    enabled: !!taskId,
    refetchInterval: 5000,
  });

  const downloadTemplate = () => {
    const csv = "recipient,name\nuser@example.com,John Doe\n";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bulk-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Bulk CSV upload</h1>
        <p className="text-sm text-muted-foreground">Upload a CSV with a `recipient` column (optional `name`).</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>File</CardTitle>
            <CardDescription>CSV, max 10MB</CardDescription>
          </CardHeader>
          <CardContent>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              className={`cursor-pointer rounded-lg border-2 border-dashed p-10 text-center transition-colors ${
                dragging ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"
              }`}
            >
              <UploadCloud className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-sm font-medium">
                {file ? file.name : "Drop CSV here or click to browse"}
              </p>
              <p className="text-xs text-muted-foreground">recipient (required), name (optional)</p>
              <input
                ref={inputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
            </div>
            {progress > 0 && progress < 100 && <Progress value={progress} className="mt-3" />}
            {file && (
              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</span>
                <button
                  className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setFile(null);
                    setRows([]);
                    setProgress(0);
                    if (inputRef.current) inputRef.current.value = "";
                  }}
                >
                  <X className="h-3 w-3" /> Clear
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Config</CardTitle>
            <CardDescription>Applied to every row</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label>Channel</Label>
              <Select
                value={channel}
                onValueChange={(v) => {
                  setChannel(v as Channel);
                  setProvider(PROVIDERS_BY_CHANNEL[v as Channel][0]);
                }}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="EMAIL">Email</SelectItem>
                  <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
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
              <Label>Template</Label>
              <Select value={templateId} onValueChange={setTemplateId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {channel === "EMAIL" && (
              <div className="space-y-2">
                <Label className="after:content-['_*'] after:text-destructive">Subject</Label>
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Email subject" />
              </div>
            )}
            <Button type="button" variant="outline" className="w-full" onClick={downloadTemplate}>
              <FileDown className="mr-2 h-4 w-4" /> Download template
            </Button>
          </CardContent>
        </Card>
      </div>

      {rows.length > 0 && (
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Preview</CardTitle>
              <CardDescription>
                {rows.length} rows · <span className="text-success">{validCount} valid</span> ·{" "}
                <span className="text-destructive">{invalidCount} invalid</span> ·{" "}
                <span className="text-warning">{dupCount} duplicates</span>
              </CardDescription>
            </div>
            <Button
              disabled={validCount === 0 || uploadMutation.isPending}
              onClick={() => {
                if (channel === "EMAIL" && !subject.trim()) {
                  toast.error("Subject required", {
                    description: "Please specify a subject for the bulk email template.",
                  });
                  return;
                }
                uploadMutation.mutate();
              }}
            >
              {uploadMutation.isPending ? "Uploading…" : `Send to ${validCount} recipients`}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.slice(0, 200).map((r, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                      <TableCell className="font-mono text-xs">{r.recipient || "—"}</TableCell>
                      <TableCell>{r.name || "—"}</TableCell>
                      <TableCell>
                        {r._valid ? (
                          <StatusBadge status="VALID" />
                        ) : (
                          <span className="text-xs text-destructive">{r._reason}</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {rows.length > 200 && (
              <p className="mt-2 text-xs text-muted-foreground">Showing first 200 of {rows.length}.</p>
            )}
          </CardContent>
        </Card>
      )}

      {taskId && (
        <Card>
          <CardHeader>
            <CardTitle>Job status</CardTitle>
            <CardDescription className="font-mono text-xs">Task {taskId}</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="max-h-64 overflow-auto rounded-md bg-muted/50 p-3 text-xs">
              {statusQ.isLoading ? "Loading…" : JSON.stringify(statusQ.data, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}