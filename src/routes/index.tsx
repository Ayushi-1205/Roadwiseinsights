import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AlertTriangle, ArrowRight, Info, Siren } from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { KpiCard } from "@/components/ui-kit/KpiCard";
import { Panel, PageHeader, StatRow } from "@/components/ui-kit/Panel";
import { TrendArea } from "@/components/charts/TrendArea";
import { HourlyBars } from "@/components/charts/HourlyBars";
import { SeverityDonut } from "@/components/charts/SeverityDonut";
import { HotspotMap } from "@/components/HotspotMap";
import { Button } from "@/components/ui/button";
import { getDashboard } from "@/lib/api";

type DashboardResponse = {
  success: boolean;

  summary: {
    total_accidents: number;
    total_casualties: number;
    fatalities: number;
    major_accidents: number;
    minor_accidents: number;
    records_without_date: number;
    records_without_hour: number;
  };

  severity_distribution: {
    severity: string;
    count: number;
  }[];

  cause_distribution: {
    cause: string;
    count: number;
  }[];

  hourly_exposure: {
    hour: number;
    count: number;
  }[];

  monthly_trend: {
    month: string;
    accidents: number;
    casualties: number;
    fatalities: number;
  }[];
};

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title: "Command Center — SafeRoadIQ Road Safety Intelligence",
      },
      {
        name: "description",
        content:
          "Live road safety command center: accident KPIs, severity mix, hotspot risk and time-of-day exposure.",
      },
      {
        property: "og:title",
        content: "Command Center — SafeRoadIQ",
      },
      {
        property: "og:description",
        content:
          "Accident KPIs, severity mix, hotspot risk and time-of-day exposure at a glance.",
      },
    ],
  }),

  component: Index,
});

const alertIcon = {
  critical: Siren,
  warning: AlertTriangle,
  info: Info,
};

const alertTone = {
  critical: "text-destructive bg-destructive/12",
  warning: "text-warning bg-warning/12",
  info: "text-accent bg-accent/12",
};

const severityColors: Record<string, string> = {
  minor: "var(--color-chart-5)",
  major: "var(--color-chart-1)",
  fatal: "var(--color-chart-3)",
};

