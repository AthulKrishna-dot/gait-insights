import { useState, type ReactNode } from "react";
import { Menu, Radio } from "lucide-react";

import { SidebarContent } from "./Sidebar";
import { DemoBadge, StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useFilters } from "@/context/FilterContext";

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { patient } = useFilters();

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-sidebar-border lg:block no-print">
        <SidebarContent />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarContent onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-border bg-surface/90 backdrop-blur no-print">
          <div className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="lg:hidden"
              aria-label="Open navigation"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="size-4" />
            </Button>

            <div className="min-w-0 flex-1">
              <h1 className="truncate font-display text-base font-semibold text-foreground sm:text-lg">
                Self-Powered Edge-AI Rehabilitation Companion
              </h1>
              <p className="truncate text-[11px] text-muted-foreground sm:text-xs">
                Edge-AI Rehabilitation Monitoring &amp; Gait Analytics
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {patient ? (
                <span className="hidden rounded-full bg-muted px-2.5 py-1 text-[11px] text-muted-foreground md:inline">
                  {patient.patient_id} · {patient.rehab_program}
                </span>
              ) : null}
              <StatusBadge tone="online" label="Monitoring Status: Active" />
              <DemoBadge />
            </div>
          </div>

          <div className="flex items-center gap-2 border-t border-border bg-primary-soft/60 px-4 py-1.5 sm:px-6">
            <Radio className="size-3 text-primary" aria-hidden="true" />
            <p className="text-[11px] leading-tight text-primary">
              Research prototype for rehabilitation monitoring — fictional demo data, no medical diagnosis, no
              hardware required.
            </p>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1400px] space-y-5 px-4 py-5 sm:px-6 sm:py-6">{children}</main>

        <footer className="mx-auto w-full max-w-[1400px] px-4 pb-8 text-[11px] text-muted-foreground sm:px-6">
          Self-Powered Edge-AI Rehabilitation Companion · Prototype v1.0 · Demo Data Mode · Local SLM Integration: Planned ·
          Not a medical device and not HIPAA/GDPR certified.
        </footer>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string | undefined;
  actions?: ReactNode | undefined;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="font-display text-lg font-semibold text-foreground sm:text-xl">{title}</h2>
        {subtitle ? <p className="mt-1 max-w-3xl text-xs text-muted-foreground sm:text-sm">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2 no-print">{actions}</div> : null}
    </div>
  );
}
