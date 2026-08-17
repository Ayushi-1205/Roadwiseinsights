import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/utils";

const toneMap = {
  primary: { stroke: "var(--color-chart-1)", chip: "bg-primary/12 text-primary" },
  accent: { stroke: "var(--color-chart-2)", chip: "bg-accent/12 text-accent" },
  destructive: { stroke: "var(--color-chart-3)", chip: "bg-destructive/12 text-destructive" },
  warning: { stroke: "var(--color-warning)", chip: "bg-warning/12 text-warning" },
};

function Sparkline({ series, stroke }: { series: number[]; stroke: string }) {
  const max = Math.max(...series);
  const min = Math.min(...series);
  const span = max - min || 1;
  const points = series.map((v, i) => {
    const x = (i / (series.length - 1)) * 100;
    const y = 32 - ((v - min) / span) * 28 - 2;
    return `${x},${y}`;
  });

  return (
    <svg viewBox="0 0 100 32" preserveAspectRatio="none" className="h-10 w-full">
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke={stroke}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <polygon points={`0,32 ${points.join(" ")} 100,32`} fill={stroke} opacity={0.12} />
    </svg>
  );
}

export function KpiCard({
  label,
  value,
  delta,
  hint,
  series,
  tone = "primary",
  index = 0,
}: {
  label: string;
  value: string;
  delta: number;
  hint: string;
  series: number[];
  tone?: keyof typeof toneMap;
  index?: number;
}) {
  const t = toneMap[tone];
  const improving = delta < 0;
  const Arrow = improving ? ArrowDownRight : ArrowUpRight;

  return (
    <article
      className="panel hover-lift rise-in p-5"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="mono-label min-w-0 text-muted-foreground">{label}</p>
        <span
          className={cn(
            "numeric flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
            improving ? "bg-success/12 text-success" : "bg-destructive/12 text-destructive",
          )}
        >
          <Arrow className="h-3 w-3" />
          {Math.abs(delta).toFixed(1)}%
        </span>
      </div>
      <p className="numeric mt-3 text-3xl font-bold text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      <div className="mt-3">
        <Sparkline series={series} stroke={t.stroke} />
      </div>
    </article>
  );
}