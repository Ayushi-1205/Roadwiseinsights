import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Download,
  FileText,
  Clock,
  Share2,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { PageHeader, Panel, StatRow } from "@/components/ui-kit/Panel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getReportSummary, downloadCSVReport } from "@/lib/api";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Reports — SafeRoadIQ Road Safety Intelligence" },
      {
        name: "description",
        content:
          "Build, schedule and export road safety reports: severity reviews, corridor audits and condition impact studies.",
      },
      { property: "og:title", content: "Reports — SafeRoadIQ" },
      {
        property: "og:description",
        content: "Build, schedule and export road safety intelligence reports.",
      },
    ],
  }),
  component: ReportsPage,
});

// ─── Types ───────────────────────────────────────────────────────────────────

type SeverityRow = {
  severity: string;
  incidents: number;
  share_pct: number;
  fatal_incidents: number;
  fatality_rate_pct: number;
  total_casualties: number;
  avg_casualties_per_crash: number;
};

type CauseRow = {
  cause: string;
  incidents: number;
  share_pct: number;
};

type CityRow = {
  city: string;
  incidents: number;
  share_pct: number;
};

type WeekRow = {
  period: string;
  incidents: number;
  share_pct: number;
};

type ReportSummary = {
  generated_at: string;
  dataset: {
    source: string;
    total_records: number;
    total_casualties: number;
    total_fatalities: number;
    fatality_rate_pct: number;
  };
  severity_breakdown: SeverityRow[];
  cause_breakdown: CauseRow[];
  city_breakdown: CityRow[];
  weekday_weekend: WeekRow[];
};

// ─── Available exports ────────────────────────────────────────────────────────

type ExportSpec = {
  id: string;
  endpoint: "severity-summary" | "hotspot-corridors" | "monthly-trend" | "cause-breakdown";
  filename: string;
  title: string;
  scope: string;
  format: "CSV";
  description: string;
};

const EXPORTS: ExportSpec[] = [
  {
    id: "EXP-001",
    endpoint: "severity-summary",
    filename: "severity-summary.csv",
    title: "Severity Summary Report",
    scope: "All 20,000 records · Severity breakdown",
    format: "CSV",
    description:
      "Per-severity incident count, share, fatality rate, total casualties, and average casualties per crash.",
  },
  {
    id: "EXP-002",
    endpoint: "monthly-trend",
    filename: "monthly-trend.csv",
    title: "Monthly Accident Trend",
    scope: "Jan 2022 – Apr 2025 · 40 months",
    format: "CSV",
    description:
      "Monthly accidents, fatalities, major, minor, total casualties, and fatality rate across the full dataset date range.",
  },
  {
    id: "EXP-003",
    endpoint: "hotspot-corridors",
    filename: "hotspot-corridors.csv",
    title: "Hotspot Corridor Report",
    scope: "City × Road type · Geographic breakdown",
    format: "CSV",
    description:
      "Accident volume, fatality rate, total casualties, and average coordinates grouped by city and road type.",
  },
  {
    id: "EXP-004",
    endpoint: "cause-breakdown",
    filename: "cause-breakdown.csv",
    title: "Accident Cause Breakdown",
    scope: "5 primary causes · Full dataset",
    format: "CSV",
    description:
      "Incident count, share percentage, fatal incidents, fatality rate, and total casualties per cause category.",
  },
];

import { toast } from "sonner";

// ─── Quick-template items (functional CSV downloads) ─────────────────────────

type QuickTemplateSpec = {
  title: string;
  endpoint: "severity-summary" | "hotspot-corridors" | "monthly-trend" | "cause-breakdown";
  filename: string;
  detail: string;
};

const TEMPLATES: QuickTemplateSpec[] = [
  {
    title: "Corridor safety audit",
    endpoint: "hotspot-corridors",
    filename: "roadwise-hotspot-corridors.csv",
    detail: "Download hotspot corridor CSV · City × Road type breakdown",
  },
  {
    title: "Severity review",
    endpoint: "severity-summary",
    filename: "roadwise-severity-summary.csv",
    detail: "Download severity summary CSV · Fatalities & casualty rates",
  },
  {
    title: "Cause impact study",
    endpoint: "cause-breakdown",
    filename: "roadwise-cause-breakdown.csv",
    detail: "Download cause breakdown CSV · Primary contributing factors",
  },
  {
    title: "Monthly trend digest",
    endpoint: "monthly-trend",
    filename: "roadwise-monthly-trend.csv",
    detail: "Download monthly trend CSV · 40-month longitudinal dataset",
  },
];

