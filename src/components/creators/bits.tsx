"use client";

/* eslint-disable @next/next/no-img-element */
import { BadgeCheck, Fingerprint, Heart, ShieldCheck, Workflow, Wrench } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { TOOL_MAP } from "@/data/tools";
import { AVAILABILITY_LABELS } from "@/lib/constants";
import { avatarUrl, initials } from "@/lib/format";
import { useDemoStore, useHydrated } from "@/lib/store";
import type { Availability, Creator } from "@/lib/types";
import { cn } from "@/lib/utils";
import { getVerificationSignals, type SignalKey } from "@/lib/verification";

export function Avatar({ creator, size = 40, className }: { creator: Pick<Creator, "name" | "avatarSeed">; size?: number; className?: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <span
      className={cn("relative inline-flex shrink-0 overflow-hidden rounded-full bg-surface-3 ring-1 ring-white/10", className)}
      style={{ width: size, height: size }}
    >
      {failed ? (
        <span className="bg-aurora flex h-full w-full items-center justify-center font-medium text-white" style={{ fontSize: size * 0.36 }}>
          {initials(creator.name)}
        </span>
      ) : (
        <img
          src={avatarUrl(creator.avatarSeed)}
          alt=""
          width={size}
          height={size}
          className="h-full w-full bg-gradient-to-br from-[#2a2346] to-[#3a1f33] object-cover"
          onError={() => setFailed(true)}
          loading="lazy"
        />
      )}
    </span>
  );
}

export function ToolChip({ toolId, className, size = "sm" }: { toolId: string; className?: string; size?: "sm" | "md" }) {
  const tool = TOOL_MAP[toolId];
  if (!tool) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] whitespace-nowrap text-foreground/85",
        size === "sm" ? "h-6 px-2 text-[11.5px]" : "h-7 px-2.5 text-xs",
        className,
      )}
    >
      <span className="size-1.5 rounded-full" style={{ background: tool.color }} />
      {tool.name}
    </span>
  );
}

export function Chip({ children, className, active }: { children: React.ReactNode; className?: string; active?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1 rounded-full border px-2.5 text-[11.5px] whitespace-nowrap",
        active ? "border-violet/50 bg-violet/15 text-foreground" : "border-white/10 bg-white/[0.04] text-foreground/80",
        className,
      )}
    >
      {children}
    </span>
  );
}

const SIGNAL_ICONS: Record<SignalKey, typeof ShieldCheck> = {
  tools: Wrench,
  workflow: Workflow,
  pastWork: BadgeCheck,
  identity: Fingerprint,
};

export function VerifiedCluster({ creator, className }: { creator: Creator; className?: string }) {
  const signals = getVerificationSignals(creator).filter((s) => s.earned);
  if (!signals.length) return null;
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)}>
      {signals.map((s) => {
        const Icon = SIGNAL_ICONS[s.key];
        return (
          <Tooltip key={s.key}>
            <TooltipTrigger
              render={<span tabIndex={0} aria-label={s.label} className="inline-flex rounded p-0.5 text-verified outline-none focus-visible:ring-2 focus-visible:ring-violet" />}
            >
              <Icon className="size-3.5" />
            </TooltipTrigger>
            <TooltipContent>
              {s.label} · {s.detail}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </span>
  );
}

export { SIGNAL_ICONS };

const AVAIL_COLORS: Record<Availability, string> = { available: "bg-verified", limited: "bg-warning", booked: "bg-subtle" };

export function AvailabilityDot({ availability, showLabel = true }: { availability: Availability; showLabel?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className={cn("size-1.5 rounded-full", AVAIL_COLORS[availability])} />
      {showLabel && AVAILABILITY_LABELS[availability]}
    </span>
  );
}

/** Circular score ring (match % or trust score). */
export function ScoreRing({
  value,
  size = 44,
  stroke = 3.5,
  label,
  tone = "aurora",
  className,
}: {
  value: number;
  size?: number;
  stroke?: number;
  label?: string;
  tone?: "aurora" | "verified";
  className?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const id = `ring-${tone}`;
  return (
    <span
      className={cn("relative inline-flex shrink-0 items-center justify-center", className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${label ?? "Score"} ${value} out of 100`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            {tone === "aurora" ? (
              <>
                <stop offset="0%" stopColor="#7C5CFF" />
                <stop offset="55%" stopColor="#FF5CAA" />
                <stop offset="100%" stopColor="#FFB45C" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#34D399" />
                <stop offset="100%" stopColor="#22D3EE" />
              </>
            )}
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${id})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.max(0, Math.min(100, value)) / 100)}
          style={{ transition: "stroke-dashoffset 700ms cubic-bezier(0.22,1,0.36,1)" }}
        />
      </svg>
      <span className="absolute font-mono font-medium tabular-nums" style={{ fontSize: size * 0.28 }}>
        {value}
      </span>
    </span>
  );
}

export function ShortlistButton({ creatorId, className, withLabel }: { creatorId: string; className?: string; withLabel?: boolean }) {
  const hydrated = useHydrated();
  const active = useDemoStore((s) => s.shortlist.includes(creatorId)) && hydrated;
  const toggle = useDemoStore((s) => s.toggleShortlist);
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={active ? "Remove from shortlist" : "Add to shortlist"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(creatorId);
        toast(active ? "Removed from shortlist" : "Added to shortlist");
      }}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full transition-all duration-300 hover:scale-105 active:scale-95",
        withLabel ? "glass h-10 rounded-[12px] px-4 text-sm hover:bg-white/10 hover:scale-100" : "size-9 bg-black/35 backdrop-blur-md ring-1 ring-white/15",
        className,
      )}
    >
      <Heart className={cn("size-4 transition-colors", active ? "fill-pink text-pink" : "text-white")} />
      {withLabel && (active ? "Shortlisted" : "Shortlist")}
    </button>
  );
}
