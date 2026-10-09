import type { BriefDraft, Deliverable } from "./types";

export interface MissingField {
  field: string;
  label: string;
  requiredToPublish: boolean;
}

export interface Completeness {
  percent: number;
  missing: MissingField[];
  canPublish: boolean;
}

export const PUBLISH_THRESHOLD = 80;

const NEEDS_DURATION = new Set(["video", "animation", "audio"]);

export function isDeliverableComplete(d: Deliverable): boolean {
  return Boolean(
    d.contentType && d.quantity >= 1 && d.aspectRatio && d.resolution && (!NEEDS_DURATION.has(d.contentType) || (d.durationSec ?? 0) > 0),
  );
}

interface Check {
  field: string;
  label: string;
  weight: number;
  requiredToPublish: boolean;
  ok: (b: BriefDraft) => boolean;
}

const filled = (s: string | undefined) => Boolean(s && s.trim().length > 0);

// Weights sum to 100.
const CHECKS: Check[] = [
  { field: "title", label: "Brief title", weight: 10, requiredToPublish: true, ok: (b) => filled(b.title) },
  { field: "brandName", label: "Brand name", weight: 6, requiredToPublish: false, ok: (b) => filled(b.brandName) },
  { field: "idea", label: "Idea / description", weight: 6, requiredToPublish: false, ok: (b) => filled(b.idea) },
  { field: "objective", label: "Campaign objective", weight: 4, requiredToPublish: false, ok: (b) => filled(b.objective) },
  { field: "audience", label: "Target audience", weight: 6, requiredToPublish: false, ok: (b) => filled(b.audience) },
  {
    field: "deliverables",
    label: "At least one complete deliverable",
    weight: 16,
    requiredToPublish: true,
    ok: (b) => b.deliverables.length > 0 && b.deliverables.every(isDeliverableComplete),
  },
  { field: "moods", label: "Style / mood", weight: 8, requiredToPublish: false, ok: (b) => b.moods.length > 0 },
  { field: "requiredSkills", label: "Required skills", weight: 8, requiredToPublish: false, ok: (b) => b.requiredSkills.length > 0 },
  {
    field: "commercial.usageTypes",
    label: "Commercial usage types",
    weight: 10,
    requiredToPublish: true,
    ok: (b) => b.commercial.usageTypes.length > 0,
  },
  { field: "commercial.platforms", label: "Platforms", weight: 8, requiredToPublish: false, ok: (b) => b.commercial.platforms.length > 0 },
  {
    field: "commercial.licenseDuration",
    label: "License duration",
    weight: 4,
    requiredToPublish: false,
    ok: (b) => filled(b.commercial.licenseDuration),
  },
  {
    field: "budget",
    label: "Budget range",
    weight: 8,
    requiredToPublish: true,
    ok: (b) => b.budget.min > 0 && b.budget.max >= b.budget.min,
  },
  { field: "deadline", label: "Deadline", weight: 6, requiredToPublish: true, ok: (b) => filled(b.deadline) },
];

export function getBriefCompleteness(brief: BriefDraft): Completeness {
  let earned = 0;
  const missing: MissingField[] = [];
  for (const c of CHECKS) {
    if (c.ok(brief)) earned += c.weight;
    else missing.push({ field: c.field, label: c.label, requiredToPublish: c.requiredToPublish });
  }
  const percent = Math.round(earned);
  return {
    percent,
    missing,
    canPublish: percent >= PUBLISH_THRESHOLD && !missing.some((m) => m.requiredToPublish),
  };
}
