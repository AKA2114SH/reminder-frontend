import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

interface ChannelDistributionItem {
  channel: string;
  count: number;
}

interface ChannelDistributionChartProps {
  data: ChannelDistributionItem[];
  onChannelSelect?: (channel: string) => void;
}

const COLORS: Record<string, string> = {
  EMAIL: "#3b82f6",
  WHATSAPP: "#25d366",
  SMS: "#8b5cf6",
};

const CHANNEL_LABELS: Record<string, string> = {
  EMAIL: "Email",
  WHATSAPP: "WhatsApp",
  SMS: "SMS",
};

export function ChannelDistributionChart({ data, onChannelSelect }: ChannelDistributionChartProps) {
  const total = data.reduce((sum, item) => sum + item.count, 0);

  if (!data || data.length === 0 || total === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        No channel distribution data available.
      </div>
    );
  }

  const formattedData = data.map((item) => ({
    name: CHANNEL_LABELS[item.channel.toUpperCase()] || item.channel,
    value: item.count,
    channel: item.channel.toUpperCase(),
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={formattedData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={85}
          paddingAngle={4}
          onClick={(entry) => onChannelSelect?.(entry.channel)}
          className="cursor-pointer"
        >
          {formattedData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={COLORS[entry.channel] || "#a1a1aa"}
            />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number) => {
            const pct = total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";
            return [`${value.toLocaleString()} (${pct}%)`, "Volume"];
          }}
          contentStyle={{
            background: "var(--color-popover)",
            border: "1px solid var(--color-border)",
            borderRadius: 8,
            fontSize: 12,
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
          }}
        />
        <Legend
          verticalAlign="bottom"
          height={36}
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 12 }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
