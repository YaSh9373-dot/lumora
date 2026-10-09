"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Circle, Plus, Save, Send, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useFieldArray, useForm, useWatch, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import { GradientButton } from "@/components/effects/gradient-button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { TOOLS, TOOL_MAP } from "@/data/tools";
import { getBriefCompleteness } from "@/lib/completeness";
import {
  ASPECT_RATIOS,
  CONTENT_TYPE_LABELS,
  CONTENT_TYPES,
  EXCLUSIVITIES,
  EXCLUSIVITY_LABELS,
  LICENSE_DURATIONS,
  LICENSE_LABELS,
  LICENSE_USES,
  MOODS,
  OBJECTIVE_LABELS,
  OBJECTIVES,
  OWNERSHIP_LABELS,
  OWNERSHIPS,
  PLATFORMS,
  RESOLUTIONS,
  SAFETY_FOOTNOTE,
  SKILLS,
  TERRITORIES,
} from "@/lib/constants";
import { convert, formatPrice, uid } from "@/lib/format";
import { briefDraftSchema } from "@/lib/schemas";
import { useDemoStore } from "@/lib/store";
import type { Brief, BriefDraft, Currency, Deliverable } from "@/lib/types";
import { cn } from "@/lib/utils";
import { AiBriefBuilder } from "./ai-brief-builder";
import { BriefPreview } from "./brief-preview";
import { ChipMulti, Field, inputClass, Segmented, selectClass } from "./controls";
import { CompletenessMeter } from "./completeness-meter";

export const EMPTY_DRAFT: BriefDraft = {
  title: "",
  brandName: "",
  idea: "",
  objective: "awareness",
  audience: "",
  deliverables: [{ id: "d1", contentType: "video", quantity: 1, aspectRatio: "16:9", durationSec: 30, resolution: "1080p" }],
  moods: [],
  palette: [],
  references: [],
  avoid: "",
  requiredSkills: [],
  preferredToolIds: [],
  commercial: {
    usageTypes: [],
    platforms: [],
    territory: "Global",
    licenseDuration: "",
    exclusivity: "none",
    ownership: "license",
    aiDisclosureRequired: true,
    watermarkFree: true,
    derivativeRights: false,
    commerciallySafeToolsOnly: false,
  },
  budget: { min: 0, max: 0, currency: "USD" },
  deadline: "",
  revisionRounds: 2,
};

const SECTIONS = [
  { id: "idea", title: "Idea & objective", fields: ["title", "brandName", "idea", "objective", "audience"] },
  { id: "deliverables", title: "Deliverables", fields: ["deliverables"] },
  { id: "style", title: "Style & mood", fields: ["moods"] },
  { id: "skills", title: "Skills & tools", fields: ["requiredSkills"] },
  { id: "commercial", title: "Commercial use", fields: ["commercial.usageTypes", "commercial.platforms", "commercial.licenseDuration"] },
  { id: "budget", title: "Budget & timeline", fields: ["budget", "deadline"] },
] as const;

const AI_FIELDS = [
  "title", "brandName", "idea", "objective", "audience", "deliverables", "moods", "palette", "avoid", "requiredSkills",
  "preferredToolIds", "commercial.usageTypes", "commercial.platforms", "commercial.territory", "commercial.licenseDuration",
  "commercial.exclusivity", "commercial.ownership", "commercial.flags", "budget", "deadline", "revisionRounds",
];

const BUDGET_MAX: Record<Currency, number> = { INR: 1_000_000, USD: 20_000 };
const BUDGET_STEP: Record<Currency, number> = { INR: 5_000, USD: 100 };

/** Field path → the key used for AI tags (deliverables.0.quantity → deliverables). */
function aiKey(name: string): string {
  const parts = name.split(".");
  if (parts[0] !== "commercial") return parts[0];
  return ["aiDisclosureRequired", "watermarkFree", "derivativeRights", "commerciallySafeToolsOnly"].includes(parts[1])
    ? "commercial.flags"
    : `commercial.${parts[1]}`;
}

