import { Link } from "@tanstack/react-router";
import { Activity, X } from "lucide-react";

import { NAV_ITEMS } from "./navigation";
import { cn } from "@/lib/utils";

interface SidebarProps {
  onNavigate?: () => void;
  showClose?: boolean;
}

export function SidebarContent({ onNavigate, showClose }: SidebarProps) {
  return (
    <div className="flex h-full flex-col bg-sidebar">
      <div className="flex items-start justify-between gap-2 border-b border-sidebar-border px-5 py-5">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Activity className="size-5" aria-hidden="true" />
          </span>
          <div>
            <p className="font-display text-sm font-semibold leading-tight text-sidebar-foreground">
              Self-Powered
              <br />
              Edge-AI Companion
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">Prototype v1.0 · Demo Data</p>
          </div>
        </div>
        {showClose ? (
          <button
            type="button"
            onClick={onNavigate}
            aria-label="Close navigation"
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-sidebar-accent"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>

      <nav aria-label="Main navigation" className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            activeOptions={{ exact: item.to === "/" }}
            className="group flex items-start gap-3 rounded-xl px-3 py-2.5 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent"
            activeProps={{
              className: cn(
                "bg-primary text-primary-foreground hover:bg-primary",
                "shadow-[0_6px_16px_oklch(0.55_0.108_215/0.28)]",
              ),
              "aria-current": "page",
            }}
          >
            {({ isActive }) => (
              <>
                <item.icon
                  className={cn("mt-0.5 size-4 shrink-0", !isActive && "text-primary")}
                  aria-hidden="true"
                />
                <span className="min-w-0">
                  <span className="block font-medium leading-tight">{item.label}</span>
                  <span
                    className={cn(
                      "block text-[11px] leading-tight",
                      isActive ? "text-primary-foreground/80" : "text-muted-foreground",
                    )}
                  >
                    {item.description}
                  </span>
                </span>
              </>
            )}
          </Link>
        ))}
      </nav>

      <div className="border-t border-sidebar-border px-5 py-4">
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Rehabilitation monitoring &amp; research prototype. Not a medical diagnosis system.
        </p>
      </div>
    </div>
  );
}
