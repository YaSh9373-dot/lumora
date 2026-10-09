import { describe, expect, it } from "vitest";
import { generateFallbackBrief } from "@/lib/fallback-brief";
import { briefDraftSchema, briefInputSchema, sanitizeBriefDraft } from "@/lib/schemas";

const base = generateFallbackBrief("A 15s instagram reel for a sneaker launch", new Date("2026-10-09"));

describe("schemas", () => {
  it("validates idea length and trims", () => {
    expect(briefInputSchema.safeParse({ idea: "short" }).success).toBe(false);
    expect(briefInputSchema.safeParse({ idea: "x".repeat(601) }).success).toBe(false);
    expect(briefInputSchema.safeParse({ idea: "  a valid idea here  " }).data?.idea).toBe("a valid idea here");
  });

  it("sanitizes untrusted AI output: drops unknown enums, clamps numbers, caps arrays", () => {
    const out = sanitizeBriefDraft(
      {
        title: "  Big Launch  ",
        objective: "world-domination",
        moods: ["cinematic", "spooky", "cinematic", "luxury", "dreamy", "gritty", "playful", "surreal"],
        requiredSkills: ["Lip-Sync", "Juggling"],
        preferredToolIds: ["runway", "photoshop-9000"],
        deliverables: [
          { contentType: "video", quantity: 999, aspectRatio: "3:2", durationSec: -5, resolution: "8K" },
          { contentType: "hologram" },
          "nope",
          { contentType: "image", quantity: 2, aspectRatio: "4:5", resolution: "Print" },
        ],
        palette: ["#123456", "red", 42],
        commercial: { usageTypes: ["paid-ads", "everything"], territory: "Mars", ownership: "full-buyout", watermarkFree: "yes" },
        budget: { min: 5000, max: 100, currency: "EUR" },
        revisionRounds: 99,
        deadline: "2026-12-01T00:00:00Z",
      },
      base,
    );
    expect(out.title).toBe("Big Launch");
    expect(out.objective).toBe(base.objective);
    expect(out.moods).toEqual(["cinematic", "luxury", "dreamy", "gritty", "playful", "surreal"]);
    expect(out.requiredSkills).toEqual(["Lip-Sync"]);
    expect(out.preferredToolIds).toEqual(["runway"]);
    expect(out.deliverables).toEqual([
      { id: "d1", contentType: "video", quantity: 50, aspectRatio: "16:9", resolution: "1080p", durationSec: 1 },
      { id: "d2", contentType: "image", quantity: 2, aspectRatio: "4:5", resolution: "Print" },
    ]);
    expect(out.palette).toEqual(["#123456"]);
    expect(out.commercial.usageTypes).toEqual(["paid-ads"]);
    expect(out.commercial.territory).toBe(base.commercial.territory);
    expect(out.commercial.ownership).toBe("full-buyout");
    expect(out.commercial.watermarkFree).toBe(base.commercial.watermarkFree);
    expect(out.budget).toEqual({ min: 5000, max: 5000, currency: base.budget.currency });
    expect(out.revisionRounds).toBe(5);
    expect(out.deadline).toBe("2026-12-01");
    expect(briefDraftSchema.safeParse(out).success).toBe(true);
  });

  it("falls back entirely for non-object input", () => {
    expect(sanitizeBriefDraft(null, base)).toEqual(base);
    expect(sanitizeBriefDraft({ deliverables: "x", palette: "y" }, base)).toEqual(base);
  });
});
