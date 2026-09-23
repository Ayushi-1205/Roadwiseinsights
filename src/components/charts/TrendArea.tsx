import { Area, AreaChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";

import { ChartFrame, axisProps, gridProps, tooltipStyles } from "./ChartFrame";

export type TrendPoint = {
  month: string;
  accidents: number;
  casualties: number;
};

export function TrendArea({ height = 320, data }: { height?: number; data: TrendPoint[] }) {
  return (
    <ChartFrame height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id="gradAccidents" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.45} />
            <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradInjuries" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-chart-2)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--color-chart-2)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey="month" {...axisProps} />
        <YAxis {...axisProps} width={56} />
        <Tooltip {...tooltipStyles} />
        <Area
          type="monotone"
          dataKey="accidents"
          name="Accidents"
          stroke="var(--color-chart-1)"
          strokeWidth={2.4}
          fill="url(#gradAccidents)"
          animationDuration={900}
        />
        <Area
          type="monotone"
          dataKey="casualties"
          name="Casualties"
          stroke="var(--color-chart-2)"
          strokeWidth={2}
          fill="url(#gradInjuries)"
          animationDuration={1100}
        />
      </AreaChart>
    </ChartFrame>
  );
}
