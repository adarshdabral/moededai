import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartTooltip } from './ChartTooltip';

export interface MagnitudeDatum {
  label: string;
  value: number;
}

interface MagnitudeBarChartProps {
  data: MagnitudeDatum[];
  height?: number;
  /** Highlights bars below this value in the flag color (e.g. weak topics). */
  warnBelow?: number;
}

/** Single-hue magnitude bars (score per topic/student) - not a categorical chart. */
export function MagnitudeBarChart({ data, height = 260, warnBelow }: MagnitudeBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
        <XAxis
          dataKey="label"
          axisLine={false}
          tickLine={false}
          tick={{ fill: 'var(--ink-muted)', fontSize: 12 }}
          interval={0}
          angle={data.length > 6 ? -30 : 0}
          textAnchor={data.length > 6 ? 'end' : 'middle'}
          height={data.length > 6 ? 50 : 30}
        />
        <YAxis
          domain={[0, 100]}
          axisLine={false}
          tickLine={false}
          tick={{ fill: 'var(--ink-muted)', fontSize: 12 }}
          width={32}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--paper-sunken)' }} />
        <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={40}>
          {data.map((d, i) => (
            <Cell key={i} fill={warnBelow && d.value < warnBelow ? 'var(--flag)' : 'var(--board)'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
