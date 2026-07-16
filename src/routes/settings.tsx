import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { NotificationApi, PROVIDERS_BY_CHANNEL } from "@/lib/api/client";
import { Trash2 } from "lucide-react";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — BAAP Notify" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const providersQ = useQuery({
    queryKey: ["providers"],
    queryFn: () => NotificationApi.providers(),
    retry: false,
  });

  const clearCache = useMutation({
    mutationFn: () => NotificationApi.clearCache(),
    onSuccess: () => toast.success("Cache cleared"),
    onError: (e: any) => toast.error("Clear failed", { description: e?.error }),
  });

  const [defaultEmail, setDefaultEmail] = useState("msg91");
  const [defaultWhats, setDefaultWhats] = useState("ultramsg");
  const [defaultSms, setDefaultSms] = useState("jiocx");
  const [retries, setRetries] = useState("3");
  const [rateLimit, setRateLimit] = useState("100");

  useEffect(() => {
    setDefaultEmail(localStorage.getItem("default_provider_email") ?? "msg91");
    setDefaultWhats(localStorage.getItem("default_provider_whatsapp") ?? "ultramsg");
    setDefaultSms(localStorage.getItem("default_provider_sms") ?? "jiocx");
    setRetries(localStorage.getItem("retry_count") ?? "3");
    setRateLimit(localStorage.getItem("rate_limit_rpm") ?? "100");
  }, []);

  const saveDefaults = () => {
    localStorage.setItem("default_provider_email", defaultEmail);
    localStorage.setItem("default_provider_whatsapp", defaultWhats);
    localStorage.setItem("default_provider_sms", defaultSms);
    localStorage.setItem("retry_count", retries);
    localStorage.setItem("rate_limit_rpm", rateLimit);
    toast.success("Preferences saved");
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Provider configuration and system controls.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Providers</CardTitle>
          <CardDescription>Registered upstream services</CardDescription>
        </CardHeader>
        <CardContent>
          {providersQ.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : providersQ.isError ? (
            <p className="text-sm text-muted-foreground">Provider list unavailable.</p>
          ) : (
            <pre className="max-h-64 overflow-auto rounded-md bg-muted/50 p-3 text-xs">
              {JSON.stringify(providersQ.data, null, 2)}
            </pre>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            {(["EMAIL", "WHATSAPP", "SMS"] as const).map((c) => (
              <div key={c} className="flex items-center gap-2 rounded-md border p-3 text-xs">
                <span className="font-medium">{c}</span>
                {PROVIDERS_BY_CHANNEL[c].map((p) => (
                  <Badge key={p} variant="secondary">{p}</Badge>
                ))}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Defaults</CardTitle>
          <CardDescription>Preferences stored locally in this browser</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {[
            { label: "Default Email provider", value: defaultEmail, set: setDefaultEmail, opts: PROVIDERS_BY_CHANNEL.EMAIL },
            { label: "Default WhatsApp provider", value: defaultWhats, set: setDefaultWhats, opts: PROVIDERS_BY_CHANNEL.WHATSAPP },
            { label: "Default SMS provider", value: defaultSms, set: setDefaultSms, opts: PROVIDERS_BY_CHANNEL.SMS },
          ].map((f) => (
            <div key={f.label} className="space-y-2">
              <Label>{f.label}</Label>
              <Select value={f.value} onValueChange={f.set}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {f.opts.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
          <div className="space-y-2">
            <Label>Retry count</Label>
            <Input type="number" value={retries} onChange={(e) => setRetries(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Rate limit (req/min)</Label>
            <Input type="number" value={rateLimit} onChange={(e) => setRateLimit(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <Button onClick={saveDefaults}>Save preferences</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API keys & tokens</CardTitle>
          <CardDescription>Client ID is injected server-side by the proxy</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="rounded-md border bg-muted/40 p-3 font-mono text-xs">
            x-client-id: •••••••• (managed by server)
          </div>
          <p className="text-xs text-muted-foreground">
            Requests are proxied through <code>/api/proxy/*</code>. The client credential never
            reaches the browser. Add a JWT bearer step later by extending the proxy handler.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Administration</CardTitle>
          <CardDescription>Dangerous operations</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={() => clearCache.mutate()}
            disabled={clearCache.isPending}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {clearCache.isPending ? "Clearing…" : "Clear server cache"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}