import type { Collaborator, Engagement } from "./types";

export const COLLAB_ROLES = [
  "Co-director",
  "Animation",
  "Sound design",
  "Music",
  "Voice & lip-sync",
  "Color grading",
  "3D & compositing",
  "Upscaling & finishing",
] as const;

export const MAX_COLLABORATORS = 3;
/** The lead always keeps at least 40% of the fee. */
export const MAX_TOTAL_SHARE = 60;
export const MIN_SHARE = 5;

/** A team can only be formed once the lead has accepted and before delivery. */
const OPEN_STATUSES: Engagement["status"][] = ["accepted", "in_progress", "revision_requested"];

export type CollabErrorCode = "CLOSED" | "SELF" | "DUPLICATE" | "LIMIT" | "SHARE" | "NOT_FOUND";

export class CollabError extends Error {
  constructor(
    public readonly code: CollabErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "CollabError";
  }
}

export interface CollabInput {
  creatorId: string;
  role: string;
  sharePct: number;
}

export function collaboratorsOf(e: Engagement): Collaborator[] {
  return e.collaborators ?? [];
}

/** Collaborators that still count: invited or accepted. */
export function activeCollaborators(e: Engagement): Collaborator[] {
  return collaboratorsOf(e).filter((c) => c.status !== "declined");
}

export function pendingCollaborators(e: Engagement): Collaborator[] {
  return collaboratorsOf(e).filter((c) => c.status === "invited");
}

export function canInviteCollaborators(e: Engagement): boolean {
  return OPEN_STATUSES.includes(e.status);
}

/** The lead's share after accepted collaborators are paid. */
export function leadShare(e: Engagement): number {
  return 100 - collaboratorsOf(e).filter((c) => c.status === "accepted").reduce((sum, c) => sum + c.sharePct, 0);
}

export function inviteCollaborator(e: Engagement, input: CollabInput, now = new Date()): Engagement | CollabError {
  if (!canInviteCollaborators(e)) return new CollabError("CLOSED", "Collaborators can be added after accepting and before delivery");
  if (input.creatorId === e.creatorId) return new CollabError("SELF", "You're already the lead on this job");
  const active = activeCollaborators(e);
  if (active.some((c) => c.creatorId === input.creatorId)) return new CollabError("DUPLICATE", "This creator is already on the team");
  if (active.length >= MAX_COLLABORATORS) return new CollabError("LIMIT", `A team can have at most ${MAX_COLLABORATORS} collaborators`);
  const committed = active.reduce((sum, c) => sum + c.sharePct, 0);
  if (!Number.isFinite(input.sharePct) || input.sharePct < MIN_SHARE || committed + input.sharePct > MAX_TOTAL_SHARE) {
    return new CollabError("SHARE", `Shares must be at least ${MIN_SHARE}% and total at most ${MAX_TOTAL_SHARE}% (${MAX_TOTAL_SHARE - committed}% left)`);
  }
  const collaborator: Collaborator = {
    creatorId: input.creatorId,
    role: input.role,
    sharePct: Math.round(input.sharePct),
    status: "invited",
    invitedAt: now.toISOString(),
  };
  // A previously declined invite is replaced, not duplicated.
  const others = collaboratorsOf(e).filter((c) => c.creatorId !== input.creatorId);
  return {
    ...e,
    collaborators: [...others, collaborator],
    events: [...e.events, { at: now.toISOString(), actor: "creator", type: "note", note: `Invited a collaborator for ${input.role} (${collaborator.sharePct}%)` }],
  };
}

export function respondToCollaboration(e: Engagement, creatorId: string, accept: boolean, now = new Date()): Engagement | CollabError {
  const invite = collaboratorsOf(e).find((c) => c.creatorId === creatorId && c.status === "invited");
  if (!invite) return new CollabError("NOT_FOUND", "No pending team invite for this creator");
  return {
    ...e,
    collaborators: collaboratorsOf(e).map((c) => (c === invite ? { ...c, status: accept ? "accepted" : "declined" } : c)),
    events: [
      ...e.events,
      { at: now.toISOString(), actor: "creator", type: "note", note: `${accept ? "Joined" : "Declined to join"} the team for ${invite.role}` },
    ],
  };
}
