import { z } from "zod";
import { TOOL_MAP } from "@/data/tools";
import {
  ASPECT_RATIOS,
  CONTENT_TYPES,
  EXCLUSIVITIES,
  LICENSE_DURATIONS,
  LICENSE_USES,
  MOODS,
  OBJECTIVES,
  OWNERSHIPS,
  PLATFORMS,
  RESOLUTIONS,
  SKILLS,
  TERRITORIES,
} from "./constants";
import { clamp, unique } from "./format";
import type { BriefDraft, Deliverable } from "./types";

export const briefInputSchema = z.object({
  idea: z.string().trim().min(10, "Describe your idea in at least 10 characters").max(600),
});

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const deliverableSchema = z.object({
  id: z.string(),
  contentType: z.enum(CONTENT_TYPES),
  quantity: z.number().int().min(1).max(50),
  aspectRatio: z.enum(ASPECT_RATIOS),
  durationSec: z.number().int().min(1).max(600).optional(),
  resolution: z.enum(RESOLUTIONS),
});

export const commercialRequirementsSchema = z.object({
  usageTypes: z.array(z.enum(LICENSE_USES)),
  platforms: z.array(z.enum(PLATFORMS)),
  territory: z.string(),
  licenseDuration: z.string(),
  exclusivity: z.enum(EXCLUSIVITIES),
  ownership: z.enum(OWNERSHIPS),
  aiDisclosureRequired: z.boolean(),
  watermarkFree: z.boolean(),
  derivativeRights: z.boolean(),
  commerciallySafeToolsOnly: z.boolean(),
});

/** Form + API schema. Strings may be empty while drafting; completeness gates publishing. */
export const briefDraftSchema = z.object({
  title: z.string().max(120),
  brandName: z.string().max(80),
  idea: z.string().max(600),
  objective: z.enum(OBJECTIVES),
  audience: z.string().max(200),
  deliverables: z.array(deliverableSchema).max(8),
  moods: z.array(z.enum(MOODS)).max(6),
  palette: z.array(hex).max(4),
  references: z.array(z.string().max(300)).max(3),
  avoid: z.string().max(400),
  requiredSkills: z.array(z.enum(SKILLS)).max(8),
  preferredToolIds: z.array(z.string().refine((id) => id in TOOL_MAP, "Unknown tool")).max(8),
  commercial: commercialRequirementsSchema,
  budget: z
    .object({ min: z.number().min(0), max: z.number().min(0), currency: z.enum(["INR", "USD"]) })
    .refine((b) => b.max >= b.min, { message: "Max must be at least min", path: ["max"] }),
  deadline: z.string(),
  revisionRounds: z.number().int().min(1).max(5),
});

export const briefBuilderResponseSchema = z.object({
  brief: briefDraftSchema,
  source: z.enum(["ai", "fallback"]),
});
export interface BriefBuilderResponse {
  brief: BriefDraft;
  source: "ai" | "fallback";
}

// ---------- Sanitizing untrusted (AI) output ----------

type Rec = Record<string, unknown>;
const isRec = (v: unknown): v is Rec => typeof v === "object" && v !== null && !Array.isArray(v);

function str(v: unknown, max: number, fallback: string): string {
  return typeof v === "string" && v.trim() ? v.trim().slice(0, max) : fallback;
}
function oneOf<T extends string>(v: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(v as T) ? (v as T) : fallback;
}
function listOf<T extends string>(v: unknown, allowed: readonly T[], max: number, fallback: T[]): T[] {
  if (!Array.isArray(v)) return fallback;
  const out = unique(v.filter((x): x is T => allowed.includes(x as T))).slice(0, max);
  return out.length ? out : fallback;
}
function num(v: unknown, min: number, max: number, fallback: number): number {
  return typeof v === "number" && Number.isFinite(v) ? clamp(Math.round(v), min, max) : fallback;
}
function bool(v: unknown, fallback: boolean): boolean {
  return typeof v === "boolean" ? v : fallback;
}

