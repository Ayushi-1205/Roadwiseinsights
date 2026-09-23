import { Cell, Pie, PieChart, Tooltip } from "recharts";

import { ChartFrame, tooltipStyles } from "./ChartFrame";

export type SeverityPoint = {
  name: string;
  value: number;
  color: string;
};

export function SeverityDonut({ height = 240, data }: { height?: number; data: SeverityPoint[] }) {
  return (
    <div>
      <ChartFrame height={height}>
        <PieChart>
          <Tooltip {...tooltipStyles} cursor={false} />
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="62%"
            outerRadius="90%"
            paddingAngle={3}
            stroke="none"
            animationDuration={900}
          >
            {data.map((s) => (
              <Cell key={s.name} fill={s.color} />
            ))}
          </Pie>
        </PieChart>
      </ChartFrame>
      <ul className="mt-4 grid grid-cols-2 gap-2">
        {data.map((s) => (
          <li key={s.name} className="flex items-center gap-2">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: s.color }}
            />
            <span className="min-w-0 truncate text-xs text-muted-foreground">{s.name}</span>
            <span className="numeric ml-auto text-xs font-semibold text-foreground">
              {s.value}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
