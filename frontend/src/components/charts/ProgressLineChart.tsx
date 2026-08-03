import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartTooltip } from './ChartTooltip';

export interface ProgressPoint {
  date: string;
  score: number;
}

interface ProgressLineChartProps {
  data: ProgressPoint[];
  height?: number;
}

/** Single-series timeline (a student's own score history) - no legend needed. */
export function ProgressLineChart({ data, height = 240 }: ProgressLineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="progress-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--board)" stopOpacity={0.18} />
            <stop offset="100%" stopColor="var(--board)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          axisLine={false}
          tickLine={false}
          tick={{ fill: 'var(--ink-muted)', fontSize: 12 }}
        />
        <YAxis
          domain={[0, 100]}
          axisLine={false}
          tickLine={false}
          tick={{ fill: 'var(--ink-muted)', fontSize: 12 }}
          width={32}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'var(--border-strong)' }} />
        <Area
          type="monotone"
          dataKey="score"
          stroke="var(--board)"
          strokeWidth={2}
          fill="url(#progress-fill)"
          dot={false}
          activeDot={{ r: 4, fill: 'var(--board)', strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
