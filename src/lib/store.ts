"use client";

import { useMemo, useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { SAMPLE_BRIEFS } from "@/data/briefs";
import { CREATORS } from "@/data/creators";
import { CollabError, inviteCollaborator, respondToCollaboration, type CollabInput } from "./collaboration";
import { createEngagement, transition, TransitionError } from "./engagement";
import { uid } from "./format";
import type { Brief, Creator, Engagement, EngagementStatus, Role } from "./types";

interface DemoState {
  briefs: Brief[];
  engagements: Engagement[];
  shortlist: string[];
  userCreator: Creator | null;
  role: Role;
  activeBriefId: string | null;

  saveBrief: (brief: Brief) => void;
  deleteBrief: (id: string) => void;
  setActiveBrief: (id: string | null) => void;
  invite: (briefId: string, creatorId: string, note?: string) => Engagement | null;
  /** Returns an error message, or null on success. */
  advance: (engagementId: string, to: EngagementStatus, note?: string, actor?: Role) => string | null;
  simulateAccept: () => string | null;
  /** Lead creator invites another creator onto the job. Returns an error message or null. */
  inviteCollaborator: (engagementId: string, input: CollabInput) => string | null;
  /** An invited collaborator accepts or declines. Returns an error message or null. */
  respondCollaboration: (engagementId: string, creatorId: string, accept: boolean) => string | null;
  toggleShortlist: (creatorId: string) => void;
  setUserCreator: (creator: Creator | null) => void;
  setRole: (role: Role) => void;
  loadSampleData: () => void;
  resetDemo: () => void;
}

const INITIAL = {
  briefs: [] as Brief[],
  engagements: [] as Engagement[],
  shortlist: [] as string[],
  userCreator: null as Creator | null,
  role: "brand" as Role,
  activeBriefId: null as string | null,
};

function revisionRoundsFor(briefId: string, briefs: Brief[]): number {
  return [...briefs, ...SAMPLE_BRIEFS].find((b) => b.id === briefId)?.revisionRounds ?? 2;
}

export const useDemoStore = create<DemoState>()(
  persist(
    (set, get) => ({
      ...INITIAL,

      saveBrief: (brief) =>
        set((s) => ({
          briefs: s.briefs.some((b) => b.id === brief.id) ? s.briefs.map((b) => (b.id === brief.id ? brief : b)) : [brief, ...s.briefs],
        })),

      deleteBrief: (id) => set((s) => ({ briefs: s.briefs.filter((b) => b.id !== id) })),

      setActiveBrief: (id) => set({ activeBriefId: id }),

      invite: (briefId, creatorId, note) => {
        const existing = get().engagements.find(
          (e) => e.briefId === briefId && e.creatorId === creatorId && !["declined", "cancelled"].includes(e.status),
        );
        if (existing) return null;
        const engagement = createEngagement(uid("eng"), briefId, creatorId, new Date(), note);
        set((s) => ({ engagements: [engagement, ...s.engagements] }));
        return engagement;
      },

      advance: (engagementId, to, note, actor) => {
        const { engagements, briefs, role } = get();
        const current = engagements.find((e) => e.id === engagementId);
        if (!current) return "Engagement not found";
        const next = transition(current, to, actor ?? role, { note, revisionRounds: revisionRoundsFor(current.briefId, briefs) });
        if (next instanceof TransitionError) return next.message;
        set({ engagements: engagements.map((e) => (e.id === engagementId ? next : e)) });
        return null;
      },

      simulateAccept: () => {
        const latest = get().engagements.find((e) => e.status === "invited");
        if (!latest) return "No pending invites. Invite a creator from a brief first.";
        return get().advance(latest.id, "accepted", "Excited to work on this!", "creator");
      },

      inviteCollaborator: (engagementId, input) => {
        const current = get().engagements.find((e) => e.id === engagementId);
        if (!current) return "Engagement not found";
        const next = inviteCollaborator(current, input);
        if (next instanceof CollabError) return next.message;
        set((st) => ({ engagements: st.engagements.map((e) => (e.id === engagementId ? next : e)) }));
        return null;
      },

      respondCollaboration: (engagementId, creatorId, accept) => {
        const current = get().engagements.find((e) => e.id === engagementId);
        if (!current) return "Engagement not found";
        const next = respondToCollaboration(current, creatorId, accept);
        if (next instanceof CollabError) return next.message;
        set((st) => ({ engagements: st.engagements.map((e) => (e.id === engagementId ? next : e)) }));
        return null;
      },

      toggleShortlist: (creatorId) =>
        set((s) => ({
          shortlist: s.shortlist.includes(creatorId) ? s.shortlist.filter((id) => id !== creatorId) : [...s.shortlist, creatorId],
        })),

      setUserCreator: (creator) => set({ userCreator: creator }),

      setRole: (role) => set({ role }),

      loadSampleData: () => {
        const now = Date.now();
        const at = (h: number) => new Date(now - h * 3_600_000);
        const [neon, brew] = SAMPLE_BRIEFS;
        const samples: Engagement[] = [
          createEngagement("eng-sample-1", neon.id, "c2", at(30), "Loved your Glow Serum spot. Keen to work together?"),
          {
            ...createEngagement("eng-sample-2", brew.id, "c3", at(72)),
            status: "in_review",
            events: [
              { at: at(72).toISOString(), actor: "brand", type: "invited" },
              { at: at(70).toISOString(), actor: "creator", type: "accepted" },
              { at: at(48).toISOString(), actor: "creator", type: "in_progress" },
              { at: at(5).toISOString(), actor: "creator", type: "in_review", note: "First cut + 4 posters: drive.example/brew-v1" },
            ],
            collaborators: [{ creatorId: "c8", role: "Animation", sharePct: 30, status: "accepted", invitedAt: at(66).toISOString() }],
          },
          createEngagement("eng-sample-3", neon.id, "c1", at(10)),
          {
            ...createEngagement("eng-sample-4", brew.id, "c5", at(60)),
            status: "in_progress",
            events: [
              { at: at(60).toISOString(), actor: "brand", type: "invited" },
              { at: at(58).toISOString(), actor: "creator", type: "accepted" },
              { at: at(40).toISOString(), actor: "creator", type: "in_progress" },
              { at: at(3).toISOString(), actor: "creator", type: "note", note: "Invited a collaborator for Voice & lip-sync (20%)" },
            ],
            collaborators: [{ creatorId: "c2", role: "Voice & lip-sync", sharePct: 20, status: "invited", invitedAt: at(3).toISOString() }],
          },
        ];
        set((s) => ({
          engagements: [...samples.filter((x) => !s.engagements.some((e) => e.id === x.id)), ...s.engagements],
        }));
      },

      resetDemo: () => set({ ...INITIAL }),
    }),
    // skipHydration: SSR and first client render use defaults; StoreHydrator rehydrates after mount.
    { name: "lumora-demo", version: 1, skipHydration: true },
  ),
);

const subscribeHydration = (cb: () => void) => useDemoStore.persist.onFinishHydration(cb);

/** False until persisted demo data has loaded from localStorage. Gate persisted UI on it. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribeHydration,
    () => useDemoStore.persist.hasHydrated(),
    () => false,
  );
}

export function useAllCreators(): Creator[] {
  const userCreator = useDemoStore((s) => s.userCreator);
  return useMemo(() => (userCreator ? [userCreator, ...CREATORS] : CREATORS), [userCreator]);
}

export function useAllBriefs(): Brief[] {
  const briefs = useDemoStore((s) => s.briefs);
  return useMemo(() => [...briefs, ...SAMPLE_BRIEFS], [briefs]);
}
