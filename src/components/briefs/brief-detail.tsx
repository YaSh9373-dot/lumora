"use client";

import { motion } from "motion/react";
import { AlertTriangle, Check, CheckCircle2, Crown, FileQuestion, Pencil, Send, X } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Avatar, ScoreRing, ShortlistButton, VerifiedCluster } from "@/components/creators/bits";
import { buttonClass, GradientButton } from "@/components/effects/gradient-button";
import { EASE, PageEnter } from "@/components/effects/motion";
import { EngagementBoard } from "@/components/engagements/board";
import { Container, EmptyState, SkeletonBlock } from "@/components/layout/states";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CONTENT_TYPE_LABELS, OBJECTIVE_LABELS } from "@/lib/constants";
import { formatPrice, toUSD } from "@/lib/format";
import { rankCreatorsForBrief, type RankedCreator } from "@/lib/matching";
import { useAllBriefs, useAllCreators, useDemoStore, useHydrated } from "@/lib/store";
import type { Brief } from "@/lib/types";
import { cn } from "@/lib/utils";
import { BriefPreview } from "./brief-preview";

export function BriefDetail({ id }: { id: string }) {
  const hydrated = useHydrated();
  const brief = useAllBriefs().find((b) => b.id === id);
  if (!brief) {
    return (
      <Container className="pt-12">
        {hydrated ? (
          <EmptyState icon={FileQuestion} title="Brief not found" description="It may have been deleted or the demo data was reset.">
            <Link href="/briefs" className={buttonClass("primary")}>
              All briefs
            </Link>
          </EmptyState>
        ) : (
          <SkeletonBlock className="h-96 rounded-[24px]" />
        )}
      </Container>
    );
  }
  return <Detail brief={brief} />;
}

