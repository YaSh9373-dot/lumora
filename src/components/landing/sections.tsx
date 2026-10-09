"use client";

import { motion, useInView } from "motion/react";
import { BadgeCheck, FileText, Fingerprint, Kanban, Layers, ShieldCheck, Sparkles, Target, Workflow, Wrench } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ScoreRing } from "@/components/creators/bits";
import { GradientLink } from "@/components/effects/gradient-button";
import { BorderBeam } from "@/components/effects/misc";
import { EASE, Reveal } from "@/components/effects/motion";
import { SpotlightCard } from "@/components/effects/spotlight-card";
import { cn } from "@/lib/utils";

// ---------- Bento ----------

function MiniWorkflow() {
  return (
    <div className="mt-6 space-y-2">
      {["Storyboard", "Keyframes · Runway", "Image-to-video · Kling", "Grade · Resolve"].map((s, i) => (
        <motion.div
          key={s}
          initial={{ opacity: 0, x: -10 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: EASE, delay: 0.15 * i }}
          className="flex items-center gap-2.5 text-[12.5px]"
        >
          <span className="flex size-5 items-center justify-center rounded-full bg-violet/20 font-mono text-[10px] text-violet">{i + 1}</span>
          <span className="text-foreground/85">{s}</span>
        </motion.div>
      ))}
    </div>
  );
}

function MiniTyping() {
  const text = "15s 9:16 · paid ads · India · 6 months";
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const t = setInterval(() => setN((v) => (v >= text.length ? v : v + 1)), 45);
    return () => clearInterval(t);
  }, [inView, text.length]);
  return (
    <div ref={ref} className="mt-6 rounded-xl border border-white/[0.06] bg-black/30 p-3 font-mono text-[12px] text-foreground/85">
      {text.slice(0, n)}
      <span className="ml-0.5 inline-block h-3.5 w-1.5 translate-y-0.5 animate-pulse bg-violet" />
    </div>
  );
}

function MiniMatch() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  return (
    <div ref={ref} className="mt-6 flex items-center gap-3">
      <ScoreRing value={inView ? 92 : 0} size={64} label="Match" />
      <div className="space-y-1 text-[12px]">
        <p className="text-verified">✓ Runway, Kling, Color Grading</p>
        <p className="text-muted-foreground">✕ Lip-Sync</p>
      </div>
    </div>
  );
}

function MiniPipeline() {
  const steps = ["Invited", "Accepted", "In progress", "Review", "Delivered"];
  return (
    <div className="mt-6 flex items-center gap-1.5">
      {steps.map((s, i) => (
        <motion.span
          key={s}
          initial={{ opacity: 0.2, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.25 * i }}
          className={cn("h-1.5 flex-1 rounded-full", i < 4 ? "bg-aurora" : "bg-verified")}
          title={s}
        />
      ))}
    </div>
  );
}

const BENTO = [
  {
    icon: Workflow,
    title: "AI portfolios with workflows",
    body: "Every piece shows the tools, steps, prompts, generations and hours behind it. Judge the process, not just the output.",
    visual: <MiniWorkflow />,
    className: "md:col-span-2 md:row-span-2",
  },
  { icon: FileText, title: "Structured briefs", body: "Formats, durations, styles and rights in one place.", visual: <MiniTyping />, className: "md:col-span-2" },
  { icon: Target, title: "Smart matching", body: "Ranked creators with reasons, not guesswork.", visual: <MiniMatch />, className: "" },
  {
    icon: ShieldCheck,
    title: "Verification signals",
    body: "Tools, workflows, past work and identity roll into a trust score.",
    visual: (
      <div className="mt-6 flex gap-2 text-verified">
        {[Wrench, Workflow, BadgeCheck, Fingerprint].map((I, i) => (
          <span key={i} className="flex size-9 items-center justify-center rounded-xl bg-verified/10">
            <I className="size-4" />
          </span>
        ))}
      </div>
    ),
    className: "",
  },
  {
    icon: Layers,
    title: "Commercial-use clarity",
    body: "License types, buyout, exclusivity and commercial-safe tool share, up front.",
    visual: (
      <div className="mt-6 flex flex-wrap gap-1.5 text-[11px]">
        {["Paid ads", "Broadcast", "Full buyout", "AI disclosed"].map((t) => (
          <span key={t} className="rounded-full bg-info/10 px-2 py-0.5 text-info">
            {t}
          </span>
        ))}
      </div>
    ),
    className: "md:col-span-2",
  },
  { icon: Kanban, title: "End-to-end engagements", body: "Invite, accept, review, revise, deliver.", visual: <MiniPipeline />, className: "md:col-span-2" },
];

