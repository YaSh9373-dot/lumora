import { describe, expect, it } from "vitest";
import { CREATORS, getCreatorBySlug } from "@/data/creators";
import { SAMPLE_BRIEFS } from "@/data/briefs";
import { TOOL_MAP } from "@/data/tools";
import { MOODS, SKILLS, SPECIALIZATIONS } from "@/lib/constants";
import { briefDraftSchema } from "@/lib/schemas";
import { hasWorkflow } from "@/lib/verification";

describe("seed data integrity", () => {
  it("has 10 creators with unique ids and slugs", () => {
    expect(CREATORS).toHaveLength(10);
    expect(new Set(CREATORS.map((c) => c.id)).size).toBe(10);
    expect(new Set(CREATORS.map((c) => c.slug)).size).toBe(10);
  });

  it.each(CREATORS.map((c) => [c.name, c] as const))("%s references only master-list values", (_, c) => {
    for (const t of c.tools) expect(TOOL_MAP[t.toolId], t.toolId).toBeDefined();
    for (const s of c.skills) expect(SKILLS).toContain(s);
    for (const s of c.specializations) expect(SPECIALIZATIONS).toContain(s);
    for (const s of c.styles) expect(MOODS).toContain(s);
    for (const p of c.portfolio) {
      for (const id of p.toolIds) expect(TOOL_MAP[id], id).toBeDefined();
      for (const step of p.workflow?.steps ?? []) if (step.toolId) expect(TOOL_MAP[step.toolId], step.toolId).toBeDefined();
    }
    expect(c.portfolio.length).toBeGreaterThanOrEqual(4);
  });

  it("first six creators share full workflows on at least 3 pieces, the rest on at least 1", () => {
    for (const c of CREATORS.slice(0, 6)) expect(c.portfolio.filter(hasWorkflow).length).toBeGreaterThanOrEqual(3);
    for (const c of CREATORS.slice(6)) expect(c.portfolio.filter(hasWorkflow).length).toBeGreaterThanOrEqual(1);
  });

  it("sample briefs are schema-valid", () => {
    for (const b of SAMPLE_BRIEFS) expect(briefDraftSchema.safeParse(b).success).toBe(true);
  });

  it("finds creators by slug, including extra user-created ones", () => {
    expect(getCreatorBySlug("maya-chen")?.name).toBe("Maya Chen");
    const extra = { ...CREATORS[0], slug: "me" };
    expect(getCreatorBySlug("me", [extra])).toBe(extra);
    expect(getCreatorBySlug("nobody")).toBeUndefined();
  });
});
