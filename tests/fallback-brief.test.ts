import { describe, expect, it } from "vitest";
import { generateFallbackBrief, parseBudget, parseDuration } from "@/lib/fallback-brief";
import { briefDraftSchema } from "@/lib/schemas";
import { getBriefCompleteness } from "@/lib/completeness";

const today = new Date("2026-10-09T00:00:00Z");
const gen = (idea: string) => generateFallbackBrief(idea, today);

describe("generateFallbackBrief", () => {
  it("Instagram reel → 9:16 15s video with Instagram platform", () => {
    const b = gen("A fun instagram reel for our new energy drink");
    expect(b.deliverables[0]).toMatchObject({ contentType: "video", aspectRatio: "9:16", durationSec: 15 });
    expect(b.commercial.platforms).toContain("Instagram");
  });

  it("picks 4K only for explicit 4K / TV / cinema, not 'cinematic'", () => {
    expect(gen("A cinematic 15s instagram reel").deliverables[0].resolution).toBe("1080p");
    expect(gen("A 30s TV spot in 4k").deliverables[0].resolution).toBe("4K");
  });

  it("detects explicit durations", () => {
    expect(gen("A 30 second youtube film about our heritage").deliverables[0]).toMatchObject({ aspectRatio: "16:9", durationSec: 30 });
    expect(gen("15s teaser for tiktok").deliverables[0].durationSec).toBe(15);
    expect(parseDuration("a 2 minute film")).toBe(120);
    expect(parseDuration("no duration")).toBeNull();
  });

  it("parses budgets and currencies", () => {
    expect(gen("Poster series for a Mumbai cafe, budget under 50k").budget).toEqual({ min: 25000, max: 50000, currency: "INR" });
    expect(gen("Product launch ad for our headphones, around $2000").budget).toEqual({ min: 1400, max: 2000, currency: "USD" });
    expect(parseBudget("₹1.5 lakh for a diwali film")).toEqual({ min: 105000, max: 150000, currency: "INR" });
    expect(parseBudget("a 15 second video")).toBeNull();
    expect(parseBudget("budget 3000 usd")?.currency).toBe("USD");
  });

  it("maps keywords to objective, moods, usage and type", () => {
    const launch = gen("Luxury product launch ad for a premium watch");
    expect(launch.objective).toBe("launch");
    expect(launch.moods).toContain("luxury");
    expect(launch.commercial.usageTypes).toContain("paid-ads");

    const cartoon = gen("A cartoon animated explainer for kids learning maths");
    expect(cartoon.deliverables.map((d) => d.contentType)).toContain("animation");
    expect(cartoon.moods).toContain("hand-drawn");
    expect(cartoon.objective).toBe("education");

    expect(gen("Three posters for a jazz night").deliverables[0]).toMatchObject({ contentType: "image", quantity: 3 });
  });

  it("respects buyout, exclusivity and commercially-safe hints", () => {
    const b = gen("Brand film with full buyout, exclusive rights and commercially safe tools only");
    expect(b.commercial.ownership).toBe("full-buyout");
    expect(b.commercial.licenseDuration).toBe("perpetual");
    expect(b.commercial.exclusivity).toBe("full");
    expect(b.commercial.commerciallySafeToolsOnly).toBe(true);
  });

  it("defaults deadline to today + 14 days and derives brand names", () => {
    expect(gen("something nice for our brand").deadline).toBe("2026-10-23");
    expect(gen("Launch teaser for Stride Lab sneakers on instagram").brandName).toBe("Stride Lab");
  });

  it.each([
    "asdkjh qwe zzz 123",
    "!!!!!!!!!!!!!!!!",
    "🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈",
    "a".repeat(600),
    "We need 99 videos and 40 posters, 9999 minutes, $0 budget, for Acme Corp in Dubai",
  ])("always returns a schema-valid, publishable brief for %j", (idea) => {
    const b = gen(idea);
    expect(briefDraftSchema.safeParse(b).success).toBe(true);
    expect(getBriefCompleteness(b).canPublish).toBe(true);
  });
});
