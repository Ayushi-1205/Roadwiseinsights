import { Bar, BarChart, CartesianGrid, Cell, Tooltip, XAxis, YAxis } from "recharts";

import { ChartFrame, axisProps, gridProps, tooltipStyles } from "./ChartFrame";

export type HourlyPoint = {
  hour: string;
  count: number;
};

export function HourlyBars({ height = 280, data }: { height?: number; data: HourlyPoint[] }) {
  const max = Math.max(0, ...data.map((d) => d.count));
  return (
    <ChartFrame height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey="hour" {...axisProps} />
        <YAxis {...axisProps} width={56} />
        <Tooltip {...tooltipStyles} />
        <Bar dataKey="count" name="Accidents" radius={[6, 6, 2, 2]} animationDuration={900}>
          {data.map((d) => (
            <Cell
              key={d.hour}
              fill={d.count > max * 0.85 ? "var(--color-chart-3)" : "var(--color-chart-1)"}
              fillOpacity={d.count > max * 0.85 ? 0.95 : 0.55}
            />
          ))}
        </Bar>
      </BarChart>
    </ChartFrame>
  );
}