function Index() {
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setError(null);

        const data: DashboardResponse = await getDashboard();

        if (!data.success) {
          throw new Error("Dashboard API returned an error");
        }

        setDashboard(data);
      } catch (err) {
        console.error("Dashboard loading error:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load dashboard data",
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const totalAccidents = dashboard?.summary.total_accidents ?? 0;
  const trendData = (dashboard?.monthly_trend ?? []).slice(-12);
  const hourlyData = (dashboard?.hourly_exposure ?? []).map((item) => ({
    hour: String(item.hour).padStart(2, "0"),
    count: item.count,
  }));
  const severityData = (dashboard?.severity_distribution ?? []).map((item) => ({
    name: item.severity.charAt(0).toUpperCase() + item.severity.slice(1),
    value: item.count,
    color: severityColors[item.severity.toLowerCase()] ?? "var(--color-chart-2)",
  }));

  const liveKpis = [
    {
      label: "Total Accidents",
      value: dashboard ? dashboard.summary.total_accidents.toLocaleString() : "—",
      status: "No comparison",
      hint: dashboard ? "Latest 12 months" : "Live data unavailable",
      series: dashboard ? trendData.map((item) => item.accidents) : undefined,
      tone: "primary" as const,
    },
    {
      label: "Fatalities",
      value: dashboard ? dashboard.summary.fatalities.toLocaleString() : "—",
      status: "No comparison",
      hint: dashboard ? "Latest 12 months" : "Live data unavailable",
      series: dashboard ? trendData.map((item) => item.fatalities) : undefined,
      tone: "destructive" as const,
    },
    {
      label: "Active Hotspots",
      value: "—",
      status: "Unavailable",
      hint: "Not provided by dashboard API",
      tone: "warning" as const,
    },
    {
      label: "Avg. Response Time",
      value: "—",
      status: "Unavailable",
      hint: "Not available in accident data",
      tone: "accent" as const,
    },
  ];

  const liveCauses =
    dashboard?.cause_distribution
      ?.slice(0, 3)
      .map((item) => {
        const total = dashboard.summary.total_accidents;

        return {
          cause: item.cause,
          share:
            total > 0
              ? Number(((item.count / total) * 100).toFixed(1))
              : 0,
          trend: 0,
        };
      });

  return (
    <AppShell>
      <PageHeader
        eyebrow="Command center · National network"
        title="Road safety intelligence overview"
        description="Consolidated accident telemetry across the road safety database."
        action={
          <Button asChild>
            <Link to="/reports">
              Generate report
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        }
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
              : `Live PostgreSQL data · ${totalAccidents.toLocaleString()} accidents`}
        </span>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {liveKpis.map((k, i) => (
          <KpiCard
            key={k.label}
            {...k}
            index={i}
          />
        ))}
      </div>

      {/* TREND + SEVERITY */}
      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Panel
          title="Accident & injury trend"
          subtitle="Rolling 12 months · monthly aggregation"
          action={
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-chart-1" />
                Accidents
              </span>

              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-chart-2" />
                Casualties
              </span>
            </div>
          }
        >
          <TrendArea data={trendData} />
        </Panel>

        <Panel
          title="Severity distribution"
          subtitle={
            dashboard
              ? "Live PostgreSQL accident severity"
              : "Share of classified incidents"
          }
        >
          <SeverityDonut data={severityData} />

          {/* LIVE DATABASE SEVERITY INFORMATION */}
          {dashboard && (
            <div className="mt-4 border-t border-border pt-3">
              {dashboard.severity_distribution.map((item) => (
                <StatRow
                  key={item.severity}
                  label={item.severity}
                  value={item.count.toLocaleString()}
                />
              ))}
            </div>
          )}
        </Panel>
      </div>

      {/* HOURLY + CAUSES */}
      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Panel
          title="Time-of-day exposure"
          subtitle={
            dashboard
              ? "Live accident counts grouped by hour"
              : "Peak risk windows highlighted in red"
          }
        >
          <HourlyBars data={hourlyData} />

          {dashboard && (
            <div className="mt-4 border-t border-border pt-3">
              <p className="mono-label mb-2 text-muted-foreground">
                Database hourly records
              </p>

              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                {dashboard.hourly_exposure
                  .slice(0, 12)
                  .map((item) => (
                    <div
                      key={item.hour}
                      className="rounded-lg border border-border bg-elevated/50 p-2 text-center"
                    >
                      <p className="mono-label text-muted-foreground">
                        {String(item.hour).padStart(2, "0")}:00
                      </p>

                      <p className="numeric mt-1 text-sm font-semibold text-foreground">
                        {item.count.toLocaleString()}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </Panel>

        <Panel
          title="Top accident causes"
          subtitle={
            dashboard
              ? "Calculated directly from PostgreSQL"
              : "Primary contributing factors"
          }
        >
          {liveCauses ? (
            <div>
              {liveCauses.map((c) => (
                <StatRow key={c.cause} label={c.cause} value={`${c.share}%`} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {loading ? "Loading live cause data..." : "Live cause data unavailable."}
            </p>
          )}
        </Panel>
      </div>

      {/* HOTSPOT MAP */}
      <Panel
        className="mt-5"
        title="Accident hotspot map"
        subtitle="Top risk corridors · click a marker for detail"
        action={
          <Button
            variant="outline"
            size="sm"
            asChild
          >
            <Link to="/hotspots">
              Full map
            </Link>
          </Button>
        }
      >
        <HotspotMap />
      </Panel>

      {/* ERROR MESSAGE */}
      {error && (
        <div className="mt-5 rounded-xl border border-destructive/40 bg-destructive/10 p-4">
          <p className="text-sm font-medium text-destructive">
            Unable to load live dashboard data
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Make sure the backend is running on
            {" "}
            http://localhost:5000
          </p>
        </div>
      )}
    </AppShell>
  );
}
