import { Link } from "@tanstack/react-router";
import { ShieldCheck, Radio } from "lucide-react";

import { navGroups } from "./nav-items";

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col bg-sidebar">
      <div className="flex items-center gap-3 px-5 py-5">
        <div
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
          style={{ backgroundImage: "var(--gradient-signal)" }}
        >
          <ShieldCheck className="h-5 w-5 text-primary-foreground" strokeWidth={2.4} />
        </div>
        <div className="min-w-0">
          <p className="truncate font-display text-sm font-semibold text-sidebar-foreground">
            SafeRoad<span className="text-primary">IQ</span>
          </p>
          <p className="mono-label text-muted-foreground">Safety intelligence</p>
        </div>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-4">
        {navGroups.map((group) => (
          <div key={group.title}>
            <p className="mono-label px-3 pb-2 text-muted-foreground/70">{group.title}</p>
            <ul className="space-y-1">
              {group.items.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    onClick={onNavigate}
                    activeOptions={{ exact: item.to === "/" }}
                    className="group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    activeProps={{
                      className:
                        "bg-sidebar-accent text-sidebar-accent-foreground shadow-[inset_0_0_0_1px_var(--sidebar-border)]",
                      "data-active": "true",
                    }}
                  >
                    <span className="absolute left-0 top-1/2 h-0 w-[3px] -translate-y-1/2 rounded-r-full bg-primary transition-all duration-200 group-data-[active=true]:h-6" />
                    <item.icon
                      className="h-[18px] w-[18px] shrink-0 transition-colors group-data-[active=true]:text-primary"
                      strokeWidth={1.9}
                    />
                    <span className="truncate">{item.label}</span>
                    {item.badge ? (
                      <span className="numeric ml-auto rounded-md bg-destructive/15 px-1.5 py-0.5 text-[11px] text-destructive">
                        {item.badge}
                      </span>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="m-3 rounded-xl border border-sidebar-border bg-sidebar-accent/40 p-4">
        <div className="flex items-center gap-2">
          <Radio className="h-4 w-4 text-success" strokeWidth={2} />
          <p className="mono-label text-success">Live feed</p>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          Connected to PostgreSQL database with 20,000 accident records across 8 major monitored
          districts.
        </p>
      </div>
    </div>
  );
}