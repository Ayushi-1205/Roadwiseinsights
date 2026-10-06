import type { ReactNode } from "react";

import { SidebarNav } from "./SidebarNav";
import { TopBar } from "./TopBar";

export interface AppShellProps {
  children: ReactNode;
  dateRange?: string;
  onDateRangeChange?: (range: string) => void;
  onExport?: () => void;
  isExporting?: boolean;
  totalAccidents?: number;
  activeHotspots?: number;
}

export function AppShell({
  children,
  dateRange,
  onDateRangeChange,
  onExport,
  isExporting,
  totalAccidents,
  activeHotspots,
}: AppShellProps) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[272px_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-screen border-r border-sidebar-border lg:block">
        <SidebarNav />
      </aside>
      <div className="flex min-w-0 flex-col">
        <TopBar
          dateRange={dateRange}
          onDateRangeChange={onDateRangeChange}
          onExport={onExport}
          isExporting={isExporting}
          totalAccidents={totalAccidents}
          activeHotspots={activeHotspots}
        />
        <main className="min-w-0 flex-1 px-4 pb-16 pt-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}