import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface ChannelBreakdownItem {
  channel: string;
  total: number;
}

interface ChannelBreakdownTableProps {
  data: ChannelBreakdownItem[];
  totalTasks: number;
}

const CHANNEL_NAMES: Record<string, string> = {
  EMAIL: "Email",
  WHATSAPP: "WhatsApp",
  SMS: "SMS",
};

export function ChannelBreakdownTable({ data, totalTasks }: ChannelBreakdownTableProps) {
  return (
    <div className="rounded-md border border-border overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/40">
          <TableRow>
            <TableHead>Channel</TableHead>
            <TableHead className="text-right">Volume</TableHead>
            <TableHead className="text-right">Share</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="py-6 text-center text-sm text-muted-foreground">
                No channel breakdown data available.
              </TableCell>
            </TableRow>
          ) : (
            data.map((row) => {
              const volume = row.total ?? (row as any).count ?? 0;
              const share = totalTasks > 0 ? (volume / totalTasks) * 100 : 0;
              return (
                <TableRow key={row.channel} className="hover:bg-muted/30">
                  <TableCell className="font-semibold text-xs py-3">
                    {CHANNEL_NAMES[row.channel.toUpperCase()] || row.channel}
                  </TableCell>
                  <TableCell className="text-right text-xs font-mono py-3">
                    {volume.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right text-xs font-mono py-3 text-muted-foreground">
                    {share.toFixed(1)}%
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
