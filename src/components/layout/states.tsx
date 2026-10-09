import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  children,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("card-surface flex flex-col items-center px-6 py-16 text-center", className)}>
      <div className="relative mb-5">
        <div className="bg-aurora absolute inset-0 rounded-2xl opacity-40 blur-xl" />
        <div className="bg-aurora relative flex size-14 items-center justify-center rounded-2xl text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]">
          <Icon className="size-6" />
        </div>
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {children && <div className="mt-6 flex flex-wrap justify-center gap-2">{children}</div>}
    </div>
  );
}

export function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn("shimmer rounded-xl", className)} />;
}

export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Loading">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="card-surface overflow-hidden p-1">
          <SkeletonBlock className="h-44 rounded-[16px]" />
          <div className="space-y-2.5 p-4">
            <SkeletonBlock className="size-12 rounded-full" />
            <SkeletonBlock className="h-4 w-1/2" />
            <SkeletonBlock className="h-3 w-5/6" />
            <SkeletonBlock className="h-6 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function PageHeader({ eyebrow, title, description, children }: { eyebrow?: string; title: ReactNode; description?: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
        <h1 className="text-[clamp(2rem,4.5vw,3rem)] leading-[1.05] font-semibold tracking-[-0.04em]">{title}</h1>
        {description && <p className="mt-3 max-w-xl text-muted-foreground">{description}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}

export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-[1280px] px-4 sm:px-6", className)}>{children}</div>;
}
