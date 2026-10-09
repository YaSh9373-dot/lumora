"use client";

import { motion, useMotionValue, useReducedMotion, useSpring, useTransform, type MotionValue } from "motion/react";
import { BadgeCheck, Clock, Layers, MousePointer2, Sparkles } from "lucide-react";
import { useEffect, useState, type CSSProperties } from "react";
import { Avatar, ScoreRing, ToolChip } from "@/components/creators/bits";
import { AuroraCover } from "@/components/effects/aurora-cover";
import { EASE } from "@/components/effects/motion";
import { CREATORS } from "@/data/creators";
import { TOOL_MAP } from "@/data/tools";

const PICKS = [
  { creator: CREATORS[1], piece: CREATORS[1].portfolio[0], rotate: -8, x: "-58%", y: 28, depth: 18, z: 1 },
  { creator: CREATORS[0], piece: CREATORS[0].portfolio[1], rotate: 0, x: "0%", y: 0, depth: 30, z: 3 },
  { creator: CREATORS[5], piece: CREATORS[5].portfolio[0], rotate: 8, x: "58%", y: 32, depth: 14, z: 2 },
];

/** Delay between each card's flip, so they turn over one after another. */
const FLIP_STAGGER = 0.14;
const preserve3d: CSSProperties = { transformStyle: "preserve-3d" };
const face: CSSProperties = { backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" };

export function HeroCards() {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 18 });
  const sy = useSpring(my, { stiffness: 60, damping: 18 });
  const reduce = useReducedMotion();
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    if (reduce) return;
    const onMove = (e: MouseEvent) => {
      mx.set(e.clientX / window.innerWidth - 0.5);
      my.set(e.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [mx, my, reduce]);

  return (
    <div className="mt-16">
      <div
        className="relative mx-auto h-[420px] w-full max-w-4xl cursor-pointer [perspective:1400px] sm:h-[480px]"
        // Mouse: flip while hovering. Touch: tap toggles.
        onPointerEnter={(e) => e.pointerType === "mouse" && setFlipped(true)}
        onPointerLeave={(e) => e.pointerType === "mouse" && setFlipped(false)}
        onPointerUp={(e) => e.pointerType !== "mouse" && setFlipped((f) => !f)}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setFlipped((f) => !f))}
        role="button"
        tabIndex={0}
        aria-pressed={flipped}
        aria-label="Flip the cards to see how each piece was made"
      >
        {PICKS.map((p, i) => (
          <Card key={p.piece.id} pick={p} index={i} sx={sx} sy={sy} flipped={flipped} reduce={Boolean(reduce)} />
        ))}
      </div>
      <p className="eyebrow mt-2 flex items-center justify-center gap-1.5 !text-[10px] text-subtle">
        <MousePointer2 className="size-3" /> Hover or tap the cards to see how they were made
      </p>
    </div>
  );
}

