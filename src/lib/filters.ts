import { TOOL_MAP } from "@/data/tools";
import { VERIFIED_TRUST_THRESHOLD } from "./constants";
import { normalizeText, toUSD, tokenize } from "./format";
import type { AspectRatio, Availability, ContentType, Creator, PortfolioPiece } from "./types";
import { getTrustScore, isCommercialSafe } from "./verification";

export interface CreatorFilters {
  specializations: string[];
  tools: string[];
  skills: string[];
  contentTypes: ContentType[];
  formats: AspectRatio[];
  availability: Availability[];
  /** Inclusive range in USD, or null for any. */
  budget: [number, number] | null;
  /** Max turnaround in days, or null for any. */
  turnaround: number | null;
  verifiedOnly: boolean;
  commercialSafeOnly: boolean;
}

export const EMPTY_FILTERS: CreatorFilters = {
  specializations: [],
  tools: [],
  skills: [],
  contentTypes: [],
  formats: [],
  availability: [],
  budget: null,
  turnaround: null,
  verifiedOnly: false,
  commercialSafeOnly: false,
};

export const BUDGET_BOUNDS: [number, number] = [0, 2000];

export type FacetGroup = "specializations" | "tools" | "skills" | "contentTypes" | "formats" | "availability";
export const FACET_GROUPS: FacetGroup[] = ["specializations", "tools", "skills", "contentTypes", "formats", "availability"];
export type Facets = Record<FacetGroup, Record<string, number>>;

/** A creator, optionally narrowed to one portfolio piece (Works view). */
export interface Entry {
  creator: Creator;
  piece?: PortfolioPiece;
}

function valuesOf(entry: Entry, group: FacetGroup): string[] {
  const { creator: c, piece: p } = entry;
  switch (group) {
    case "specializations":
      return c.specializations;
    case "skills":
      return c.skills;
    case "availability":
      return [c.availability];
    case "tools":
      return p ? p.toolIds : c.tools.map((t) => t.toolId);
    case "contentTypes":
      return p ? [p.contentType] : c.contentTypes;
    case "formats":
      return p ? [p.aspectRatio] : c.formats;
  }
}

function haystack(entry: Entry): string {
  const { creator: c, piece: p } = entry;
  const toolNames = (p ? p.toolIds : c.tools.map((t) => t.toolId)).map((id) => TOOL_MAP[id]?.name ?? id);
  return normalizeText(
    [c.name, c.handle, c.headline, ...c.specializations, ...c.skills, ...toolNames, ...(p ? [p.title] : [])].join(" "),
  );
}

function passesGroup(entry: Entry, group: FacetGroup, selected: string[]): boolean {
  if (!selected.length) return true;
  const values = valuesOf(entry, group);
  // Skills are strict: creator must have ALL selected. Other groups are OR.
  return group === "skills" ? selected.every((s) => values.includes(s)) : selected.some((s) => values.includes(s));
}

function passes(entry: Entry, f: CreatorFilters, tokens: string[], skip?: FacetGroup): boolean {
  const c = entry.creator;
  for (const g of FACET_GROUPS) {
    if (g !== skip && !passesGroup(entry, g, f[g])) return false;
  }
  if (f.budget) {
    const price = toUSD(c.startingPrice, c.currency);
    if (price < f.budget[0] || price > f.budget[1]) return false;
  }
  if (f.turnaround !== null && c.turnaroundDays > f.turnaround) return false;
  if (f.verifiedOnly && getTrustScore(c) < VERIFIED_TRUST_THRESHOLD) return false;
  if (f.commercialSafeOnly && !isCommercialSafe(c)) return false;
  if (tokens.length) {
    const text = haystack(entry);
    if (!tokens.every((t) => text.includes(t))) return false;
  }
  return true;
}

function computeFacets(entries: Entry[], f: CreatorFilters, tokens: string[]): Facets {
  const facets = Object.fromEntries(FACET_GROUPS.map((g) => [g, {}])) as Facets;
  for (const g of FACET_GROUPS) {
    for (const entry of entries) {
      if (!passes(entry, f, tokens, g)) continue;
      for (const v of new Set(valuesOf(entry, g))) facets[g][v] = (facets[g][v] ?? 0) + 1;
    }
  }
  return facets;
}

export interface FilterResult<T> {
  results: T[];
  facets: Facets;
}

export function filterCreators(creators: Creator[], filters: CreatorFilters, query = ""): FilterResult<Creator> {
  const tokens = tokenize(query);
  const entries = creators.map((creator) => ({ creator }));
  return {
    results: entries.filter((e) => passes(e, filters, tokens)).map((e) => e.creator),
    facets: computeFacets(entries, filters, tokens),
  };
}