function Detail({ brief }: { brief: Brief }) {
  const creators = useAllCreators();
  const ranked = rankCreatorsForBrief(creators, brief);
  const engagementCount = useDemoStore((s) => s.engagements.filter((e) => e.briefId === brief.id).length);
  const types = [...new Set(brief.deliverables.map((d) => CONTENT_TYPE_LABELS[d.contentType]))];
  const ratios = [...new Set(brief.deliverables.map((d) => d.aspectRatio))];

  return (
    <PageEnter>
      <Container className="pt-12">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-[11px] font-medium",
                  brief.status === "published" ? "bg-verified/10 text-verified" : "bg-warning/10 text-warning",
                )}
              >
                {brief.status === "published" ? "Published" : "Draft"}
              </span>
              {brief.isSample && <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] text-muted-foreground">Sample</span>}
              <span className="eyebrow">{brief.brandName}</span>
            </div>
            <h1 className="mt-3 text-[clamp(1.8rem,4vw,2.6rem)] leading-[1.05] font-semibold tracking-[-0.04em]">{brief.title}</h1>
            <div className="mt-4 flex flex-wrap gap-1.5 text-xs">
              <span className="bg-aurora rounded-full px-2.5 py-0.5 font-medium text-white">{OBJECTIVE_LABELS[brief.objective]}</span>
              {[...types, ...ratios].map((t) => (
                <span key={t} className="rounded-full border border-white/10 px-2.5 py-0.5">{t}</span>
              ))}
              <span className="rounded-full border border-white/10 px-2.5 py-0.5 font-mono">
                {formatPrice(brief.budget.min, brief.budget.currency)}–{formatPrice(brief.budget.max, brief.budget.currency)}
              </span>
              <span className="rounded-full border border-white/10 px-2.5 py-0.5 font-mono">Due {brief.deadline}</span>
            </div>
          </div>
          {!brief.isSample && (
            <Link href={`/briefs/${brief.id}/edit`} className={buttonClass("secondary")}>
              <Pencil /> Edit brief
            </Link>
          )}
        </div>

        <Tabs defaultValue="matches" className="mt-10">
          <TabsList variant="line" className="h-auto! gap-4 border-b border-white/[0.06] pb-0 w-full justify-start rounded-none">
            <TabsTrigger value="matches" className="flex-none px-1 pb-3">Matches</TabsTrigger>
            <TabsTrigger value="brief" className="flex-none px-1 pb-3">Brief</TabsTrigger>
            <TabsTrigger value="engagements" className="flex-none px-1 pb-3">
              Engagements {engagementCount > 0 && <span className="font-mono text-[11px] text-subtle">{engagementCount}</span>}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="matches" className="pt-6">
            {brief.status !== "published" ? (
              <EmptyState icon={Send} title="Publish to see matches" description="Matches are calculated once the brief is published.">
                <Link href={`/briefs/${brief.id}/edit`} className={buttonClass("primary")}>
                  Finish brief
                </Link>
              </EmptyState>
            ) : (
              <div className="space-y-3">
                <p className="text-[13px] text-muted-foreground">
                  Ranked by skills, content type, tools, style, format, budget, commercial terms and verification.
                </p>
                {ranked.map((r, i) => (
                  <motion.div key={r.creator.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE, delay: Math.min(i, 8) * 0.04 }}>
                    <MatchRow ranked={r} brief={brief} top={i === 0} />
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
          <TabsContent value="brief" className="pt-6">
            <BriefPreview brief={brief} className="mx-auto max-w-3xl" />
          </TabsContent>
          <TabsContent value="engagements" className="pt-6">
            <EngagementBoard briefId={brief.id} />
          </TabsContent>
        </Tabs>
      </Container>
    </PageEnter>
  );
}

function MatchRow({ ranked, brief, top }: { ranked: RankedCreator; brief: Brief; top: boolean }) {
  const { creator, match, trust } = ranked;
  const invite = useDemoStore((s) => s.invite);
  const invited = useDemoStore((s) =>
    s.engagements.some((e) => e.briefId === brief.id && e.creatorId === creator.id && !["declined", "cancelled"].includes(e.status)),
  );
  const priceUSD = toUSD(creator.startingPrice, creator.currency);
  const maxUSD = toUSD(brief.budget.max, brief.budget.currency);
  const minUSD = toUSD(brief.budget.min, brief.budget.currency);
  const budgetFit = priceUSD <= maxUSD ? (priceUSD < minUSD * 0.5 ? "Well under budget" : "Within budget") : "Over budget";

  return (
    <div
      className={cn(
        "card-surface relative flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5",
        top && "border-violet/40 shadow-[0_0_0_1px_rgba(124,92,255,0.25),0_24px_60px_-20px_rgba(124,92,255,0.35)]",
      )}
    >
      {top && (
        <span className="bg-aurora absolute -top-2.5 left-5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white">
          <Crown className="size-3" /> Top match
        </span>
      )}
      <div className="flex items-center gap-4 sm:w-[300px] sm:shrink-0">
        <ScoreRing value={match.score} size={56} label="Match" />
        <Link href={`/creators/${creator.slug}`} className="flex min-w-0 items-center gap-3 hover:opacity-90">
          <Avatar creator={creator} size={40} />
          <span className="min-w-0">
            <span className="flex items-center gap-1 text-sm font-semibold">
              <span className="truncate">{creator.name}</span> <VerifiedCluster creator={creator} />
            </span>
            <span className="block truncate text-xs text-muted-foreground">{creator.specializations.join(" · ")}</span>
          </span>
        </Link>
      </div>

      <div className="min-w-0 flex-1 space-y-1.5 text-[12.5px]">
        {match.reasons.matched.length > 0 && (
          <p className="flex gap-1.5">
            <Check className="mt-0.5 size-3.5 shrink-0 text-verified" />
            <span>
              <span className="text-muted-foreground">Matched: </span>
              {match.reasons.matched.slice(0, 3).join(", ")}
              {match.reasons.matched.length > 3 && <span className="text-subtle"> +{match.reasons.matched.length - 3}</span>}
            </span>
          </p>
        )}
        {match.reasons.missing.length > 0 && (
          <p className="flex gap-1.5">
            <X className="mt-0.5 size-3.5 shrink-0 text-danger/80" />
            <span>
              <span className="text-muted-foreground">Missing: </span>
              {match.reasons.missing.slice(0, 3).join(", ")}
              {match.reasons.missing.length > 3 && <span className="text-subtle"> +{match.reasons.missing.length - 3}</span>}
            </span>
          </p>
        )}
        {match.reasons.notes.slice(0, 2).map((n) => (
          <p key={n} className="flex gap-1.5 text-warning/90">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0" /> {n}
          </p>
        ))}
      </div>

      <div className="flex items-center gap-4 sm:shrink-0">
        <div className="text-right text-xs">
          <p className="font-mono">{formatPrice(creator.startingPrice, creator.currency)}</p>
          <p className={cn(budgetFit === "Over budget" ? "text-warning" : "text-verified")}>{budgetFit}</p>
          <p className="mt-0.5 text-subtle">Trust {trust}</p>
        </div>
        <ShortlistButton creatorId={creator.id} className="bg-white/5" />
        {invited ? (
          <span className="inline-flex h-10 items-center gap-1.5 rounded-[12px] px-3 text-[13px] text-verified">
            <CheckCircle2 className="size-4" /> Invited
          </span>
        ) : (
          <GradientButton
            onClick={() => {
              if (invite(brief.id, creator.id)) toast.success(`Invited ${creator.name}`, { description: "Track it in the Engagements tab." });
            }}
          >
            <Send /> Invite
          </GradientButton>
        )}
      </div>
    </div>
  );
}