function sanitizeDeliverables(v: unknown, fallback: Deliverable[]): Deliverable[] {
  if (!Array.isArray(v)) return fallback;
  const out: Deliverable[] = [];
  for (const raw of v.slice(0, 6)) {
    if (!isRec(raw) || !CONTENT_TYPES.includes(raw.contentType as Deliverable["contentType"])) continue;
    const contentType = raw.contentType as Deliverable["contentType"];
    const timed = contentType === "video" || contentType === "animation" || contentType === "audio";
    out.push({
      id: `d${out.length + 1}`,
      contentType,
      quantity: num(raw.quantity, 1, 50, 1),
      aspectRatio: oneOf(raw.aspectRatio, ASPECT_RATIOS, "16:9"),
      resolution: oneOf(raw.resolution, RESOLUTIONS, "1080p"),
      ...(timed ? { durationSec: num(raw.durationSec, 1, 600, 30) } : {}),
    });
  }
  return out.length ? out : fallback;
}

/**
 * Coerce an untrusted object into a valid BriefDraft: unknown enum values are
 * dropped, numbers clamped, arrays capped. Missing fields come from `base`.
 */
export function sanitizeBriefDraft(raw: unknown, base: BriefDraft): BriefDraft {
  const r = isRec(raw) ? raw : {};
  const c = isRec(r.commercial) ? r.commercial : {};
  const b = isRec(r.budget) ? r.budget : {};
  const currency = oneOf(b.currency, ["INR", "USD"] as const, base.budget.currency);
  const min = num(b.min, 0, 100_000_000, base.budget.min);
  const max = Math.max(min, num(b.max, 0, 100_000_000, base.budget.max));
  const toolIds = Object.keys(TOOL_MAP);
  const deadline = typeof r.deadline === "string" && /^\d{4}-\d{2}-\d{2}/.test(r.deadline) ? r.deadline.slice(0, 10) : base.deadline;

  return {
    title: str(r.title, 120, base.title),
    brandName: str(r.brandName, 80, base.brandName),
    idea: base.idea,
    objective: oneOf(r.objective, OBJECTIVES, base.objective),
    audience: str(r.audience, 200, base.audience),
    deliverables: sanitizeDeliverables(r.deliverables, base.deliverables),
    moods: listOf(r.moods, MOODS, 6, base.moods),
    palette: Array.isArray(r.palette)
      ? r.palette.filter((x): x is string => typeof x === "string" && /^#[0-9a-fA-F]{6}$/.test(x)).slice(0, 4)
      : base.palette,
    references: base.references,
    avoid: str(r.avoid, 400, base.avoid),
    requiredSkills: listOf(r.requiredSkills, SKILLS, 8, base.requiredSkills),
    preferredToolIds: listOf(r.preferredToolIds, toolIds, 8, base.preferredToolIds),
    commercial: {
      usageTypes: listOf(c.usageTypes, LICENSE_USES, 4, base.commercial.usageTypes),
      platforms: listOf(c.platforms, PLATFORMS, 9, base.commercial.platforms),
      territory: oneOf(c.territory, TERRITORIES, base.commercial.territory as (typeof TERRITORIES)[number]),
      licenseDuration: oneOf(
        c.licenseDuration,
        LICENSE_DURATIONS,
        base.commercial.licenseDuration as (typeof LICENSE_DURATIONS)[number],
      ),
      exclusivity: oneOf(c.exclusivity, EXCLUSIVITIES, base.commercial.exclusivity),
      ownership: oneOf(c.ownership, OWNERSHIPS, base.commercial.ownership),
      aiDisclosureRequired: bool(c.aiDisclosureRequired, base.commercial.aiDisclosureRequired),
      watermarkFree: bool(c.watermarkFree, base.commercial.watermarkFree),
      derivativeRights: bool(c.derivativeRights, base.commercial.derivativeRights),
      commerciallySafeToolsOnly: bool(c.commerciallySafeToolsOnly, base.commercial.commerciallySafeToolsOnly),
    },
    budget: { min, max, currency },
    deadline,
    revisionRounds: num(r.revisionRounds, 1, 5, base.revisionRounds),
  };
}
