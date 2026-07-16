import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarDays } from "lucide-react";

interface DateRangePickerProps {
  value: number;
  onChange: (days: number) => void;
}

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  return (
    <div className="flex items-center gap-2">
      <CalendarDays className="h-4 w-4 text-muted-foreground" />
      <Select value={String(value)} onValueChange={(v) => onChange(Number(v))}>
        <SelectTrigger className="w-40 h-9 font-medium text-xs">
          <SelectValue placeholder="Select range" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="7" className="text-xs">Last 7 days</SelectItem>
          <SelectItem value="30" className="text-xs">Last 30 days</SelectItem>
          <SelectItem value="90" className="text-xs">Last 90 days</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
