import { useEffect, useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { getVehicles } from "@/lib/api";

export const Route = createFileRoute("/vehicles")({
  head: () => ({
    meta: [
      { title: "Vehicle-wise Analysis — SafeRoadIQ" },
      {
        name: "description",
        content:
          "Accident and fatality-rate analysis by vehicles involved per collision: single-vehicle, two-vehicle, and multi-vehicle crashes.",
      },
      { property: "og:title", content: "Vehicle-wise Analysis — SafeRoadIQ" },
      {
        property: "og:description",
        content: "Incident volume and fatality rate compared across vehicle collision classes.",
      },
    ],
  }),
  component: VehiclesPage,
});

const highlightIcons = [Bike, Car, Truck, Bus];

type VehicleItem = {
  vehicles_involved: number;
  type: string;
  incidents: number;
  share: number;
  fatalityRate: number;
  fatalIncidents?: number;
  totalCasualties?: number;
  avgCasualties?: number;
};

type HighlightItem = {
  label: string;
  value: string;
  note: string;
};

type VehiclesData = {
  total_accidents: number;
  vehicles: VehicleItem[];
  highlights: HighlightItem[];
};

function VehiclesPage() {
  const [data, setData] = useState<VehiclesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadVehicles() {
      try {
        setLoading(true);
        setError(null);

        const res = await getVehicles();
        if (cancelled) return;

        if (res && res.success && Array.isArray(res.vehicles)) {
          setData({
            total_accidents: typeof res.total_accidents === "number" ? res.total_accidents : 0,
            vehicles: res.vehicles,
            highlights: Array.isArray(res.highlights) ? res.highlights : [],
          });
        } else {
          setData(null);
          setError("Unable to load live vehicle analysis data");
        }
      } catch (err) {
        if (cancelled) return;
        console.error("Failed to load vehicles API:", err);
        setData(null);
        setError(
          err instanceof Error ? err.message : "Unable to load vehicle data from database",
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadVehicles();

    return () => {
      cancelled = true;
    };
  }, []);

  const vehicles = data?.vehicles ?? [];
  const highlights = data?.highlights ?? [];
  const totalAccidents = data?.total_accidents ?? 0;

  const badgeLabel = loading
    ? "Loading vehicle telemetry..."
    : error
      ? "Live data unavailable"
      : `${totalAccidents.toLocaleString()} incidents analyzed`;

  return (
    <AppShell>
      <PageHeader
        eyebrow="Fleet & collision analysis"
        title="Vehicle-wise analysis"
        description="Incident volume versus outcome severity grouped by the number of vehicles involved per collision. Bubble size on the risk matrix reflects total casualties attributed to that class."
        action={<Badge variant="outline">{badgeLabel}</Badge>}
      />

      {/* DATABASE CONNECTION STATUS */}
      <div className="mb-5 flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3">
        <span
          className={`h-2.5 w-2.5 rounded-full ${
            loading
              ? "bg-yellow-500"
              : error
                ? "bg-destructive"
                : "bg-green-500"
          }`}
        />
        <span className="text-sm text-muted-foreground">
          {loading
            ? "Loading data from PostgreSQL..."
            : error
              ? `Database API error: ${error}`
              : `Live PostgreSQL data · ${vehicles.length} collision categories (${totalAccidents.toLocaleString()} records)`}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="panel flex items-center gap-4 p-5 text-muted-foreground"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/12 text-xs">
                ...
              </span>
              <div>
                <p className="numeric text-xl font-bold text-foreground">—</p>
                <p className="text-xs text-muted-foreground">Loading metric...</p>
              </div>
            </div>
          ))
        ) : error ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="panel flex items-center gap-4 p-5 text-muted-foreground"
            >
              <div>
                <p className="numeric text-xl font-bold text-destructive">—</p>
                <p className="text-xs text-muted-foreground">Unavailable</p>
              </div>
            </div>
          ))
        ) : (
          highlights.map((h, i) => {
            const Icon = highlightIcons[i % highlightIcons.length];
            return (
              <div
                key={h.label}
                className="panel hover-lift rise-in flex items-center gap-4 p-5"
                style={{ animationDelay: `${i * 70}ms` }}
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/12">
                  <Icon className="h-5 w-5 text-primary" strokeWidth={1.9} />
                </span>
                <div className="min-w-0">
                  <p className="numeric text-xl font-bold text-foreground">{h.value}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {h.label} · {h.note}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Panel title="Incidents by vehicle count" subtitle="Absolute volume per collision cardinality">
          {loading ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Loading volume by vehicle count...
            </p>
          ) : error ? (
            <p className="py-12 text-center text-sm font-medium text-destructive">{error}</p>
          ) : vehicles.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No vehicle collision records found in database.
            </p>
          ) : (
            <ChartFrame height={320}>
              <BarChart data={vehicles} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="type" {...axisProps} interval={0} height={42} dy={6} />
                <YAxis {...axisProps} width={56} domain={[0, "auto"]} />
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
          )}
        </Panel>

        <Panel title="Risk matrix" subtitle="Volume vs. fatality rate">
          {loading ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Loading risk matrix...
            </p>
          ) : error ? (
            <p className="py-12 text-center text-sm font-medium text-destructive">{error}</p>
          ) : vehicles.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No vehicle collision records found in database.
            </p>
          ) : (
            <ChartFrame height={320}>
              <ScatterChart margin={{ top: 12, right: 16, left: -12, bottom: 8 }}>
                <CartesianGrid {...gridProps} vertical />
                <XAxis
                  type="number"
                  dataKey="incidents"
                  name="Incidents"
                  domain={[3800, 4150]}
                  {...axisProps}
                  width={56}
                />
                <YAxis
                  type="number"
                  dataKey="fatalityRate"
                  name="Fatality rate %"
                  domain={[13.5, 16.5]}
                  {...axisProps}
                  width={56}
                />
                <ZAxis type="number" dataKey="totalCasualties" range={[120, 600]} name="Casualties" />
                <Tooltip
                  {...tooltipStyles}
                  cursor={{ strokeDasharray: "3 3" }}
                  formatter={(value: any, name: any) => [
                    name === "Fatality rate %" ? `${value}%` : value.toLocaleString(),
                    name,
                  ]}
                />
                <Scatter data={vehicles} name="Vehicle cardinality" animationDuration={900}>
                  {vehicles.map((v) => (
                    <Cell
                      key={v.type}
                      fill={v.fatalityRate >= 15.0 ? "var(--color-chart-3)" : "var(--color-chart-2)"}
                      fillOpacity={0.7}
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ChartFrame>
          )}
        </Panel>
      </div>

      <Panel
        className="mt-5"
        title="Vehicle collision register"
        subtitle="Classified by vehicles involved per accident record"
        bodyClassName="p-0"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="mono-label px-5 py-3 text-left text-muted-foreground">Category</th>
                <th className="mono-label px-3 py-3 text-right text-muted-foreground">Incidents</th>
                <th className="mono-label px-3 py-3 text-right text-muted-foreground">Share</th>
                <th className="mono-label px-5 py-3 text-right text-muted-foreground">
                  Fatality rate
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-sm text-muted-foreground">
                    Loading vehicle collision register...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-sm font-medium text-destructive">
                    {error}
                  </td>
                </tr>
              ) : vehicles.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-sm text-muted-foreground">
                    No vehicle records found in database.
                  </td>
                </tr>
              ) : (
                vehicles.map((v) => (
                  <tr
                    key={v.type}
                    className="border-b border-border/60 transition-colors last:border-0 hover:bg-secondary/50"
                  >
                    <td className="px-5 py-3 font-medium text-foreground">{v.type}</td>
                    <td className="numeric px-3 py-3 text-right text-foreground">
                      {v.incidents.toLocaleString()}
                    </td>
                    <td className="numeric px-3 py-3 text-right text-muted-foreground">
                      {v.share.toFixed(1)}%
                    </td>
                    <td
                      className={`numeric px-5 py-3 text-right font-semibold ${
                        v.fatalityRate >= 15.0 ? "text-destructive" : "text-foreground"
                      }`}
                    >
                      {v.fatalityRate.toFixed(1)}%
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* ERROR MESSAGE */}
      {error && (
        <div className="mt-5 rounded-xl border border-destructive/40 bg-destructive/10 p-4">
          <p className="text-sm font-medium text-destructive">
            Unable to load live vehicle analysis data
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Make sure the backend is running on http://localhost:5000
          </p>
        </div>
      )}
    </AppShell>
  );
}