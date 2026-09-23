import { useEffect, useMemo, useState } from "react";
import { Crosshair, Layers, MapPin } from "lucide-react";

import { getHotspots } from "@/lib/api";
import { cn } from "@/lib/utils";

export type HotspotItem = {
  id: string;
  name: string;
  x: number;
  y: number;
  risk: number;
  incidents: number;
  kind: string;
  city?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
};

function riskColor(risk: number) {
  if (risk >= 85) return "var(--color-chart-3)";
  if (risk >= 70) return "var(--color-chart-1)";
  return "var(--color-chart-2)";
}

function positionKey(h: Pick<HotspotItem, "x" | "y">) {
  return `${h.x},${h.y}`;
}

export function HotspotMap({
  className,
  hotspotsData,
  loading: loadingProp,
  error: errorProp,
}: {
  className?: string;
  hotspotsData?: HotspotItem[];
  loading?: boolean;
  error?: string | null;
}) {
  const isControlled = hotspotsData !== undefined || loadingProp !== undefined || errorProp != null;
  const [fetched, setFetched] = useState<HotspotItem[]>([]);
  const [fetchLoading, setFetchLoading] = useState(!isControlled);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    if (isControlled) {
      return;
    }

    let cancelled = false;
    setFetchLoading(true);
    setFetchError(null);

    getHotspots()
      .then((res) => {
        if (cancelled) return;
        if (res && res.success && Array.isArray(res.hotspots)) {
          setFetched(res.hotspots);
        } else {
          setFetched([]);
          setFetchError("Unable to load live hotspot data");
        }
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to load hotspots:", err);
        setFetched([]);
        setFetchError("Unable to load live hotspot data");
      })
      .finally(() => {
        if (!cancelled) setFetchLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isControlled]);

  const data = useMemo(
    () => (isControlled ? (hotspotsData ?? []) : fetched),
    [isControlled, hotspotsData, fetched],
  );
  const loading = isControlled ? Boolean(loadingProp) : fetchLoading;
  const error = isControlled ? (errorProp ?? null) : fetchError;

  useEffect(() => {
    if (loading || error || data.length === 0) {
      setActive(null);
      return;
    }
    setActive((current) => (current && data.some((h) => h.id === current) ? current : data[0].id));
  }, [data, loading, error]);

  const stacks = useMemo(() => {
    const grouped = new Map<string, HotspotItem[]>();
    for (const h of data) {
      const key = positionKey(h);
      const list = grouped.get(key);
      if (list) list.push(h);
      else grouped.set(key, [h]);
    }
    return grouped;
  }, [data]);

  const selected = data.find((h) => h.id === active) ?? null;
  const selectedStack = selected ? (stacks.get(positionKey(selected)) ?? [selected]) : [];

  const statusMessage = loading
    ? "Loading live hotspot data..."
    : error
      ? error
      : data.length === 0
        ? "No hotspot groups with valid coordinates."
        : null;

  function selectStackAt(items: HotspotItem[]) {
    if (items.length === 0) return;
    const currentIndex = items.findIndex((h) => h.id === active);
    if (currentIndex >= 0 && items.length > 1) {
      setActive(items[(currentIndex + 1) % items.length].id);
      return;
    }
    setActive(items[0].id);
  }

  return (
    <div className={cn("grid gap-5 xl:grid-cols-[minmax(0,1fr)_290px]", className)}>
      <div className="surface-grid relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-border bg-background/60">
        {/* stylised road network */}
        <svg
          viewBox="0 0 100 62"
          className="absolute inset-0 h-full w-full"
          preserveAspectRatio="none"
        >
          <g stroke="var(--color-muted-foreground)" strokeOpacity={0.35} fill="none">
            <path d="M0 14 C 22 10, 38 26, 62 22 S 88 34, 100 28" strokeWidth={1.1} />
            <path d="M0 44 C 26 40, 42 52, 68 46 S 90 54, 100 50" strokeWidth={1.1} />
            <path d="M18 0 L 26 62" strokeWidth={0.8} />
            <path d="M52 0 L 46 62" strokeWidth={0.8} />
            <path d="M78 0 L 84 62" strokeWidth={0.8} />
          </g>
          <g stroke="var(--color-primary)" strokeOpacity={0.5} fill="none" strokeDasharray="2 3">
            <path d="M0 30 C 30 24, 55 38, 100 32" strokeWidth={0.9} />
          </g>
        </svg>

        {!statusMessage &&
          Array.from(stacks.values()).map((items) => {
            const representative =
              items.find((h) => h.id === selected?.id) ??
              items.reduce((best, h) => (h.risk > best.risk ? h : best), items[0]);
            const isActive = items.some((h) => h.id === selected?.id);
            const color = riskColor(representative.risk);
            return (
              <button
                key={positionKey(items[0])}
                onClick={() => selectStackAt(items)}
                style={{ left: `${items[0].x}%`, top: `${items[0].y}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 outline-none"
                aria-label={
                  items.length > 1
                    ? `${items.length} hotspot groups at this location. ${representative.name}`
                    : representative.name
                }
              >
                <span
                  className="pulse-ring absolute inset-0 m-auto block h-4 w-4 rounded-full"
                  style={{ backgroundColor: color, opacity: 0.35 }}
                />
                <span
                  className={cn(
                    "relative block rounded-full ring-2 ring-background transition-all duration-200",
                    isActive ? "h-4 w-4 scale-110" : "h-3 w-3 hover:scale-125",
                  )}
                  style={{ backgroundColor: color, boxShadow: `0 0 16px ${color}` }}
                />
              </button>
            );
          })}

        {statusMessage ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/70 px-6 text-center">
            <p
              className={cn(
                "text-sm",
                error ? "font-medium text-destructive" : "text-muted-foreground",
              )}
            >
              {statusMessage}
            </p>
          </div>
        ) : null}

        <div className="absolute left-4 top-4 flex items-center gap-2 rounded-lg border border-border bg-card/80 px-3 py-1.5 backdrop-blur">
          <Layers className="h-3.5 w-3.5 text-primary" />
          <span className="mono-label text-muted-foreground">Risk density layer</span>
        </div>

        <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card/80 px-3 py-2 backdrop-blur">
          <span className="mono-label text-muted-foreground">Low</span>
          <span
            className="h-1.5 min-w-24 flex-1 rounded-full"
            style={{ backgroundImage: "var(--gradient-risk)" }}
          />
          <span className="mono-label text-destructive">Critical</span>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="rounded-xl border border-border bg-elevated/60 p-4">
          {selected ? (
            <>
              <div className="flex items-center gap-2">
                <Crosshair className="h-4 w-4 shrink-0 text-primary" />
                <p className="mono-label truncate text-muted-foreground">{selected.id}</p>
              </div>
              <p className="mt-2 text-sm font-semibold leading-snug text-foreground">
                {selected.name}
              </p>
              <p className="text-xs text-muted-foreground">{selected.kind}</p>
              {selectedStack.length > 1 ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  {selectedStack.length} groups at this location · click marker to cycle
                </p>
              ) : null}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <p className="mono-label text-muted-foreground">Risk</p>
                  <p
                    className="numeric text-2xl font-bold"
                    style={{ color: riskColor(selected.risk) }}
                  >
                    {selected.risk}
                  </p>
                </div>
                <div>
                  <p className="mono-label text-muted-foreground">Incidents</p>
                  <p className="numeric text-2xl font-bold text-foreground">{selected.incidents}</p>
                </div>
              </div>
            </>
          ) : (
            <p
              className={cn(
                "text-sm",
                error ? "font-medium text-destructive" : "text-muted-foreground",
              )}
            >
              {statusMessage ?? "Select a hotspot"}
            </p>
          )}
        </div>

        <ul className="max-h-72 space-y-1 overflow-y-auto pr-1">
          {data.map((h) => (
            <li key={h.id}>
              <button
                onClick={() => setActive(h.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors",
                  h.id === selected?.id ? "bg-secondary" : "hover:bg-secondary/60",
                )}
              >
                <MapPin
                  className="h-4 w-4 shrink-0"
                  style={{ color: riskColor(h.risk) }}
                  strokeWidth={2}
                />
                <span className="min-w-0 flex-1 truncate text-xs text-foreground">{h.name}</span>
                <span className="numeric shrink-0 text-xs font-semibold text-muted-foreground">
                  {h.risk}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
