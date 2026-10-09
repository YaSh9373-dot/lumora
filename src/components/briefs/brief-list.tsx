"use client";

import { ArrowUpRight, FileText, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { SpotlightCard } from "@/components/effects/spotlight-card";
import { GradientLink } from "@/components/effects/gradient-button";
import { CardGridSkeleton, EmptyState } from "@/components/layout/states";
import { getBriefCompleteness } from "@/lib/completeness";
import { CONTENT_TYPE_LABELS, OBJECTIVE_LABELS } from "@/lib/constants";
import { formatPrice } from "@/lib/format";
import { useAllBriefs, useDemoStore, useHydrated } from "@/lib/store";
import type { Brief } from "@/lib/types";
import { cn } from "@/lib/utils";

function BriefCard({ brief }: { brief: Brief }) {
  const deleteBrief = useDemoStore((s) => s.deleteBrief);
  const pct = getBriefCompleteness(brief).percent;
  const href = brief.status === "draft" ? `/briefs/${brief.id}/edit` : `/briefs/${brief.id}`;
  return (
    <SpotlightCard className="h-full">
      <Link href={href} className="flex h-full flex-col p-6 outline-none focus-visible:ring-2 focus-visible:ring-violet rounded-[20px]">
        {brief.palette.length > 0 && (
          <div className="mb-5 flex h-1.5 overflow-hidden rounded-full">
            {brief.palette.map((p, i) => (
              <span key={`${p}-${i}`} className="flex-1" style={{ background: p }} />
            ))}
          </div>
        )}
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10.5px] font-medium",
              brief.status === "published" ? "bg-verified/10 text-verified" : "bg-warning/10 text-warning",
            )}
          >
            {brief.status === "published" ? "Published" : `Draft · ${pct}%`}
          </span>
          {brief.isSample && <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10.5px] text-muted-foreground">Sample</span>}
          <ArrowUpRight className="ml-auto size-4 text-subtle transition-colors group-hover/spot:text-foreground" />
        </div>
        <p className="eyebrow mt-4">{brief.brandName || "No brand"}</p>
        <h3 className="mt-1 text-lg leading-snug font-semibold tracking-tight">{brief.title || "Untitled brief"}</h3>
        <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
          <span className="rounded-full bg-white/5 px-2 py-0.5">{OBJECTIVE_LABELS[brief.objective]}</span>
          {brief.deliverables.map((d) => (
            <span key={d.id} className="rounded-full bg-white/5 px-2 py-0.5">
              {d.quantity}× {CONTENT_TYPE_LABELS[d.contentType]} {d.aspectRatio}
            </span>
          ))}
        </div>
        <div className="mt-auto flex items-center justify-between pt-5 text-xs text-muted-foreground">
          <span className="font-mono">
            {formatPrice(brief.budget.min, brief.budget.currency)}–{formatPrice(brief.budget.max, brief.budget.currency)}
          </span>
          <span>Due {brief.deadline || "—"}</span>
        </div>
      </Link>
      {!brief.isSample && (
        <button
          type="button"
          aria-label={`Delete ${brief.title || "brief"}`}
          onClick={() => {
            deleteBrief(brief.id);
            toast("Brief deleted");
          }}
          className="absolute right-4 bottom-14 flex size-8 items-center justify-center rounded-lg text-subtle opacity-0 transition-opacity group-hover/spot:opacity-100 hover:bg-white/5 hover:text-danger focus-visible:opacity-100"
        >
          <Trash2 className="size-3.5" />
        </button>
      )}
    </SpotlightCard>
  );
}

export function BriefList() {
  const hydrated = useHydrated();
  const briefs = useAllBriefs();
  const mine = briefs.filter((b) => !b.isSample);
  const samples = briefs.filter((b) => b.isSample);

  if (!hydrated) return <CardGridSkeleton count={3} />;

  return (
    <div className="space-y-12">
      <section>
        <h2 className="eyebrow mb-4">Your briefs</h2>
        {mine.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {mine.map((b) => (
              <BriefCard key={b.id} brief={b} />
            ))}
          </div>
        ) : (
          <EmptyState icon={FileText} title="No briefs yet" description="Describe your idea in one line and let the AI Brief Builder draft the rest.">
            <GradientLink href="/briefs/new">
              <Plus /> Post your first brief
            </GradientLink>
          </EmptyState>
        )}
      </section>
      <section>
        <h2 className="eyebrow mb-4">Sample briefs</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {samples.map((b) => (
            <BriefCard key={b.id} brief={b} />
          ))}
        </div>
      </section>
    </div>
  );
}
