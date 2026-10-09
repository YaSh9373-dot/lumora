import { describe, expect, it } from "vitest";
import { CREATORS } from "@/data/creators";
import { SAMPLE_BRIEFS } from "@/data/briefs";
import { budgetFit, COMMERCIAL_SAFE_PENALTY, rankCreatorsForBrief, scoreCreatorForBrief } from "@/lib/matching";
import { brief, bySlug, creator } from "./helpers";

describe("scoreCreatorForBrief", () => {
  it("gives a near-perfect score to an ideal match", () => {
    const b = brief({
      requiredSkills: ["Image-to-Video", "Color Grading"],
      preferredToolIds: ["runway", "kling"],
      moods: ["cinematic"],
      objective: "awareness",
      deliverables: [{ id: "d", contentType: "video", quantity: 1, aspectRatio: "16:9", durationSec: 30, resolution: "4K" }],
      budget: { min: 50000, max: 100000, currency: "INR" },
    });
    const r = scoreCreatorForBrief(bySlug("aarav-mehta"), b);
    expect(r.score).toBeGreaterThanOrEqual(95);
    expect(r.reasons.missing).toEqual([]);
    expect(r.reasons.matched).toEqual(expect.arrayContaining(["Runway", "Image-to-Video", "Video"]));
  });

  it("missing skills lower the score and are listed", () => {
    const base = scoreCreatorForBrief(bySlug("aarav-mehta"), brief({ requiredSkills: ["Image-to-Video"] }));
    const r = scoreCreatorForBrief(bySlug("aarav-mehta"), brief({ requiredSkills: ["Image-to-Video", "Lip-Sync"] }));
    expect(r.score).toBeLessThan(base.score);
    expect(r.reasons.missing).toContain("Lip-Sync");
  });

  it("tapers budget fit to zero at 2x the max", () => {
    expect(budgetFit(100, 100)).toBe(1);
    expect(budgetFit(150, 100)).toBeCloseTo(0.5);
    expect(budgetFit(250, 100)).toBe(0);
    expect(budgetFit(10, 0)).toBe(1);
    const fits = scoreCreatorForBrief(bySlug("noah-williams"), brief({ budget: { min: 0, max: 1500, currency: "USD" } }));
    const over = scoreCreatorForBrief(bySlug("noah-williams"), brief({ budget: { min: 0, max: 500, currency: "USD" } }));
    expect(fits.breakdown.budget.score).toBe(10);
    expect(over.breakdown.budget.score).toBe(0);
    expect(over.reasons.notes.join(" ")).toMatch(/above budget/);
  });

  it("applies the commercial-safe penalty with a note", () => {
    const zoya = bySlug("zoya-khan");
    const b = brief();
    const off = scoreCreatorForBrief(zoya, b);
    const on = scoreCreatorForBrief(zoya, brief({ commercial: { ...b.commercial, commerciallySafeToolsOnly: true } }));
    expect(off.score - on.score).toBe(COMMERCIAL_SAFE_PENALTY);
    expect(on.reasons.notes).toContain("Uses tools not flagged commercial-safe");
  });

  it("caps the verification bonus at 5 and total at 0–100", () => {
    for (const c of CREATORS) {
      const r = scoreCreatorForBrief(c, SAMPLE_BRIEFS[0]);
      expect(r.breakdown.verification.score).toBeLessThanOrEqual(5);
      expect(r.score).toBeLessThanOrEqual(100);
      expect(r.score).toBeGreaterThanOrEqual(0);
    }
    const low = creator({ identityVerified: false, tools: [], portfolio: [] });
    expect(scoreCreatorForBrief(low, brief()).breakdown.verification.score).toBe(0);
  });

  it("gives full marks for empty requirement lists and flags commercial gaps", () => {
    const b = brief({ requiredSkills: [], preferredToolIds: [], moods: [] });
    const r = scoreCreatorForBrief(bySlug("noah-williams"), {
      ...b,
      commercial: { ...b.commercial, usageTypes: ["paid-ads"], ownership: "full-buyout" },
    });
    expect(r.breakdown.skills.score).toBe(25);
    expect(r.breakdown.tools.score).toBe(15);
    expect(r.reasons.notes).toEqual(expect.arrayContaining(["Doesn't license all requested usage types", "No full buyout offered"]));
  });
});

describe("rankCreatorsForBrief", () => {
  it("sorts by score, then trust score", () => {
    const ranked = rankCreatorsForBrief(CREATORS, SAMPLE_BRIEFS[0]);
    for (let i = 1; i < ranked.length; i++) {
      const [a, b] = [ranked[i - 1], ranked[i]];
      expect(a.match.score > b.match.score || (a.match.score === b.match.score && a.trust >= b.trust)).toBe(true);
    }
  });

  it("breaks score ties by trust", () => {
    const a = creator({ id: "a", identityVerified: false });
    const b = creator({ id: "b", identityVerified: true });
    const ranked = rankCreatorsForBrief([a, b], brief({ requiredSkills: [], preferredToolIds: [], moods: [] }));
    expect(ranked[0].creator.id).toBe("b");
  });

  it("puts a sensible creator on top of the café sample brief", () => {
    expect(rankCreatorsForBrief(CREATORS, SAMPLE_BRIEFS[1])[0].creator.slug).toBe("maya-chen");
  });
});
