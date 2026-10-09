"use client";

import { formatDistanceToNow } from "date-fns";
import {
  ArrowLeftRight,
  ArrowRight,
  Building2,
  Check,
  CircleDot,
  Hourglass,
  KanbanSquare,
  MessageSquare,
  Palette,
  UserPlus,
  Users,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Avatar } from "@/components/creators/bits";
import { buttonClass, GradientButton } from "@/components/effects/gradient-button";
import { EmptyState } from "@/components/layout/states";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import {
  activeCollaborators,
  canInviteCollaborators,
  COLLAB_ROLES,
  leadShare,
  MAX_TOTAL_SHARE,
  pendingCollaborators,
} from "@/lib/collaboration";
import { ACTION_LABELS, allowedTransitions, STATUS_LABELS } from "@/lib/engagement";
import { useAllBriefs, useAllCreators, useDemoStore } from "@/lib/store";
import type { Brief, Collaborator, Creator, Engagement, EngagementStatus, Role } from "@/lib/types";
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

const otherRole = (role: Role): Role => (role === "brand" ? "creator" : "brand");

/** Optional/negative moves (cancel, decline, revise) don't count as "your move". */
const SIDE_ACTIONS: EngagementStatus[] = ["declined", "cancelled", "revision_requested"];
const nextMove = (e: Engagement, role: Role) => allowedTransitions(e, role).find((a) => !SIDE_ACTIONS.includes(a));

function TeamStack({ leadId, team, creators }: { leadId: string; team: Collaborator[]; creators: Creator[] }) {
  const lead = creators.find((c) => c.id === leadId);
  const accepted = team.filter((t) => t.status === "accepted").length;
  const pending = team.length - accepted;
  return (
    <div className="mt-3 flex items-center gap-2">
      <span className="flex -space-x-2">
        {lead && <Avatar creator={lead} size={20} className="ring-2 ring-surface" />}
        {team.map((t) => {
          const c = creators.find((x) => x.id === t.creatorId);
          return c ? (
            <Avatar key={t.creatorId} creator={c} size={20} className={cn("ring-2 ring-surface", t.status === "invited" && "opacity-50")} />
          ) : null;
        })}
      </span>
      <span className="flex items-center gap-1 text-[10.5px] text-muted-foreground">
        <Users className="size-3" /> Team of {1 + accepted}
        {pending > 0 && <span className="text-subtle">· {pending} pending</span>}
      </span>
    </div>
  );
}

function EngagementCard({ item, role, onOpen, creators }: { item: Resolved; role: Role; onOpen: () => void; creators: Creator[] }) {
  const { engagement: e, brief, creator } = item;
  const last = e.events.at(-1);
  const next = nextMove(e, role);
  const teamInvites = role === "creator" ? pendingCollaborators(e).length : 0;
  const waitingOnOther = !next && !teamInvites && nextMove(e, otherRole(role)) !== undefined;
  const team = activeCollaborators(e);

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "card-surface group w-full rounded-[16px] p-3.5 text-left transition-all hover:-translate-y-0.5 hover:border-border-strong",
        (next || teamInvites > 0) && "border-violet/45 shadow-[0_0_0_1px_rgba(124,92,255,0.2),0_12px_30px_-12px_rgba(124,92,255,0.55)]",
      )}
    >
      {role === "brand" ? (
        <div className="flex items-center gap-2.5">
          {creator && <Avatar creator={creator} size={30} />}
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium">{creator?.name ?? "Unknown creator"}</p>
            <p className="truncate text-[11.5px] text-muted-foreground">{brief?.title ?? "Unknown brief"}</p>
          </div>
        </div>
      ) : (
        <div className="min-w-0">
          <p className="eyebrow !text-[10px]">{brief?.brandName ?? "Brand"}</p>
          <p className="mt-0.5 line-clamp-2 text-[13px] leading-snug font-medium">{brief?.title ?? "Unknown brief"}</p>
          {creator && (
            <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Avatar creator={creator} size={16} /> as {creator.name}
            </p>
          )}
        </div>
      )}
      <div className="mt-3 flex items-center justify-between">
        <span className={cn("rounded-full px-2 py-0.5 text-[10.5px]", STATUS_TONE[e.status])}>{STATUS_LABELS[e.status]}</span>
        {last && <span className="text-[10.5px] text-subtle">{formatDistanceToNow(new Date(last.at), { addSuffix: true })}</span>}
      </div>
      {team.length > 0 && <TeamStack leadId={e.creatorId} team={team} creators={creators} />}
      {next ? (
        <p className="mt-3 flex items-center gap-1.5 border-t border-white/[0.06] pt-2.5 text-[11.5px] font-medium text-violet">
          <Zap className="size-3" /> Your move: {ACTION_LABELS[next]}
        </p>
      ) : teamInvites > 0 ? (
        <p className="mt-3 flex items-center gap-1.5 border-t border-white/[0.06] pt-2.5 text-[11.5px] font-medium text-violet">
          <Zap className="size-3" /> Your move: Respond to team invite
        </p>
      ) : waitingOnOther ? (
        <p className="mt-3 flex items-center gap-1.5 border-t border-white/[0.06] pt-2.5 text-[11.5px] text-subtle">
          <Hourglass className="size-3" /> Waiting on {otherRole(role)}
        </p>
      ) : null}
    </button>
  );
}

