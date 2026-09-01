import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function SectionCard({
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn("panel", className)}>
      {title || action ? (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-3.5 sm:px-5">
          <div className="min-w-0">
            {title ? <h2 className="text-sm font-semibold text-card-foreground">{title}</h2> : null}
            {description ? (
              <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {action ? <div className="flex flex-wrap items-center gap-2 no-print">{action}</div> : null}
        </header>
      ) : null}
      <div className={cn("p-4 sm:p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

export function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border px-6 py-10 text-center">
      <p className="text-sm font-medium text-card-foreground">{title}</p>
      <p className="mt-1 max-w-md text-xs text-muted-foreground">{message}</p>
    </div>
  );
}
