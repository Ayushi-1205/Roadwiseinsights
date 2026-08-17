import { createFileRoute } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, Cell, Tooltip, XAxis, YAxis } from "recharts";

import { AppShell } from "@/components/layout/AppShell";
import { PageHeader, Panel } from "@/components/ui-kit/Panel";
import { HotspotMap } from "@/components/HotspotMap";
import { ChartFrame, axisProps, gridProps, tooltipStyles } from "@/components/charts/ChartFrame";
import { Badge } from "@/components/ui/badge";
import { corridorRisk } from "@/lib/mock-data";

export const Route = createFileRoute("/hotspots")({
  head: () => ({
    meta: [
      { title: "Accident Hotspot Map — SafeRoadIQ" },
      {
        name: "description",
        content:
          "Geospatial hotspot intelligence: corridor risk scores, incident clustering and blackspot ranking.",
      },
      { property: "og:title", content: "Accident Hotspot Map — SafeRoadIQ" },
      {
        property: "og:description",
        content: "Corridor risk scores, incident clustering and blackspot ranking.",
      },
    ],
  }),
  component: HotspotsPage,
});

const statusTone: Record<string, string> = {
  Critical: "bg-destructive/12 text-destructive",
  High: "bg-warning/12 text-warning",
  Elevated: "bg-accent/12 text-accent",
};

function HotspotsPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Geospatial intelligence"
        title="Accident hotspot map"
        description="Blackspot clustering across the monitored network. Risk score blends incident density, severity weighting, exposure volume and infrastructure defects."
        action={<Badge variant="outline">127 active hotspots</Badge>}
      />

      <Panel title="Risk density layer" subtitle="Interactive — select any marker">
        <HotspotMap />
      </Panel>

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Panel title="Corridor risk ranking" subtitle="Weighted composite score">
          <ChartFrame height={300}>
            <BarChart
              data={corridorRisk}
              layout="vertical"
              margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
            >
              <CartesianGrid {...gridProps} vertical horizontal={false} />
              <XAxis type="number" domain={[0, 100]} {...axisProps} />
              <YAxis type="category" dataKey="corridor" width={140} {...axisProps} />
              <Tooltip {...tooltipStyles} />
              <Bar dataKey="risk" name="Risk score" radius={[0, 6, 6, 0]} animationDuration={900}>
                {corridorRisk.map((c) => (
                  <Cell
                    key={c.corridor}
                    fill={c.risk >= 85 ? "var(--color-chart-3)" : "var(--color-chart-1)"}
                    fillOpacity={0.85}
                  />
                ))}
              </Bar>
            </BarChart>
          </ChartFrame>
        </Panel>

        <Panel title="Blackspot register" subtitle="Prioritised for intervention" bodyClassName="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="mono-label px-5 py-3 text-left text-muted-foreground">Corridor</th>
                  <th className="mono-label px-3 py-3 text-right text-muted-foreground">Risk</th>
                  <th className="mono-label px-3 py-3 text-right text-muted-foreground">Δ 30d</th>
                  <th className="mono-label px-5 py-3 text-right text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {corridorRisk.map((c) => (
                  <tr
                    key={c.corridor}
                    className="border-b border-border/60 transition-colors last:border-0 hover:bg-secondary/50"
                  >
                    <td className="px-5 py-3">
                      <p className="font-medium text-foreground">{c.corridor}</p>
                      <p className="text-xs text-muted-foreground">{c.incidents} incidents</p>
                    </td>
                    <td className="numeric px-3 py-3 text-right font-semibold text-foreground">
                      {c.risk}
                    </td>
                    <td
                      className={`numeric px-3 py-3 text-right font-semibold ${
                        c.change > 0 ? "text-destructive" : "text-success"
                      }`}
                    >
                      {c.change > 0 ? "+" : ""}
                      {c.change}%
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${statusTone[c.status]}`}
                      >
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}