function QuickTemplateItem({ t }: { t: QuickTemplateSpec }) {
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    try {
      setDownloading(true);
      await downloadCSVReport(t.endpoint, t.filename);
      toast.success(`Downloaded ${t.filename}`);
    } catch (err) {
      console.error("Template download error:", err);
      toast.error(err instanceof Error ? err.message : `Failed to download ${t.filename}`);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={downloading}
      className="w-full text-left rounded-xl border border-border bg-elevated/50 p-4 transition-colors hover:bg-accent/40 focus:outline-none focus:ring-2 focus:ring-ring/40 disabled:opacity-70"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-foreground">{t.title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{t.detail}</p>
        </div>
        {downloading ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
        ) : (
          <Download className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
      </div>
    </button>
  );
}

// ─── DownloadButton ───────────────────────────────────────────────────────────

function DownloadButton({ spec }: { spec: ExportSpec }) {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [bytes, setBytes] = useState<number | null>(null);

  async function handleDownload() {
    setStatus("loading");
    setErrorMsg(null);
    try {
      const size = await downloadCSVReport(spec.endpoint, spec.filename);
      setBytes(size);
      setStatus("done");
      // Reset back to idle after 3 s
      setTimeout(() => setStatus("idle"), 3000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Download failed");
      setStatus("error");
      setTimeout(() => setStatus("idle"), 5000);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Download ${spec.title}`}
        disabled={status === "loading"}
        onClick={handleDownload}
        className={cn(
          status === "done" && "text-success",
          status === "error" && "text-destructive",
        )}
      >
        {status === "loading" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : status === "done" ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : status === "error" ? (
          <AlertCircle className="h-4 w-4" />
        ) : (
          <Download className="h-4 w-4" />
        )}
      </Button>
      {status === "done" && bytes !== null && (
        <span className="text-center text-[10px] text-success">
          {(bytes / 1024).toFixed(1)} KB
        </span>
      )}
      {status === "error" && errorMsg && (
        <span className="text-center text-[10px] text-destructive" title={errorMsg}>
          Error
        </span>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function ReportsPage() {
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState<string | null>(null);
  const [bulkError, setBulkError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadSummary() {
      try {
        setLoading(true);
        setError(null);
        const res = await getReportSummary();
        if (cancelled) return;
        if (res && res.success) {
          setSummary(res);
        } else {
          setError("Failed to load live report summary");
        }
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Unable to load report summary");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadSummary();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleDownloadAll() {
    setBulkLoading("Downloading all reports…");
    setBulkError(null);
    const errors: string[] = [];
    for (const spec of EXPORTS) {
      try {
        await downloadCSVReport(spec.endpoint, spec.filename);
        await new Promise((r) => setTimeout(r, 400)); // brief pause between files
      } catch (err) {
        errors.push(spec.title);
      }
    }
    setBulkLoading(null);
    if (errors.length > 0) {
      setBulkError(`Failed: ${errors.join(", ")}`);
    }
  }

  const ds = summary?.dataset;

  return (
    <AppShell>
      <PageHeader
        eyebrow="Deliverables"
        title="Reports"
        description="CSV exports generated directly from the live PostgreSQL dataset. All figures are aggregated from public.accident (20,000 records). Scheduled delivery and PDF generation are not yet implemented."
        action={
          <Button onClick={handleDownloadAll} disabled={bulkLoading !== null}>
            {bulkLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            {bulkLoading ?? "Download all"}
          </Button>
        }
      />

      {/* DATABASE CONNECTION STATUS */}
      <div className="mb-5 flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3">
        <span
          className={`h-2.5 w-2.5 rounded-full ${
            loading ? "bg-yellow-500" : error ? "bg-destructive" : "bg-green-500"
          }`}
        />
        <span className="text-sm text-muted-foreground">
          {loading
            ? "Loading report summary from PostgreSQL…"
            : error
              ? `Database API error: ${error}`
              : `Live PostgreSQL data · ${ds?.total_records.toLocaleString()} records · generated ${
                  summary ? new Date(summary.generated_at).toLocaleTimeString() : ""
                }`}
        </span>
      </div>

      {bulkError && (
        <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {bulkError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        {/* ── Export library ── */}
        <Panel title="Available exports" subtitle="Live CSV downloads from PostgreSQL" bodyClassName="p-0">
          <ul>
            {EXPORTS.map((spec) => (
              <li
                key={spec.id}
                className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 border-b border-border/60 px-5 py-4 transition-colors last:border-0 hover:bg-secondary/40"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/12">
                  <FileText className="h-4 w-4 text-primary" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{spec.title}</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {spec.id} · {spec.scope} · {spec.format}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground/80 leading-relaxed">
                    {spec.description}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <Badge
                    variant="outline"
                    className="hidden rounded-full bg-success/12 px-2 py-0.5 text-[11px] font-medium text-success sm:inline-flex"
                  >
                    Ready
                  </Badge>
                  <DownloadButton spec={spec} />
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <div className="flex flex-col gap-5">
          {/* ── Live dataset summary ── */}
          <Panel title="Dataset summary" subtitle="Verified PostgreSQL aggregates">
            {loading ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Loading summary…
              </p>
            ) : error ? (
              <p className="py-6 text-center text-sm font-medium text-destructive">{error}</p>
            ) : ds ? (
              <>
                <StatRow
                  label="Total accident records"
                  value={ds.total_records.toLocaleString()}
                  tone="default"
                />
                <StatRow
                  label="Total casualties"
                  value={ds.total_casualties.toLocaleString()}
                  tone="warn"
                />
                <StatRow
                  label="Total fatalities"
                  value={ds.total_fatalities.toLocaleString()}
                  tone="bad"
                />
                <StatRow
                  label="Overall fatality rate"
                  value={`${ds.fatality_rate_pct.toFixed(2)}%`}
                  tone="bad"
                />
                <div className="mt-4 border-t border-border pt-4">
                  <p className="mono-label mb-2 text-muted-foreground">Severity mix</p>
                  {summary?.severity_breakdown.map((s) => (
                    <StatRow
                      key={s.severity}
                      label={s.severity.charAt(0).toUpperCase() + s.severity.slice(1)}
                      value={`${s.incidents.toLocaleString()} (${s.share_pct}%)`}
                      tone="default"
                    />
                  ))}
                </div>
                <div className="mt-4 border-t border-border pt-4">
                  <p className="mono-label mb-2 text-muted-foreground">Weekday / Weekend</p>
                  {summary?.weekday_weekend.map((w) => (
                    <StatRow
                      key={w.period}
                      label={w.period}
                      value={`${w.incidents.toLocaleString()} (${w.share_pct}%)`}
                      tone="default"
                    />
                  ))}
                </div>
              </>
            ) : null}
          </Panel>

          {/* ── Quick templates ── */}
          <Panel title="Quick templates" subtitle="Trigger instant CSV exports for targeted audits">
            <div className="space-y-2">
              {TEMPLATES.map((t) => (
                <QuickTemplateItem key={t.title} t={t} />
              ))}
            </div>
          </Panel>

          {/* ── Report delivery status ── */}
          <Panel
            title="Report delivery status"
            subtitle="Manual export availability & scheduled delivery configuration"
          >
            <StatRow label="Manual exports" value="Available" tone="good" />
            <StatRow label="Scheduled weekly digest" value="Not configured" tone="default" />
            <StatRow label="Scheduled monthly review" value="Not configured" tone="default" />
            <StatRow label="Email recipients" value="Not configured" tone="default" />
            <div className="mt-4 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                disabled
                title="Automated scheduling is not configured."
              >
                <Clock className="mr-2 h-4 w-4" />
                Schedule
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                disabled
                title="Automated scheduling is not configured."
              >
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground">
              Direct CSV file downloads are active. Automated email digests and scheduled distribution channels are not configured.
            </p>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}