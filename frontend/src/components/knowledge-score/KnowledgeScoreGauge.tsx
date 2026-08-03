import { cn } from '@/lib/cn';

interface KnowledgeScoreGaugeProps {
  score: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeConfig = {
  sm: { box: 96, stroke: 7, font: 'text-2xl' },
  md: { box: 144, stroke: 9, font: 'text-4xl' },
  lg: { box: 200, stroke: 11, font: 'text-6xl' },
};

function bandColor(score: number): { stroke: string; text: string } {
  if (score >= 80) return { stroke: 'var(--gold)', text: 'text-gold-strong' };
  if (score >= 50) return { stroke: 'var(--board)', text: 'text-board-strong' };
  return { stroke: 'var(--flag)', text: 'text-flag' };
}

/**
 * The product's signature component: a grade-dial styled like a classroom
 * gauge, chalk-tick marks around the rim, the score set in the display
 * serif at the center. Appears on the student dashboard, a teacher's
 * student-detail view, and admin analytics - the one visual thread tying
 * every portal together.
 */
export function KnowledgeScoreGauge({ score, label, size = 'md', className }: KnowledgeScoreGaugeProps) {
  const { box, stroke, font } = sizeConfig[size];
  const radius = (box - stroke * 2) / 2;
  const center = box / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, score));
  const dashOffset = circumference * (1 - clamped / 100);
  const { stroke: strokeColor, text: textColor } = bandColor(clamped);

  const tickCount = 24;
  const ticks = Array.from({ length: tickCount }, (_, i) => {
    const angle = (i / tickCount) * 360;
    const isMajor = i % 6 === 0;
    const tickRadius = radius + stroke * 0.9;
    const innerRadius = tickRadius - (isMajor ? 6 : 3);
    const rad = (angle - 90) * (Math.PI / 180);
    return {
      x1: center + Math.cos(rad) * tickRadius,
      y1: center + Math.sin(rad) * tickRadius,
      x2: center + Math.cos(rad) * innerRadius,
      y2: center + Math.sin(rad) * innerRadius,
      isMajor,
    };
  });

  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: box, height: box }}
      role="meter"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? 'Knowledge Score'}
    >
      <svg width={box} height={box} className="-rotate-90">
        {ticks.map((t, i) => (
          <line
            key={i}
            x1={t.x1}
            y1={t.y1}
            x2={t.x2}
            y2={t.y2}
            stroke="var(--border-strong)"
            strokeWidth={t.isMajor ? 1.5 : 1}
            strokeLinecap="round"
            className="rotate-90"
            style={{ transformOrigin: `${center}px ${center}px` }}
          />
        ))}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth={stroke}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.16,1,0.3,1)' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={cn('font-display font-medium leading-none', font, textColor)}>
          {Math.round(clamped)}
        </span>
        {label && <span className="eyebrow mt-1">{label}</span>}
      </div>
    </div>
  );
}