export function filterWorks(
  creators: Creator[],
  filters: CreatorFilters,
  query = "",
): FilterResult<{ creator: Creator; piece: PortfolioPiece }> {
  const tokens = tokenize(query);
  const entries = creators.flatMap((creator) => creator.portfolio.map((piece) => ({ creator, piece })));
  return {
    results: entries.filter((e) => passes(e, filters, tokens)),
    facets: computeFacets(entries, filters, tokens),
  };
}

export type SortKey = "match" | "rating" | "price" | "turnaround" | "verified";

export const SORT_LABELS: Record<SortKey, string> = {
  match: "Best match",
  rating: "Top rated",
  price: "Price: low to high",
  turnaround: "Fastest turnaround",
  verified: "Most verified",
};

/** Returns a new sorted array. `matchScores` is used for "match" (falls back to rating). */
export function sortCreators(creators: Creator[], key: SortKey, matchScores?: Map<string, number>): Creator[] {
  const list = [...creators];
  const byRating = (a: Creator, b: Creator) => b.rating - a.rating || b.reviewCount - a.reviewCount;
  switch (key) {
    case "match":
      if (!matchScores) return list.sort(byRating);
      return list.sort((a, b) => (matchScores.get(b.id) ?? 0) - (matchScores.get(a.id) ?? 0) || byRating(a, b));
    case "rating":
      return list.sort(byRating);
    case "price":
      return list.sort((a, b) => toUSD(a.startingPrice, a.currency) - toUSD(b.startingPrice, b.currency));
    case "turnaround":
      return list.sort((a, b) => a.turnaroundDays - b.turnaroundDays || byRating(a, b));
    case "verified":
      return list.sort((a, b) => getTrustScore(b) - getTrustScore(a) || byRating(a, b));
  }
}

export function countActiveFilters(f: CreatorFilters): number {
  return (
    FACET_GROUPS.reduce((n, g) => n + f[g].length, 0) +
    (f.budget ? 1 : 0) +
    (f.turnaround !== null ? 1 : 0) +
    (f.verifiedOnly ? 1 : 0) +
    (f.commercialSafeOnly ? 1 : 0)
  );
}

// ---------- URL (de)serialization ----------

export interface DiscoverState {
  filters: CreatorFilters;
  query: string;
  sort: SortKey;
  view: "creators" | "works";
  briefId: string | null;
}

const LIST_KEYS: Record<FacetGroup, string> = {
  specializations: "spec",
  tools: "tools",
  skills: "skills",
  contentTypes: "type",
  formats: "format",
  availability: "avail",
};

export function defaultSort(briefId: string | null): SortKey {
  return briefId ? "match" : "rating";
}

function readList(params: URLSearchParams, key: string): string[] {
  return params.get(key)?.split(",").filter(Boolean) ?? [];
}

export function parseDiscoverParams(params: URLSearchParams): DiscoverState {
  const filters: CreatorFilters = { ...EMPTY_FILTERS };
  for (const g of FACET_GROUPS) (filters[g] as string[]) = readList(params, LIST_KEYS[g]);
  const budget = readList(params, "budget").map(Number);
  if (budget.length === 2 && budget.every((n) => Number.isFinite(n))) filters.budget = [budget[0], budget[1]];
  const ta = Number(params.get("ta"));
  filters.turnaround = Number.isFinite(ta) && ta > 0 ? ta : null;
  filters.verifiedOnly = params.get("verified") === "1";
  filters.commercialSafeOnly = params.get("safe") === "1";
  const sort = params.get("sort") as SortKey | null;
  const briefId = params.get("brief");
  return {
    filters,
    query: params.get("q") ?? "",
    sort: sort && sort in SORT_LABELS ? sort : defaultSort(briefId),
    view: params.get("view") === "works" ? "works" : "creators",
    briefId,
  };
}

export function serializeDiscoverState(s: DiscoverState): string {
  const p = new URLSearchParams();
  if (s.query) p.set("q", s.query);
  for (const g of FACET_GROUPS) if (s.filters[g].length) p.set(LIST_KEYS[g], s.filters[g].join(","));
  if (s.filters.budget) p.set("budget", s.filters.budget.join(","));
  if (s.filters.turnaround !== null) p.set("ta", String(s.filters.turnaround));
  if (s.filters.verifiedOnly) p.set("verified", "1");
  if (s.filters.commercialSafeOnly) p.set("safe", "1");
  if (s.sort !== defaultSort(s.briefId)) p.set("sort", s.sort);
  if (s.view !== "creators") p.set("view", s.view);
  if (s.briefId) p.set("brief", s.briefId);
  return p.toString();
}
