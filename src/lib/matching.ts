import { TOOL_MAP } from "@/data/tools";
import { CONTENT_TYPE_LABELS, OBJECTIVE_SPECIALIZATIONS } from "./constants";
import { clamp, formatPrice, toUSD, unique } from "./format";
import type { Brief, Creator } from "./types";
import { getTrustScore, isCommercialSafe } from "./verification";

export type MatchFactor = "skills" | "contentType" | "tools" | "style" | "format" | "budget" | "commercial" | "verification";

export interface MatchResult {
  score: number;
  reasons: { matched: string[]; missing: string[]; notes: string[] };
  breakdown: Record<MatchFactor, { score: number; max: number }>;
}

export const WEIGHTS = {
  skills: 25,
  contentType: 20,
  tools: 15,
  style: 15,
  format: 10,
  budget: 10,
  commercial: 5,
  verification: 5,
} as const satisfies Record<MatchFactor, number>;

export const COMMERCIAL_SAFE_PENALTY = 25;

const toolName = (id: string) => TOOL_MAP[id]?.name ?? id;

/** Budget fit: 1 when price ≤ max, linear taper to 0 at 2× max. */
export function budgetFit(priceUSD: number, maxUSD: number): number {
  if (maxUSD <= 0) return 1;
  if (priceUSD <= maxUSD) return 1;
  return clamp(1 - (priceUSD - maxUSD) / maxUSD, 0, 1);
}

export function scoreCreatorForBrief(creator: Creator, brief: Brief): MatchResult {
  const matched: string[] = [];
  const missing: string[] = [];
  const notes: string[] = [];

  // Skills (25)
  const req = brief.requiredSkills;
  const hasSkills = req.filter((s) => creator.skills.includes(s));
  const skillsRatio = req.length ? hasSkills.length / req.length : 1;
  matched.push(...hasSkills);
  missing.push(...req.filter((s) => !creator.skills.includes(s)));

  // Content type (20)
  const types = unique(brief.deliverables.map((d) => d.contentType));
  const okTypes = types.filter((t) => creator.contentTypes.includes(t));
  const typeRatio = types.length ? okTypes.length / types.length : 1;
  matched.push(...okTypes.map((t) => CONTENT_TYPE_LABELS[t]));
  missing.push(...types.filter((t) => !creator.contentTypes.includes(t)).map((t) => CONTENT_TYPE_LABELS[t]));

  // Tools (15), weighted by proficiency
  const pref = brief.preferredToolIds;
  let toolSum = 0;
  for (const id of pref) {
    const prof = creator.tools.find((t) => t.toolId === id);
    if (prof) {
      toolSum += prof.level / 5;
      matched.push(toolName(id));
    } else {
      missing.push(toolName(id));
    }
  }
  const toolRatio = pref.length ? toolSum / pref.length : 1;

  // Style (12) + specialization bonus (3)
  const moods = brief.moods;
  const moodRatio = moods.length ? moods.filter((m) => creator.styles.includes(m)).length / moods.length : 1;
  const specAligned = creator.specializations.some((s) => OBJECTIVE_SPECIALIZATIONS[brief.objective].includes(s));
  const styleScore = moodRatio * 12 + (specAligned ? 3 : 0);

  // Format (10)
  const ratios = unique(brief.deliverables.map((d) => d.aspectRatio));
  const known = new Set([...creator.formats, ...creator.portfolio.map((p) => p.aspectRatio)]);
  const formatRatio = ratios.length ? ratios.filter((r) => known.has(r)).length / ratios.length : 1;
  const missingRatios = ratios.filter((r) => !known.has(r));
  if (missingRatios.length) missing.push(...missingRatios.map((r) => `${r} format`));

  // Budget (10)
  const priceUSD = toUSD(creator.startingPrice, creator.currency);
  const maxUSD = toUSD(brief.budget.max, brief.budget.currency);
  const budgetRatio = budgetFit(priceUSD, maxUSD);
  if (budgetRatio < 1) notes.push(`Starts at ${formatPrice(creator.startingPrice, creator.currency)}, above budget`);

  // Commercial (5): usage 3, ownership 1, exclusivity 1
  const usageOk = brief.commercial.usageTypes.every((u) => creator.commercial.licensesOffered.includes(u));
  const ownershipOk = creator.commercial.ownershipOptions.includes(brief.commercial.ownership);
  const exclusivityOk =
    brief.commercial.exclusivity === "none" || creator.commercial.exclusivityAvailable.includes(brief.commercial.exclusivity);
  const commercialScore = (usageOk ? 3 : 0) + (ownershipOk ? 1 : 0) + (exclusivityOk ? 1 : 0);
  if (!usageOk) notes.push("Doesn't license all requested usage types");
  if (!ownershipOk) notes.push("No full buyout offered");

  // Verification bonus (up to 5)
  const trust = getTrustScore(creator);
  const verificationScore = trust >= 80 ? 5 : trust >= 60 ? 3 : 0;

  const breakdown: MatchResult["breakdown"] = {
    skills: { score: WEIGHTS.skills * skillsRatio, max: WEIGHTS.skills },
    contentType: { score: WEIGHTS.contentType * typeRatio, max: WEIGHTS.contentType },
    tools: { score: WEIGHTS.tools * toolRatio, max: WEIGHTS.tools },
    style: { score: styleScore, max: WEIGHTS.style },
    format: { score: WEIGHTS.format * formatRatio, max: WEIGHTS.format },
    budget: { score: WEIGHTS.budget * budgetRatio, max: WEIGHTS.budget },
    commercial: { score: commercialScore, max: WEIGHTS.commercial },
    verification: { score: verificationScore, max: WEIGHTS.verification },
  };

  let score = Object.values(breakdown).reduce((s, b) => s + b.score, 0);
  if (brief.commercial.commerciallySafeToolsOnly && !isCommercialSafe(creator)) {
    score -= COMMERCIAL_SAFE_PENALTY;
    notes.push("Uses tools not flagged commercial-safe");
  }

  return {
    score: Math.round(clamp(score, 0, 100)),
    reasons: { matched: unique(matched), missing: unique(missing), notes },
    breakdown,
  };
}

export interface RankedCreator {
  creator: Creator;
  match: MatchResult;
  trust: number;
}

export function rankCreatorsForBrief(creators: Creator[], brief: Brief): RankedCreator[] {
  return creators
    .map((creator) => ({ creator, match: scoreCreatorForBrief(creator, brief), trust: getTrustScore(creator) }))
    .sort((a, b) => b.match.score - a.match.score || b.trust - a.trust);
}
