"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, Plus, Rocket, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ChipMulti, Field, inputClass, Segmented, selectClass } from "@/components/briefs/controls";
import { GradientButton } from "@/components/effects/gradient-button";
import { EASE } from "@/components/effects/motion";
import { TOOLS, TOOL_MAP } from "@/data/tools";
import {
  ASPECT_RATIOS,
  AVAILABILITIES,
  AVAILABILITY_LABELS,
  CONTENT_TYPE_LABELS,
  CONTENT_TYPES,
  LICENSE_DURATIONS,
  LICENSE_LABELS,
  LICENSE_USES,
  MOODS,
  OWNERSHIP_LABELS,
  OWNERSHIPS,
  SKILLS,
  SPECIALIZATIONS,
} from "@/lib/constants";
import { slugify } from "@/lib/format";
import { useDemoStore } from "@/lib/store";
import type { AspectRatio, Availability, ContentType, Creator, Currency, LicenseUse, Ownership, ToolProficiency, WorkflowStep } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CreatorCard } from "./creator-card";

interface WizardData {
  name: string;
  location: string;
  headline: string;
  bio: string;
  languages: string;
  specializations: string[];
  tools: ToolProficiency[];
  skills: string[];
  contentTypes: ContentType[];
  formats: AspectRatio[];
  styles: string[];
  startingPrice: number;
  currency: Currency;
  turnaroundDays: number;
  revisionsIncluded: number;
  availability: Availability;
  licensesOffered: LicenseUse[];
  ownershipOptions: Ownership[];
  usageDurations: string[];
  aiDisclosure: string;
  piece: {
    title: string;
    contentType: ContentType;
    aspectRatio: AspectRatio;
    durationSec: number;
    summary: string;
    steps: WorkflowStep[];
    promptExample: string;
    generations: number;
    hoursSpent: number;
  };
}

const INITIAL: WizardData = {
  name: "",
  location: "",
  headline: "",
  bio: "",
  languages: "English",
  specializations: [],
  tools: [],
  skills: [],
  contentTypes: [],
  formats: [],
  styles: [],
  startingPrice: 500,
  currency: "USD",
  turnaroundDays: 7,
  revisionsIncluded: 2,
  availability: "available",
  licensesOffered: ["organic-social"],
  ownershipOptions: ["license"],
  usageDurations: ["1 year"],
  aiDisclosure: "Deliverables are AI-assisted and labelled where platforms require it.",
  piece: {
    title: "",
    contentType: "video",
    aspectRatio: "16:9",
    durationSec: 30,
    summary: "",
    steps: [{ title: "", toolId: undefined, detail: "" }],
    promptExample: "",
    generations: 50,
    hoursSpent: 8,
  },
};

const STEPS = ["Basics", "Tools & skills", "Pricing & terms", "First piece"];

function validate(step: number, d: WizardData): string | null {
  if (step === 0) {
    if (d.name.trim().length < 2) return "Add your name";
    if (d.headline.trim().length < 10) return "Write a one-line headline (10+ characters)";
    if (!d.specializations.length) return "Pick at least one specialization";
  }
  if (step === 1) {
    if (!d.tools.length) return "Add at least one tool";
    if (!d.skills.length) return "Pick at least one skill";
    if (!d.contentTypes.length) return "Pick at least one content type";
  }
  if (step === 2) {
    if (!(d.startingPrice > 0)) return "Set a starting price";
    if (!d.licensesOffered.length) return "Offer at least one license type";
  }
  if (step === 3) {
    if (d.piece.title.trim().length < 2) return "Give your piece a title";
    if (!d.piece.steps.some((s) => s.title.trim())) return "Describe at least one workflow step";
  }
  return null;
}

const PALETTES = [
  ["#7C5CFF", "#FF5CAA", "#FFB45C"],
  ["#0F4C5C", "#E36414", "#FB8B24"],
  ["#2A9D8F", "#E9C46A", "#264653"],
  ["#F72585", "#4CC9F0", "#3A0CA3"],
];

