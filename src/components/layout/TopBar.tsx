import { useState } from "react";
import { Menu, Search, Bell, CalendarRange, Download, ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { SidebarNav } from "./SidebarNav";

export function TopBar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 border-sidebar-border bg-sidebar p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <SidebarNav onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>

          <label className="relative hidden min-w-0 flex-1 items-center md:flex md:max-w-sm">
            <Search className="pointer-events-none absolute left-3 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search corridors, districts, reports…"
              className="h-10 w-full rounded-lg border border-input bg-card/60 pl-9 pr-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-ring/40"
            />
          </label>

          <div className="hidden items-center gap-2 rounded-lg border border-border bg-card/60 px-3 py-2 xl:flex">
            <CalendarRange className="h-4 w-4 text-primary" />
            <span className="text-xs text-muted-foreground">Last 90 days</span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="hidden sm:inline-flex">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button variant="ghost" size="icon" className="relative" aria-label="Alerts">
            <Bell className="h-5 w-5" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-destructive ring-2 ring-background" />
          </Button>
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card/60 p-1 pr-3">
            <div
              className="numeric grid h-8 w-8 place-items-center rounded-md text-xs font-bold text-primary-foreground"
              style={{ backgroundImage: "var(--gradient-signal)" }}
            >
              AK
            </div>
            <div className="hidden leading-tight sm:block">
              <p className="text-xs font-medium text-foreground">A. Kulkarni</p>
              <p className="mono-label text-muted-foreground">Safety analyst</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}