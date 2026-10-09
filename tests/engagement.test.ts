import { describe, expect, it } from "vitest";
import { allowedTransitions, createEngagement, transition, TransitionError } from "@/lib/engagement";
import type { Engagement, EngagementStatus, Role } from "@/lib/types";

const now = new Date("2026-10-09T10:00:00Z");
const opts = { revisionRounds: 2, now };
const at = (status: EngagementStatus, revisionsUsed = 0): Engagement => ({
  ...createEngagement("e1", "b1", "c1", now),
  status,
  revisionsUsed,
});

function ok(r: Engagement | TransitionError): Engagement {
  if (r instanceof TransitionError) throw r;
  return r;
}

const ALLOWED: [EngagementStatus, EngagementStatus, Role][] = [
  ["invited", "accepted", "creator"],
  ["invited", "declined", "creator"],
  ["invited", "cancelled", "brand"],
  ["accepted", "in_progress", "creator"],
  ["in_progress", "in_review", "creator"],
  ["in_review", "delivered", "brand"],
  ["in_review", "revision_requested", "brand"],
  ["revision_requested", "in_review", "creator"],
];
const ALL: EngagementStatus[] = ["invited", "accepted", "declined", "in_progress", "in_review", "revision_requested", "delivered", "cancelled"];

describe("engagement state machine", () => {
  it.each(ALLOWED)("%s → %s by %s is allowed", (from, to, actor) => {
    const r = ok(transition(at(from), to, actor, { ...opts, note: "hi" }));
    expect(r.status).toBe(to);
    expect(r.events.at(-1)).toEqual({ at: now.toISOString(), actor, type: to, note: "hi" });
  });

  it.each(ALLOWED)("%s → %s by the wrong role is forbidden", (from, to, actor) => {
    const r = transition(at(from), to, actor === "brand" ? "creator" : "brand", opts);
    expect(r).toBeInstanceOf(TransitionError);
    expect((r as TransitionError).code).toBe("FORBIDDEN_ROLE");
  });

  it("rejects every transition not in the map", () => {
    const allowed = new Set(ALLOWED.map(([f, t]) => `${f}>${t}`));
    for (const from of ALL)
      for (const to of ALL) {
        if (allowed.has(`${from}>${to}`)) continue;
        for (const role of ["brand", "creator"] as Role[]) {
          expect((transition(at(from), to, role, opts) as TransitionError).code, `${from}>${to}`).toBe("INVALID_TRANSITION");
        }
      }
  });

  it("increments revisions and enforces the limit", () => {
    let e = at("in_review");
    e = ok(transition(e, "revision_requested", "brand", opts));
    expect(e.revisionsUsed).toBe(1);
    e = ok(transition(e, "in_review", "creator", opts));
    e = ok(transition(e, "revision_requested", "brand", opts));
    e = ok(transition(e, "in_review", "creator", opts));
    const r = transition(e, "revision_requested", "brand", opts);
    expect(r).toBeInstanceOf(TransitionError);
    expect((r as TransitionError).code).toBe("REVISION_LIMIT");
    expect((r as TransitionError).message).toBe("Revision limit reached");
  });

  it("lists allowed actions per role", () => {
    expect(allowedTransitions(at("invited"), "creator").sort()).toEqual(["accepted", "declined"]);
    expect(allowedTransitions(at("invited"), "brand")).toEqual(["cancelled"]);
    expect(allowedTransitions(at("delivered"), "brand")).toEqual([]);
  });

  it("does not mutate the original engagement", () => {
    const e = at("invited");
    ok(transition(e, "accepted", "creator", opts));
    expect(e.status).toBe("invited");
    expect(e.events).toHaveLength(1);
  });
});