export function toCreator(d: WizardData): Creator {
  const slug = `${slugify(d.name) || "creator"}-you`;
  const steps = d.piece.steps.filter((s) => s.title.trim());
  const palette = PALETTES[d.name.length % PALETTES.length];
  const timed = ["video", "animation", "audio"].includes(d.piece.contentType);
  return {
    id: "user-creator",
    slug,
    name: d.name.trim(),
    handle: `@${slugify(d.name).replace(/-/g, ".") || "you"}`,
    avatarSeed: d.name.trim() || "you",
    headline: d.headline.trim(),
    bio: d.bio.trim() || d.headline.trim(),
    location: d.location.trim() || "Remote",
    languages: d.languages.split(",").map((l) => l.trim()).filter(Boolean),
    specializations: d.specializations,
    skills: d.skills,
    tools: d.tools,
    contentTypes: d.contentTypes,
    styles: d.styles,
    formats: d.formats.length ? d.formats : [d.piece.aspectRatio],
    startingPrice: d.startingPrice,
    currency: d.currency,
    turnaroundDays: d.turnaroundDays,
    revisionsIncluded: d.revisionsIncluded,
    availability: d.availability,
    responseTimeHours: 6,
    rating: 0,
    reviewCount: 0,
    projectsCompleted: 0,
    commercial: {
      licensesOffered: d.licensesOffered,
      ownershipOptions: d.ownershipOptions.length ? d.ownershipOptions : ["license"],
      exclusivityAvailable: ["none"],
      usageDurations: d.usageDurations,
      aiDisclosure: d.aiDisclosure,
      trainingDataStatement: "Uses the vendors' hosted models.",
    },
    identityVerified: false,
    portfolio: [
      {
        id: `${slug}-1`,
        title: d.piece.title.trim(),
        contentType: d.piece.contentType,
        aspectRatio: d.piece.aspectRatio,
        durationSec: timed ? d.piece.durationSec : undefined,
        year: new Date().getFullYear(),
        palette,
        toolIds: [...new Set(steps.map((s) => s.toolId).filter((t): t is string => Boolean(t)))],
        clientVerified: false,
        commercialUseCleared: true,
        workflow: {
          summary: d.piece.summary.trim() || d.piece.title.trim(),
          steps,
          promptExample: d.piece.promptExample.trim() || undefined,
          generations: d.piece.generations,
          hoursSpent: d.piece.hoursSpent,
          postProduction: [],
        },
      },
    ],
    testimonials: [],
    isUserCreated: true,
  };
}

