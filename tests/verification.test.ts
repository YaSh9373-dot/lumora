import { describe, expect, it } from "vitest";
import { CREATORS } from "@/data/creators";
import { commercialSafeRatio, getTrustScore, getVerificationSignals, isCommercialSafe } from "@/lib/verification";
import type { Creator, PortfolioPiece } from "@/lib/types";
import { bySlug, creator } from "./helpers";

const signal = (c: Creator, key: string) => getVerificationSignals(c).find((s) => s.key === key)!;

const step = { title: "s", detail: "d" };
const piece = (id: string, steps: number, clientVerified = false): PortfolioPiece => ({
  id,
  title: id,
  contentType: "image",
  aspectRatio: "1:1",
  year: 2025,
  palette: [],
  toolIds: [],
  clientVerified,
  commercialUseCleared: true,
  workflow: { summary: "", steps: Array(steps).fill(step), generations: 1, hoursSpent: 1, postProduction: [] },
});

describe("verification signals", () => {
  it("fully verified creator scores 100", () => {
    const c = creator({
      tools: [
        { toolId: "runway", level: 5, yearsUsing: 1, verified: true },
        { toolId: "veo", level: 5, yearsUsing: 1, verified: true },
      ],
      portfolio: [piece("a", 3, true), piece("b", 4, true), piece("c", 3, true), piece("d", 3, true)],
      identityVerified: true,
    });
    expect(getTrustScore(c)).toBe(100);
    expect(getVerificationSignals(c).every((s) => s.earned)).toBe(true);
  });

  it("tools badge needs ≥60% verified AND ≥2 tools", () => {
    const one = creator({ tools: [{ toolId: "runway", level: 5, yearsUsing: 1, verified: true }] });
    expect(signal(one, "tools").earned).toBe(false);
    const threeOfFive = creator({
      tools: ["runway", "veo", "kling", "sora", "pika"].map((toolId, i) => ({ toolId, level: 3 as const, yearsUsing: 1, verified: i < 3 })),
    });
    expect(signal(threeOfFive, "tools").earned).toBe(true);
    expect(signal(threeOfFive, "tools").points).toBeCloseTo(18);
  });

  it("workflow badge needs ≥50% of pieces with 3+ steps and ≥2 pieces", () => {
    expect(signal(creator({ portfolio: [piece("a", 3)] }), "workflow").earned).toBe(false);
    expect(signal(creator({ portfolio: [piece("a", 3), piece("b", 2)] }), "workflow").earned).toBe(true);
    expect(signal(creator({ portfolio: [piece("a", 2), piece("b", 2)] }), "workflow").earned).toBe(false);
  });

  it("past work badge needs ≥2 client-verified pieces, points cap at 4", () => {
    expect(signal(creator({ portfolio: [piece("a", 0, true)] }), "pastWork").earned).toBe(false);
    const many = creator({ portfolio: Array.from({ length: 6 }, (_, i) => piece(`p${i}`, 0, true)) });
    expect(signal(many, "pastWork").points).toBe(25);
  });

  it("creator with no portfolio and no tools gets only identity points", () => {
    expect(getTrustScore(creator({ portfolio: [], tools: [], identityVerified: true }))).toBe(15);
    expect(getTrustScore(creator({ portfolio: [], tools: [], identityVerified: false }))).toBe(0);
  });

  it("seed data spreads trust scores (90+, ~55, ~35)", () => {
    expect(getTrustScore(bySlug("aarav-mehta"))).toBeGreaterThanOrEqual(90);
    const noah = getTrustScore(bySlug("noah-williams"));
    expect(noah).toBeGreaterThanOrEqual(45);
    expect(noah).toBeLessThanOrEqual(65);
    expect(getTrustScore(bySlug("ananya-iyer"))).toBeLessThanOrEqual(40);
    for (const c of CREATORS) expect(getTrustScore(c)).toBeLessThanOrEqual(100);
  });

  it("commercial-safe rule is ≥70% of listed tools", () => {
    expect(isCommercialSafe(bySlug("lucas-ferreira"))).toBe(true);
    expect(isCommercialSafe(bySlug("zoya-khan"))).toBe(false);
    expect(commercialSafeRatio(creator({ tools: [] }))).toBe(0);
  });
});
