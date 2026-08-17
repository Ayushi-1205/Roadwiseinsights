import { createFileRoute } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AppShell } from "@/components/layout/AppShell";
import { PageHeader, Panel, StatRow } from "@/components/ui-kit/Panel";
import { ChartFrame, axisProps, gridProps, tooltipStyles } from "@/components/charts/ChartFrame";
import { TrendArea } from "@/components/charts/TrendArea";
import { HourlyBars } from "@/components/charts/HourlyBars";
import { SeverityDonut } from "@/components/charts/SeverityDonut";
import { Badge } from "@/components/ui/badge";
import { monthlyTrend } from "@/lib/mock-data";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Accident Analytics — SafeRoadIQ" },
      {
        name: "description",
        content:
          "Multi-year accident, injury and fatality analytics with severity ratios and seasonal exposure curves.",
      },
      { property: "og:title", content: "Accident Analytics — SafeRoadIQ" },
      {
        property: "og:description",
        content: "Trend, seasonality and severity analytics for road accident data.",
      },
    ],
  }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Analytics workspace"
        title="Accident analytics"
        description="Compare volume, injury and fatality curves across the reporting window. Severity ratios reveal where outcome intensity is rising even when incident counts fall."
        action={<Badge variant="outline">Sample dataset · 12 months</Badge>}
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Panel title="Volume & injury curve" subtitle="Monthly aggregation">
          <TrendArea height={340} />
        </Panel>
        <Panel title="Severity mix" subtitle="Outcome classification">
          <SeverityDonut height={220} />
        </Panel>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Panel title="Fatality trajectory" subtitle="Monthly fatalities vs. moving intensity">
          <ChartFrame height={300}>
            <LineChart data={monthlyTrend} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="month" {...axisProps} />
              <YAxis {...axisProps} width={56} />
              <Tooltip {...tooltipStyles} />
              <Legend wrapperStyle={{ fontSize: 12, color: "var(--color-muted-foreground)" }} />
              <Line
                type="monotone"
                dataKey="fatalities"
                name="Fatalities"
                stroke="var(--color-chart-3)"
                strokeWidth={2.6}
                dot={{ r: 3, strokeWidth: 0, fill: "var(--color-chart-3)" }}
                activeDot={{ r: 5 }}
                animationDuration={900}
              />
            </LineChart>
          </ChartFrame>
        </Panel>

        <Panel title="Injuries vs. accidents" subtitle="Paired monthly comparison">
          <ChartFrame height={300}>
            <BarChart data={monthlyTrend} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="month" {...axisProps} />
              <YAxis {...axisProps} width={56} />
              <Tooltip {...tooltipStyles} />
              <Bar
                dataKey="accidents"
                name="Accidents"
                fill="var(--color-chart-1)"
                fillOpacity={0.75}
                radius={[5, 5, 0, 0]}
              />
              <Bar
                dataKey="injuries"
                name="Injuries"
                fill="var(--color-chart-2)"
                fillOpacity={0.7}
                radius={[5, 5, 0, 0]}
              />
            </BarChart>
          </ChartFrame>
        </Panel>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Panel title="Hourly exposure profile" subtitle="Aggregated across all corridors">
          <HourlyBars height={300} />
        </Panel>
        <Panel title="Derived indicators" subtitle="Computed on current selection">
          <StatRow label="Injuries per accident" value="0.78" />
          <StatRow label="Fatality ratio" value="6.4%" tone="bad" />
          <StatRow label="Peak hour share" value="18:00 — 20:00" tone="warn" />
          <StatRow label="Weekend concentration" value="31.2%" />
          <StatRow label="Night-time share" value="42.7%" tone="warn" />
          <StatRow label="Reporting completeness" value="96.1%" tone="good" />
        </Panel>
      </div>
    </AppShell>
  );
}