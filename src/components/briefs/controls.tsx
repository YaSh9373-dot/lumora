"use client";

import { Check, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const inputClass =
  "h-10 w-full rounded-[12px] border border-white/10 bg-white/[0.03] px-3 text-sm outline-none transition-colors placeholder:text-subtle hover:border-white/15 focus-visible:border-violet/60 focus-visible:ring-4 focus-visible:ring-violet/15";

export const selectClass = cn(
  inputClass,
  "appearance-none bg-[length:12px] bg-[right_12px_center] bg-no-repeat pr-8 [background-image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%239A9AB0' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")]",
);

interface FieldProps {
  id: string;
  label: string;
  children: ReactNode;
  hint?: string;
  error?: string;
  aiSuggested?: boolean;
  /** Changes when AI fills the form, restarting the flash animation. */
  flashKey?: number;
  flashDelay?: number;
  className?: string;
}

export function Field({ id, label, children, hint, error, aiSuggested, flashKey, flashDelay = 0, className }: FieldProps) {
  return (
    <div
      id={`field-${id}`}
      key={aiSuggested ? `ai-${flashKey}` : "user"}
      className={cn("scroll-mt-28 rounded-[14px]", aiSuggested && flashKey ? "animate-field-flash" : "", className)}
      style={{ animationDelay: `${flashDelay}ms` }}
    >
      <div className="mb-1.5 flex items-center gap-2">
        <label htmlFor={id} className="text-[13px] font-medium text-foreground/90">
          {label}
        </label>
        {aiSuggested && (
          <span className="inline-flex items-center gap-1 rounded-full bg-violet/15 px-1.5 py-px text-[10px] text-violet">
            <Sparkles className="size-2.5" /> AI-suggested
          </span>
        )}
      </div>
      {children}
      {hint && !error && <p className="mt-1 text-[11px] text-subtle">{hint}</p>}
      {error && <p className="mt-1 text-[11px] text-danger" role="alert">{error}</p>}
    </div>
  );
}

interface ChipToggleProps<T extends string> {
  id?: string;
  options: readonly T[];
  value: T[];
  onChange: (v: T[]) => void;
  label?: (v: T) => ReactNode;
  max?: number;
  className?: string;
}

export function ChipMulti<T extends string>({ id, options, value, onChange, label = (v) => v, max, className }: ChipToggleProps<T>) {
  return (
    <div id={id} className={cn("flex flex-wrap gap-1.5", className)} role="group">
      {options.map((o) => {
        const on = value.includes(o);
        const disabled = !on && max !== undefined && value.length >= max;
        return (
          <button
            key={o}
            type="button"
            aria-pressed={on}
            disabled={disabled}
            onClick={() => onChange(on ? value.filter((v) => v !== o) : [...value, o])}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[12.5px] transition-all disabled:opacity-35",
              on ? "border-violet/50 bg-violet/15 text-foreground" : "border-white/10 text-foreground/75 hover:border-white/20 hover:bg-white/[0.04]",
            )}
          >
            {on && <Check className="size-3" />}
            {label(o)}
          </button>
        );
      })}
    </div>
  );
}

export function Segmented<T extends string | number>({
  id,
  options,
  value,
  onChange,
  label = (v) => String(v),
}: {
  id?: string;
  options: readonly T[];
  value: T | undefined;
  onChange: (v: T) => void;
  label?: (v: T) => ReactNode;
}) {
  return (
    <div id={id} className="inline-flex flex-wrap gap-1 rounded-[12px] border border-white/10 bg-white/[0.02] p-1" role="radiogroup">
      {options.map((o) => (
        <button
          key={String(o)}
          type="button"
          role="radio"
          aria-checked={value === o}
          onClick={() => onChange(o)}
          className={cn(
            "h-8 rounded-[9px] px-3 text-[12.5px] transition-all",
            value === o ? "bg-white/10 text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {label(o)}
        </button>
      ))}
    </div>
  );
}
