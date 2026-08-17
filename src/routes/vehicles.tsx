import { createFileRoute } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { Bike, Bus, Car, Truck } from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { PageHeader, Panel } from "@/components/ui-kit/Panel";
import { ChartFrame, axisProps, gridProps, tooltipStyles } from "@/components/charts/ChartFrame";
import { vehicles } from "@/lib/mock-data";

export const Route = createFileRoute("/vehicles")({
  head: () => ({
    meta: [
      { title: "Vehicle-wise Analysis — SafeRoadIQ" },
      {
        name: "description",
        content:
          "Accident and fatality-rate analysis by vehicle class: two-wheelers, cars, freight, buses and non-motorised.",
      },
      { property: "og:title", content: "Vehicle-wise Analysis — SafeRoadIQ" },
      {
        property: "og:description",
        content: "Incident volume and fatality rate compared across every vehicle class.",
      },
    ],
  }),
  component: VehiclesPage,
});

const highlight = [
  { icon: Bike, label: "Two-wheeler", value: "40.1%", note: "highest exposure share" },
  { icon: Truck, label: "Freight", value: "12.8%", note: "highest fatality rate" },
  { icon: Car, label: "Car / SUV", value: "23.1%", note: "largest urban volume" },
  { icon: Bus, label: "Bus", value: "6.2%", note: "mass-casualty potential" },
];

function VehiclesPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Fleet & mode analysis"
        title="Vehicle-wise analysis"
        description="Incident volume versus outcome severity per vehicle class. Bubble size on the risk matrix reflects total incidents attributed to that class."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {highlight.map((h, i) => (
          <div
            key={h.label}
            className="panel hover-lift rise-in flex items-center gap-4 p-5"
            style={{ animationDelay: `${i * 70}ms` }}
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/12">
              <h.icon className="h-5 w-5 text-primary" strokeWidth={1.9} />
            </span>
            <div className="min-w-0">
              <p className="numeric text-xl font-bold text-foreground">{h.value}</p>
              <p className="truncate text-xs text-muted-foreground">
                {h.label} · {h.note}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Panel title="Incidents by vehicle class" subtitle="Absolute volume">
          <ChartFrame height={320}>
            <BarChart data={vehicles} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="type" {...axisProps} interval={0} angle={-16} height={54} dy={12} />
              <YAxis {...axisProps} width={56} />
              <Tooltip {...tooltipStyles} />
              <Bar dataKey="incidents" name="Incidents" radius={[6, 6, 0, 0]} animationDuration={900}>
                {vehicles.map((v, i) => (
                  <Cell
                    key={v.type}
                    fill={`var(--color-chart-${(i % 5) + 1})`}
                    fillOpacity={0.85}
                  />
                ))}
              </Bar>
            </BarChart>
          </ChartFrame>
        </Panel>

        <Panel title="Risk matrix" subtitle="Volume vs. fatality rate">
          <ChartFrame height={320}>
            <ScatterChart margin={{ top: 12, right: 16, left: -12, bottom: 8 }}>
              <CartesianGrid {...gridProps} vertical />
              <XAxis
                type="number"
                dataKey="incidents"
                name="Incidents"
                {...axisProps}
                width={56}
              />
              <YAxis
                type="number"
                dataKey="fatalityRate"
                name="Fatality rate %"
                {...axisProps}
                width={56}
              />
              <ZAxis type="number" dataKey="incidents" range={[80, 620]} />
              <Tooltip {...tooltipStyles} cursor={{ strokeDasharray: "3 3" }} />
              <Scatter data={vehicles} name="Vehicle class" animationDuration={900}>
                {vehicles.map((v) => (
                  <Cell
                    key={v.type}
                    fill={v.fatalityRate > 8 ? "var(--color-chart-3)" : "var(--color-chart-2)"}
                    fillOpacity={0.55}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ChartFrame>
        </Panel>
      </div>

      <Panel
        className="mt-5"
        title="Vehicle class register"
        subtitle="Normalised across reporting authorities"
        bodyClassName="p-0"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="mono-label px-5 py-3 text-left text-muted-foreground">Class</th>
                <th className="mono-label px-3 py-3 text-right text-muted-foreground">Incidents</th>
                <th className="mono-label px-3 py-3 text-right text-muted-foreground">Share</th>
                <th className="mono-label px-5 py-3 text-right text-muted-foreground">
                  Fatality rate
                </th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((v) => (
                <tr
                  key={v.type}
                  className="border-b border-border/60 transition-colors last:border-0 hover:bg-secondary/50"
                >
                  <td className="px-5 py-3 font-medium text-foreground">{v.type}</td>
                  <td className="numeric px-3 py-3 text-right text-foreground">
                    {v.incidents.toLocaleString()}
                  </td>
                  <td className="numeric px-3 py-3 text-right text-muted-foreground">
                    {v.share}%
                  </td>
                  <td
                    className={`numeric px-5 py-3 text-right font-semibold ${
                      v.fatalityRate > 8 ? "text-destructive" : "text-foreground"
                    }`}
                  >
                    {v.fatalityRate}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </AppShell>
  );
}