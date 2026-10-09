"use client";

import { AlertCircle, CheckCircle2 } from "lucide-react";
import { PUBLISH_THRESHOLD, type Completeness } from "@/lib/completeness";
import { cn } from "@/lib/utils";

export function CompletenessMeter({ completeness, onJump }: { completeness: Completeness; onJump?: (field: string) => void }) {
  const { percent, missing, canPublish } = completeness;
  return (
    <div className="card-surface p-5">
      <div className="flex items-center justify-between">
        <span className="eyebrow">Brief completeness</span>
        <span className={cn("font-mono text-sm tabular-nums", canPublish ? "text-verified" : "text-foreground")} aria-live="polite">
          {percent}%
        </span>
      </div>
      <div
        className="relative mt-3 h-2 overflow-hidden rounded-full bg-white/[0.06]"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Brief completeness"
      >
        <div
          className="bg-aurora h-full rounded-full transition-[width] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{ width: `${percent}%` }}
        />
        <div className="absolute top-0 h-full w-px bg-white/40" style={{ left: `${PUBLISH_THRESHOLD}%` }} title="Publish threshold" />
      </div>
      {missing.length === 0 ? (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-verified">
          <CheckCircle2 className="size-3.5" /> Everything a creator needs. Ready to publish.
        </p>
      ) : (
        <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Missing fields">
          {missing.map((m) => (
            <li key={m.field}>
              <button
                type="button"
                onClick={() => onJump?.(m.field)}
                className={cn(
                  "inline-flex h-6 items-center gap-1 rounded-full border px-2 text-[11px] transition-colors hover:bg-white/5",
                  m.requiredToPublish ? "border-warning/40 text-warning" : "border-white/10 text-muted-foreground",
                )}
              >
                {m.requiredToPublish && <AlertCircle className="size-3" />}
                {m.label}
              </button>
            </li>
          ))}
        </ul>
      )}
      {!canPublish && <p className="mt-3 text-[11px] text-subtle">Publishing needs {PUBLISH_THRESHOLD}%+ and all highlighted fields.</p>}
    </div>
  );
}
