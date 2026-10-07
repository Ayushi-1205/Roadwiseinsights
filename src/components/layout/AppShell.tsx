import { useState, type ReactNode } from "react";
import { useLocation } from "@tanstack/react-router";
import { Menu } from "lucide-react";

import { SidebarNav } from "./SidebarNav";
import { TopBar } from "./TopBar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export interface AppShellProps {
  children: ReactNode;
  dateRange?: string;
  onDateRangeChange?: (range: string) => void;
  onExport?: () => void;
  isExporting?: boolean;
  totalAccidents?: number;
  activeHotspots?: number;
  selectedCity?: string;
  onCitySelect?: (city: string) => void;
  onClearCity?: () => void;
}

export function AppShell({
  children,
  dateRange,
  onDateRangeChange,
  onExport,
  isExporting,
  totalAccidents,
  activeHotspots,
  selectedCity,
  onCitySelect,
  onClearCity,
}: AppShellProps) {
  const location = useLocation();
  const isDashboard = location.pathname === "/";
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[272px_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-screen border-r border-sidebar-border lg:block">
        <SidebarNav />
      </aside>
      <div className="flex min-w-0 flex-col">
        {isDashboard ? (
          <TopBar
            dateRange={dateRange}
            onDateRangeChange={onDateRangeChange}
            onExport={onExport}
            isExporting={isExporting}
            totalAccidents={totalAccidents}
            activeHotspots={activeHotspots}
            selectedCity={selectedCity}
            onCitySelect={onCitySelect}
            onClearCity={onClearCity}
          />
        ) : (
          /* Mobile navigation toggle for non-dashboard routes (hidden on desktop) */
          <div className="flex items-center gap-3 border-b border-border bg-background/80 px-4 py-3 backdrop-blur-xl lg:hidden">
            <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open navigation" className="shrink-0">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 border-sidebar-border bg-sidebar p-0">
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                <SidebarNav onNavigate={() => setMobileNavOpen(false)} />
              </SheetContent>
            </Sheet>
            <span className="font-display text-sm font-semibold text-foreground">
              SafeRoad<span className="text-primary">IQ</span>
            </span>
          </div>
        )}
        <main className="min-w-0 flex-1 px-4 pb-16 pt-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}