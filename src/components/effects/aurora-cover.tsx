"use client";

/* eslint-disable @next/next/no-img-element */
import { Music2, Play } from "lucide-react";
import { useEffect, useRef } from "react";
import { getAuroraCoverStyle } from "@/lib/cover";
import { formatDuration } from "@/lib/format";
import type { ContentType } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  seed: string;
  palette: string[];
  title?: string;
  contentType?: ContentType;
  durationSec?: number;
  coverUrl?: string;
  /** Local mp4 (e.g. /media/x.mp4). Plays muted and looped. */
  videoUrl?: string;
  /** Controls playback. Omit to autoplay; pass false/true to pause/play (e.g. on hover). */
  playing?: boolean;
  className?: string;
  showBadges?: boolean;
}

function CoverVideo({ src, playing }: { src: string; playing?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  const shouldPlay = playing ?? true;
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (shouldPlay && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // play() rejects if interrupted by a quick pause; that's fine
      v.play().catch(() => {});
    } else {
      v.pause();
    }
  }, [shouldPlay]);
  return (
    <video
      ref={ref}
      src={src}
      muted
      loop
      playsInline
      preload={playing === undefined ? "auto" : "none"}
      aria-hidden
      className={cn(
        "absolute inset-0 h-full w-full object-cover transition-opacity duration-500",
        shouldPlay ? "opacity-100" : "opacity-0",
      )}
    />
  );
}

/** Deterministic procedural cover art; a real `coverUrl` takes precedence. */
export function AuroraCover({ seed, palette, title, contentType, durationSec, coverUrl, videoUrl, playing, className, showBadges = true }: Props) {
  const style = getAuroraCoverStyle(seed, palette);
  const timed = contentType === "video" || contentType === "animation";
  const videoActive = Boolean(videoUrl) && (playing ?? true);
  return (
    <div className={cn("relative h-full w-full overflow-hidden", className)} style={{ backgroundColor: style.base }}>
      {coverUrl ? (
        <>
          <img src={coverUrl} alt={title ?? ""} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
          {videoUrl && <CoverVideo src={videoUrl} playing={playing} />}
        </>
      ) : (
        <>
          <div className="absolute inset-0 scale-110 blur-2xl" style={{ backgroundImage: style.backgroundImage }} />
          <div
            className="absolute inset-0 opacity-30 mix-blend-soft-light"
            style={{ backgroundImage: `conic-gradient(from ${style.angle}deg at 50% 50%, transparent, rgba(255,255,255,0.4), transparent 40%)` }}
          />
          <svg aria-hidden className="absolute inset-0 h-full w-full opacity-[0.18] mix-blend-overlay">
            <filter id={`g-${seed}`}>
              <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
            </filter>
            <rect width="100%" height="100%" filter={`url(#g-${seed})`} />
          </svg>
          {title && (
            <div className={cn("absolute inset-0 flex justify-center p-4", showBadges && timed ? "items-end pb-6" : "items-center")}>
              <span className="accent text-center text-[clamp(1rem,4vw,1.6rem)] leading-tight text-white/85 drop-shadow-[0_2px_12px_rgba(0,0,0,0.35)]">
                {title}
              </span>
            </div>
          )}
        </>
      )}
      {showBadges && timed && !videoActive && (
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex size-11 items-center justify-center rounded-full bg-black/25 text-white/90 backdrop-blur-md ring-1 ring-white/20">
            <Play className="ml-0.5 size-4 fill-current" />
          </span>
        </span>
      )}
      {showBadges && contentType === "audio" && (
        <span className="absolute inset-0 flex items-center justify-center text-white/80">
          <Music2 className="size-8" />
        </span>
      )}
      {showBadges && durationSec ? (
        <span className="absolute right-2 bottom-2 rounded-md bg-black/45 px-1.5 py-0.5 font-mono text-[10px] text-white/90 backdrop-blur-md">
          {formatDuration(durationSec)}
        </span>
      ) : null}
    </div>
  );
}
