import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusConfig {
  label: string;
  className: string;
}

const STATUS_MAP: Record<string, StatusConfig> = {
  QUEUED: { label: "⏳ Queued", className: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  PROCESSING: { label: "🔄 Processing", className: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  ENRICHED: { label: "📝 Enriched", className: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
  SENT_TO_PROVIDER: { label: "📤 Sent", className: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20" },
  DELIVERED: { label: "✅ Delivered", className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
  FAILED: { label: "❌ Failed", className: "bg-rose-500/10 text-rose-500 border-rose-500/20" },
  SCHEDULED: { label: "📅 Scheduled", className: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20" },
};

export function StatusBadge({ status }: { status?: string }) {
  const s = (status || "UNKNOWN").toUpperCase();
  const config = STATUS_MAP[s] || {
    label: s,
    className: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  };

  return (
    <Badge variant="outline" className={cn("font-medium tracking-wide gap-1 shadow-sm", config.className)}>
      {config.label}
    </Badge>
  );
}