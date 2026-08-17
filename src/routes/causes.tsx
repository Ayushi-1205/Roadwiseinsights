import { createFileRoute } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, Cell, Tooltip, XAxis, YAxis } from "recharts";
import { TrendingDown, TrendingUp } from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { PageHeader, Panel, StatRow } from "@/components/ui-kit/Panel";
import { ChartFrame, axisProps, gridProps, tooltipStyles } from "@/components/charts/ChartFrame";
import { causes } from "@/lib/mock-data";

export const Route = createFileRoute("/causes")({
  head: () => ({
    meta: [
      { title: "Accident Cause Analysis — SafeRoadIQ" },
      {
        name: "description",
        content:
          "Behavioural and infrastructural cause attribution for road accidents, ranked by share and momentum.",
      },
      { property: "og:title", content: "Accident Cause Analysis — SafeRoadIQ" },
      {
        property: "og:description",
        content: "Cause attribution ranked by share of incidents and 30-day momentum.",
      },
    ],
  }),
  component: CausesPage,
});

function CausesPage() {
  const max = Math.max(...causes.map((c) => c.share));

  return (
    <AppShell>
      <PageHeader
        eyebrow="Causal attribution"
        title="Accident cause analysis"
        description="Primary contributing factor per incident, normalised across reporting authorities. Momentum shows the 30-day directional change in attributed share."
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Panel title="Contribution by cause" subtitle="Share of all classified incidents">
          <ChartFrame height={340}>
            <BarChart
              data={causes}
              layout="vertical"
              margin={{ top: 4, right: 20, left: 8, bottom: 4 }}
            >
              <CartesianGrid {...gridProps} vertical horizontal={false} />
              <XAxis type="number" {...axisProps} />
              <YAxis type="category" dataKey="cause" width={130} {...axisProps} />
              <Tooltip {...tooltipStyles} />
              <Bar dataKey="share" name="Share %" radius={[0, 6, 6, 0]} animationDuration={900}>
                {causes.map((c) => (
                  <Cell
                    key={c.cause}
                    fill={c.share === max ? "var(--color-chart-3)" : "var(--color-chart-1)"}
                    fillOpacity={0.85}
                  />
                ))}
              </Bar>
            </BarChart>
          </ChartFrame>
        </Panel>

        <Panel title="Cause register" subtitle="Volume and 30-day momentum">
          <ul className="space-y-4">
            {causes.map((c) => (
              <li key={c.cause}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0 truncate text-sm text-foreground">{c.cause}</span>
                  <span className="numeric shrink-0 text-sm font-semibold text-foreground">
                    {c.incidents.toLocaleString()}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full transition-[width] duration-700"
                      style={{
                        width: `${(c.share / max) * 100}%`,
                        backgroundImage: "var(--gradient-signal)",
                      }}
                    />
                  </div>
                  <span
                    className={`numeric flex shrink-0 items-center gap-1 text-xs font-semibold ${
                      c.trend > 0 ? "text-destructive" : "text-success"
                    }`}
                  >
                    {c.trend > 0 ? (
                      <TrendingUp className="h-3.5 w-3.5" />
                    ) : (
                      <TrendingDown className="h-3.5 w-3.5" />
                    )}
                    {Math.abs(c.trend)}%
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-3">
        <Panel title="Behavioural factors" subtitle="Driver-attributed">
          <StatRow label="Speed related" value="34.2%" tone="bad" />
          <StatRow label="Attention related" value="18.6%" tone="bad" />
          <StatRow label="Impairment" value="12.4%" tone="warn" />
        </Panel>
        <Panel title="Infrastructure factors" subtitle="Asset-attributed">
          <StatRow label="Road geometry" value="6.9%" tone="warn" />
          <StatRow label="Signage defects" value="3.1%" />
          <StatRow label="Lighting gaps" value="2.8%" />
        </Panel>
        <Panel title="Intervention impact" subtitle="Post-measure evaluation">
          <StatRow label="Speed cameras" value="-14.2%" tone="good" />
          <StatRow label="Signal retiming" value="-9.6%" tone="good" />
          <StatRow label="Rumble strips" value="-6.1%" tone="good" />
        </Panel>
      </div>
    </AppShell>
  );
}