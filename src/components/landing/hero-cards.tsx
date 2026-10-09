"use client";

import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import { BadgeCheck, Layers } from "lucide-react";
import { useEffect } from "react";
import { Avatar, ScoreRing, ToolChip } from "@/components/creators/bits";
import { AuroraCover } from "@/components/effects/aurora-cover";
import { EASE } from "@/components/effects/motion";
import { CREATORS } from "@/data/creators";

const PICKS = [
  {
    creator: CREATORS[2],
    piece: CREATORS[2].portfolio[0],
    rotate: -8,
    x: "-58%",
    y: 28,
    depth: 18,
    z: 1,
  },
  {
    creator: CREATORS[0],
    piece: CREATORS[0].portfolio[1],
    rotate: 0,
    x: "0%",
    y: 0,
    depth: 30,
    z: 3,
  },
  {
    creator: CREATORS[3],
    piece: CREATORS[3].portfolio[0],
    rotate: 8,
    x: "58%",
    y: 32,
    depth: 14,
    z: 2,
  },
];

export function HeroCards() {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 18 });
  const sy = useSpring(my, { stiffness: 60, damping: 18 });
  const reduce = useReducedMotion();

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
    <div className="relative mx-auto mt-16 h-[420px] w-full max-w-4xl [perspective:1400px] sm:h-[480px]">
      {PICKS.map((p, i) => (
        <Card key={p.piece.id} pick={p} index={i} sx={sx} sy={sy} />
      ))}
    </div>
  );
}

function Card({
  pick,
  index,
  sx,
  sy,
}: {
  pick: (typeof PICKS)[number];
  index: number;
  sx: ReturnType<typeof useSpring>;
  sy: ReturnType<typeof useSpring>;
}) {
  const tx = useTransform(sx, (v) => v * pick.depth * 2);
  const ty = useTransform(sy, (v) => v * pick.depth * 1.4);
  const rY = useTransform(sx, (v) => v * 10);
  const rX = useTransform(sy, (v) => -v * 8);
  const { creator, piece } = pick;
  const center = index === 1;

  return (
    <div
      className={`absolute left-1/2 w-[200px] sm:w-[260px] ${center ? "" : "hidden sm:block"}`}
      style={{
        zIndex: pick.z,
        top: pick.y,
        transform: `translateX(-50%) translateX(${pick.x})`,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 60, rotate: pick.rotate * 1.5 }}
        animate={{ opacity: 1, y: 0, rotate: pick.rotate }}
        transition={{ duration: 1, ease: EASE, delay: 0.3 + index * 0.12 }}
      >
        <motion.div style={{ x: tx, y: ty, rotateX: rX, rotateY: rY }}>
          <div className="card-surface overflow-hidden rounded-[22px] p-1.5 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)]">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[16px]">
              <AuroraCover
                seed={piece.id}
                palette={piece.palette}
                contentType={piece.contentType}
                durationSec={piece.durationSec}
                title={piece.title}
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
        </motion.div>
      </motion.div>
    </div>
  );
}
