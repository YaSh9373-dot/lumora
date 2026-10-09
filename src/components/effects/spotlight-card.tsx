"use client";

import type { CSSProperties, HTMLAttributes, MouseEvent } from "react";
import { cn } from "@/lib/utils";

interface Props extends HTMLAttributes<HTMLDivElement> {
  /** Spotlight color (rgba). */
  glow?: string;
  interactive?: boolean;
}

/** Card with a cursor-following radial highlight and a gradient hairline border on hover. */
export function SpotlightCard({ className, children, glow = "rgba(124,92,255,0.14)", interactive = true, style, ...props }: Props) {
  function onMouseMove(e: MouseEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
    props.onMouseMove?.(e);
  }
  return (
    <div
      {...props}
      onMouseMove={onMouseMove}
      style={{ "--glow": glow, ...style } as CSSProperties}
      className={cn(
        "card-surface group/spot relative isolate overflow-hidden transition-[transform,border-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
        interactive && "hover:-translate-y-0.5 hover:border-border-strong",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-300 group-hover/spot:opacity-100"
        style={{ background: "radial-gradient(420px circle at var(--mx, 50%) var(--my, 50%), var(--glow), transparent 60%)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover/spot:opacity-100"
        style={{
          padding: 1,
          background:
            "radial-gradient(260px circle at var(--mx, 50%) var(--my, 50%), rgba(255,255,255,0.35), rgba(124,92,255,0.25) 40%, transparent 70%)",
          WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
        }}
      />
      {children}
    </div>
  );
}
