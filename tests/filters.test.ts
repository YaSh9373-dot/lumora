import { describe, expect, it } from "vitest";
import { CREATORS } from "@/data/creators";
import {
  countActiveFilters,
  EMPTY_FILTERS,
  filterCreators,
  filterWorks,
  parseDiscoverParams,
  serializeDiscoverState,
  sortCreators,
  type CreatorFilters,
  type DiscoverState,
} from "@/lib/filters";
import { getTrustScore, isCommercialSafe } from "@/lib/verification";
import { creator } from "./helpers";

const f = (o: Partial<CreatorFilters>): CreatorFilters => ({ ...EMPTY_FILTERS, ...o });
const names = (cs: { name: string }[]) => cs.map((c) => c.name);

describe("filterCreators", () => {
  it("returns everyone with no filters", () => {
    expect(filterCreators(CREATORS, EMPTY_FILTERS).results).toHaveLength(10);
  });

  it("matches all query tokens across fields, case and accent insensitive", () => {
    expect(names(filterCreators(CREATORS, EMPTY_FILTERS, "MAYA lora").results)).toEqual(["Maya Chen"]);
    expect(filterCreators(CREATORS, EMPTY_FILTERS, "maya runway").results).toHaveLength(0);
    const cafe = creator({ id: "x", name: "Café Rossi" });
    expect(filterCreators([cafe], EMPTY_FILTERS, "cafe").results).toHaveLength(1);
    expect(names(filterCreators(CREATORS, EMPTY_FILTERS, "dream machine").results)).toEqual(["Omar Haddad"]);
  });

  it("ORs within tools", () => {
    const res = filterCreators(CREATORS, f({ tools: ["sora", "blender"] })).results;
    expect(names(res).sort()).toEqual(["Kenji Watanabe", "Noah Williams", "Omar Haddad", "Sofia Rossi"]);
  });

  it("ANDs skills (must have all)", () => {
    const res = filterCreators(CREATORS, f({ skills: ["LoRA Training", "Character Consistency"] })).results;
    expect(names(res).sort()).toEqual(["Kenji Watanabe", "Maya Chen"]);
    expect(filterCreators(CREATORS, f({ skills: ["LoRA Training", "Lip-Sync"] })).results).toHaveLength(0);
  });

  it("ANDs across groups", () => {
    const res = filterCreators(CREATORS, f({ tools: ["kling"], specializations: ["Product Ads"], contentTypes: ["video"] })).results;
    expect(names(res)).toEqual(["Zoya Khan"]);
  });

  it("filters budget in USD using the demo FX rate", () => {
    // ₹25,000 ≈ $294
    expect(names(filterCreators(CREATORS, f({ budget: [0, 300] })).results)).toEqual(["Ananya Iyer"]);
    expect(names(filterCreators(CREATORS, f({ budget: [1400, 2000] })).results)).toEqual(["Noah Williams"]);
  });

  it("filters turnaround, availability, verified and commercial-safe", () => {
    expect(names(filterCreators(CREATORS, f({ turnaround: 3 })).results)).toEqual(["Zoya Khan"]);
    expect(names(filterCreators(CREATORS, f({ availability: ["booked"] })).results)).toEqual(["Omar Haddad"]);
    const verified = filterCreators(CREATORS, f({ verifiedOnly: true })).results;
    expect(verified.length).toBeGreaterThan(0);
    for (const c of verified) expect(getTrustScore(c)).toBeGreaterThanOrEqual(70);
    const safe = filterCreators(CREATORS, f({ commercialSafeOnly: true })).results;
    expect(safe.length).toBeGreaterThan(0);
    for (const c of safe) expect(isCommercialSafe(c)).toBe(true);
  });

  it("computes facet counts ignoring the facet's own group", () => {
    const { facets } = filterCreators(CREATORS, f({ tools: ["kling"] }));
    // Tool counts ignore the tools filter, so other tools still show counts
    expect(facets.tools.runway).toBe(3);
    // Other groups are narrowed by the kling filter (Aarav, Zoya, Ananya)
    expect(facets.contentTypes.video).toBe(3);
    expect(facets.specializations["Product Ads"]).toBe(1);
  });

  it("returns empty results gracefully", () => {
    expect(filterCreators(CREATORS, f({ formats: ["21:9"] }), "zzz").results).toEqual([]);
  });

  it("counts active filters", () => {
    expect(countActiveFilters(EMPTY_FILTERS)).toBe(0);
    expect(countActiveFilters(f({ tools: ["a", "b"], verifiedOnly: true, budget: [0, 1], turnaround: 7, commercialSafeOnly: true }))).toBe(6);
  });
});

describe("filterWorks", () => {
  it("filters pieces by their own aspect ratio", () => {
    const { results } = filterWorks(CREATORS, f({ formats: ["21:9"] }));
    expect(results.length).toBeGreaterThan(0);
    for (const r of results) expect(r.piece.aspectRatio).toBe("21:9");
  });

  it("matches piece titles in search", () => {
    expect(filterWorks(CREATORS, EMPTY_FILTERS, "paper fox").results.map((r) => r.piece.id)).toEqual(["maya-1"]);
  });
});

describe("sortCreators", () => {
  it("sorts by price, turnaround, rating, verified and match", () => {
    expect(sortCreators(CREATORS, "price")[0].name).toBe("Ananya Iyer");
    expect(sortCreators(CREATORS, "turnaround")[0].name).toBe("Zoya Khan");
    expect(sortCreators(CREATORS, "rating")[0].rating).toBe(4.9);
    expect(sortCreators(CREATORS, "verified")[0].name).toBe("Aarav Mehta");
    expect(sortCreators(CREATORS, "match", new Map([["c9", 99]]))[0].name).toBe("Ananya Iyer");
    expect(sortCreators(CREATORS, "match")[0].rating).toBe(4.9);
  });

  it("does not mutate the input", () => {
    const copy = [...CREATORS];
    sortCreators(CREATORS, "price");
    expect(CREATORS).toEqual(copy);
  });
});

describe("URL state", () => {
  it("round-trips filters, query, sort, view and brief", () => {
    const state: DiscoverState = {
      filters: f({ tools: ["kling", "veo"], skills: ["Lip-Sync"], budget: [100, 900], turnaround: 7, verifiedOnly: true, commercialSafeOnly: true }),
      query: "neon",
      sort: "price",
      view: "works",
      briefId: "b1",
    };
    expect(parseDiscoverParams(new URLSearchParams(serializeDiscoverState(state)))).toEqual(state);
  });

  it("defaults sort to match when a brief is selected, and ignores junk", () => {
    expect(parseDiscoverParams(new URLSearchParams("brief=x")).sort).toBe("match");
    const p = parseDiscoverParams(new URLSearchParams("sort=bogus&ta=abc&budget=1"));
    expect(p.sort).toBe("rating");
    expect(p.filters.turnaround).toBeNull();
    expect(p.filters.budget).toBeNull();
    expect(serializeDiscoverState({ filters: EMPTY_FILTERS, query: "", sort: "rating", view: "creators", briefId: null })).toBe("");
  });
});
