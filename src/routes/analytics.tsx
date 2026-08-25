import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Area,
  ComposedChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarRange,
  Info,
  MapPin,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { PageHeader, Panel, StatRow } from "@/components/ui-kit/Panel";
import { ChartFrame, axisProps, gridProps, tooltipStyles } from "@/components/charts/ChartFrame";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  HIGH_RISK_HOUR_THRESHOLD,
  accidentTypes,
  districtRanking,
  filterDefaults,
  filterOptions,
  hourlyPattern,
  keyInsights,
  severityBreakdown,
  trendSeries,
  weekdayPattern,
  type Granularity,
} from "@/lib/analytics-mock";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Accident analytics — SafeRoadIQ" },
      {
        name: "description",
        content:
          "Explore accident patterns, severity, trends and risk factors across the monitored road network.",
      },
      { property: "og:title", content: "Accident analytics — SafeRoadIQ" },
      {
        property: "og:description",
        content:
          "Detailed analytical workspace for accident trends, geography, severity and time patterns.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AnalyticsPage,
});

const granularities: { key: Granularity; label: string }[] = [
  { key: "daily", label: "Daily" },
  { key: "monthly", label: "Monthly" },
  { key: "yearly", label: "Yearly" },
];

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="min-w-0 flex-1 basis-44">
      <span className="mono-label mb-1.5 block text-muted-foreground">{label}</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full bg-elevated/60 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o} value={o}>
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  );
}

function Delta({ value }: { value: number }) {
  const up = value > 0;
  const Arrow = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        "numeric inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold",
        up ? "bg-destructive/12 text-destructive" : "bg-success/12 text-success",
      )}
    >
      <Arrow className="h-3 w-3" />
      {Math.abs(value).toFixed(1)}%
    </span>
  );
}

const insightTone = {
  critical: { chip: "bg-destructive/12 text-destructive", icon: ShieldAlert },
  warning: { chip: "bg-warning/12 text-warning", icon: TrendingUp },
  info: { chip: "bg-accent/12 text-accent", icon: Info },
  positive: { chip: "bg-success/12 text-success", icon: Sparkles },
} as const;

