import { Cell, Pie, PieChart, Tooltip } from "recharts";

import { severitySplit } from "@/lib/mock-data";
import { ChartFrame, tooltipStyles } from "./ChartFrame";

export function SeverityDonut({ height = 240 }: { height?: number }) {
  return (
    <div>
      <ChartFrame height={height}>
        <PieChart>
          <Tooltip {...tooltipStyles} cursor={false} />
          <Pie
            data={severitySplit}
            dataKey="value"
            nameKey="name"
            innerRadius="62%"
            outerRadius="90%"
            paddingAngle={3}
            stroke="none"
            animationDuration={900}
          >
            {severitySplit.map((s) => (
              <Cell key={s.name} fill={s.color} />
            ))}
          </Pie>
        </PieChart>
      </ChartFrame>
      <ul className="mt-4 grid grid-cols-2 gap-2">
        {severitySplit.map((s) => (
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