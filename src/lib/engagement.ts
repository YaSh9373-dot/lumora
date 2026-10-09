import type { Engagement, EngagementEvent, EngagementStatus, Role } from "./types";

type Actor = Role;

/** from → to → who may perform it */
const TRANSITIONS: Record<EngagementStatus, Partial<Record<EngagementStatus, Actor>>> = {
  invited: { accepted: "creator", declined: "creator", cancelled: "brand" },
  accepted: { in_progress: "creator" },
  in_progress: { in_review: "creator" },
  in_review: { delivered: "brand", revision_requested: "brand" },
  revision_requested: { in_review: "creator" },
  delivered: {},
  declined: {},
  cancelled: {},
};

export const TERMINAL: EngagementStatus[] = ["delivered", "declined", "cancelled"];

export const STATUS_LABELS: Record<EngagementStatus, string> = {
  invited: "Invited",
  accepted: "Accepted",
  declined: "Declined",
  in_progress: "In progress",
  in_review: "In review",
  revision_requested: "Revision requested",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

/** Label of the action that moves an engagement INTO this status. */
export const ACTION_LABELS: Record<EngagementStatus, string> = {
  invited: "Invite",
  accepted: "Accept",
  declined: "Decline",
  in_progress: "Start work",
  in_review: "Submit for review",
  revision_requested: "Request revision",
  delivered: "Approve & mark delivered",
  cancelled: "Cancel invite",
};

export type TransitionErrorCode = "INVALID_TRANSITION" | "FORBIDDEN_ROLE" | "REVISION_LIMIT";

export class TransitionError extends Error {
  constructor(
    public readonly code: TransitionErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "TransitionError";
  }
}

export interface TransitionOptions {
  note?: string;
  /** Revision rounds included in the brief. */
  revisionRounds: number;
  now?: Date;
}

export function allowedTransitions(engagement: Engagement, role: Role): EngagementStatus[] {
  const map = TRANSITIONS[engagement.status];
  return (Object.keys(map) as EngagementStatus[]).filter((to) => map[to] === role);
}

export function transition(
  engagement: Engagement,
  to: EngagementStatus,
  actor: Actor,
  { note, revisionRounds, now = new Date() }: TransitionOptions,
): Engagement | TransitionError {
  const who = TRANSITIONS[engagement.status][to];
  if (!who) {
    return new TransitionError(
      "INVALID_TRANSITION",
      `Can't move from ${STATUS_LABELS[engagement.status]} to ${STATUS_LABELS[to]}`,
    );
  }
  if (who !== actor) return new TransitionError("FORBIDDEN_ROLE", `Only the ${who} can do this`);

  let revisionsUsed = engagement.revisionsUsed;
  if (to === "revision_requested") {
    if (revisionsUsed + 1 > revisionRounds) return new TransitionError("REVISION_LIMIT", "Revision limit reached");
    revisionsUsed += 1;
  }

  const event: EngagementEvent = { at: now.toISOString(), actor, type: to, ...(note ? { note } : {}) };
  return { ...engagement, status: to, revisionsUsed, events: [...engagement.events, event] };
}

export function createEngagement(id: string, briefId: string, creatorId: string, now = new Date(), note?: string): Engagement {
  return {
    id,
    briefId,
    creatorId,
    status: "invited",
    revisionsUsed: 0,
    events: [{ at: now.toISOString(), actor: "brand", type: "invited", ...(note ? { note } : {}) }],
  };
}