function AnalyticsPage() {
  const [granularity, setGranularity] = useState<Granularity>("monthly");
  const [filters, setFilters] = useState(filterDefaults);
  const setFilter = (k: keyof typeof filterDefaults) => (v: string) =>
    setFilters((f) => ({ ...f, [k]: v }));

  const trend = trendSeries[granularity];
  const maxDistrict = districtRanking[0]!.accidents;
  const peakHour = useMemo(
    () => hourlyPattern.reduce((a, b) => (b.accidents > a.accidents ? b : a)),
    [],
  );
  const peakDay = useMemo(
    () => weekdayPattern.reduce((a, b) => (b.accidents > a.accidents ? b : a)),
    [],
  );
  const totalIncidents = severityBreakdown.reduce((s, r) => s + r.incidents, 0);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Analytical workspace"
        title="Accident analytics"
        description="Explore accident patterns, severity, trends and risk factors across the monitored network."
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setFilters(filterDefaults)}>
              <RotateCcw className="h-4 w-4" />
              Reset filters
            </Button>
          </div>
        }
      />

      <section className="panel rise-in mb-5 p-4 sm:p-5">
        <div className="flex flex-wrap items-end gap-3">
          <FilterSelect
            label="Date range"
            value={filters.dateRange}
            options={filterOptions.dateRanges}
            onChange={setFilter("dateRange")}
          />
          <FilterSelect
            label="District / location"
            value={filters.district}
            options={filterOptions.districts}
            onChange={setFilter("district")}
          />
          <FilterSelect
            label="Severity"
            value={filters.severity}
            options={filterOptions.severities}
            onChange={setFilter("severity")}
          />
          <FilterSelect
            label="Accident type"
            value={filters.accidentType}
            options={filterOptions.accidentTypes}
            onChange={setFilter("accidentType")}
          />
        </div>
        <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <CalendarRange className="h-3.5 w-3.5 text-primary" />
          Sample dataset · {filters.dateRange} · {filters.district} · {filters.severity} ·{" "}
          {filters.accidentType}
        </p>
      </section>

      {/* Section 1 — Trend analysis */}
      <Panel
        title="Accident trend analysis"
        subtitle="Accidents, injuries and fatalities over time"
        action={
          <div className="flex gap-1 rounded-full border border-border bg-elevated/60 p-1">
            {granularities.map((g) => (
              <button
                key={g.key}
                type="button"
                onClick={() => setGranularity(g.key)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                  granularity === g.key
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {g.label}
              </button>
            ))}
          </div>
        }
      >
        <ChartFrame height={360}>
          <ComposedChart data={trend} margin={{ top: 8, right: 8, left: -14, bottom: 0 }}>
            <defs>
              <linearGradient id="aaAccidents" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.45} />
                <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="aaInjuries" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-chart-2)" stopOpacity={0.32} />
                <stop offset="100%" stopColor="var(--color-chart-2)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid {...gridProps} />
            <XAxis dataKey="period" {...axisProps} />
            <YAxis yAxisId="left" {...axisProps} width={62} />
            <YAxis yAxisId="right" orientation="right" {...axisProps} width={54} />
            <Tooltip {...tooltipStyles} />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
            <Area
              type="monotone"
              yAxisId="left"
              dataKey="accidents"
              name="Accidents"
              stroke="var(--color-chart-1)"
              strokeWidth={2.4}
              fill="url(#aaAccidents)"
              animationDuration={900}
            />
            <Area
              type="monotone"
              yAxisId="left"
              dataKey="injuries"
              name="Injuries"
              stroke="var(--color-chart-2)"
              strokeWidth={2}
              fill="url(#aaInjuries)"
              animationDuration={1000}
            />
            <Line
              type="monotone"
              yAxisId="right"
              dataKey="fatalities"
              name="Fatalities"
              stroke="var(--color-chart-3)"
              strokeWidth={2.4}
              dot={false}
              animationDuration={1100}
            />
          </ComposedChart>
        </ChartFrame>
      </Panel>

      {/* Section 2 — Geographic analysis */}
      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <Panel title="Geographic distribution" subtitle="Districts ranked by accident count">
          <ChartFrame height={340}>
            <BarChart
              data={districtRanking}
              layout="vertical"
              margin={{ top: 4, right: 24, left: 8, bottom: 0 }}
            >
              <CartesianGrid {...gridProps} vertical horizontal={false} />
              <XAxis type="number" {...axisProps} />
              <YAxis
                type="category"
                dataKey="district"
                {...axisProps}
                width={150}
                tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
              />
              <Tooltip {...tooltipStyles} />
              <Bar dataKey="accidents" name="Accidents" radius={[0, 6, 6, 0]} animationDuration={900}>
                {districtRanking.map((d, i) => (
                  <Cell
                    key={d.district}
                    fill={i < 2 ? "var(--color-chart-3)" : "var(--color-chart-1)"}
                    fillOpacity={i < 2 ? 0.95 : 0.6}
                  />
                ))}
              </Bar>
            </BarChart>
          </ChartFrame>
        </Panel>

        <Panel title="District contribution" subtitle="Share of network incidents">
          <ul className="space-y-3.5">
            {districtRanking.map((d, i) => (
              <li key={d.district} className="group">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-2">
                    <MapPin
                      className={cn(
                        "h-3.5 w-3.5 shrink-0",
                        i < 2 ? "text-destructive" : "text-muted-foreground",
                      )}
                    />
                    <span className="truncate text-sm text-foreground">{d.district}</span>
                    {i === 0 ? (
                      <Badge variant="outline" className="shrink-0 text-[10px]">
                        Highest risk
                      </Badge>
                    ) : null}
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="numeric text-sm font-semibold text-foreground">
                      {d.accidents.toLocaleString()}
                    </span>
                    <Delta value={d.change} />
                  </span>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-700",
                        i < 2 ? "bg-destructive/80" : "bg-primary/70",
                      )}
                      style={{ width: `${(d.accidents / maxDistrict) * 100}%` }}
                    />
                  </div>
                  <span className="numeric w-12 text-right text-xs text-muted-foreground">
                    {d.share.toFixed(1)}%
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      {/* Section 3 — Severity analysis */}
      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.55fr)]">
        <Panel title="Severity mix" subtitle={`${totalIncidents.toLocaleString()} classified incidents`}>
          <ChartFrame height={250}>
            <PieChart>
              <Tooltip {...tooltipStyles} cursor={false} />
              <Pie
                data={severityBreakdown}
                dataKey="incidents"
                nameKey="name"
                innerRadius="60%"
                outerRadius="90%"
                paddingAngle={3}
                stroke="none"
                animationDuration={900}
              >
                {severityBreakdown.map((s) => (
                  <Cell key={s.name} fill={s.color} />
                ))}
              </Pie>
            </PieChart>
          </ChartFrame>
          <div className="mt-4 space-y-1">
            <StatRow label="Overall fatality rate" value="6.4%" tone="bad" />
            <StatRow label="Overall injury rate" value="78.2%" tone="warn" />
            <StatRow label="Classification completeness" value="94.0%" tone="good" />
          </div>
        </Panel>

        <Panel title="Severity detail" subtitle="Incident counts and outcome rates by class">
          <div className="-mx-5 overflow-x-auto px-5">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  {["Severity", "Incidents", "Share", "Fatality rate", "Injury rate"].map((h) => (
                    <th key={h} className="mono-label pb-2 pr-3 font-medium text-muted-foreground">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {severityBreakdown.map((s) => (
                  <tr
                    key={s.name}
                    className="border-b border-border/60 transition-colors last:border-0 hover:bg-muted/40"
                  >
                    <td className="py-3 pr-3">
                      <span className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: s.color }}
                        />
                        <span className="font-medium text-foreground">{s.name}</span>
                      </span>
                    </td>
                    <td className="numeric py-3 pr-3 font-semibold text-foreground">
                      {s.incidents.toLocaleString()}
                    </td>
                    <td className="numeric py-3 pr-3 text-muted-foreground">
                      {s.share.toFixed(1)}%
                    </td>
                    <td className="numeric py-3 pr-3 text-destructive">
                      {s.fatalityRate.toFixed(1)}%
                    </td>
                    <td className="numeric py-3 pr-3 text-warning">{s.injuryRate.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      {/* Section 4 — Time pattern */}
      <Panel
        className="mt-5"
        title="Time-of-day pattern"
        subtitle="Hourly accident frequency, 00:00 — 23:00"
        action={
          <Badge variant="outline" className="text-[11px]">
            Peak {peakHour.hour}
          </Badge>
        }
      >
        <ChartFrame height={300}>
          <BarChart data={hourlyPattern} margin={{ top: 8, right: 8, left: -14, bottom: 0 }}>
            <CartesianGrid {...gridProps} />
            <XAxis dataKey="hour" {...axisProps} interval={1} />
            <YAxis {...axisProps} width={62} />
            <Tooltip {...tooltipStyles} />
            <Bar dataKey="accidents" name="Accidents" radius={[6, 6, 2, 2]} animationDuration={900}>
              {hourlyPattern.map((h) => (
                <Cell
                  key={h.hour}
                  fill={
                    h.accidents >= HIGH_RISK_HOUR_THRESHOLD
                      ? "var(--color-chart-3)"
                      : "var(--color-chart-1)"
                  }
                  fillOpacity={h.accidents >= HIGH_RISK_HOUR_THRESHOLD ? 0.95 : 0.5}
                />
              ))}
            </Bar>
          </BarChart>
        </ChartFrame>
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border/60 pt-4 text-xs">
          <span className="flex items-center gap-2 text-muted-foreground">
            <span className="h-2 w-4 rounded-full bg-chart-1/50" /> Normal exposure
          </span>
          <span className="flex items-center gap-2 text-muted-foreground">
            <span className="h-2 w-4 rounded-full bg-destructive" /> High-risk period
          </span>
          <span className="flex items-center gap-2 text-foreground">
            <Info className="h-3.5 w-3.5 text-primary" />
            Peak accident exposure occurs during evening hours (17:00 — 20:00).
          </span>
        </div>
      </Panel>

      {/* Sections 5 & 6 */}
      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Panel
          title="Day-of-week distribution"
          subtitle="Weekly incident spread"
          action={
            <Badge variant="outline" className="text-[11px]">
              Highest · {peakDay.day}
            </Badge>
          }
        >
          <ChartFrame height={290}>
            <BarChart data={weekdayPattern} margin={{ top: 8, right: 8, left: -14, bottom: 0 }}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="short" {...axisProps} />
              <YAxis {...axisProps} width={62} />
              <Tooltip {...tooltipStyles} />
              <Bar dataKey="accidents" name="Accidents" radius={[6, 6, 2, 2]} animationDuration={900}>
                {weekdayPattern.map((d) => (
                  <Cell
                    key={d.day}
                    fill={
                      d.accidents === peakDay.accidents
                        ? "var(--color-chart-3)"
                        : "var(--color-chart-1)"
                    }
                    fillOpacity={d.accidents === peakDay.accidents ? 0.95 : 0.55}
                  />
                ))}
              </Bar>
            </BarChart>
          </ChartFrame>
          <p className="mt-3 text-xs text-muted-foreground">
            {peakDay.day} records {peakDay.accidents.toLocaleString()} incidents and{" "}
            {peakDay.fatalities} fatalities — the highest-risk day of the week.
          </p>
        </Panel>

        <Panel title="Accident type breakdown" subtitle="Category share of total incidents">
          <ChartFrame height={240}>
            <PieChart>
              <Tooltip {...tooltipStyles} cursor={false} />
              <Pie
                data={accidentTypes}
                dataKey="incidents"
                nameKey="type"
                innerRadius="52%"
                outerRadius="88%"
                paddingAngle={2}
                stroke="none"
                animationDuration={900}
              >
                {accidentTypes.map((t) => (
                  <Cell key={t.type} fill={t.color} />
                ))}
              </Pie>
            </PieChart>
          </ChartFrame>
          <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {accidentTypes.map((t) => (
              <li key={t.type} className="flex items-center gap-2">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: t.color }}
                />
                <span className="min-w-0 truncate text-xs text-muted-foreground">{t.type}</span>
                <span className="numeric ml-auto shrink-0 text-xs font-semibold text-foreground">
                  {t.incidents.toLocaleString()} · {t.share.toFixed(1)}%
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      {/* Section 7 — Key insights */}
      <Panel
        className="mt-5"
        title="Key insights"
        subtitle="Generated from the current selection"
        action={
          <Badge variant="outline" className="text-[11px]">
            5 observations
          </Badge>
        }
        bodyClassName="p-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
      >
        {keyInsights.map((insight, i) => {
          const tone = insightTone[insight.tone];
          const Icon = tone.icon;
          return (
            <article
              key={insight.id}
              className="rise-in hover-lift rounded-xl border border-border bg-elevated/50 p-4"
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <div className="flex items-start justify-between gap-3">
                <span className={cn("rounded-lg p-2", tone.chip)}>
                  <Icon className="h-4 w-4" />
                </span>
                <span className={cn("numeric rounded-full px-2 py-0.5 text-[11px] font-semibold", tone.chip)}>
                  {insight.metric}
                </span>
              </div>
              <h4 className="mt-3 text-sm font-semibold leading-snug text-foreground">
                {insight.headline}
              </h4>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                {insight.detail}
              </p>
            </article>
          );
        })}
      </Panel>
    </AppShell>
  );
}
