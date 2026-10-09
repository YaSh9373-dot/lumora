"use client";

import { formatDistanceToNow } from "date-fns";
import { ArrowRight, CircleDot, KanbanSquare, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Avatar } from "@/components/creators/bits";
import { buttonClass, GradientButton } from "@/components/effects/gradient-button";
import { EmptyState } from "@/components/layout/states";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { ACTION_LABELS, allowedTransitions, STATUS_LABELS } from "@/lib/engagement";
import { useAllBriefs, useAllCreators, useDemoStore } from "@/lib/store";
import type { Brief, Creator, Engagement, EngagementStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const COLUMNS: { title: string; statuses: EngagementStatus[]; dot: string }[] = [
  { title: "Invited", statuses: ["invited"], dot: "bg-info" },
  { title: "Accepted", statuses: ["accepted"], dot: "bg-violet" },
  { title: "In progress", statuses: ["in_progress", "revision_requested"], dot: "bg-amber" },
  { title: "In review", statuses: ["in_review"], dot: "bg-pink" },
  { title: "Delivered", statuses: ["delivered"], dot: "bg-verified" },
];

export const STATUS_TONE: Record<EngagementStatus, string> = {
  invited: "bg-info/10 text-info",
  accepted: "bg-violet/15 text-violet",
  in_progress: "bg-amber/10 text-amber",
  revision_requested: "bg-warning/10 text-warning",
  in_review: "bg-pink/10 text-pink",
  delivered: "bg-verified/10 text-verified",
  declined: "bg-white/5 text-subtle",
  cancelled: "bg-white/5 text-subtle",
};

const STATUS_DOT: Record<EngagementStatus, string> = {
  invited: "bg-info",
  accepted: "bg-violet",
  in_progress: "bg-amber",
  revision_requested: "bg-warning",
  in_review: "bg-pink",
  delivered: "bg-verified",
  declined: "bg-subtle",
  cancelled: "bg-subtle",
};

/** Actions that need a note from the actor. */
const NEEDS_NOTE: EngagementStatus[] = ["revision_requested", "in_review"];

interface Resolved {
  engagement: Engagement;
  brief?: Brief;
  creator?: Creator;
}

function useResolved(filterBriefId?: string): Resolved[] {
  const engagements = useDemoStore((s) => s.engagements);
  const briefs = useAllBriefs();
  const creators = useAllCreators();
  return engagements
    .filter((e) => !filterBriefId || e.briefId === filterBriefId)
    .map((engagement) => ({
      engagement,
      brief: briefs.find((b) => b.id === engagement.briefId),
      creator: creators.find((c) => c.id === engagement.creatorId),
    }));
}

function EngagementCard({ item, onOpen }: { item: Resolved; onOpen: () => void }) {
  const { engagement: e, brief, creator } = item;
  const last = e.events.at(-1);
  return (
    <button
      type="button"
      onClick={onOpen}
      className="card-surface group w-full rounded-[16px] p-3.5 text-left transition-all hover:-translate-y-0.5 hover:border-border-strong"
    >
      <div className="flex items-center gap-2.5">
        {creator && <Avatar creator={creator} size={30} />}
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium">{creator?.name ?? "Unknown creator"}</p>
          <p className="truncate text-[11.5px] text-muted-foreground">{brief?.title ?? "Unknown brief"}</p>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className={cn("rounded-full px-2 py-0.5 text-[10.5px]", STATUS_TONE[e.status])}>{STATUS_LABELS[e.status]}</span>
        {last && <span className="text-[10.5px] text-subtle">{formatDistanceToNow(new Date(last.at), { addSuffix: true })}</span>}
      </div>
    </button>
  );
}

export function EngagementBoard({ briefId }: { briefId?: string }) {
  const items = useResolved(briefId);
  const [openId, setOpenId] = useState<string | null>(null);
  const open = items.find((i) => i.engagement.id === openId);
  const closed = items.filter((i) => ["declined", "cancelled"].includes(i.engagement.status));
  const [showClosed, setShowClosed] = useState(false);

  if (!items.length) {
    return (
      <EmptyState
        icon={KanbanSquare}
        title="No engagements yet"
        description="Invite a creator from a brief's Matches tab, or load sample engagements from the Demo Controls (bottom-right)."
      >
        <Link href="/briefs" className={buttonClass("primary")}>
          Go to briefs <ArrowRight />
        </Link>
      </EmptyState>
    );
  }

  return (
    <>
      <div className="no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0 lg:grid lg:grid-cols-5 lg:overflow-visible">
        {COLUMNS.map((col) => {
          const colItems = items.filter((i) => col.statuses.includes(i.engagement.status));
          return (
            <section key={col.title} className="w-[260px] shrink-0 snap-start lg:w-auto" aria-label={col.title}>
              <header className="mb-3 flex items-center gap-2 px-1">
                <span className={cn("size-1.5 rounded-full", col.dot)} />
                <h2 className="text-[13px] font-medium">{col.title}</h2>
                <span className="font-mono text-[11px] text-subtle">{colItems.length}</span>
              </header>
              <div className="min-h-32 space-y-2.5 rounded-[18px] border border-white/[0.04] bg-white/[0.015] p-2">
                {colItems.map((i) => (
                  <EngagementCard key={i.engagement.id} item={i} onOpen={() => setOpenId(i.engagement.id)} />
                ))}
                {!colItems.length && <p className="px-2 py-6 text-center text-[11px] text-subtle">Nothing here</p>}
              </div>
            </section>
          );
        })}
      </div>
      {closed.length > 0 && (
        <div className="mt-4">
          <button type="button" onClick={() => setShowClosed((s) => !s)} className="text-xs text-muted-foreground hover:text-foreground">
            {showClosed ? "Hide" : "Show"} declined & cancelled ({closed.length})
          </button>
          {showClosed && (
            <div className="mt-3 grid gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
              {closed.map((i) => (
                <EngagementCard key={i.engagement.id} item={i} onOpen={() => setOpenId(i.engagement.id)} />
              ))}
            </div>
          )}
        </div>
      )}
      <EngagementSheet item={open} onClose={() => setOpenId(null)} />
    </>
  );
}

function EngagementSheet({ item, onClose }: { item?: Resolved; onClose: () => void }) {
  const role = useDemoStore((s) => s.role);
  const advance = useDemoStore((s) => s.advance);
  const [note, setNote] = useState("");
  const e = item?.engagement;
  const actions = e ? allowedTransitions(e, role) : [];
  const otherRoleActions = e ? allowedTransitions(e, role === "brand" ? "creator" : "brand") : [];

  function act(to: EngagementStatus) {
    if (!e) return;
    if (NEEDS_NOTE.includes(to) && !note.trim()) {
      toast.error(to === "in_review" ? "Add a deliverable link or note" : "Describe the revision you need");
      return;
    }
    const err = advance(e.id, to, note.trim() || undefined);
    if (err) toast.error(err);
    else {
      toast.success(STATUS_LABELS[to]);
      setNote("");
    }
  }

  return (
    <Sheet open={!!item} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full border-white/10 bg-surface sm:max-w-md">
        {item && e && (
          <>
            <div className="border-b border-white/10 p-6">
              <span className={cn("rounded-full px-2 py-0.5 text-[11px]", STATUS_TONE[e.status])}>{STATUS_LABELS[e.status]}</span>
              <SheetTitle className="mt-3 text-lg">{item.brief?.title ?? "Engagement"}</SheetTitle>
              <SheetDescription className="mt-2 flex items-center gap-2">
                {item.creator && <Avatar creator={item.creator} size={22} />}
                {item.creator?.name}
                {item.creator && (
                  <Link href={`/creators/${item.creator.slug}`} className="text-xs text-violet hover:underline">
                    Profile
                  </Link>
                )}
              </SheetDescription>
              <p className="mt-3 font-mono text-[11px] text-muted-foreground">
                Revisions used: {e.revisionsUsed} / {item.brief?.revisionRounds ?? "—"}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <p className="eyebrow mb-4">Activity</p>
              <ol className="relative space-y-5 border-l border-white/10 pl-5">
                {e.events.map((ev, i) => (
                  <li key={i} className="relative">
                    <span
                      className={cn(
                        "absolute top-1 -left-[25px] flex size-2.5 rounded-full ring-4 ring-surface",
                        ev.type === "note" ? "bg-white/30" : STATUS_DOT[ev.type],
                      )}
                    />
                    <p className="text-[13px]">
                      <span className="capitalize text-muted-foreground">{ev.actor}</span>{" "}
                      <span className="font-medium">{ev.type === "note" ? "added a note" : STATUS_LABELS[ev.type].toLowerCase()}</span>
                    </p>
                    {ev.note && (
                      <p className="mt-1.5 flex gap-1.5 rounded-lg bg-white/[0.04] px-2.5 py-2 text-[12.5px] text-foreground/85">
                        <MessageSquare className="mt-0.5 size-3 shrink-0 text-subtle" /> {ev.note}
                      </p>
                    )}
                    <p className="mt-1 text-[11px] text-subtle">{formatDistanceToNow(new Date(ev.at), { addSuffix: true })}</p>
                  </li>
                ))}
              </ol>
            </div>

            <div className="space-y-3 border-t border-white/10 p-4">
              {actions.length > 0 ? (
                <>
                  {actions.some((a) => NEEDS_NOTE.includes(a)) && (
                    <textarea
                      value={note}
                      onChange={(ev) => setNote(ev.target.value)}
                      rows={2}
                      aria-label="Note"
                      placeholder={role === "creator" ? "Deliverable link or note…" : "What should change?"}
                      className="w-full resize-none rounded-[12px] border border-white/10 bg-white/[0.03] p-2.5 text-sm outline-none focus-visible:border-violet/60"
                    />
                  )}
                  <div className="flex flex-wrap gap-2">
                    {actions.map((to) => (
                      <GradientButton
                        key={to}
                        variant={["declined", "cancelled", "revision_requested"].includes(to) ? "secondary" : "primary"}
                        className="flex-1"
                        onClick={() => act(to)}
                      >
                        {ACTION_LABELS[to]}
                      </GradientButton>
                    ))}
                  </div>
                </>
              ) : otherRoleActions.length > 0 ? (
                <p className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
                  <CircleDot className="size-3.5 text-amber" />
                  Waiting on the {role === "brand" ? "creator" : "brand"}. Switch role in Demo Controls to act as them.
                </p>
              ) : (
                <p className="text-[12.5px] text-muted-foreground">This engagement is closed.</p>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
