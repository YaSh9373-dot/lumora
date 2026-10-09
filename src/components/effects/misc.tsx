import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Global filmic grain. One fixed layer over the app. */
export function NoiseOverlay() {
  return (
    <svg aria-hidden className="pointer-events-none fixed inset-0 z-[100] h-full w-full opacity-[0.04] mix-blend-overlay">
      <filter id="grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#grain)" />
    </svg>
  );
}

/** A light segment orbiting the card border. Parent must be `relative` with rounded corners. */
export function BorderBeam({ duration = 8, size = 120 }: { duration?: number; size?: number }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 rounded-[inherit] [mask-composite:intersect] [-webkit-mask-composite:source-in]"
      style={{
        border: "1px solid transparent",
        WebkitMask: "linear-gradient(transparent, transparent), linear-gradient(#000, #000)",
        mask: "linear-gradient(transparent, transparent), linear-gradient(#000, #000)",
        WebkitMaskClip: "padding-box, border-box",
        maskClip: "padding-box, border-box",
      }}
    >
      <div
        className="absolute aspect-square bg-gradient-to-l from-[#FFB45C] via-[#FF5CAA] to-transparent"
        style={{
          width: size,
          offsetPath: `rect(0 auto auto 0 round ${size}px)`,
          animation: `beam ${duration}s linear infinite`,
        }}
      />
    </div>
  );
}

export function Marquee({ children, className, duration = 40 }: { children: ReactNode; className?: string; duration?: number }) {
  return (
    <div
      className={cn("group relative flex overflow-hidden", className)}
      style={{ maskImage: "linear-gradient(90deg, transparent, black 10%, black 90%, transparent)" }}
    >
      <div
        className="flex w-max shrink-0 gap-3 pr-3 group-hover:[animation-play-state:paused]"
        style={{ animation: `marquee ${duration}s linear infinite` }}
      >
        {children}
        <div aria-hidden className="flex gap-3">
          {children}
        </div>
      </div>
    </div>
  );
}

export function Eyebrow({ children, className, pulse }: { children: ReactNode; className?: string; pulse?: boolean }) {
  return (
    <span className={cn("glass inline-flex items-center gap-2 rounded-full px-3 py-1 eyebrow text-foreground/80", className)}>
      {pulse && (
        <span className="relative flex size-1.5">
          <span className="absolute inset-0 rounded-full bg-verified" style={{ animation: "pulse-dot 2s ease-in-out infinite" }} />
          <span className="relative size-1.5 rounded-full bg-verified" />
        </span>
      )}
      {children}
    </span>
  );
}
