import { useEffect, useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { getConditions } from "@/lib/api";

export const Route = createFileRoute("/conditions")({
  head: () => ({
    meta: [
      { title: "Weather & Road Condition Analysis — SafeRoadIQ" },
      {
        name: "description",
        content:
          "How weather, surface environment and visibility conditions shift accident frequency and severity across the network.",
      },
      { property: "og:title", content: "Weather & Road Condition Analysis — SafeRoadIQ" },
      {
        property: "og:description",
        content: "Weather, road environment and visibility risk correlation for road accidents.",
      },
    ],
  }),
  component: ConditionsPage,
});

const cardIcons = [Sun, CloudRain, CloudFog, Wind];

type WeatherCondition = {
  condition: string;
  accidents: number;
  share: number;
  fatal_count: number;
  severity: number;
};

type RoadCondition = {
  surface: string;
  accidents: number;
  share: number;
  fatal_count: number;
  riskIndex: number;
};

type VisibilityFactor = {
  factor: string;
  accidents: number;
  share: number;
  fatal_count: number;
  risk: number;
};

type CardItem = {
  label: string;
  value: string;
  note: string;
};

type ConditionsData = {
  total_accidents: number;
  cards: CardItem[];
  weather_conditions: WeatherCondition[];
  road_conditions: RoadCondition[];
  visibility_radar: VisibilityFactor[];
};

function ConditionsPage() {
  const [data, setData] = useState<ConditionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadConditions() {
      try {
        setLoading(true);
        setError(null);

        const res = await getConditions();
        if (cancelled) return;

        if (res && res.success) {
          setData({
            total_accidents: typeof res.total_accidents === "number" ? res.total_accidents : 0,
            cards: Array.isArray(res.cards) ? res.cards : [],
            weather_conditions: Array.isArray(res.weather_conditions) ? res.weather_conditions : [],
            road_conditions: Array.isArray(res.road_conditions) ? res.road_conditions : [],
            visibility_radar: Array.isArray(res.visibility_radar) ? res.visibility_radar : [],
          });
        } else {
          setData(null);
          setError("Unable to load live conditions data");
        }
      } catch (err) {
        if (cancelled) return;
        console.error("Failed to load conditions API:", err);
        setData(null);
        setError(
          err instanceof Error ? err.message : "Unable to load conditions data from database",
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadConditions();

    return () => {
      cancelled = true;
    };
  }, []);

  const weatherConditions = data?.weather_conditions ?? [];
  const roadConditions = data?.road_conditions ?? [];
  const lightRadar = data?.visibility_radar ?? [];
  const cards = data?.cards ?? [];
  const totalAccidents = data?.total_accidents ?? 0;

  const badgeLabel = loading
    ? "Loading environmental telemetry..."
    : error
      ? "Live data unavailable"
      : `${totalAccidents.toLocaleString()} incidents analyzed`;

  return (
    <AppShell>
      <PageHeader
        eyebrow="Environmental risk"
        title="Weather & road condition analysis"
        description="Environmental correlation layer. Evaluates how atmospheric weather, road infrastructure classification, and visibility shift accident exposure and fatality rates."
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
              : `Live PostgreSQL data · ${weatherConditions.length} weather & ${roadConditions.length} road classifications (${totalAccidents.toLocaleString()} records)`}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="panel p-5 text-muted-foreground">
              <span className="text-xs">...</span>
              <p className="numeric mt-3 text-2xl font-bold text-foreground">—</p>
              <p className="mt-1 text-xs text-muted-foreground">Loading metric...</p>
            </div>
          ))
        ) : error ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="panel p-5 text-muted-foreground">
              <p className="numeric text-2xl font-bold text-destructive">—</p>
              <p className="mt-1 text-xs text-muted-foreground">Unavailable</p>
            </div>
          ))
        ) : (
          cards.map((c, i) => {
            const Icon = cardIcons[i % cardIcons.length];
            return (
              <div
                key={c.label}
                className="panel hover-lift rise-in p-5"
                style={{ animationDelay: `${i * 70}ms` }}
              >
                <Icon className="h-5 w-5 text-accent" strokeWidth={1.9} />
                <p className="numeric mt-3 text-2xl font-bold text-foreground">{c.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {c.label} · {c.note}
                </p>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Panel title="Weather condition impact" subtitle="Volume with fatality rate overlay">
          {loading ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Loading weather condition data...
            </p>
          ) : error ? (
            <p className="py-12 text-center text-sm font-medium text-destructive">{error}</p>
          ) : weatherConditions.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No weather records found in database.
            </p>
          ) : (
            <ChartFrame height={320}>
              <BarChart data={weatherConditions} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="condition" {...axisProps} interval={0} />
                <YAxis {...axisProps} width={56} domain={[0, "auto"]} />
                <Tooltip
                  {...tooltipStyles}
                  formatter={(value: any, name: any, item: any) => [
                    name === "Accidents"
                      ? `${value.toLocaleString()} (${item.payload.severity}% fatal)`
                      : value,
                    name,
                  ]}
                />
                <Bar
                  dataKey="accidents"
                  name="Accidents"
                  radius={[6, 6, 0, 0]}
                  animationDuration={900}
                >
                  {weatherConditions.map((w) => (
                    <Cell
                      key={w.condition}
                      fill={w.severity >= 15.0 ? "var(--color-chart-3)" : "var(--color-chart-2)"}
                      fillOpacity={0.8}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ChartFrame>
          )}
        </Panel>

        <Panel title="Visibility risk profile" subtitle="Fatality rate by visibility level">
          {loading ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Loading visibility profile...
            </p>
          ) : error ? (
            <p className="py-12 text-center text-sm font-medium text-destructive">{error}</p>
          ) : lightRadar.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No visibility records found in database.
            </p>
          ) : (
            <ChartFrame height={320}>
              <RadarChart data={lightRadar} outerRadius="72%">
                <PolarGrid stroke="var(--color-border)" />
                <PolarAngleAxis
                  dataKey="factor"
                  tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
                />
                <Tooltip
                  {...tooltipStyles}
                  cursor={false}
                  formatter={(value: any, name: any, item: any) => [
                    `${value}% (${item.payload.accidents.toLocaleString()} incidents)`,
                    "Fatality Rate",
                  ]}
                />
                <Radar
                  dataKey="risk"
                  name="Fatality rate %"
                  stroke="var(--color-chart-1)"
                  strokeWidth={2}
                  fill="var(--color-chart-1)"
                  fillOpacity={0.28}
                  animationDuration={900}
                />
              </RadarChart>
            </ChartFrame>
          )}
        </Panel>
      </div>

      <Panel className="mt-5" title="Road network environment" subtitle="Accidents and fatality rate per road classification">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          {loading ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Loading road environment data...
            </p>
          ) : error ? (
            <p className="py-12 text-center text-sm font-medium text-destructive">{error}</p>
          ) : roadConditions.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No road classification records found in database.
            </p>
          ) : (
            <>
              <ChartFrame height={280}>
                <BarChart
                  data={roadConditions}
                  layout="vertical"
                  margin={{ top: 4, right: 20, left: 8, bottom: 4 }}
                >
                  <CartesianGrid {...gridProps} vertical horizontal={false} />
                  <XAxis type="number" {...axisProps} domain={[0, "auto"]} />
                  <YAxis type="category" dataKey="surface" width={110} {...axisProps} />
                  <Tooltip
                    {...tooltipStyles}
                    formatter={(value: any, name: any, item: any) => [
                      `${value.toLocaleString()} (${item.payload.riskIndex}% fatal)`,
                      name,
                    ]}
                  />
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
                      <span className="text-sm font-medium text-foreground">{r.surface}</span>
                      <span className="numeric text-sm font-semibold text-foreground">
                        {r.accidents.toLocaleString()} ({r.riskIndex}% fatal)
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(r.accidents / 7000) * 100}%`,
                          backgroundImage: "var(--gradient-risk)",
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </Panel>

      {/* ERROR MESSAGE */}
      {error && (
        <div className="mt-5 rounded-xl border border-destructive/40 bg-destructive/10 p-4">
          <p className="text-sm font-medium text-destructive">
            Unable to load live conditions data
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Make sure the backend is running on http://localhost:5000
          </p>
        </div>
      )}
    </AppShell>
  );
}