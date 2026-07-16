export function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div className="w-full flex flex-col justify-between animate-pulse" style={{ height: `${height}px` }}>
      <div className="flex justify-between items-end h-full px-6 pb-4 pt-6 gap-3">
        {[40, 70, 45, 90, 60, 35, 80, 55, 95, 50, 75, 40].map((h, i) => (
          <div key={i} className="bg-muted w-full rounded-t" style={{ height: `${h}%` }} />
        ))}
      </div>
      <div className="flex justify-between border-t border-muted/20 pt-3 px-6 pb-2">
        <div className="h-3 w-12 bg-muted rounded" />
        <div className="h-3 w-12 bg-muted rounded" />
        <div className="h-3 w-12 bg-muted rounded" />
        <div className="h-3 w-12 bg-muted rounded" />
      </div>
    </div>
  );
}
