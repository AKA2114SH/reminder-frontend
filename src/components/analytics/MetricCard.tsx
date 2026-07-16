import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface MetricCardProps {
  title?: string;
  label?: string; // Alias for dashboard compatibility
  value: string | number;
  subtitle?: string;
  hint?: string; // Alias for dashboard compatibility
  icon: React.ReactNode;
  color?: string;
  trend?: number;
  tone?: "default" | "success" | "destructive" | "info" | "muted";
}

export function MetricCard({
  title,
  label,
  value,
  subtitle,
  hint,
  icon,
  color,
  trend,
  tone = "default",
}: MetricCardProps) {
  const displayTitle = title || label || "";
  const displaySubtitle = subtitle || hint || "";

  const accentCls =
    tone === "success"
      ? "bg-emerald-500"
      : tone === "destructive"
        ? "bg-rose-500"
        : tone === "info"
          ? "bg-blue-500"
          : "";

  return (
    <Card className="relative overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <span className={`text-xs font-semibold uppercase tracking-wider text-muted-foreground ${color || ""}`}>
          {displayTitle}
        </span>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        {displaySubtitle && <p className="text-xs text-muted-foreground mt-1">{displaySubtitle}</p>}
        {trend !== undefined && (
          <p className={`text-xs mt-1 font-semibold ${trend >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
            {trend >= 0 ? "↑" : "↓"} {Math.abs(trend).toFixed(1)}%
          </p>
        )}
      </CardContent>
      {accentCls && <div className={`absolute inset-x-0 bottom-0 h-0.5 ${accentCls}`} />}
    </Card>
  );
}
