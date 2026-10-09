import { describe, expect, it } from "vitest";
import { getAuroraCoverStyle, hashString, seededRandom } from "@/lib/cover";
import { addDays, avatarUrl, convert, formatDuration, formatPrice, initials, normalizeText, slugify, toUSD, uid } from "@/lib/format";
import { createRateLimiter } from "@/lib/rate-limit";

describe("cover", () => {
  it("is deterministic for the same seed", () => {
    const p = ["#111111", "#222222", "#333333"];
    expect(getAuroraCoverStyle("abc", p)).toEqual(getAuroraCoverStyle("abc", p));
    expect(getAuroraCoverStyle("abc", [])).not.toEqual(getAuroraCoverStyle("abd", []));
    expect(hashString("x")).toBe(hashString("x"));
    const v = seededRandom(1)();
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThan(1);
  });

  it("uses all palette colors", () => {
    const s = getAuroraCoverStyle("seed", ["#AA0000", "#00AA00", "#0000AA"]);
    for (const c of ["#AA0000", "#00AA00", "#0000AA"]) expect(s.backgroundImage).toContain(c);
  });
});

describe("format", () => {
  it("handles text, money and time", () => {
    expect(normalizeText("  Café ")).toBe("cafe");
    expect(toUSD(8500, "INR")).toBe(100);
    expect(convert(100, "USD", "INR")).toBe(8500);
    expect(convert(8500, "INR", "USD")).toBe(100);
    expect(convert(5, "USD", "USD")).toBe(5);
    expect(formatPrice(60000, "INR")).toBe("₹60,000");
    expect(formatPrice(900, "USD")).toBe("$900");
    expect(formatDuration(62)).toBe("1:02");
    expect(formatDuration(15)).toBe("0:15");
    expect(formatDuration()).toBe("");
    expect(initials("Maya Chen")).toBe("MC");
    expect(slugify("Ünïcode Name!")).toBe("unicode-name");
    expect(addDays(new Date("2026-01-30T00:00:00Z"), 3)).toBe("2026-02-02");
    expect(avatarUrl("a b")).toContain("seed=a%20b");
    expect(uid("x")).toMatch(/^x-/);
  });
});

describe("rate limiter", () => {
  it("allows N per window then blocks, per key", () => {
    const allow = createRateLimiter(2, 1000);
    expect(allow("a", 0)).toBe(true);
    expect(allow("a", 1)).toBe(true);
    expect(allow("a", 2)).toBe(false);
    expect(allow("b", 2)).toBe(true);
    expect(allow("a", 1500)).toBe(true);
  });
});