function Card({
  pick,
  index,
  sx,
  sy,
  flipped,
  reduce,
}: {
  pick: (typeof PICKS)[number];
  index: number;
  sx: MotionValue<number>;
  sy: MotionValue<number>;
  flipped: boolean;
  reduce: boolean;
}) {
  const tx = useTransform(sx, (v) => v * pick.depth * 2);
  const ty = useTransform(sy, (v) => v * pick.depth * 1.4);
  const rY = useTransform(sx, (v) => v * 10);
  const rX = useTransform(sy, (v) => -v * 8);
  const { creator, piece } = pick;
  const center = index === 1;
  // Flip over left → right; flip back right → left, like a wave.
  const delay = (flipped ? index : PICKS.length - 1 - index) * FLIP_STAGGER;

  return (
    <div
      className={`absolute left-1/2 w-[200px] sm:w-[260px] ${center ? "" : "hidden sm:block"}`}
      style={{ zIndex: pick.z, top: pick.y, transform: `translateX(-50%) translateX(${pick.x})`, ...preserve3d }}
    >
      <motion.div
        style={preserve3d}
        initial={{ opacity: 0, y: 60, rotate: pick.rotate * 1.5 }}
        animate={{ opacity: 1, y: 0, rotate: pick.rotate }}
        transition={{ duration: 1, ease: EASE, delay: 0.3 + index * 0.12 }}
      >
        <motion.div style={{ x: tx, y: ty, rotateX: rX, rotateY: rY, ...preserve3d }}>
          <motion.div
            className="relative"
            style={preserve3d}
            animate={{ rotateY: flipped ? 180 : 0 }}
            transition={reduce ? { duration: 0 } : { duration: 0.7, ease: EASE, delay }}
          >
            {/* Front: the finished piece */}
            <div style={face} className="card-surface overflow-hidden rounded-[22px] p-1.5 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)]">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[16px]">
                <AuroraCover
                  seed={piece.id}
                  palette={piece.palette}
                  contentType={piece.contentType}
                  durationSec={piece.durationSec}
                  title={piece.title}
                  coverUrl={piece.coverUrl}
                  videoUrl={piece.mediaUrl?.startsWith("/media/") ? piece.mediaUrl : undefined}
                />
                {center && (
                  <div className="absolute top-2.5 right-2.5 rounded-full bg-black/45 p-0.5 backdrop-blur-md">
                    <ScoreRing value={94} size={40} label="Match" />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 px-2 pt-2.5 pb-1.5">
                <Avatar creator={creator} size={24} />
                <span className="truncate text-[12.5px] font-medium">{creator.name}</span>
                <BadgeCheck className="size-3.5 shrink-0 text-verified" />
                <span className="ml-auto flex items-center gap-1 font-mono text-[10px] text-muted-foreground">
                  <Layers className="size-3" /> {piece.workflow?.steps.length ?? 0} steps
                </span>
              </div>
              <div className="flex gap-1 px-2 pb-1.5">
                {piece.toolIds.slice(0, 2).map((id) => (
                  <ToolChip key={id} toolId={id} />
                ))}
              </div>
            </div>

            {/* Back: how it was made */}
            <div
              style={{ ...face, transform: "rotateY(180deg)" }}
              className="card-surface absolute inset-0 flex flex-col overflow-hidden rounded-[22px] p-4 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)]"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-25 blur-2xl"
                style={{ background: `radial-gradient(circle at 20% 0%, ${piece.palette[0]}, transparent 60%), radial-gradient(circle at 100% 100%, ${piece.palette[1] ?? piece.palette[0]}, transparent 55%)` }}
              />
              <div className={`relative flex flex-1 flex-col text-left ${index === 2 ? "pl-[34%]" : ""}`}>
                <p className="eyebrow flex items-center gap-1 !text-[9.5px]">
                  <Sparkles className="size-2.5 text-violet" /> How it was made
                </p>
                <p className="mt-1 text-[15px] leading-tight font-semibold tracking-tight">{piece.title}</p>
                <ol className="relative mt-3 space-y-2.5 pl-5 before:absolute before:top-1.5 before:bottom-1.5 before:left-[6px] before:w-px before:bg-gradient-to-b before:from-violet before:via-pink before:to-amber">
                  {(piece.workflow?.steps ?? []).slice(0, 4).map((s, i) => (
                    <li key={i} className="relative">
                      <span className="absolute top-0.5 -left-5 flex size-[13px] items-center justify-center rounded-full bg-surface font-mono text-[7.5px] ring-1 ring-violet/60">
                        {i + 1}
                      </span>
                      <p className="text-[11.5px] leading-snug font-medium">{s.title}</p>
                      {s.toolId && <p className="text-[10px] text-muted-foreground">{TOOL_MAP[s.toolId]?.name}</p>}
                    </li>
                  ))}
                </ol>
                <div className="flex-1" />
                <div className="mt-3 grid grid-cols-2 gap-1.5 border-t border-white/[0.08] pt-3 font-mono text-[10.5px]">
                  <span className="flex items-center gap-1.5 text-foreground/85">
                    <Layers className="size-3 text-subtle" /> {piece.workflow?.generations ?? 0} gens
                  </span>
                  <span className="flex items-center gap-1.5 text-foreground/85">
                    <Clock className="size-3 text-subtle" /> {piece.workflow?.hoursSpent ?? 0} hrs
                  </span>
                </div>
                <p className="mt-2.5 flex items-center gap-1.5 text-[10.5px] text-muted-foreground">
                  <Avatar creator={creator} size={16} /> {creator.name}
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
