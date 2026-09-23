import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, Cell, Tooltip, XAxis, YAxis } from "recharts";

import { AppShell } from "@/components/layout/AppShell";
import { PageHeader, Panel, StatRow } from "@/components/ui-kit/Panel";
import { ChartFrame, axisProps, gridProps, tooltipStyles } from "@/components/charts/ChartFrame";
import { Badge } from "@/components/ui/badge";
import { getCauses } from "@/lib/api";

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
        content: "Cause attribution ranked by share of incidents across the road network.",
      },
    ],
  }),
  component: CausesPage,
});

type CauseItem = {
  cause: string;
  incidents: number;
  share: number;
  fatalityRate: number;
};

type FactorItem = {
  label: string;
  value: string;
  tone?: "bad" | "warn" | "good" | "default";
};

type CausesData = {
  total_accidents: number;
  causes: CauseItem[];
  factors: {
    behavioral: FactorItem[];
    infrastructure_weather: FactorItem[];
  };
};

function CausesPage() {
  const [data, setData] = useState<CausesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadCauses() {
      try {
        setLoading(true);
        setError(null);

        const res = await getCauses();
        if (cancelled) return;

        if (res && res.success && Array.isArray(res.causes)) {
          setData({
            total_accidents: typeof res.total_accidents === "number" ? res.total_accidents : 0,
            causes: res.causes,
            factors: {
              behavioral: Array.isArray(res.factors?.behavioral) ? res.factors.behavioral : [],
              infrastructure_weather: Array.isArray(res.factors?.infrastructure_weather)
                ? res.factors.infrastructure_weather
                : [],
            },
          });
        } else {
          setData(null);
          setError("Unable to load live causes data");
        }
      } catch (err) {
        if (cancelled) return;
        console.error("Failed to load causes API:", err);
        setData(null);
        setError(
          err instanceof Error ? err.message : "Unable to load causes data from database",
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadCauses();

    return () => {
      cancelled = true;
    };
  }, []);

  const causes = data?.causes ?? [];
  const max = causes.length > 0 ? Math.max(...causes.map((c) => c.share)) || 1 : 1;
  const totalAccidents = data?.total_accidents ?? 0;

  const behavioral = data?.factors?.behavioral ?? [];
  const infra = data?.factors?.infrastructure_weather ?? [];

  const badgeLabel = loading
    ? "Loading causes..."
    : error
      ? "Live data unavailable"
      : `${totalAccidents.toLocaleString()} incidents analyzed`;

  return (
    <AppShell>
      <PageHeader
        eyebrow="Causal attribution"
        title="Accident cause analysis"
        description="Primary contributing factor per incident, normalised across reporting authorities. Share reflects the proportion of total recorded incidents attributed to each primary cause."
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
              : `Live PostgreSQL data · ${causes.length} classified causes (${totalAccidents.toLocaleString()} records)`}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Panel title="Contribution by cause" subtitle="Share of all classified incidents">
          {loading ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Loading live cause data...
            </p>
          ) : error ? (
            <p className="py-12 text-center text-sm font-medium text-destructive">{error}</p>
          ) : causes.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No cause records found in database.
            </p>
          ) : (
            <ChartFrame height={340}>
              <BarChart
                data={causes}
                layout="vertical"
                margin={{ top: 4, right: 20, left: 8, bottom: 4 }}
              >
                <CartesianGrid {...gridProps} vertical horizontal={false} />
                <XAxis type="number" domain={[0, "auto"]} {...axisProps} />
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
          )}
        </Panel>

        <Panel title="Cause register" subtitle="Volume and attributed share">
          {loading ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Loading cause register...
            </p>
          ) : error ? (
            <p className="py-12 text-center text-sm font-medium text-destructive">{error}</p>
          ) : causes.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No cause records found in database.
            </p>
          ) : (
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
                    <span className="numeric flex shrink-0 items-center gap-1 text-xs font-semibold text-foreground">
                      {c.share.toFixed(1)}%
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-3">
        <Panel title="Behavioural factors" subtitle="Driver-attributed">
          {loading ? (
            <p className="py-6 text-sm text-muted-foreground">Loading factors...</p>
          ) : error ? (
            <p className="py-6 text-sm font-medium text-destructive">Unavailable</p>
          ) : behavioral.length > 0 ? (
            behavioral.map((b) => (
              <StatRow key={b.label} label={b.label} value={b.value} tone={b.tone} />
            ))
          ) : (
            <>
              <StatRow label="Overspeeding" value="—" tone="default" />
              <StatRow label="Distracted driving" value="—" tone="default" />
              <StatRow label="Drunk driving" value="—" tone="default" />
            </>
          )}
        </Panel>

        <Panel title="Infrastructure factors" subtitle="Asset-attributed">
          {loading ? (
            <p className="py-6 text-sm text-muted-foreground">Loading factors...</p>
          ) : error ? (
            <p className="py-6 text-sm font-medium text-destructive">Unavailable</p>
          ) : infra.length > 0 ? (
            infra.map((inf) => (
              <StatRow key={inf.label} label={inf.label} value={inf.value} tone={inf.tone} />
            ))
          ) : (
            <>
              <StatRow label="Poor road condition" value="—" tone="default" />
              <StatRow label="Adverse weather" value="—" tone="default" />
              <StatRow label="Signal-controlled sites" value="—" tone="default" />
            </>
          )}
        </Panel>

        <Panel title="Intervention impact" subtitle="Post-measure evaluation">
          <StatRow label="Speed cameras" value="—" tone="default" />
          <StatRow label="Signal retiming" value="—" tone="default" />
          <StatRow label="Rumble strips" value="—" tone="default" />
          <p className="mt-2 text-[11px] text-muted-foreground">
            * Intervention telemetry is not recorded in the current dataset.
          </p>
        </Panel>
      </div>

      {/* ERROR MESSAGE */}
      {error && (
        <div className="mt-5 rounded-xl border border-destructive/40 bg-destructive/10 p-4">
          <p className="text-sm font-medium text-destructive">
            Unable to load live causes data
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Make sure the backend is running on http://localhost:5000
          </p>
        </div>
      )}
    </AppShell>
  );
}