const ROLE_COPY: Record<Role, { title: string; body: string; icon: typeof Building2 }> = {
  brand: {
    title: "You're viewing as the Brand",
    body: "You invite creators, review submitted work, request revisions and approve delivery.",
    icon: Building2,
  },
  creator: {
    title: "You're viewing as the Creator",
    body: "You accept or decline invites, start the work and submit it for the brand's review.",
    icon: Palette,
  },
};

function RoleBanner({ role, actionCount }: { role: Role; actionCount: number }) {
  const router = useRouter();
  const copy = ROLE_COPY[role];
  return (
    <div className="card-surface mb-6 flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-xl",
          role === "brand" ? "bg-info/10 text-info" : "bg-pink/10 text-pink",
        )}
      >
        <copy.icon className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-semibold">{copy.title}</p>
        <p className="text-[13px] text-muted-foreground">{copy.body}</p>
      </div>
      <span
        className={cn(
          "rounded-full px-3 py-1 text-[12px] font-medium whitespace-nowrap",
          actionCount ? "bg-violet/15 text-violet" : "bg-white/5 text-muted-foreground",
        )}
        aria-live="polite"
      >
        {actionCount ? `${actionCount} need${actionCount === 1 ? "s" : ""} your action` : "Nothing waiting on you"}
      </span>
      <GradientButton variant="secondary" size="sm" onClick={() => router.push(`/engagements/${otherRole(role)}`)}>
        <ArrowLeftRight /> Switch to {otherRole(role) === "brand" ? "Brand" : "Creator"}
      </GradientButton>
    </div>
  );
}

/** `role` comes from the URL (/engagements/brand or /engagements/creator); embedded boards fall back to the store role. */
export function EngagementBoard({ briefId, role: roleProp }: { briefId?: string; role?: Role }) {
  const items = useResolved(briefId);
  const [openId, setOpenId] = useState<string | null>(null);
  const open = items.find((i) => i.engagement.id === openId);
  const closed = items.filter((i) => ["declined", "cancelled"].includes(i.engagement.status));
  const [showClosed, setShowClosed] = useState(false);
  const storeRole = useDemoStore((s) => s.role);
  const role = roleProp ?? storeRole;
  const creators = useAllCreators();
  const actionCount = items.filter(
    (i) => nextMove(i.engagement, role) || (role === "creator" && pendingCollaborators(i.engagement).length > 0),
  ).length;

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
      {!briefId && <RoleBanner role={role} actionCount={actionCount} />}
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
                  <EngagementCard
                    key={i.engagement.id}
                    item={i}
                    role={role}
                    creators={creators}
                    onOpen={() => setOpenId(i.engagement.id)}
                  />
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
                <EngagementCard key={i.engagement.id} item={i} role={role} creators={creators} onOpen={() => setOpenId(i.engagement.id)} />
              ))}
            </div>
          )}
        </div>
      )}
      <EngagementSheet item={open} role={role} onClose={() => setOpenId(null)} />
    </>
  );
}

