import type { ReactNode } from "react";
import { ResponsiveContainer } from "recharts";

export const axisProps = {
  stroke: "var(--color-muted-foreground)",
  tick: { fill: "var(--color-muted-foreground)", fontSize: 11 },
  tickLine: false,
  axisLine: false,
} as const;

export const gridProps = {
  stroke: "var(--color-border)",
  strokeDasharray: "3 6",
  vertical: false,
} as const;

export const tooltipStyles = {
  contentStyle: {
    background: "var(--color-elevated)",
    border: "1px solid var(--color-border)",
    borderRadius: "12px",
    fontSize: "12px",
    boxShadow: "var(--shadow-panel)",
    color: "var(--color-foreground)",
  },
  labelStyle: { color: "var(--color-muted-foreground)", marginBottom: 4 },
  itemStyle: { color: "var(--color-foreground)" },
  cursor: { fill: "var(--color-muted)", opacity: 0.35 },
} as const;

export function ChartFrame({ height = 300, children }: { height?: number; children: ReactNode }) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        {children as never}
      </ResponsiveContainer>
    </div>
  );
}