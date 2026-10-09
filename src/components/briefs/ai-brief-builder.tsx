"use client";

import { AnimatePresence, motion } from "motion/react";
import { Check, Loader2, Sparkles, Wand2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { GradientButton } from "@/components/effects/gradient-button";
import { BorderBeam } from "@/components/effects/misc";
import { EASE } from "@/components/effects/motion";
import { generateFallbackBrief } from "@/lib/fallback-brief";
import { briefBuilderResponseSchema, type BriefBuilderResponse } from "@/lib/schemas";
import type { BriefDraft } from "@/lib/types";
import { cn } from "@/lib/utils";

const EXAMPLES = [
  "15 second Instagram reel teasing our glow-in-the-dark sneaker launch in India, budget under 1 lakh",
  "Hand-drawn animated story for our neighbourhood café, plus 4 posters, full buyout, around $1500",
  "60s explainer with an AI presenter for our UPI payments app, Hindi and English voiceover",
  "Luxury watch launch film for YouTube and TV, cinematic, commercially safe tools only, $5000",
];

const STEPS = ["Understanding your idea", "Choosing formats & tools", "Drafting commercial terms"];
const MAX = 600;

async function requestBrief(idea: string): Promise<BriefBuilderResponse> {
  try {
    const res = await fetch("/api/brief-builder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idea }),
    });
    if (res.ok) {
      const parsed = briefBuilderResponseSchema.safeParse(await res.json());
      if (parsed.success) return parsed.data as BriefBuilderResponse;
    }
  } catch {
    // network error: fall through to local templates
  }
  // Rate limited, offline or bad response: the deterministic generator runs client-side too.
  return { brief: generateFallbackBrief(idea), source: "fallback" };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function AiBriefBuilder({ onBrief }: { onBrief: (brief: BriefDraft, source: BriefBuilderResponse["source"]) => void }) {
  const [idea, setIdea] = useState("");
  const [step, setStep] = useState<number | null>(null);
  const [source, setSource] = useState<BriefBuilderResponse["source"] | null>(null);
  const loading = step !== null;
  const tooShort = idea.trim().length < 10;

  async function build() {
    if (tooShort || loading) return;
    setStep(0);
    try {
      const pending = requestBrief(idea.trim());
      for (let i = 1; i < STEPS.length; i++) {
        await sleep(650);
        setStep(i);
      }
      const [result] = await Promise.all([pending, sleep(500)]);
      onBrief(result.brief, result.source);
      setSource(result.source);
      toast.success("Brief drafted. Review and tweak anything.");
    } catch {
      toast.error("Couldn't draft the brief", { action: { label: "Retry", onClick: () => void build() } });
    } finally {
      setStep(null);
    }
  }

  return (
    <div className="card-surface relative overflow-hidden p-5 sm:p-6">
      <BorderBeam duration={10} />
      <div className="bg-aurora pointer-events-none absolute -top-24 -left-16 size-56 rounded-full opacity-[0.12] blur-3xl" />
      <div className="relative">
        <div className="flex items-center gap-2">
          <span className="bg-aurora flex size-7 items-center justify-center rounded-lg text-white">
            <Wand2 className="size-3.5" />
          </span>
          <h2 className="text-aurora text-lg font-semibold tracking-tight">Start with a rough idea</h2>
        </div>
        <p className="mt-1 text-[13px] text-muted-foreground">Describe it in a sentence. AI fills every field below, and you stay in control.</p>

        <div className="relative mt-4">
          <textarea
            value={idea}
            onChange={(e) => setIdea(e.target.value.slice(0, MAX))}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void build();
            }}
            rows={3}
            maxLength={MAX}
            aria-label="Rough idea"
            placeholder="e.g. A 15s vertical teaser for our new sneaker drop, neon and high-energy, for Instagram and TikTok…"
            className="w-full resize-none rounded-[14px] border border-white/10 bg-black/30 p-3.5 pb-7 text-sm leading-relaxed outline-none placeholder:text-subtle focus-visible:border-violet/60 focus-visible:ring-4 focus-visible:ring-violet/15"
          />
          <span className="absolute right-3 bottom-2.5 font-mono text-[10px] text-subtle">
            {idea.length}/{MAX}
          </span>
        </div>

        <div className="no-scrollbar mt-3 flex gap-1.5 overflow-x-auto pb-1">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => setIdea(ex)}
              className="shrink-0 rounded-full border border-white/10 px-3 py-1 text-left text-[11.5px] text-muted-foreground transition-colors hover:border-white/20 hover:text-foreground"
            >
              {ex.length > 46 ? `${ex.slice(0, 46)}…` : ex}
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <GradientButton onClick={() => void build()} disabled={tooShort || loading}>
            {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
            {loading ? "Building…" : "Build my brief"}
          </GradientButton>
          {source && !loading && (
            <span className="text-[11px] text-subtle">{source === "ai" ? "Drafted by Gemini" : "Drafted by smart templates"}</span>
          )}
          {tooShort && idea.length > 0 && <span className="text-[11px] text-subtle">At least 10 characters</span>}
        </div>

        <AnimatePresence>
          {loading && (
            <motion.ol
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: EASE }}
              className="mt-4 space-y-2 overflow-hidden"
              aria-live="polite"
            >
              {STEPS.map((s, i) => (
                <li key={s} className={cn("flex items-center gap-2 text-[13px] transition-colors", i <= (step ?? -1) ? "text-foreground" : "text-subtle")}>
                  <span className="flex size-4 items-center justify-center">
                    {i < (step ?? -1) ? (
                      <Check className="size-3.5 text-verified" />
                    ) : i === step ? (
                      <Loader2 className="size-3.5 animate-spin text-violet" />
                    ) : (
                      <span className="size-1.5 rounded-full bg-white/20" />
                    )}
                  </span>
                  {s}
                </li>
              ))}
            </motion.ol>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
