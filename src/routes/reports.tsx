import { createFileRoute } from "@tanstack/react-router";
import { Download, FileText, Plus, Clock, Share2 } from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { PageHeader, Panel, StatRow } from "@/components/ui-kit/Panel";
import { Button } from "@/components/ui/button";
import { reports } from "@/lib/mock-data";

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

const statusTone: Record<string, string> = {
  Ready: "bg-success/12 text-success",
  Scheduled: "bg-warning/12 text-warning",
  Archived: "bg-muted text-muted-foreground",
};

const templates = [
  { title: "Corridor safety audit", detail: "Risk score, causes, interventions" },
  { title: "Severity review", detail: "Fatal / serious outcome breakdown" },
  { title: "Condition impact study", detail: "Weather, surface and lighting" },
  { title: "Vehicle class digest", detail: "Mode-wise exposure and outcomes" },
];

function ReportsPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Deliverables"
        title="Reports"
        description="Generated intelligence packs for authorities, transport departments and enforcement teams. Exports are placeholders until the data layer is connected."
        action={
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New report
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Panel title="Report library" subtitle="Most recent first" bodyClassName="p-0">
          <ul>
            {reports.map((r) => (
              <li
                key={r.id}
                className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 border-b border-border/60 px-5 py-4 transition-colors last:border-0 hover:bg-secondary/40"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/12">
                  <FileText className="h-4 w-4 text-primary" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{r.title}</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {r.id} · {r.scope} · {r.format}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="mono-label hidden text-muted-foreground sm:inline">
                    {r.updated}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${statusTone[r.status]}`}
                  >
                    {r.status}
                  </span>
                  <Button variant="ghost" size="icon" aria-label={`Download ${r.title}`}>
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <div className="flex flex-col gap-5">
          <Panel title="Quick templates" subtitle="One-click generation">
            <ul className="space-y-2">
              {templates.map((t) => (
                <li key={t.title}>
                  <button className="hover-lift w-full rounded-xl border border-border bg-elevated/50 p-4 text-left">
                    <p className="text-sm font-medium text-foreground">{t.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{t.detail}</p>
                  </button>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Distribution" subtitle="Scheduled delivery">
            <StatRow label="Weekly digest" value="Mon 07:00" />
            <StatRow label="Monthly review" value="1st, 09:00" />
            <StatRow label="Recipients" value="14 teams" />
            <div className="mt-4 flex gap-2">
              <Button variant="outline" size="sm" className="flex-1">
                <Clock className="mr-2 h-4 w-4" />
                Schedule
              </Button>
              <Button variant="outline" size="sm" className="flex-1">
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
            </div>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}