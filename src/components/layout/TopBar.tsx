import { useState, useRef, useEffect, useMemo } from "react";
import {
  Menu,
  Search,
  Bell,
  CalendarRange,
  Download,
  ChevronDown,
  Check,
  MapPin,
  FileText,
  Flame,
  Loader2,
  X,
  AlertCircle,
} from "lucide-react";
import { useNavigate, Link, useLocation } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SidebarNav } from "./SidebarNav";
import { getHealth, testDatabase, getHotspots, getDashboard, type HotspotItem } from "@/lib/api";

export interface TopBarProps {
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

const DATE_OPTIONS = [
  "All time",
  "Last 30 days",
  "Last 90 days",
  "Last 12 months",
  "Year to date",
];

interface SearchItem {
  id: string;
  title: string;
  category: "Districts" | "Corridors" | "Workspaces";
  description: string;
  route: string;
  keywords: string;
  city?: string;
}

// Static application routes / workspaces (these correspond to genuine app routes)
const STATIC_WORKSPACE_ITEMS: SearchItem[] = [
  {
    id: "w-dashboard",
    title: "Command Center Dashboard",
    category: "Workspaces",
    description: "Executive accident KPIs, severity distribution & trends",
    route: "/",
    keywords: "command center dashboard home overview kpi executive",
  },
  {
    id: "w-analytics",
    title: "Accident Analytics",
    category: "Workspaces",
    description: "Time, trends, district filters & multi-dimensional metrics",
    route: "/analytics",
    keywords: "analytics trends filter time series monthly graph chart",
  },
  {
    id: "w-hotspots",
    title: "Hotspot Map",
    category: "Workspaces",
    description: "Monitored risk corridors with coordinate projections",
    route: "/hotspots",
    keywords: "hotspot map corridors risk spatial coordinates markers",
  },
  {
    id: "w-causes",
    title: "Cause Analysis",
    category: "Workspaces",
    description: "Overspeeding, drunk driving & behavioral collision factors",
    route: "/causes",
    keywords: "cause causes overspeeding drunk driving reckless behavioral factor",
  },
  {
    id: "w-vehicles",
    title: "Vehicle-wise Analysis",
    category: "Workspaces",
    description: "Two-wheelers, heavy commercial trucks, cars & bus risks",
    route: "/vehicles",
    keywords: "vehicle vehicles truck car two-wheeler bus collision fleet",
  },
  {
    id: "w-conditions",
    title: "Weather & Road Conditions",
    category: "Workspaces",
    description: "Rain, fog, low visibility & wet asphalt accident correlation",
    route: "/conditions",
    keywords: "weather conditions rain fog wet road surface temperature visibility",
  },
  {
    id: "w-reports",
    title: "Reports & CSV Exports",
    category: "Workspaces",
    description: "Download verified PostgreSQL datasets & summary audit sheets",
    route: "/reports",
    keywords: "reports report csv export download summary tables data",
  },
];

export function TopBar({
  dateRange = "All time",
  onDateRangeChange,
  onExport,
  isExporting = false,
  totalAccidents: propTotalAccidents,
  activeHotspots: propActiveHotspots,
  selectedCity = "",
  onCitySelect,
  onClearCity,
}: TopBarProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const isDashboard = location.pathname === "/" || Boolean(onCitySelect);

  // Dynamic system status state (loaded from live APIs)
  const [backendHealth, setBackendHealth] = useState<"checking" | "online" | "offline">("checking");
  const [dbStatus, setDbStatus] = useState<"checking" | "connected" | "disconnected">("checking");
  const [fetchedTotalAccidents, setFetchedTotalAccidents] = useState<number | null>(null);
  const [fetchedHotspotsCount, setFetchedHotspotsCount] = useState<number | null>(null);
  const [dynamicSearchItems, setDynamicSearchItems] = useState<SearchItem[]>([]);

  // Fetch real system status and dynamic corridor search items on mount
  useEffect(() => {
    let cancelled = false;

    // 1. Check Backend Health
    getHealth()
      .then((res) => {
        if (!cancelled && res.success) {
          setBackendHealth("online");
        } else if (!cancelled) {
          setBackendHealth("offline");
        }
      })
      .catch(() => {
        if (!cancelled) setBackendHealth("offline");
      });

    // 2. Check Database Connection
    testDatabase()
      .then((res) => {
        if (!cancelled && res.success) {
          setDbStatus("connected");
        } else if (!cancelled) {
          setDbStatus("disconnected");
        }
      })
      .catch(() => {
        if (!cancelled) setDbStatus("disconnected");
      });

    // 3. Load dynamic hotspots and districts for search index
    getHotspots()
      .then((res) => {
        if (cancelled || !res || !res.success || !Array.isArray(res.hotspots)) return;
        setFetchedHotspotsCount(res.active_hotspots_count ?? res.hotspots.length);

        // Derive distinct districts dynamically
        const citiesMap = new Map<string, string>();
        res.hotspots.forEach((h: HotspotItem) => {
          if (h.city && !citiesMap.has(h.city)) {
            citiesMap.set(h.city, h.state || "");
          }
        });

        const districtItems: SearchItem[] = Array.from(citiesMap.entries()).map(([city, state]) => ({
          id: `district-${city.toLowerCase()}`,
          title: city,
          category: "Districts",
          description: state ? `${state} district · Real PostgreSQL data` : "Monitored district",
          route: "/analytics",
          keywords: `${city} ${state} district urban city analytics`.toLowerCase(),
          city,
        }));

        // Derive corridors dynamically from backend
        const corridorItems: SearchItem[] = res.hotspots.map((h: HotspotItem) => ({
          id: `corridor-${h.id}`,
          title: h.name,
          category: "Corridors",
          description: `${h.city || ""} · ${h.kind || "Corridor"} · Risk score ${h.risk}`,
          route: "/hotspots",
          keywords: `${h.name} ${h.city || ""} ${h.state || ""} ${h.kind || ""} corridor hotspot`.toLowerCase(),
          city: h.city,
        }));

        setDynamicSearchItems([...districtItems, ...corridorItems]);
      })
      .catch((err) => {
        console.error("Failed to load hotspots for search:", err);
      });

    // 4. Load full dataset total if not passed via props
    if (propTotalAccidents === undefined) {
      getDashboard("All time")
        .then((res) => {
          if (!cancelled && res.success && res.summary) {
            setFetchedTotalAccidents(res.summary.total_accidents);
            if (res.summary.active_hotspots != null) {
              setFetchedHotspotsCount(res.summary.active_hotspots);
            }
          }
        })
        .catch(() => {});
    }

    return () => {
      cancelled = true;
    };
  }, [propTotalAccidents]);

  // Combined live search database
  const fullSearchDatabase = useMemo(() => {
    return [...dynamicSearchItems, ...STATIC_WORKSPACE_ITEMS];
  }, [dynamicSearchItems]);

  // Filter search items based on real data
  const q = searchQuery.trim().toLowerCase();
  const searchResults = q
    ? fullSearchDatabase
        .filter(
          (item) =>
            item.title.toLowerCase().includes(q) ||
            item.description.toLowerCase().includes(q) ||
            item.keywords.toLowerCase().includes(q) ||
            item.category.toLowerCase().includes(q),
        )
        .slice(0, 8)
    : [];

  // Close search dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setIsSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectSearchItem = (item: SearchItem) => {
    setSearchQuery("");
    setIsSearchFocused(false);

    if (isDashboard || onCitySelect) {
      if (item.category === "Districts") {
        onCitySelect?.(item.title);
        return;
      }
      if (item.category === "Corridors") {
        const cityCandidate = item.city || item.title.split(" - ")[0].trim();
        if (cityCandidate) {
          onCitySelect?.(cityCandidate);
          return;
        }
      }
      if (item.category === "Workspaces") {
        navigate({ to: item.route as "/" });
        return;
      }
      if (item.city && onCitySelect) {
        onCitySelect(item.city);
        return;
      }
      if (item.title && onCitySelect) {
        onCitySelect(item.title);
        return;
      }
    }

    navigate({ to: item.route as "/" });
  };

