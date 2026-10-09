import { describe, expect, it } from "vitest";
import {
  activeCollaborators,
  canInviteCollaborators,
  CollabError,
  inviteCollaborator,
  leadShare,
  pendingCollaborators,
  respondToCollaboration,
} from "@/lib/collaboration";
import { createEngagement } from "@/lib/engagement";
import type { Engagement, EngagementStatus } from "@/lib/types";

const now = new Date("2026-10-09T10:00:00Z");
const at = (status: EngagementStatus): Engagement => ({ ...createEngagement("e1", "b1", "c1", now), status });

function ok(r: Engagement | CollabError): Engagement {
  if (r instanceof CollabError) throw r;
  return r;
}
const code = (r: Engagement | CollabError) => (r as CollabError).code;

describe("collaboration", () => {
  it("only allows teams after acceptance and before delivery", () => {
    for (const s of ["accepted", "in_progress", "revision_requested"] as const) expect(canInviteCollaborators(at(s))).toBe(true);
    for (const s of ["invited", "in_review", "delivered", "declined", "cancelled"] as const) {
      expect(canInviteCollaborators(at(s))).toBe(false);
      expect(code(inviteCollaborator(at(s), { creatorId: "c2", role: "Music", sharePct: 20 }))).toBe("CLOSED");
    }
  });

  it("invites, accepts and splits the fee", () => {
    let e = ok(inviteCollaborator(at("in_progress"), { creatorId: "c2", role: "Sound design", sharePct: 25 }, now));
    expect(pendingCollaborators(e)).toHaveLength(1);
    expect(leadShare(e)).toBe(100); // pending invites don't reduce the lead's share yet
    expect(e.events.at(-1)?.note).toMatch(/Sound design \(25%\)/);
    e = ok(respondToCollaboration(e, "c2", true, now));
    expect(e.collaborators?.[0].status).toBe("accepted");
    expect(leadShare(e)).toBe(75);
    expect(e.events.at(-1)?.note).toMatch(/Joined/);
  });

  it("rejects self, duplicates, too many collaborators and bad shares", () => {
    const base = at("accepted");
    expect(code(inviteCollaborator(base, { creatorId: "c1", role: "Music", sharePct: 10 }))).toBe("SELF");
    let e = ok(inviteCollaborator(base, { creatorId: "c2", role: "Music", sharePct: 10 }));
    expect(code(inviteCollaborator(e, { creatorId: "c2", role: "Animation", sharePct: 10 }))).toBe("DUPLICATE");
    expect(code(inviteCollaborator(e, { creatorId: "c3", role: "Animation", sharePct: 2 }))).toBe("SHARE");
    expect(code(inviteCollaborator(e, { creatorId: "c3", role: "Animation", sharePct: 55 }))).toBe("SHARE");
    expect(code(inviteCollaborator(e, { creatorId: "c3", role: "Animation", sharePct: Number.NaN }))).toBe("SHARE");
    e = ok(inviteCollaborator(e, { creatorId: "c3", role: "Animation", sharePct: 10 }));
    e = ok(inviteCollaborator(e, { creatorId: "c4", role: "Voice & lip-sync", sharePct: 10 }));
    expect(code(inviteCollaborator(e, { creatorId: "c5", role: "Music", sharePct: 10 }))).toBe("LIMIT");
  });

  it("frees the slot and share when an invite is declined, and allows re-inviting", () => {
    let e = ok(inviteCollaborator(at("accepted"), { creatorId: "c2", role: "Music", sharePct: 60 }));
    e = ok(respondToCollaboration(e, "c2", false, now));
    expect(activeCollaborators(e)).toHaveLength(0);
    e = ok(inviteCollaborator(e, { creatorId: "c2", role: "Animation", sharePct: 30 }));
    expect(e.collaborators).toHaveLength(1);
    expect(e.collaborators?.[0]).toMatchObject({ role: "Animation", status: "invited" });
  });

  it("can't respond to an invite that doesn't exist or was already answered", () => {
    let e = ok(inviteCollaborator(at("accepted"), { creatorId: "c2", role: "Music", sharePct: 20 }));
    expect(code(respondToCollaboration(e, "c9", true))).toBe("NOT_FOUND");
    e = ok(respondToCollaboration(e, "c2", true));
    expect(code(respondToCollaboration(e, "c2", false))).toBe("NOT_FOUND");
  });

  it("handles engagements saved before collaborators existed", () => {
    const legacy = at("accepted");
    delete legacy.collaborators;
    expect(activeCollaborators(legacy)).toEqual([]);
    expect(leadShare(legacy)).toBe(100);
  });
});
