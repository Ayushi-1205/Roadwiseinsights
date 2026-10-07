import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, Cell, Tooltip, XAxis, YAxis } from "recharts";

import { AppShell } from "@/components/layout/AppShell";
import { PageHeader, Panel } from "@/components/ui-kit/Panel";
import { HotspotMap, type HotspotItem } from "@/components/HotspotMap";
import { ChartFrame, axisProps, gridProps, tooltipStyles } from "@/components/charts/ChartFrame";
import { Badge } from "@/components/ui/badge";
import { getHotspots } from "@/lib/api";

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

type CorridorRiskItem = {
  corridor: string;
  risk: number;
  incidents: number;
  status: string;
  delta30d?: string;
};

const statusTone: Record<string, string> = {
  Critical: "bg-destructive/12 text-destructive",
  High: "bg-warning/12 text-warning",
  Elevated: "bg-accent/12 text-accent",
};

function HotspotsPage() {
  const [hotspots, setHotspots] = useState<HotspotItem[]>([]);
  const [corridorRisk, setCorridorRisk] = useState<CorridorRiskItem[]>([]);
  const [activeCount, setActiveCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getHotspots()
      .then((res) => {
        if (cancelled) return;
        if (res && res.success) {
          setHotspots(Array.isArray(res.hotspots) ? res.hotspots : []);
          setCorridorRisk(Array.isArray(res.corridor_risk) ? res.corridor_risk : []);
          setActiveCount(
            typeof res.active_hotspots_count === "number"
              ? res.active_hotspots_count
              : Array.isArray(res.hotspots)
                ? res.hotspots.length
                : 0,
          );
          setError(null);
        } else {
          setHotspots([]);
          setCorridorRisk([]);
          setActiveCount(null);
          setError("Unable to load live hotspot data");
        }
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to load hotspots API:", err);
        setHotspots([]);
        setCorridorRisk([]);
        setActiveCount(null);
        setError("Unable to load live hotspot data");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const badgeLabel = loading
    ? "Loading hotspots"
    : error
      ? "Live data unavailable"
      : `${activeCount ?? hotspots.length} active hotspots`;

  const rankingEmpty = !loading && (Boolean(error) || corridorRisk.length === 0);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Geospatial intelligence"
        title="Accident hotspot map"
        description="Blackspot clustering across the monitored network. Risk score blends incident density, severity weighting, exposure volume and infrastructure defects."
        action={<Badge variant="outline">{badgeLabel}</Badge>}
      />

      <Panel title="Risk density layer" subtitle="Interactive — select any marker">
        <HotspotMap hotspotsData={hotspots} loading={loading} error={error} />
      </Panel>

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Panel title="Corridor risk ranking" subtitle="Weighted composite score">
          {loading || rankingEmpty ? (
            <p
              className={
                error ? "text-sm font-medium text-destructive" : "text-sm text-muted-foreground"
              }
            >
              {loading
                ? "Loading live hotspot data..."
                : error
                  ? error
                  : "No corridor ranking available."}
            </p>
          ) : (
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
          )}
        </Panel>

        <Panel
          title="Blackspot register"
          subtitle="Prioritised for intervention"
          bodyClassName="p-0"
        >
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
                {loading || rankingEmpty ? (
                  <tr>
                    <td
                      colSpan={4}
                      className={`px-5 py-6 text-sm ${error ? "font-medium text-destructive" : "text-muted-foreground"}`}
                    >
                      {loading
                        ? "Loading live hotspot data..."
                        : error
                          ? error
                          : "No blackspot rows available."}
                    </td>
                  </tr>
                ) : (
                  corridorRisk.map((c) => (
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
                      <td className={`numeric px-3 py-3 text-right font-semibold ${
                        c.delta30d?.startsWith("+")
                          ? "text-destructive"
                          : c.delta30d?.startsWith("-")
                            ? "text-green-500"
                            : "text-muted-foreground"
                      }`}>
                        {c.delta30d ?? "—"}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${statusTone[c.status] ?? ""}`}
                        >
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
