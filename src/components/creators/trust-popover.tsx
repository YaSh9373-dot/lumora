"use client";

import { Check, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PROOF_FOOTNOTE } from "@/lib/constants";
import type { Creator } from "@/lib/types";
import { cn } from "@/lib/utils";
import { getTrustScore, getVerificationSignals } from "@/lib/verification";
import { ScoreRing, SIGNAL_ICONS } from "./bits";

export function TrustPopover({ creator, size = 56 }: { creator: Creator; size?: number }) {
  const signals = getVerificationSignals(creator);
  const score = getTrustScore(creator);
  return (
    <Popover>
      <PopoverTrigger
        render={
          <button
            type="button"
            className="group inline-flex items-center gap-3 rounded-2xl p-1 pr-3 text-left transition-colors hover:bg-white/5"
            aria-label={`Trust score ${score}. Show breakdown`}
          />
        }
      >
        <ScoreRing value={score} size={size} tone="verified" label="Trust score" />
        <span className="flex flex-col">
          <span className="eyebrow">Trust score</span>
          <span className="text-xs text-muted-foreground underline decoration-dotted underline-offset-4 group-hover:text-foreground">
            See signals
          </span>
        </span>
      </PopoverTrigger>
      <PopoverContent className="glass w-80 rounded-2xl border-white/10 bg-popover/90 p-4" align="start">
        <p className="eyebrow mb-3">Verification signals</p>
        <ul className="space-y-3">
          {signals.map((s) => {
            const Icon = SIGNAL_ICONS[s.key];
            return (
              <li key={s.key} className="flex gap-3">
                <span
                  className={cn(
                    "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg",
                    s.earned ? "bg-verified/15 text-verified" : "bg-white/5 text-subtle",
                  )}
                >
                  <Icon className="size-3.5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2 text-sm">
                    <span className="flex items-center gap-1.5">
                      {s.label}
                      {s.earned ? <Check className="size-3.5 text-verified" /> : <X className="size-3.5 text-subtle" />}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {Math.round(s.points)}/{s.maxPoints}
                    </span>
                  </span>
                  <span className="block text-xs text-muted-foreground">{s.detail}</span>
                  {!s.earned && <span className="block text-xs text-subtle">Earn it: {s.proof}</span>}
                </span>
              </li>
            );
          })}
        </ul>
        <p className="mt-4 border-t border-white/10 pt-3 text-[11px] leading-relaxed text-subtle">{PROOF_FOOTNOTE}</p>
      </PopoverContent>
    </Popover>
  );
}
