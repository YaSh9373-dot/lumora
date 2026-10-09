import { describe, expect, it } from "vitest";
import { getBriefCompleteness, isDeliverableComplete } from "@/lib/completeness";
import type { BriefDraft } from "@/lib/types";
import { brief } from "./helpers";

const empty = {
  title: "",
  brandName: "",
  idea: "",
  objective: "",
  audience: "",
  deliverables: [],
  moods: [],
  palette: [],
  references: [],
  avoid: "",
  requiredSkills: [],
  preferredToolIds: [],
  commercial: {
    usageTypes: [],
    platforms: [],
    territory: "",
    licenseDuration: "",
    exclusivity: "none",
    ownership: "license",
    aiDisclosureRequired: false,
    watermarkFree: false,
    derivativeRights: false,
    commerciallySafeToolsOnly: false,
  },
  budget: { min: 0, max: 0, currency: "USD" },
  deadline: "",
  revisionRounds: 2,
} as unknown as BriefDraft;

describe("getBriefCompleteness", () => {
  it("empty brief is 0% and cannot publish", () => {
    const c = getBriefCompleteness(empty);
    expect(c.percent).toBe(0);
    expect(c.canPublish).toBe(false);
    expect(c.missing).toHaveLength(13);
  });

  it("fully filled sample brief is 100% and publishable", () => {
    const c = getBriefCompleteness(brief());
    expect(c.percent).toBe(100);
    expect(c.missing).toEqual([]);
    expect(c.canPublish).toBe(true);
  });

  it("blocks publishing when a required field is missing even above 80%", () => {
    const c = getBriefCompleteness({ ...brief(), deadline: "" });
    expect(c.percent).toBeGreaterThanOrEqual(80);
    expect(c.canPublish).toBe(false);
    expect(c.missing.map((m) => m.field)).toEqual(["deadline"]);
  });

  it("blocks publishing below 80% even with required fields present", () => {
    const c = getBriefCompleteness({ ...brief(), brandName: "", idea: "", audience: "", moods: [], requiredSkills: [] });
    expect(c.percent).toBeLessThan(80);
    expect(c.canPublish).toBe(false);
  });

  it("requires durations on timed deliverables and a valid budget", () => {
    expect(isDeliverableComplete({ id: "a", contentType: "video", quantity: 1, aspectRatio: "9:16", resolution: "1080p" })).toBe(false);
    expect(isDeliverableComplete({ id: "a", contentType: "image", quantity: 1, aspectRatio: "1:1", resolution: "4K" })).toBe(true);
    expect(getBriefCompleteness({ ...brief(), budget: { min: 500, max: 100, currency: "USD" } }).canPublish).toBe(false);
  });
});
