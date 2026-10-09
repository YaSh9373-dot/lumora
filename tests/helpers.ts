import { CREATORS } from "@/data/creators";
import { SAMPLE_BRIEFS } from "@/data/briefs";
import type { Brief, Creator } from "@/lib/types";

export function creator(overrides: Partial<Creator> = {}): Creator {
  return { ...structuredClone(CREATORS[0]), ...overrides };
}

export function brief(overrides: Partial<Brief> = {}): Brief {
  return { ...structuredClone(SAMPLE_BRIEFS[0]), ...overrides };
}

export const bySlug = (slug: string) => CREATORS.find((c) => c.slug === slug)!;
