import type { TooltipContentProps } from 'recharts';

/** Recharts clones this element and injects the full TooltipContentProps at
 *  runtime, but that makes every prop appear required to the element's own
 *  type - accept a partial so `<ChartTooltip />` type-checks as a bare element. */
export function ChartTooltip({ active, payload, label }: Partial<TooltipContentProps<number, string>>) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-paper-raised px-3 py-2 shadow-md">
      {label !== undefined && <p className="text-xs font-medium text-ink-muted">{label}</p>}
      {payload.map((entry, i) => (
        <p key={i} className="font-mono text-sm text-ink">
          {entry.value}
        </p>
      ))}
    </div>
  );
}
