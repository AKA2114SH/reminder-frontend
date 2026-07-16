import {
  ResponsiveContainer,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Line,
} from "recharts";

interface TimeSeriesItem {
  date: string;
  sent: number;
  delivered: number;
  failed: number;
  successRate: number;
}

interface DeliveryOverTimeChartProps {
  data: TimeSeriesItem[];
}

export function DeliveryOverTimeChart({ data }: DeliveryOverTimeChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        No delivery history data available for this range.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.5} />
        <XAxis
          dataKey="date"
          stroke="var(--color-muted-foreground)"
          fontSize={11}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="var(--color-muted-foreground)"
          fontSize={11}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          content={({ active, payload, label }) => {
            if (active && payload && payload.length) {
              const dataItem = payload[0].payload;
              return (
                <div className="bg-popover border border-border p-3 rounded-lg shadow-lg text-xs space-y-1.5 min-w-[140px]">
                  <p className="font-semibold text-muted-foreground">{label}</p>
                  <div className="space-y-1">
                    {payload.map((p: any) => (
                      <div key={p.name} className="flex justify-between items-center gap-4">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color || p.stroke }} />
                          {p.name}:
                        </span>
                        <span className="font-semibold font-mono">{p.value}</span>
                      </div>
                    ))}
                    <div className="border-t border-border mt-1.5 pt-1.5 flex justify-between items-center gap-4">
                      <span className="font-medium text-blue-500">Success Rate:</span>
                      <span className="font-semibold font-mono text-blue-500">{dataItem.successRate}%</span>
                    </div>
                  </div>
                </div>
              );
            }
            return null;
          }}
        />
        <Legend
          verticalAlign="top"
          height={36}
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 12, paddingBottom: 10 }}
        />
        <Line
          type="monotone"
          name="Sent"
          dataKey="sent"
          stroke="#6366f1"
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
        />
        <Line
          type="monotone"
          name="Delivered"
          dataKey="delivered"
          stroke="#22c55e"
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
        />
        <Line
          type="monotone"
          name="Failed"
          dataKey="failed"
          stroke="#ef4444"
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