  const handleExportClick = () => {
    if (onExport) {
      onExport();
    } else {
      navigate({ to: "/reports" });
    }
  };

  const getCategoryIcon = (category: SearchItem["category"]) => {
    switch (category) {
      case "Districts":
        return <MapPin className="h-4 w-4 text-primary" />;
      case "Corridors":
        return <Flame className="h-4 w-4 text-warning" />;
      case "Workspaces":
        return <FileText className="h-4 w-4 text-accent" />;
    }
  };

  const displayTotalRecords = propTotalAccidents ?? fetchedTotalAccidents;
  const displayHotspotsCount = propActiveHotspots ?? fetchedHotspotsCount;

  const isSystemHealthy = backendHealth === "online" && dbStatus === "connected";

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:gap-3 px-3 py-2.5 sm:px-4 sm:py-3 lg:px-8">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          {/* Mobile navigation sheet */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden shrink-0"
                aria-label="Open navigation"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 border-sidebar-border bg-sidebar p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <SidebarNav onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>

          {/* Interactive Search Bar */}
          <div ref={searchContainerRef} className="relative min-w-0 flex-1 max-w-[170px] xs:max-w-[210px] sm:max-w-xs md:max-w-md">
            <div className="relative flex items-center">
              <Search className="pointer-events-none absolute left-2.5 sm:left-3 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchFocused(true);
                }}
                onFocus={() => setIsSearchFocused(true)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setIsSearchFocused(false);
                  } else if (e.key === "Enter") {
                    e.preventDefault();
                    if (isDashboard || onCitySelect) {
                      if (searchResults.length > 0) {
                        handleSelectSearchItem(searchResults[0]);
                        return;
                      }
                      const trimmed = searchQuery.trim();
                      if (trimmed && onCitySelect) {
                        const matchedItem = dynamicSearchItems.find(
                          (it) => it.title.toLowerCase() === trimmed.toLowerCase() ||
                                  (it.city && it.city.toLowerCase() === trimmed.toLowerCase())
                        );
                        const targetCity = matchedItem ? (matchedItem.city || matchedItem.title) : trimmed;
                        onCitySelect(targetCity);
                        setSearchQuery("");
                        setIsSearchFocused(false);
                        return;
                      }
                    } else if (searchResults.length > 0) {
                      handleSelectSearchItem(searchResults[0]);
                    }
                  }
                }}
                placeholder={selectedCity ? `District: ${selectedCity}` : "Search corridors, districts, reports…"}
                className="h-9 sm:h-10 w-full rounded-lg border border-input bg-card/60 pl-8 sm:pl-9 pr-7 sm:pr-8 text-xs sm:text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-ring/40"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 sm:right-2.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </button>
              )}
            </div>

            {/* Search Results Dropdown */}
            {isSearchFocused && searchQuery.trim() && (
              <div className="absolute left-0 right-0 top-11 sm:top-12 z-50 rounded-xl border border-border bg-popover/95 p-2 shadow-xl backdrop-blur-md">
                <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Found {searchResults.length} matching result{searchResults.length === 1 ? "" : "s"}
                </div>
                {searchResults.length === 0 ? (
                  <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                    No matching corridors, districts, or reports found for &ldquo;{searchQuery}&rdquo;.
                  </div>
                ) : (
                  <ul className="mt-1 space-y-1">
                    {searchResults.map((item) => (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => handleSelectSearchItem(item)}
                          className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-accent/60"
                        >
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border bg-background">
                            {getCategoryIcon(item.category)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-medium text-foreground">{item.title}</p>
                              <span className="rounded bg-muted px-1.5 py-0.2 text-[10px] text-muted-foreground">
                                {item.category}
                              </span>
                            </div>
                            <p className="truncate text-[11px] text-muted-foreground">
                              {item.description}
                            </p>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Active City Filter Badge in TopBar (when filtered) */}
          {selectedCity && (
            <div className="hidden md:flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1.5 text-xs font-medium text-primary shrink-0">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="max-w-[100px] truncate">{selectedCity}</span>
              {onClearCity && (
                <button
                  type="button"
                  onClick={onClearCity}
                  className="rounded p-0.5 hover:bg-primary/20 text-primary/80 hover:text-primary transition-colors"
                  title="Clear district filter"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          )}

          {/* Responsive Date Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                title="Date ranges are relative to the latest accident record available in the database."
                className="flex items-center gap-1.5 sm:gap-2 rounded-lg border border-border bg-card/60 px-2 sm:px-3 py-1.5 sm:py-2 text-left transition-colors hover:bg-card/90 shrink-0"
              >
                <CalendarRange className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary shrink-0" />
                <span className="text-xs font-medium text-foreground whitespace-nowrap">{dateRange}</span>
                <ChevronDown className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">
                Date Range Filter
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {DATE_OPTIONS.map((opt) => (
                <DropdownMenuItem
                  key={opt}
                  onClick={() => {
                    if (onDateRangeChange) {
                      onDateRangeChange(opt);
                    } else {
                      navigate({ to: "/" });
                    }
                  }}
                  className="flex items-center justify-between text-xs cursor-pointer"
                >
                  <span>{opt}</span>
                  {dateRange === opt && <Check className="h-3.5 w-3.5 text-primary" />}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <div className="px-2 py-1.5 text-[10px] leading-tight text-muted-foreground bg-muted/40 rounded-b">
                Date ranges are relative to the latest accident record available in the database.
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Right side action controls */}
        <div className="flex items-center gap-2">
          {/* Functional CSV Export Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportClick}
            disabled={isExporting}
            className="hidden sm:inline-flex"
          >
            {isExporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            {isExporting ? "Exporting…" : "Export"}
          </Button>

          {/* Notification / Dynamic System Status Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                aria-label="System Status"
              >
                <Bell className="h-5 w-5" />
                <span
                  className={`absolute right-2 top-2 h-2 w-2 rounded-full ring-2 ring-background ${
                    isSystemHealthy
                      ? "bg-emerald-500"
                      : backendHealth === "checking" || dbStatus === "checking"
                        ? "bg-yellow-500"
                        : "bg-destructive"
                  }`}
                />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-4">
              <div className="flex items-center justify-between border-b border-border pb-2.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  System & Data Status
                </p>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                    isSystemHealthy
                      ? "bg-emerald-500/10 text-emerald-500"
                      : backendHealth === "checking" || dbStatus === "checking"
                        ? "bg-yellow-500/10 text-yellow-500"
                        : "bg-destructive/10 text-destructive"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      isSystemHealthy
                        ? "bg-emerald-500 animate-pulse"
                        : backendHealth === "checking" || dbStatus === "checking"
                          ? "bg-yellow-500"
                          : "bg-destructive"
                    }`}
                  />
                  {isSystemHealthy
                    ? "Live Verified"
                    : backendHealth === "checking" || dbStatus === "checking"
                      ? "Verifying…"
                      : "Service Alert"}
                </span>
              </div>

              <div className="mt-3 space-y-2.5 text-xs">
                <div className="flex items-start justify-between">
                  <span className="text-muted-foreground">PostgreSQL Database</span>
                  <span className="font-medium text-foreground">
                    {dbStatus === "connected"
                      ? "Connected (Neon Cloud)"
                      : dbStatus === "checking"
                        ? "Checking…"
                        : "Disconnected"}
                  </span>
                </div>
                <div className="flex items-start justify-between">
                  <span className="text-muted-foreground">Accident Records</span>
                  <span className="font-medium text-foreground">
                    {displayTotalRecords !== null
                      ? `${displayTotalRecords.toLocaleString()} verified rows`
                      : "Querying…"}
                  </span>
                </div>
                <div className="flex items-start justify-between">
                  <span className="text-muted-foreground">Monitored Corridors</span>
                  <span className="font-medium text-foreground">
                    {displayHotspotsCount !== null
                      ? `${displayHotspotsCount} active corridors`
                      : "Querying…"}
                  </span>
                </div>
                <div className="flex items-start justify-between">
                  <span className="text-muted-foreground">Backend API</span>
                  <span className="font-medium text-foreground">
                    {backendHealth === "online"
                      ? "Online & healthy"
                      : backendHealth === "checking"
                        ? "Checking…"
                        : "Unreachable"}
                  </span>
                </div>
                <div className="flex items-start justify-between">
                  <span className="text-muted-foreground">Selected Filter</span>
                  <span className="font-medium text-primary">{dateRange}</span>
                </div>
              </div>

              <div className="mt-3.5 border-t border-border pt-2.5 flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">Full data exports available</span>
                <Link
                  to="/reports"
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Reports &rarr;
                </Link>
              </div>
            </PopoverContent>
          </Popover>

          {/* Organization Badge */}
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card/60 p-1 pr-3">
            <div
              className="numeric grid h-8 w-8 place-items-center rounded-md text-xs font-bold text-primary-foreground"
              style={{ backgroundImage: "var(--gradient-signal)" }}
            >
              RW
            </div>
            <div className="hidden leading-tight sm:block">
              <p className="text-xs font-medium text-foreground">RoadWise Admin</p>
              <p className="mono-label text-muted-foreground">Safety dashboard</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}