"use client";

import { useMemo, useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { SAMPLE_BRIEFS } from "@/data/briefs";
import { CREATORS } from "@/data/creators";
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
          },
          createEngagement("eng-sample-3", neon.id, "c1", at(10)),
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
