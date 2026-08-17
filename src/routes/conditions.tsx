import { createFileRoute } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CloudRain, CloudFog, Sun, Wind } from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { PageHeader, Panel } from "@/components/ui-kit/Panel";
import { ChartFrame, axisProps, gridProps, tooltipStyles } from "@/components/charts/ChartFrame";
import { lightRadar, roadConditions, weatherConditions } from "@/lib/mock-data";

export const Route = createFileRoute("/conditions")({
  head: () => ({
    meta: [
      { title: "Weather & Road Condition Analysis — SafeRoadIQ" },
      {
        name: "description",
        content:
          "How weather, surface quality and lighting conditions shift accident frequency and severity across the network.",
      },
      { property: "og:title", content: "Weather & Road Condition Analysis — SafeRoadIQ" },
      {
        property: "og:description",
        content: "Weather, surface and lighting risk correlation for road accidents.",
      },
    ],
  }),
  component: ConditionsPage,
});

const cards = [
  { icon: Sun, label: "Clear conditions", value: "54.6%", note: "of all incidents" },
  { icon: CloudRain, label: "Wet surface", value: "1.7×", note: "severity multiplier" },
  { icon: CloudFog, label: "Fog exposure", value: "81", note: "severity index" },
  { icon: Wind, label: "Unlit night", value: "88", note: "highest risk factor" },
];

function ConditionsPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Environmental risk"
        title="Weather & road condition analysis"
        description="Environmental correlation layer. Severity index normalises outcome intensity per 100 incidents, isolating condition impact from raw exposure volume."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c, i) => (
          <div
            key={c.label}
            className="panel hover-lift rise-in p-5"
            style={{ animationDelay: `${i * 70}ms` }}
          >
            <c.icon className="h-5 w-5 text-accent" strokeWidth={1.9} />
            <p className="numeric mt-3 text-2xl font-bold text-foreground">{c.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {c.label} · {c.note}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Panel title="Weather condition impact" subtitle="Volume with severity overlay">
          <ChartFrame height={320}>
            <BarChart data={weatherConditions} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="condition" {...axisProps} interval={0} />
              <YAxis {...axisProps} width={56} />
              <Tooltip {...tooltipStyles} />
              <Bar
                dataKey="accidents"
                name="Accidents"
                radius={[6, 6, 0, 0]}
                animationDuration={900}
              >
                {weatherConditions.map((w) => (
                  <Cell
                    key={w.condition}
                    fill={w.severity > 65 ? "var(--color-chart-3)" : "var(--color-chart-2)"}
                    fillOpacity={0.8}
                  />
                ))}
              </Bar>
            </BarChart>
          </ChartFrame>
        </Panel>

        <Panel title="Lighting risk profile" subtitle="Risk index by light condition">
          <ChartFrame height={320}>
            <RadarChart data={lightRadar} outerRadius="72%">
              <PolarGrid stroke="var(--color-border)" />
              <PolarAngleAxis
                dataKey="factor"
                tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
              />
              <Tooltip {...tooltipStyles} cursor={false} />
              <Radar
                dataKey="risk"
                name="Risk index"
                stroke="var(--color-chart-1)"
                strokeWidth={2}
                fill="var(--color-chart-1)"
                fillOpacity={0.28}
                animationDuration={900}
              />
            </RadarChart>
          </ChartFrame>
        </Panel>
      </div>

      <Panel className="mt-5" title="Road surface condition" subtitle="Risk index per surface state">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <ChartFrame height={280}>
            <BarChart
              data={roadConditions}
              layout="vertical"
              margin={{ top: 4, right: 20, left: 8, bottom: 4 }}
            >
              <CartesianGrid {...gridProps} vertical horizontal={false} />
              <XAxis type="number" {...axisProps} />
              <YAxis type="category" dataKey="surface" width={110} {...axisProps} />
              <Tooltip {...tooltipStyles} />
              <Bar
                dataKey="accidents"
                name="Accidents"
                fill="var(--color-chart-1)"
                fillOpacity={0.8}
                radius={[0, 6, 6, 0]}
                animationDuration={900}
              />
            </BarChart>
          </ChartFrame>

          <ul className="space-y-4">
            {roadConditions.map((r) => (
              <li key={r.surface}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm text-foreground">{r.surface}</span>
                  <span className="numeric text-sm font-semibold text-foreground">
                    Risk {r.riskIndex}
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${r.riskIndex}%`,
                      backgroundImage: "var(--gradient-risk)",
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </Panel>
    </AppShell>
  );
}