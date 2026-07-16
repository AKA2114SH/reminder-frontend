import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  NotificationApi,
  PROVIDERS_BY_CHANNEL,
  TEMPLATES,
  type Channel,
  type SendPayload,
} from "@/lib/api/client";
import { Send, RefreshCw, X } from "lucide-react";

export const Route = createFileRoute("/send")({
  head: () => ({ meta: [{ title: "Send Notification — BAAP Notify" }] }),
  component: SendPage,
});

const schema = z.object({
  channel: z.enum(["EMAIL", "WHATSAPP", "SMS"]),
  provider: z.string().min(1, "Provider required"),
  recipients: z.array(z.string().min(1)).min(1, "At least one recipient"),
  subject: z.string().max(200).optional(),
  text: z.string().max(4000).optional(),
  templateId: z.string().optional(),
  variables: z.record(z.string()).optional(),
  priority: z.number().min(1).max(5),
  scheduled: z.boolean(),
  scheduledAt: z.string().optional(),
  idempotencyKey: z.string().min(1),
});

type FormValues = z.infer<typeof schema>;

function genKey() {
  return `idk_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function SendPage() {
  const navigate = useNavigate();
  const [recipientInput, setRecipientInput] = useState("");

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      channel: "EMAIL",
      provider: "msg91",
      recipients: [],
      subject: "",
      text: "",
      templateId: "",
      variables: {},
      priority: 3,
      scheduled: false,
      scheduledAt: "",
      idempotencyKey: genKey(),
    },
  });

  const channel = form.watch("channel");
  const templateId = form.watch("templateId");
  const scheduled = form.watch("scheduled");
  const recipients = form.watch("recipients");

  const template = useMemo(() => TEMPLATES.find((t) => t.id === templateId), [templateId]);
  const availableTemplates = useMemo(
    () => TEMPLATES.filter((t) => t.channel.includes(channel)),
    [channel],
  );
  const availableProviders = PROVIDERS_BY_CHANNEL[channel];

  const mutation = useMutation({
    mutationFn: (v: SendPayload) => NotificationApi.send(v),
    onSuccess: (res) => {
      toast.success("Notification queued", {
        description: `Task ${res.taskId?.slice(0, 8)}… · ${res.status}`,
        action: {
          label: "View",
          onClick: () => navigate({ to: "/logs" }),
        },
      });
      form.reset({
        ...form.getValues(),
        recipients: [],
        idempotencyKey: genKey(),
      });
    },
    onError: (e: any) => {
      toast.error("Send failed", { description: e?.error ?? "Unknown error" });
    },
  });

  const addRecipient = () => {
    const parts = recipientInput
      .split(/[,\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (!parts.length) return;
    const current = form.getValues("recipients");
    const next = Array.from(new Set([...current, ...parts]));
    form.setValue("recipients", next, { shouldValidate: true });
    setRecipientInput("");
  };

  const removeRecipient = (r: string) => {
    form.setValue(
      "recipients",
      form.getValues("recipients").filter((x) => x !== r),
      { shouldValidate: true },
    );
  };

  const onSubmit = form.handleSubmit((v) => {
    const payload: SendPayload = {
      channel: v.channel,
      provider: v.provider,
      to: v.recipients.length === 1 ? v.recipients[0] : v.recipients,
      content: {
        ...(v.templateId ? { templateId: v.templateId, variables: v.variables } : {}),
        ...(v.subject ? { subject: v.subject } : {}),
        ...(v.text ? { text: v.text } : {}),
      },
      priority: v.priority as 1 | 2 | 3 | 4 | 5,
      ...(v.scheduled && v.scheduledAt ? { scheduledAt: new Date(v.scheduledAt).toISOString() } : {}),
      idempotencyKey: v.idempotencyKey,
    };
    mutation.mutate(payload);
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Send notification</h1>
        <p className="text-sm text-muted-foreground">
          Deliver to a single recipient or paste a batch. Choose a template or write freeform.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Routing</CardTitle>
            <CardDescription>Channel and provider</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Channel</Label>
              <Controller
                control={form.control}
                name="channel"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(v) => {
                      field.onChange(v);
                      const provs = PROVIDERS_BY_CHANNEL[v as Channel];
                      form.setValue("provider", provs[0]);
                      form.setValue("templateId", "");
                    }}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EMAIL">Email</SelectItem>
                      <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                      <SelectItem value="SMS">SMS</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label>Provider</Label>
              <Controller
                control={form.control}
                name="provider"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {availableProviders.map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recipients</CardTitle>
            <CardDescription>
              {channel === "EMAIL"
                ? "One or more email addresses."
                : "Phone numbers in E.164 (no +)."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder={channel === "EMAIL" ? "user@example.com" : "919021503115"}
                value={recipientInput}
                onChange={(e) => setRecipientInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    addRecipient();
                  }
                }}
              />
              <Button type="button" variant="secondary" onClick={addRecipient}>Add</Button>
            </div>
            {recipients.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {recipients.map((r) => (
                  <span
                    key={r}
                    className="inline-flex items-center gap-1 rounded-full border bg-muted px-2 py-0.5 text-xs"
                  >
                    {r}
                    <button
                      type="button"
                      onClick={() => removeRecipient(r)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            {form.formState.errors.recipients && (
              <p className="text-xs text-destructive">{form.formState.errors.recipients.message as string}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Content</CardTitle>
            <CardDescription>Template or free text</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Template (optional)</Label>
              <Controller
                control={form.control}
                name="templateId"
                render={({ field }) => (
                  <Select
                    value={field.value || "__none"}
                    onValueChange={(v) => {
                      const val = v === "__none" ? "" : v;
                      field.onChange(val);
                      const t = TEMPLATES.find((x) => x.id === val);
                      const vars: Record<string, string> = {};
                      t?.variables.forEach((k) => (vars[k] = ""));
                      form.setValue("variables", vars);
                    }}
                  >
                    <SelectTrigger><SelectValue placeholder="No template" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none">No template</SelectItem>
                      {availableTemplates.map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {template && (
              <div className="grid gap-3 rounded-md border bg-muted/40 p-3 sm:grid-cols-2">
                {template.variables.map((v) => (
                  <div key={v} className="space-y-1">
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">{v}</Label>
                    <Controller
                      control={form.control}
                      name={`variables.${v}` as any}
                      render={({ field }) => (
                        <Input {...field} value={field.value ?? ""} placeholder={`{{${v}}}`} />
                      )}
                    />
                  </div>
                ))}
              </div>
            )}

            {channel === "EMAIL" && (
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input {...form.register("subject")} placeholder="Your one-time code" />
              </div>
            )}

            <div className="space-y-2">
              <Label>Body / text (optional)</Label>
              <Textarea rows={5} {...form.register("text")} placeholder="Custom message body" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Delivery</CardTitle>
            <CardDescription>Priority, schedule, idempotency</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Priority</Label>
                <span className="text-sm font-medium">{form.watch("priority")}</span>
              </div>
              <Controller
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <Slider
                    min={1}
                    max={5}
                    step={1}
                    value={[field.value]}
                    onValueChange={(v) => field.onChange(v[0])}
                  />
                )}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1 · low</span><span>5 · urgent</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Schedule</Label>
                <p className="text-xs text-muted-foreground">Send later at a specific time</p>
              </div>
              <Controller
                control={form.control}
                name="scheduled"
                render={({ field }) => (
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
            </div>

            {scheduled && (
              <div className="space-y-2">
                <Label>Scheduled at</Label>
                <Input type="datetime-local" {...form.register("scheduledAt")} />
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Idempotency key</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => form.setValue("idempotencyKey", genKey())}
                >
                  <RefreshCw className="mr-1 h-3 w-3" /> Regenerate
                </Button>
              </div>
              <Input {...form.register("idempotencyKey")} />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => form.reset()}>Reset</Button>
          <Button type="submit" disabled={mutation.isPending}>
            <Send className="mr-2 h-4 w-4" />
            {mutation.isPending ? "Sending…" : "Send notification"}
          </Button>
        </div>
      </form>
    </div>
  );
}