export function Bento() {
  return (
    <div className="grid auto-rows-[minmax(220px,auto)] gap-4 md:grid-cols-4">
      {BENTO.map((b, i) => (
        <Reveal key={b.title} delay={i * 0.05} className={b.className}>
          <SpotlightCard className="h-full p-6">
            <b.icon className="size-5 text-violet" />
            <h3 className="mt-4 text-[17px] font-semibold tracking-tight">{b.title}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">{b.body}</p>
            {b.visual}
          </SpotlightCard>
        </Reveal>
      ))}
    </div>
  );
}

// ---------- How it works ----------

const STEPS = [
  { n: "01", title: "Describe", body: "Type one line. The AI Brief Builder turns it into a complete brief you can edit." },
  { n: "02", title: "Match", body: "Get a ranked list of creators with a match score and plain-language reasons." },
  { n: "03", title: "Deliver", body: "Invite, track progress, request revisions and approve delivery in one pipeline." },
];

export function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  return (
    <div ref={ref} className="relative grid gap-10 md:grid-cols-3 md:gap-6">
      <div className="absolute top-6 right-[16%] left-[16%] hidden h-px bg-white/10 md:block">
        <motion.div
          className="bg-aurora h-full origin-left"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: inView ? 1 : 0 }}
          transition={{ duration: 1.4, ease: EASE, delay: 0.2 }}
        />
      </div>
      {STEPS.map((s, i) => (
        <motion.div
          key={s.n}
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: EASE, delay: 0.2 + i * 0.35 }}
          className="relative text-center"
        >
          <span className="glass relative mx-auto flex size-12 items-center justify-center rounded-2xl bg-background font-mono text-sm">{s.n}</span>
          <h3 className="mt-5 text-xl font-semibold tracking-tight">{s.title}</h3>
          <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">{s.body}</p>
        </motion.div>
      ))}
    </div>
  );
}

// ---------- AI Brief Builder teaser ----------

const IDEA = "Neon teaser for our glow-in-the-dark sneaker, Instagram + TikTok, India, under ₹1 lakh";
const CHIPS = ["Launch", "Video ×2 · 9:16 · 0:15", "Image · 16:9 · 4K", "high-energy", "cinematic", "Paid ads", "Instagram", "TikTok", "India · 1 year", "₹50,000–₹1,00,000", "Image-to-Video", "Kling", "Runway"];

export function BriefTeaser() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-120px" });
  const [n, setN] = useState(0);
  const done = n >= IDEA.length;
  useEffect(() => {
    if (!inView) return;
    const t = setInterval(() => setN((v) => Math.min(IDEA.length, v + 1)), 28);
    return () => clearInterval(t);
  }, [inView]);

  return (
    <div ref={ref} className="card-surface relative overflow-hidden rounded-[28px] p-6 sm:p-10">
      <BorderBeam duration={9} size={160} />
      <div className="bg-aurora pointer-events-none absolute -top-32 -right-24 size-80 rounded-full opacity-15 blur-3xl" />
      <div className="relative grid gap-10 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="eyebrow flex items-center gap-1.5">
            <Sparkles className="size-3 text-violet" /> AI Brief Builder
          </p>
          <h2 className="mt-3 text-[clamp(1.8rem,3.5vw,2.6rem)] leading-[1.05] font-semibold tracking-[-0.04em]">
            One rough line in. <span className="accent text-aurora pr-1">A full brief</span> out.
          </h2>
          <p className="mt-4 max-w-md text-muted-foreground">
            Gemini drafts formats, durations, style, tools and commercial terms from your idea. Smart templates take over if the AI is
            unavailable, so it always works.
          </p>
          <GradientLink href="/briefs/new" className="mt-6" size="lg">
            <Sparkles /> Try the brief builder
          </GradientLink>
        </div>
        <div>
          <div className="rounded-2xl border border-white/10 bg-black/40 p-4 font-mono text-[13px] leading-relaxed text-foreground/90">
            <span className="text-subtle">idea › </span>
            {IDEA.slice(0, n)}
            {!done && <span className="ml-0.5 inline-block h-4 w-1.5 translate-y-0.5 animate-pulse bg-violet" />}
          </div>
          <div className="mt-4 flex min-h-[120px] flex-wrap content-start gap-1.5">
            {CHIPS.map((c, i) => (
              <motion.span
                key={c}
                initial={{ opacity: 0, y: 6, scale: 0.9 }}
                animate={done ? { opacity: 1, y: 0, scale: 1 } : {}}
                transition={{ duration: 0.35, ease: EASE, delay: i * 0.06 }}
                className="rounded-full border border-violet/30 bg-violet/10 px-2.5 py-1 text-[12px]"
              >
                {c}
              </motion.span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