export function JoinWizard() {
  const router = useRouter();
  const setUserCreator = useDemoStore((s) => s.setUserCreator);
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [d, setD] = useState<WizardData>(INITIAL);
  const up = (patch: Partial<WizardData>) => setD((prev) => ({ ...prev, ...patch }));
  const upPiece = (patch: Partial<WizardData["piece"]>) => setD((prev) => ({ ...prev, piece: { ...prev.piece, ...patch } }));
  const isPreview = step === STEPS.length;

  function next() {
    const err = validate(step, d);
    if (err) return toast.error(err);
    setDir(1);
    setStep((s) => s + 1);
  }
  function back() {
    setDir(-1);
    setStep((s) => Math.max(0, s - 1));
  }
  function publish() {
    const creator = toCreator(d);
    setUserCreator(creator);
    toast.success("Your profile is live", { description: "It now appears in Discover, tagged “You”." });
    router.push(`/creators/${creator.slug}`);
  }

  const progress = Math.min(100, ((step + (isPreview ? 0 : 0.5)) / STEPS.length) * 100);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <div className="mb-3 flex flex-wrap gap-x-6 gap-y-1">
          {STEPS.map((s, i) => (
            <span key={s} className={cn("text-[13px]", i === step ? "text-foreground" : i < step ? "text-verified" : "text-subtle")}>
              <span className="font-mono text-[11px]">0{i + 1}</span> {s}
            </span>
          ))}
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-white/[0.06]" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100} aria-label="Wizard progress">
          <div className="bg-aurora h-full rounded-full transition-[width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="card-surface overflow-hidden p-6 sm:p-8">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={step}
            custom={dir}
            initial={{ opacity: 0, x: 24 * dir }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 * dir }}
            transition={{ duration: 0.3, ease: EASE }}
            className="space-y-5"
          >
            {step === 0 && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field id="w-name" label="Your name">
                    <input id="w-name" className={inputClass} value={d.name} onChange={(e) => up({ name: e.target.value })} placeholder="Riya Sharma" />
                  </Field>
                  <Field id="w-loc" label="Location">
                    <input id="w-loc" className={inputClass} value={d.location} onChange={(e) => up({ location: e.target.value })} placeholder="Pune, India" />
                  </Field>
                </div>
                <Field id="w-headline" label="Headline" hint="One line brands will see on your card">
                  <input id="w-headline" className={inputClass} value={d.headline} onChange={(e) => up({ headline: e.target.value })} placeholder="Dreamy AI music videos for indie artists" />
                </Field>
                <Field id="w-bio" label="Short bio">
                  <textarea id="w-bio" rows={3} className={cn(inputClass, "h-auto py-2.5")} value={d.bio} onChange={(e) => up({ bio: e.target.value })} />
                </Field>
                <Field id="w-lang" label="Languages" hint="Comma separated">
                  <input id="w-lang" className={inputClass} value={d.languages} onChange={(e) => up({ languages: e.target.value })} />
                </Field>
                <Field id="w-spec" label="Specializations" hint="Up to 3">
                  <ChipMulti options={SPECIALIZATIONS} value={d.specializations} onChange={(v) => up({ specializations: v })} max={3} />
                </Field>
              </>
            )}

            {step === 1 && (
              <>
                <Field id="w-tools" label="Tools & models you use" hint="Then set your proficiency for each">
                  <ChipMulti
                    options={TOOLS.map((t) => t.id)}
                    value={d.tools.map((t) => t.toolId)}
                    max={8}
                    onChange={(ids) =>
                      up({ tools: ids.map((id) => d.tools.find((t) => t.toolId === id) ?? { toolId: id, level: 3, yearsUsing: 1, verified: false }) })
                    }
                    label={(id) => (
                      <>
                        <span className="size-1.5 rounded-full" style={{ background: TOOL_MAP[id].color }} />
                        {TOOL_MAP[id].name}
                      </>
                    )}
                  />
                </Field>
                {d.tools.length > 0 && (
                  <div className="space-y-2 rounded-[14px] border border-white/[0.06] bg-white/[0.02] p-3">
                    {d.tools.map((t) => (
                      <div key={t.toolId} className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[13px]">{TOOL_MAP[t.toolId].name}</span>
                        <Segmented
                          options={[1, 2, 3, 4, 5] as const}
                          value={t.level}
                          onChange={(level) => up({ tools: d.tools.map((x) => (x.toolId === t.toolId ? { ...x, level } : x)) })}
                        />
                      </div>
                    ))}
                  </div>
                )}
                <Field id="w-skills" label="Skills">
                  <ChipMulti options={SKILLS} value={d.skills} onChange={(v) => up({ skills: v })} />
                </Field>
                <Field id="w-types" label="Content types">
                  <ChipMulti options={CONTENT_TYPES} value={d.contentTypes} onChange={(v) => up({ contentTypes: v })} label={(t) => CONTENT_TYPE_LABELS[t]} />
                </Field>
                <Field id="w-formats" label="Formats you deliver">
                  <ChipMulti options={ASPECT_RATIOS} value={d.formats} onChange={(v) => up({ formats: v })} />
                </Field>
                <Field id="w-styles" label="Your styles">
                  <ChipMulti options={MOODS} value={d.styles} onChange={(v) => up({ styles: v })} max={5} label={(m) => <span className="capitalize">{m}</span>} />
                </Field>
              </>
            )}

            {step === 2 && (
              <>
                <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
                  <Field id="w-price" label="Starting price">
                    <input id="w-price" type="number" min={1} className={inputClass} value={d.startingPrice} onChange={(e) => up({ startingPrice: Number(e.target.value) })} />
                  </Field>
                  <Field id="w-cur" label="Currency">
                    <Segmented options={["USD", "INR"] as const} value={d.currency} onChange={(currency) => up({ currency })} />
                  </Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field id="w-ta" label="Typical turnaround (days)">
                    <input id="w-ta" type="number" min={1} max={60} className={inputClass} value={d.turnaroundDays} onChange={(e) => up({ turnaroundDays: Number(e.target.value) })} />
                  </Field>
                  <Field id="w-rev" label="Revisions included">
                    <Segmented options={[1, 2, 3, 4, 5] as const} value={d.revisionsIncluded as 1} onChange={(revisionsIncluded) => up({ revisionsIncluded })} />
                  </Field>
                </div>
                <Field id="w-avail" label="Availability">
                  <Segmented options={AVAILABILITIES} value={d.availability} onChange={(availability) => up({ availability })} label={(a) => AVAILABILITY_LABELS[a]} />
                </Field>
                <Field id="w-lic" label="Licenses you offer">
                  <ChipMulti options={LICENSE_USES} value={d.licensesOffered} onChange={(v) => up({ licensesOffered: v })} label={(u) => LICENSE_LABELS[u]} />
                </Field>
                <Field id="w-own" label="Ownership options">
                  <ChipMulti options={OWNERSHIPS} value={d.ownershipOptions} onChange={(v) => up({ ownershipOptions: v })} label={(o) => OWNERSHIP_LABELS[o]} />
                </Field>
                <Field id="w-dur" label="Usage durations">
                  <ChipMulti options={LICENSE_DURATIONS} value={d.usageDurations as (typeof LICENSE_DURATIONS)[number][]} onChange={(v) => up({ usageDurations: v })} />
                </Field>
                <Field id="w-disc" label="AI disclosure statement">
                  <input id="w-disc" className={inputClass} value={d.aiDisclosure} onChange={(e) => up({ aiDisclosure: e.target.value })} />
                </Field>
              </>
            )}

            {step === 3 && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field id="w-ptitle" label="Piece title">
                    <input id="w-ptitle" className={inputClass} value={d.piece.title} onChange={(e) => upPiece({ title: e.target.value })} placeholder="Neon Monsoon" />
                  </Field>
                  <div className="grid grid-cols-3 gap-2">
                    <Field id="w-ptype" label="Type">
                      <select id="w-ptype" className={selectClass} value={d.piece.contentType} onChange={(e) => upPiece({ contentType: e.target.value as ContentType })}>
                        {CONTENT_TYPES.map((t) => (
                          <option key={t} value={t}>{CONTENT_TYPE_LABELS[t]}</option>
                        ))}
                      </select>
                    </Field>
                    <Field id="w-pratio" label="Ratio">
                      <select id="w-pratio" className={selectClass} value={d.piece.aspectRatio} onChange={(e) => upPiece({ aspectRatio: e.target.value as AspectRatio })}>
                        {ASPECT_RATIOS.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </Field>
                    <Field id="w-pdur" label="Secs">
                      <input id="w-pdur" type="number" min={1} className={inputClass} value={d.piece.durationSec} onChange={(e) => upPiece({ durationSec: Number(e.target.value) })} />
                    </Field>
                  </div>
                </div>
                <Field id="w-psum" label="What was the piece?">
                  <input id="w-psum" className={inputClass} value={d.piece.summary} onChange={(e) => upPiece({ summary: e.target.value })} placeholder="A 30s rain-soaked teaser for a streetwear drop" />
                </Field>
                <Field id="w-steps" label="Workflow steps" hint="3+ steps earns the “Workflow shared” signal">
                  <div className="space-y-2">
                    {d.piece.steps.map((s, i) => (
                      <div key={i} className="grid gap-2 rounded-[14px] border border-white/[0.06] bg-white/[0.02] p-2.5 sm:grid-cols-[1fr_170px_auto]">
                        <input
                          aria-label={`Step ${i + 1} title`}
                          className={inputClass}
                          placeholder={`Step ${i + 1}: e.g. Generate keyframes`}
                          value={s.title}
                          onChange={(e) => upPiece({ steps: d.piece.steps.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)) })}
                        />
                        <select
                          aria-label={`Step ${i + 1} tool`}
                          className={selectClass}
                          value={s.toolId ?? ""}
                          onChange={(e) => upPiece({ steps: d.piece.steps.map((x, j) => (j === i ? { ...x, toolId: e.target.value || undefined } : x)) })}
                        >
                          <option value="">No tool</option>
                          {TOOLS.map((t) => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          aria-label={`Remove step ${i + 1}`}
                          disabled={d.piece.steps.length === 1}
                          onClick={() => upPiece({ steps: d.piece.steps.filter((_, j) => j !== i) })}
                          className="flex h-10 items-center justify-center rounded-[12px] px-2.5 text-muted-foreground hover:text-danger disabled:opacity-30"
                        >
                          <Trash2 className="size-4" />
                        </button>
                        <input
                          aria-label={`Step ${i + 1} detail`}
                          className={cn(inputClass, "sm:col-span-3")}
                          placeholder="One or two sentences on what you did"
                          value={s.detail}
                          onChange={(e) => upPiece({ steps: d.piece.steps.map((x, j) => (j === i ? { ...x, detail: e.target.value } : x)) })}
                        />
                      </div>
                    ))}
                    {d.piece.steps.length < 6 && (
                      <button
                        type="button"
                        onClick={() => upPiece({ steps: [...d.piece.steps, { title: "", detail: "" }] })}
                        className="flex h-10 w-full items-center justify-center gap-1.5 rounded-[14px] border border-dashed border-white/15 text-[13px] text-muted-foreground hover:text-foreground"
                      >
                        <Plus className="size-3.5" /> Add step
                      </button>
                    )}
                  </div>
                </Field>
                <Field id="w-prompt" label="Prompt example (optional)">
                  <textarea id="w-prompt" rows={2} className={cn(inputClass, "h-auto py-2.5 font-mono text-xs")} value={d.piece.promptExample} onChange={(e) => upPiece({ promptExample: e.target.value })} />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field id="w-gens" label="Generations">
                    <input id="w-gens" type="number" min={1} className={inputClass} value={d.piece.generations} onChange={(e) => upPiece({ generations: Number(e.target.value) })} />
                  </Field>
                  <Field id="w-hrs" label="Hours spent">
                    <input id="w-hrs" type="number" min={1} className={inputClass} value={d.piece.hoursSpent} onChange={(e) => upPiece({ hoursSpent: Number(e.target.value) })} />
                  </Field>
                </div>
              </>
            )}

            {isPreview && (
              <div className="grid items-center gap-8 sm:grid-cols-[320px_1fr]">
                <CreatorCard creator={toCreator(d)} />
                <div>
                  <p className="eyebrow">Preview</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                    Looking <span className="accent text-aurora pr-1">sharp</span>
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    This is how brands will see you in Discover. Verification signals grow as you attach proof, share more workflows and
                    complete client work.
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-8 flex items-center justify-between border-t border-white/[0.06] pt-5">
          <GradientButton variant="ghost" onClick={back} disabled={step === 0}>
            <ArrowLeft /> Back
          </GradientButton>
          {isPreview ? (
            <GradientButton onClick={publish} size="lg">
              <Rocket /> Publish profile
            </GradientButton>
          ) : (
            <GradientButton onClick={next}>
              {step === STEPS.length - 1 ? "Preview" : "Continue"} <ArrowRight />
            </GradientButton>
          )}
        </div>
      </div>
    </div>
  );
}
