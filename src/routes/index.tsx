import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowRight, Info, Siren } from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { KpiCard } from "@/components/ui-kit/KpiCard";
import { Panel, PageHeader, StatRow } from "@/components/ui-kit/Panel";
import { TrendArea } from "@/components/charts/TrendArea";
import { HourlyBars } from "@/components/charts/HourlyBars";
import { SeverityDonut } from "@/components/charts/SeverityDonut";
import { HotspotMap } from "@/components/HotspotMap";
import { Button } from "@/components/ui/button";
import { alerts, causes, kpis } from "@/lib/mock-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Command Center — SafeRoadIQ Road Safety Intelligence" },
      {
        name: "description",
        content:
          "Live road safety command center: accident KPIs, severity mix, hotspot risk and time-of-day exposure.",
      },
      { property: "og:title", content: "Command Center — SafeRoadIQ" },
      {
        property: "og:description",
        content: "Accident KPIs, severity mix, hotspot risk and time-of-day exposure at a glance.",
      },
    ],
  }),
  component: Index,
});

const alertIcon = { critical: Siren, warning: AlertTriangle, info: Info };
const alertTone = {
  critical: "text-destructive bg-destructive/12",
  warning: "text-warning bg-warning/12",
  info: "text-accent bg-accent/12",
};

function Index() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Command center · National network"
        title="Road safety intelligence overview"
        description="Consolidated accident telemetry across 42 districts, 1,284 monitored corridors and 6 severity classes. Figures below are modelled sample data."
        action={
          <Button asChild>
            <Link to="/reports">
              Generate report
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k, i) => (
          <KpiCard key={k.label} {...k} index={i} />
        ))}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Panel
          title="Accident & injury trend"
          subtitle="Rolling 12 months · monthly aggregation"
          action={
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-chart-1" /> Accidents
              </span>
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-chart-2" /> Injuries
              </span>
            </div>
          }
        >
          <TrendArea />
        </Panel>

        <Panel title="Severity distribution" subtitle="Share of classified incidents">
          <SeverityDonut />
        </Panel>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Panel title="Time-of-day exposure" subtitle="Peak risk windows highlighted in red">
          <HourlyBars />
        </Panel>

        <Panel title="Live risk alerts" subtitle="Automated anomaly detection">
          <ul className="space-y-3">
            {alerts.map((a) => {
              const Icon = alertIcon[a.level];
              return (
                <li
                  key={a.id}
                  className="flex gap-3 rounded-xl border border-border bg-elevated/50 p-3 transition-colors hover:border-primary/40"
                >
                  <span
                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${alertTone[a.level]}`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-snug text-foreground">{a.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{a.detail}</p>
                    <p className="mono-label mt-1.5 text-muted-foreground/70">{a.time}</p>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="mt-4 border-t border-border pt-3">
            {causes.slice(0, 3).map((c) => (
              <StatRow
                key={c.cause}
                label={c.cause}
                value={`${c.share}%`}
                tone={c.trend > 0 ? "bad" : "good"}
              />
            ))}
          </div>
        </Panel>
      </div>

      <Panel
        className="mt-5"
        title="Accident hotspot map"
        subtitle="Top risk corridors · click a marker for detail"
        action={
          <Button variant="outline" size="sm" asChild>
            <Link to="/hotspots">Full map</Link>
          </Button>
        }
      >
        <HotspotMap />
      </Panel>
    </AppShell>
  );
}