function EngagementSheet({ item, role, onClose }: { item?: Resolved; role: Role; onClose: () => void }) {
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
    const err = advance(e.id, to, note.trim() || undefined, role);
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

            <div className="flex-1 space-y-8 overflow-y-auto p-6">
              <TeamSection engagement={e} role={role} />
              <div>
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
                  Waiting on the {otherRole(role)}. Open the {otherRole(role)} view to act as them.
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

function TeamSection({ engagement: e, role }: { engagement: Engagement; role: Role }) {
  const creators = useAllCreators();
  const inviteCollaborator = useDemoStore((s) => s.inviteCollaborator);
  const respond = useDemoStore((s) => s.respondCollaboration);
  const [adding, setAdding] = useState(false);
  const [pick, setPick] = useState("");
  const [teamRole, setTeamRole] = useState<string>(COLLAB_ROLES[0]);
  const [share, setShare] = useState(20);

  const lead = creators.find((c) => c.id === e.creatorId);
  const team = activeCollaborators(e);
  const committed = team.reduce((sum, c) => sum + c.sharePct, 0);
  const open = canInviteCollaborators(e);
  const candidates = creators.filter((c) => c.id !== e.creatorId && !team.some((t) => t.creatorId === c.id));
  const nameOf = (id: string) => creators.find((c) => c.id === id)?.name ?? "Creator";

  if (!team.length && !(role === "creator" && open)) return null;

  function submit() {
    if (!pick) return toast.error("Pick a creator to invite");
    const err = inviteCollaborator(e.id, { creatorId: pick, role: teamRole, sharePct: share });
    if (err) return toast.error(err);
    toast.success(`Invited ${nameOf(pick)} to the team`);
    setAdding(false);
    setPick("");
  }

  function answer(creatorId: string, accept: boolean) {
    const err = respond(e.id, creatorId, accept);
    if (err) toast.error(err);
    else toast.success(accept ? `${nameOf(creatorId)} joined the team` : "Team invite declined");
  }

  const field =
    "h-9 w-full rounded-[10px] border border-white/10 bg-white/[0.03] px-2.5 text-[13px] outline-none focus-visible:border-violet/60";

  return (
    <section>
      <p className="eyebrow mb-3 flex items-center gap-1.5">
        <Users className="size-3" /> Team
      </p>
      <ul className="space-y-2">
        {lead && (
          <li className="flex items-center gap-2.5 rounded-xl bg-white/[0.03] px-3 py-2">
            <Avatar creator={lead} size={26} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-medium">{lead.name}</span>
              <span className="block text-[11px] text-muted-foreground">Lead creator</span>
            </span>
            <span className="font-mono text-[12px]">{leadShare(e)}%</span>
          </li>
        )}
        {team.map((t) => {
          const c = creators.find((x) => x.id === t.creatorId);
          return (
            <li key={t.creatorId} className="rounded-xl bg-white/[0.03] px-3 py-2">
              <div className="flex items-center gap-2.5">
                {c && <Avatar creator={c} size={26} />}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium">{c?.name ?? "Creator"}</span>
                  <span className="block text-[11px] text-muted-foreground">{t.role}</span>
                </span>
                <span className="text-right">
                  <span className="block font-mono text-[12px]">{t.sharePct}%</span>
                  <span className={cn("block text-[10px]", t.status === "accepted" ? "text-verified" : "text-amber")}>
                    {t.status === "accepted" ? "Joined" : "Invite pending"}
                  </span>
                </span>
              </div>
              {t.status === "invited" && role === "creator" && (
                <div className="mt-2 flex items-center gap-2 border-t border-white/[0.06] pt-2">
                  <span className="flex-1 text-[11px] text-subtle">Respond as {c?.name.split(" ")[0]}:</span>
                  <button
                    type="button"
                    onClick={() => answer(t.creatorId, false)}
                    className="flex h-7 items-center gap-1 rounded-lg px-2 text-[12px] text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  >
                    <X className="size-3" /> Decline
                  </button>
                  <button
                    type="button"
                    onClick={() => answer(t.creatorId, true)}
                    className="flex h-7 items-center gap-1 rounded-lg bg-violet/20 px-2.5 text-[12px] text-foreground hover:bg-violet/30"
                  >
                    <Check className="size-3" /> Join team
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {role === "creator" && open && !adding && (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="mt-3 flex h-9 w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/15 text-[12.5px] text-muted-foreground hover:border-violet/40 hover:text-foreground"
        >
          <UserPlus className="size-3.5" /> Invite a collaborator
        </button>
      )}
      {role === "creator" && open && adding && (
        <div className="mt-3 space-y-2 rounded-xl border border-violet/25 bg-violet/[0.05] p-3">
          <select aria-label="Creator to invite" className={field} value={pick} onChange={(ev) => setPick(ev.target.value)}>
            <option value="">Choose a creator…</option>
            {candidates.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} · {c.specializations[0]}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-[1fr_90px] gap-2">
            <select aria-label="Their role" className={field} value={teamRole} onChange={(ev) => setTeamRole(ev.target.value)}>
              {COLLAB_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <label className="relative">
              <span className="sr-only">Fee share percent</span>
              <input
                type="number"
                min={5}
                max={MAX_TOTAL_SHARE - committed}
                step={5}
                value={share}
                onChange={(ev) => setShare(Number(ev.target.value))}
                className={cn(field, "pr-6")}
              />
              <span className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-[12px] text-subtle">%</span>
            </label>
          </div>
          <p className="text-[11px] text-subtle">
            Their share comes out of the lead&apos;s fee. {MAX_TOTAL_SHARE - committed}% left to share; the lead keeps at least{" "}
            {100 - MAX_TOTAL_SHARE}%.
          </p>
          <div className="flex justify-end gap-2">
            <GradientButton variant="ghost" size="sm" onClick={() => setAdding(false)}>
              Cancel
            </GradientButton>
            <GradientButton size="sm" onClick={submit}>
              <UserPlus /> Send invite
            </GradientButton>
          </div>
        </div>
      )}
      {role === "brand" && team.length > 0 && (
        <p className="mt-2 text-[11px] text-subtle">The lead creator manages the team and stays your single point of contact.</p>
      )}
    </section>
  );
}