function sectionOf(field: string): string {
  if (field.startsWith("commercial.")) return "commercial";
  return SECTIONS.find((s) => (s.fields as readonly string[]).includes(field))?.id ?? "idea";
}

export function BriefForm({ initial }: { initial?: Brief }) {
  const router = useRouter();
  const saveBrief = useDemoStore((s) => s.saveBrief);
  const [briefId] = useState(() => initial?.id ?? uid("brief"));
  const [open, setOpen] = useState<string[]>(SECTIONS.map((s) => s.id));
  const [aiFields, setAiFields] = useState<Set<string>>(new Set());
  const [flashKey, setFlashKey] = useState(0);

  const form = useForm<BriefDraft>({
    defaultValues: initial ?? EMPTY_DRAFT,
    // Schema enums are stricter than BriefDraft's string fields; runtime validation is identical.
    resolver: zodResolver(briefDraftSchema) as unknown as Resolver<BriefDraft>,
    mode: "onChange",
  });
  const { control, register, reset, setValue, getValues, formState } = form;
  const deliverables = useFieldArray({ control, name: "deliverables", keyName: "_key" });
  const values = useWatch({ control }) as BriefDraft;
  const completeness = getBriefCompleteness(values);

  // Editing a field clears its "AI-suggested" tag.
  useEffect(() => {
    const sub = form.watch((_, { name, type }) => {
      if (type !== "change" || !name) return;
      const key = aiKey(name);
      setAiFields((prev) => {
        if (!prev.has(key)) return prev;
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    });
    return () => sub.unsubscribe();
  }, [form]);

  function applyAi(brief: BriefDraft) {
    reset({ ...brief, references: getValues("references") });
    setAiFields(new Set(AI_FIELDS));
    setFlashKey((k) => k + 1);
    setOpen(SECTIONS.map((s) => s.id));
  }

  function jump(field: string) {
    const section = sectionOf(field);
    setOpen((o) => (o.includes(section) ? o : [...o, section]));
    requestAnimationFrame(() => {
      const el = document.getElementById(`field-${field}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.querySelector<HTMLElement>("input, textarea, select, button")?.focus({ preventScroll: true });
    });
  }

  function save(status: Brief["status"]) {
    const draft = getValues();
    const parsed = briefDraftSchema.safeParse(draft);
    if (!parsed.success) {
      toast.error("Please fix the highlighted fields", { description: parsed.error.issues[0]?.message });
      return;
    }
    if (status === "published" && !getBriefCompleteness(draft).canPublish) {
      toast.error("Brief isn't ready to publish", { description: "Fill the highlighted fields to reach 80%." });
      return;
    }
    saveBrief({ ...draft, id: briefId, status, createdAt: initial?.createdAt ?? new Date().toISOString() });
    if (status === "published") {
      toast.success("Brief published", { description: "Here are your best-matched creators." });
      router.push(`/briefs/${briefId}`);
    } else {
      toast.success("Draft saved");
    }
  }

  const ai = (key: string) => aiFields.has(key);
  const flash = { flashKey };
  let order = 0;
  const delay = () => (order++ % 20) * 60;

  const sectionDone = (id: string) => {
    const sec = SECTIONS.find((s) => s.id === id)!;
    return !completeness.missing.some((m) => (sec.fields as readonly string[]).includes(m.field));
  };

  const currency = values.budget?.currency ?? "USD";

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)]">
      <form className="min-w-0 space-y-5" onSubmit={(e) => e.preventDefault()} noValidate>
        <AiBriefBuilder onBrief={applyAi} />

        <Accordion multiple value={open} onValueChange={(v) => setOpen(v as string[])} className="space-y-3">
          {/* 1. Idea */}
          <Section id="idea" title="Idea & objective" done={sectionDone("idea")} n={1}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="title" label="Brief title" aiSuggested={ai("title")} {...flash} flashDelay={delay()} error={formState.errors.title?.message}>
                <input id="title" className={inputClass} placeholder="Neon Run: sneaker launch teaser" {...register("title")} />
              </Field>
              <Field id="brandName" label="Brand name" aiSuggested={ai("brandName")} {...flash} flashDelay={delay()}>
                <input id="brandName" className={inputClass} placeholder="Stride Lab" {...register("brandName")} />
              </Field>
            </div>
            <Field id="idea" label="Idea / rough description" aiSuggested={ai("idea")} {...flash} flashDelay={delay()}>
              <textarea id="idea" rows={2} className={cn(inputClass, "h-auto py-2.5")} {...register("idea")} />
            </Field>
            <Field id="objective" label="Campaign objective" aiSuggested={ai("objective")} {...flash} flashDelay={delay()}>
              <Controller
                control={control}
                name="objective"
                render={({ field }) => <Segmented id="objective" options={OBJECTIVES} value={field.value} onChange={field.onChange} label={(o) => OBJECTIVE_LABELS[o]} />}
              />
            </Field>
            <Field id="audience" label="Target audience" aiSuggested={ai("audience")} {...flash} flashDelay={delay()}>
              <input id="audience" className={inputClass} placeholder="Urban runners in India, 18–30" {...register("audience")} />
            </Field>
          </Section>

          {/* 2. Deliverables */}
          <Section id="deliverables" title="Deliverables" done={sectionDone("deliverables")} n={2}>
            <Field id="deliverables" label="What should the creator deliver?" aiSuggested={ai("deliverables")} {...flash} flashDelay={delay()}>
              <div className="space-y-2">
                {deliverables.fields.map((d, i) => {
                  const type = values.deliverables?.[i]?.contentType;
                  const timed = type === "video" || type === "animation" || type === "audio";
                  return (
                    <div key={d._key} className="grid grid-cols-2 gap-2 rounded-[14px] border border-white/[0.06] bg-white/[0.02] p-2.5 sm:grid-cols-[1.3fr_0.7fr_1fr_0.9fr_1fr_auto]">
                      <select aria-label="Content type" className={selectClass} {...register(`deliverables.${i}.contentType`)}>
                        {CONTENT_TYPES.map((t) => (
                          <option key={t} value={t}>{CONTENT_TYPE_LABELS[t]}</option>
                        ))}
                      </select>
                      <input aria-label="Quantity" type="number" min={1} max={50} className={inputClass} {...register(`deliverables.${i}.quantity`, { valueAsNumber: true })} />
                      <select aria-label="Aspect ratio" className={selectClass} {...register(`deliverables.${i}.aspectRatio`)}>
                        {ASPECT_RATIOS.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                      <input
                        aria-label="Duration in seconds"
                        type="number"
                        min={1}
                        max={600}
                        disabled={!timed}
                        placeholder={timed ? "sec" : "—"}
                        className={cn(inputClass, "disabled:opacity-40")}
                        {...register(`deliverables.${i}.durationSec`, { setValueAs: (v) => (v === "" || v === null || Number.isNaN(Number(v)) ? undefined : Number(v)) })}
                      />
                      <select aria-label="Resolution" className={selectClass} {...register(`deliverables.${i}.resolution`)}>
                        {RESOLUTIONS.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        aria-label="Remove deliverable"
                        onClick={() => deliverables.remove(i)}
                        className="flex h-10 items-center justify-center rounded-[12px] px-2.5 text-muted-foreground hover:bg-white/5 hover:text-danger"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  );
                })}
                {deliverables.fields.length < 8 && (
                  <button
                    type="button"
                    onClick={() =>
                      deliverables.append({ id: uid("d"), contentType: "image", quantity: 1, aspectRatio: "1:1", resolution: "4K" } satisfies Deliverable)
                    }
                    className="flex h-10 w-full items-center justify-center gap-1.5 rounded-[14px] border border-dashed border-white/15 text-[13px] text-muted-foreground hover:border-white/25 hover:text-foreground"
                  >
                    <Plus className="size-3.5" /> Add deliverable
                  </button>
                )}
              </div>
            </Field>
          </Section>

          {/* 3. Style */}
          <Section id="style" title="Style & mood" done={sectionDone("style")} n={3}>
            <Field id="moods" label="Mood" hint="Pick up to 6" aiSuggested={ai("moods")} {...flash} flashDelay={delay()}>
              <Controller
                control={control}
                name="moods"
                render={({ field }) => <ChipMulti options={MOODS} value={field.value} onChange={field.onChange} max={6} label={(m) => <span className="capitalize">{m}</span>} />}
              />
            </Field>
            <Field id="palette" label="Color palette" hint="Up to 4 swatches" aiSuggested={ai("palette")} {...flash} flashDelay={delay()}>
              <Controller
                control={control}
                name="palette"
                render={({ field }) => (
                  <div className="flex flex-wrap items-center gap-2">
                    {field.value.map((hex, i) => (
                      <span key={i} className="group relative">
                        <input
                          type="color"
                          aria-label={`Swatch ${i + 1}`}
                          value={hex}
                          onChange={(e) => field.onChange(field.value.map((h, j) => (j === i ? e.target.value.toUpperCase() : h)))}
                          className="size-10 cursor-pointer rounded-full border border-white/15 bg-transparent p-0 [&::-webkit-color-swatch]:rounded-full [&::-webkit-color-swatch]:border-0 [&::-webkit-color-swatch-wrapper]:p-0"
                        />
                        <button
                          type="button"
                          aria-label={`Remove swatch ${i + 1}`}
                          onClick={() => field.onChange(field.value.filter((_, j) => j !== i))}
                          className="absolute -top-1 -right-1 hidden size-4 items-center justify-center rounded-full bg-surface-3 text-foreground group-hover:flex group-focus-within:flex"
                        >
                          <X className="size-2.5" />
                        </button>
                      </span>
                    ))}
                    {field.value.length < 4 && (
                      <button
                        type="button"
                        aria-label="Add swatch"
                        onClick={() => field.onChange([...field.value, ["#7C5CFF", "#FF5CAA", "#FFB45C", "#22D3EE"][field.value.length]])}
                        className="flex size-10 items-center justify-center rounded-full border border-dashed border-white/20 text-muted-foreground hover:text-foreground"
                      >
                        <Plus className="size-4" />
                      </button>
                    )}
                  </div>
                )}
              />
            </Field>
            <Field id="references" label="Reference links" hint="Up to 3 URLs (YouTube, Behance, Pinterest…)">
              <Controller
                control={control}
                name="references"
                render={({ field }) => (
                  <div className="space-y-2">
                    {[0, 1, 2].map((i) => (
                      <input
                        key={i}
                        type="url"
                        aria-label={`Reference link ${i + 1}`}
                        className={inputClass}
                        placeholder="https://"
                        value={field.value[i] ?? ""}
                        onChange={(e) => {
                          const next = [...field.value];
                          next[i] = e.target.value;
                          field.onChange(next.filter((v, j) => v || j < i).slice(0, 3));
                        }}
                      />
                    ))}
                  </div>
                )}
              />
            </Field>
            <Field id="avoid" label="Avoid" aiSuggested={ai("avoid")} {...flash} flashDelay={delay()}>
              <input id="avoid" className={inputClass} placeholder="Competitor logos, real people's likenesses…" {...register("avoid")} />
            </Field>
          </Section>

          {/* 4. Skills */}
          <Section id="skills" title="Skills & tools" done={sectionDone("skills")} n={4}>
            <Field id="requiredSkills" label="Required skills" aiSuggested={ai("requiredSkills")} {...flash} flashDelay={delay()}>
              <Controller control={control} name="requiredSkills" render={({ field }) => <ChipMulti options={SKILLS} value={field.value} onChange={field.onChange} max={8} />} />
            </Field>
            <Field id="preferredToolIds" label="Preferred tools" aiSuggested={ai("preferredToolIds")} {...flash} flashDelay={delay()}>
              <Controller
                control={control}
                name="preferredToolIds"
                render={({ field }) => (
                  <ChipMulti
                    options={TOOLS.map((t) => t.id)}
                    value={field.value}
                    onChange={field.onChange}
                    max={8}
                    label={(id) => (
                      <>
                        <span className="size-1.5 rounded-full" style={{ background: TOOL_MAP[id].color }} />
                        {TOOL_MAP[id].name}
                      </>
                    )}
                  />
                )}
              />
            </Field>
            <Controller
              control={control}
              name="commercial.commerciallySafeToolsOnly"
              render={({ field }) => (
                <label className="flex cursor-pointer items-start gap-3 rounded-[14px] border border-white/[0.06] bg-white/[0.02] p-3.5">
                  <Switch checked={field.value} onCheckedChange={field.onChange} className="mt-0.5" />
                  <span>
                    <span className="block text-[13px] font-medium">Only commercially safe tools</span>
                    <span className="block text-[11px] text-subtle">{SAFETY_FOOTNOTE}</span>
                  </span>
                </label>
              )}
            />
          </Section>

          {/* 5. Commercial */}
          <Section id="commercial" title="Commercial use" done={sectionDone("commercial")} n={5}>
            <Field id="commercial.usageTypes" label="Usage" aiSuggested={ai("commercial.usageTypes")} {...flash} flashDelay={delay()}>
              <Controller
                control={control}
                name="commercial.usageTypes"
                render={({ field }) => <ChipMulti options={LICENSE_USES} value={field.value} onChange={field.onChange} label={(u) => LICENSE_LABELS[u]} />}
              />
            </Field>
            <Field id="commercial.platforms" label="Platforms" aiSuggested={ai("commercial.platforms")} {...flash} flashDelay={delay()}>
              <Controller control={control} name="commercial.platforms" render={({ field }) => <ChipMulti options={PLATFORMS} value={field.value} onChange={field.onChange} />} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="commercial.territory" label="Territory" aiSuggested={ai("commercial.territory")} {...flash} flashDelay={delay()}>
                <select id="commercial.territory" className={selectClass} {...register("commercial.territory")}>
                  {TERRITORIES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </Field>
              <Field id="commercial.licenseDuration" label="License duration" aiSuggested={ai("commercial.licenseDuration")} {...flash} flashDelay={delay()}>
                <Controller
                  control={control}
                  name="commercial.licenseDuration"
                  render={({ field }) => <Segmented options={LICENSE_DURATIONS} value={field.value as (typeof LICENSE_DURATIONS)[number]} onChange={field.onChange} />}
                />
              </Field>
              <Field id="commercial.exclusivity" label="Exclusivity" aiSuggested={ai("commercial.exclusivity")} {...flash} flashDelay={delay()}>
                <Controller
                  control={control}
                  name="commercial.exclusivity"
                  render={({ field }) => <Segmented options={EXCLUSIVITIES} value={field.value} onChange={field.onChange} label={(e) => EXCLUSIVITY_LABELS[e]} />}
                />
              </Field>
              <Field id="commercial.ownership" label="Ownership" aiSuggested={ai("commercial.ownership")} {...flash} flashDelay={delay()}>
                <Controller
                  control={control}
                  name="commercial.ownership"
                  render={({ field }) => <Segmented options={OWNERSHIPS} value={field.value} onChange={field.onChange} label={(o) => OWNERSHIP_LABELS[o]} />}
                />
              </Field>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              {(
                [
                  ["commercial.aiDisclosureRequired", "AI disclosure required"],
                  ["commercial.watermarkFree", "Watermark-free"],
                  ["commercial.derivativeRights", "Edit / derivative rights"],
                ] as const
              ).map(([name, label]) => (
                <Controller
                  key={name}
                  control={control}
                  name={name}
                  render={({ field }) => (
                    <label className="flex cursor-pointer items-center gap-2.5 rounded-[12px] border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-[13px]">
                      <Switch checked={field.value} onCheckedChange={field.onChange} /> {label}
                    </label>
                  )}
                />
              ))}
            </div>
          </Section>

          {/* 6. Budget */}
          <Section id="budget" title="Budget & timeline" done={sectionDone("budget")} n={6}>
            <Field id="budget" label="Budget range" aiSuggested={ai("budget")} {...flash} flashDelay={delay()} error={formState.errors.budget?.max?.message}>
              <div className="space-y-4 rounded-[14px] border border-white/[0.06] bg-white/[0.02] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Segmented
                    options={["INR", "USD"] as const}
                    value={currency}
                    onChange={(c) => {
                      const b = getValues("budget");
                      const round = (n: number) => Math.round(convert(n, b.currency, c) / BUDGET_STEP[c]) * BUDGET_STEP[c];
                      setValue("budget", { currency: c, min: round(b.min), max: round(b.max) }, { shouldDirty: true });
                    }}
                  />
                  <span className="font-mono text-sm">
                    {formatPrice(values.budget?.min ?? 0, currency)} – {formatPrice(values.budget?.max ?? 0, currency)}
                  </span>
                </div>
                <Controller
                  control={control}
                  name="budget"
                  render={({ field }) => (
                    <Slider
                      aria-label="Budget range"
                      min={0}
                      max={BUDGET_MAX[currency]}
                      step={BUDGET_STEP[currency]}
                      value={[Math.min(field.value.min, BUDGET_MAX[currency]), Math.min(field.value.max, BUDGET_MAX[currency])]}
                      onValueChange={(v) => {
                        const [min, max] = v as number[];
                        field.onChange({ ...field.value, min, max });
                      }}
                    />
                  )}
                />
                <div className="grid grid-cols-2 gap-2">
                  <input aria-label="Minimum budget" type="number" min={0} className={inputClass} {...register("budget.min", { valueAsNumber: true })} />
                  <input aria-label="Maximum budget" type="number" min={0} className={inputClass} {...register("budget.max", { valueAsNumber: true })} />
                </div>
              </div>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="deadline" label="Deadline" aiSuggested={ai("deadline")} {...flash} flashDelay={delay()}>
                <input id="deadline" type="date" className={cn(inputClass, "[color-scheme:dark]")} {...register("deadline")} />
              </Field>
              <Field id="revisionRounds" label="Revision rounds" aiSuggested={ai("revisionRounds")} {...flash} flashDelay={delay()}>
                <Controller
                  control={control}
                  name="revisionRounds"
                  render={({ field }) => <Segmented options={[1, 2, 3, 4, 5] as const} value={field.value as 1} onChange={field.onChange} />}
                />
              </Field>
            </div>
          </Section>
        </Accordion>

        <div className="sticky bottom-4 z-20 flex flex-wrap items-center justify-end gap-2 rounded-2xl border border-white/10 bg-surface/85 p-2.5 backdrop-blur-xl lg:hidden">
          <span className="mr-auto pl-2 font-mono text-sm">{completeness.percent}%</span>
          <GradientButton variant="secondary" onClick={() => save("draft")}>
            <Save /> Save draft
          </GradientButton>
          <GradientButton onClick={() => save("published")} disabled={!completeness.canPublish}>
            <Send /> Publish
          </GradientButton>
        </div>
      </form>

      <aside className="space-y-4 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:self-start lg:overflow-y-auto lg:pb-4 no-scrollbar">
        <CompletenessMeter completeness={completeness} onJump={jump} />
        <div className="hidden gap-2 lg:flex">
          <GradientButton variant="secondary" className="flex-1" onClick={() => save("draft")}>
            <Save /> Save draft
          </GradientButton>
          <GradientButton className="flex-1" onClick={() => save("published")} disabled={!completeness.canPublish}>
            <Send /> Publish brief
          </GradientButton>
        </div>
        <p className="eyebrow pt-2">Live preview</p>
        <BriefPreview brief={values} />
      </aside>
    </div>
  );
}

function Section({ id, title, done, n, children }: { id: string; title: string; done: boolean; n: number; children: React.ReactNode }) {
  return (
    <AccordionItem value={id} className="card-surface overflow-hidden !border-b-[1px]">
      <AccordionTrigger className="items-center px-5 py-4 hover:no-underline">
        <span className="flex items-center gap-3">
          {done ? <CheckCircle2 className="size-4.5 text-verified" /> : <Circle className="size-4.5 text-subtle" />}
          <span className="font-mono text-[11px] text-subtle">0{n}</span>
          <span className="text-[15px] font-semibold">{title}</span>
        </span>
      </AccordionTrigger>
      <AccordionContent className="space-y-5 px-5 pt-1 pb-6">{children}</AccordionContent>
    </AccordionItem>
  );
}
