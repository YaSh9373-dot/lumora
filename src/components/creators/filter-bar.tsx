"use client";

import { Check, ChevronDown, SlidersHorizontal, X } from "lucide-react";
import type { ReactNode } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { TOOLS, TOOL_MAP } from "@/data/tools";
import {
  ASPECT_RATIOS,
  AVAILABILITIES,
  AVAILABILITY_LABELS,
  CONTENT_TYPE_LABELS,
  CONTENT_TYPES,
  SAFETY_FOOTNOTE,
  SKILLS,
  SPECIALIZATIONS,
  TURNAROUND_OPTIONS,
} from "@/lib/constants";
import { BUDGET_BOUNDS, countActiveFilters, EMPTY_FILTERS, type CreatorFilters, type FacetGroup, type Facets } from "@/lib/filters";
import { cn } from "@/lib/utils";

interface Option {
  value: string;
  label: string;
  dot?: string;
}

interface GroupDef {
  group: FacetGroup;
  label: string;
  options: Option[];
  helper?: string;
}

const GROUPS: GroupDef[] = [
  { group: "specializations", label: "Specialization", options: SPECIALIZATIONS.map((s) => ({ value: s, label: s })) },
  { group: "tools", label: "Tools", options: TOOLS.map((t) => ({ value: t.id, label: t.name, dot: t.color })) },
  {
    group: "skills",
    label: "Skills",
    options: SKILLS.map((s) => ({ value: s, label: s })),
    helper: "Creator must have all selected skills",
  },
  { group: "contentTypes", label: "Content type", options: CONTENT_TYPES.map((t) => ({ value: t, label: CONTENT_TYPE_LABELS[t] })) },
  { group: "formats", label: "Format", options: ASPECT_RATIOS.map((r) => ({ value: r, label: r })) },
  { group: "availability", label: "Availability", options: AVAILABILITIES.map((a) => ({ value: a, label: AVAILABILITY_LABELS[a] })) },
];

const LABEL_OF: Record<FacetGroup, (v: string) => string> = {
  specializations: (v) => v,
  tools: (v) => TOOL_MAP[v]?.name ?? v,
  skills: (v) => v,
  contentTypes: (v) => CONTENT_TYPE_LABELS[v as keyof typeof CONTENT_TYPE_LABELS] ?? v,
  formats: (v) => v,
  availability: (v) => AVAILABILITY_LABELS[v as keyof typeof AVAILABILITY_LABELS] ?? v,
};

interface Props {
  filters: CreatorFilters;
  facets: Facets;
  onChange: (f: CreatorFilters) => void;
}

function toggle<T extends string>(list: T[], v: T): T[] {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
}

function OptionList({ def, filters, facets, onChange }: { def: GroupDef } & Props) {
  const selected = filters[def.group] as string[];
  return (
    <div>
      {def.helper && <p className="mb-2 px-1 text-[11px] text-subtle">{def.helper}</p>}
      <ul className="max-h-72 space-y-0.5 overflow-y-auto pr-1" role="group" aria-label={def.label}>
        {def.options.map((o) => {
          const on = selected.includes(o.value);
          const count = facets[def.group][o.value] ?? 0;
          return (
            <li key={o.value}>
              <button
                type="button"
                role="checkbox"
                aria-checked={on}
                onClick={() => onChange({ ...filters, [def.group]: toggle(selected, o.value) })}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-[13px] transition-colors hover:bg-white/[0.06]",
                  !on && count === 0 && "opacity-45",
                )}
              >
                <span
                  className={cn(
                    "flex size-4 shrink-0 items-center justify-center rounded-[5px] border transition-colors",
                    on ? "border-violet bg-violet text-white" : "border-white/20",
                  )}
                >
                  {on && <Check className="size-3" />}
                </span>
                {o.dot && <span className="size-1.5 rounded-full" style={{ background: o.dot }} />}
                <span className="flex-1 truncate">{o.label}</span>
                <span className="font-mono text-[11px] text-subtle tabular-nums">{count}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function TriggerChip({ active, count, children, ...props }: { active: boolean; count?: number; children?: ReactNode } & React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[13px] transition-all",
        active ? "border-violet/50 bg-violet/15 text-foreground" : "border-white/10 bg-white/[0.03] text-foreground/80 hover:border-white/20 hover:bg-white/[0.06]",
        props.className,
      )}
    >
      {children}
      {count ? <span className="bg-aurora rounded-full px-1.5 font-mono text-[10px] leading-4 text-white">{count}</span> : null}
      <ChevronDown className="size-3.5 opacity-60" />
    </button>
  );
}

function BudgetControl({ filters, onChange }: Omit<Props, "facets">) {
  const value = filters.budget ? [filters.budget[0], Math.min(filters.budget[1], BUDGET_BOUNDS[1])] : BUDGET_BOUNDS;
  return (
    <div className="space-y-4 px-1 py-1">
      <div className="flex justify-between font-mono text-xs text-muted-foreground">
        <span>${value[0]}</span>
        <span>${value[1]}{value[1] === BUDGET_BOUNDS[1] ? "+" : ""}</span>
      </div>
      <Slider
        min={BUDGET_BOUNDS[0]}
        max={BUDGET_BOUNDS[1]}
        step={50}
        value={[value[0], value[1]]}
        aria-label="Starting price range in USD"
        onValueChange={(v) => {
          const [lo, hi] = v as number[];
          const isFull = lo === BUDGET_BOUNDS[0] && hi === BUDGET_BOUNDS[1];
          onChange({ ...filters, budget: isFull ? null : [lo, hi === BUDGET_BOUNDS[1] ? 100_000 : hi] });
        }}
      />
      <p className="text-[11px] text-subtle">Starting price in USD. INR prices converted at a fixed demo rate (1 USD = ₹85).</p>
    </div>
  );
}

function TurnaroundControl({ filters, onChange }: Omit<Props, "facets">) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {TURNAROUND_OPTIONS.map((d) => (
        <button
          key={d}
          type="button"
          aria-pressed={filters.turnaround === d}
          onClick={() => onChange({ ...filters, turnaround: filters.turnaround === d ? null : d })}
          className={cn(
            "h-8 rounded-full border px-3 text-[13px] transition-colors",
            filters.turnaround === d ? "border-violet/50 bg-violet/15" : "border-white/10 hover:bg-white/[0.06]",
          )}
        >
          ≤ {d} days
        </button>
      ))}
    </div>
  );
}

function Toggles({ filters, onChange, className }: Omit<Props, "facets"> & { className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-x-5 gap-y-3", className)}>
      <label className="flex cursor-pointer items-center gap-2 text-[13px] text-foreground/85">
        <Switch checked={filters.verifiedOnly} onCheckedChange={(v) => onChange({ ...filters, verifiedOnly: v })} />
        Verified only
      </label>
      <label className="flex cursor-pointer items-center gap-2 text-[13px] text-foreground/85" title={SAFETY_FOOTNOTE}>
        <Switch checked={filters.commercialSafeOnly} onCheckedChange={(v) => onChange({ ...filters, commercialSafeOnly: v })} />
        Commercial-safe tools
      </label>
    </div>
  );
}

const popoverClass = "glass w-72 rounded-2xl border-white/10 bg-popover/95 p-3";

export function FilterBar({ filters, facets, onChange }: Props) {
  const active = countActiveFilters(filters);
  return (
    <>
      {/* Desktop: chip popovers */}
      <div className="hidden flex-wrap items-center gap-2 md:flex">
        {GROUPS.map((def) => {
          const n = (filters[def.group] as string[]).length;
          return (
            <Popover key={def.group}>
              <PopoverTrigger render={<TriggerChip active={n > 0} count={n} />}>{def.label}</PopoverTrigger>
              <PopoverContent className={popoverClass} align="start">
                <div className="mb-2 flex items-center justify-between px-1">
                  <span className="eyebrow">{def.label}</span>
                  {n > 0 && (
                    <button type="button" className="text-xs text-muted-foreground hover:text-foreground" onClick={() => onChange({ ...filters, [def.group]: [] })}>
                      Clear
                    </button>
                  )}
                </div>
                <OptionList def={def} filters={filters} facets={facets} onChange={onChange} />
              </PopoverContent>
            </Popover>
          );
        })}
        <Popover>
          <PopoverTrigger render={<TriggerChip active={filters.budget !== null} />}>Budget</PopoverTrigger>
          <PopoverContent className={popoverClass} align="start">
            <span className="eyebrow px-1">Starting price</span>
            <BudgetControl filters={filters} onChange={onChange} />
          </PopoverContent>
        </Popover>
        <Popover>
          <PopoverTrigger render={<TriggerChip active={filters.turnaround !== null} />}>Turnaround</PopoverTrigger>
          <PopoverContent className={popoverClass} align="start">
            <span className="eyebrow mb-2 block px-1">Delivers within</span>
            <TurnaroundControl filters={filters} onChange={onChange} />
          </PopoverContent>
        </Popover>
        <Toggles filters={filters} onChange={onChange} className="ml-2" />
      </div>

      {/* Mobile: bottom sheet */}
      <div className="md:hidden">
        <Sheet>
          <SheetTrigger
            render={
              <button type="button" className="glass inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm">
                <SlidersHorizontal className="size-4" /> Filters
                {active > 0 && <span className="bg-aurora rounded-full px-1.5 font-mono text-[10px] text-white">{active}</span>}
              </button>
            }
          />
          <SheetContent side="bottom" className="max-h-[85vh] rounded-t-[24px] border-white/10 bg-surface">
            <div className="flex items-center justify-between px-5 pt-5">
              <SheetTitle>Filters</SheetTitle>
              {active > 0 && (
                <button type="button" className="mr-10 text-sm text-muted-foreground" onClick={() => onChange(EMPTY_FILTERS)}>
                  Clear all
                </button>
              )}
            </div>
            <div className="space-y-6 overflow-y-auto px-5 pb-8">
              <Toggles filters={filters} onChange={onChange} />
              {GROUPS.map((def) => (
                <section key={def.group}>
                  <p className="eyebrow mb-2">{def.label}</p>
                  <OptionList def={def} filters={filters} facets={facets} onChange={onChange} />
                </section>
              ))}
              <section>
                <p className="eyebrow mb-2">Budget</p>
                <BudgetControl filters={filters} onChange={onChange} />
              </section>
              <section>
                <p className="eyebrow mb-2">Turnaround</p>
                <TurnaroundControl filters={filters} onChange={onChange} />
              </section>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}

export function ActiveFilters({ filters, onChange }: Omit<Props, "facets">) {
  const chips: { key: string; label: string; remove: () => void }[] = [];
  for (const def of GROUPS) {
    for (const v of filters[def.group] as string[]) {
      chips.push({
        key: `${def.group}-${v}`,
        label: LABEL_OF[def.group](v),
        remove: () => onChange({ ...filters, [def.group]: (filters[def.group] as string[]).filter((x) => x !== v) }),
      });
    }
  }
  if (filters.budget) {
    const hi = filters.budget[1] >= BUDGET_BOUNDS[1] ? `${BUDGET_BOUNDS[1]}+` : filters.budget[1];
    chips.push({ key: "budget", label: `$${filters.budget[0]}–$${hi}`, remove: () => onChange({ ...filters, budget: null }) });
  }
  if (filters.turnaround !== null)
    chips.push({ key: "ta", label: `≤ ${filters.turnaround} days`, remove: () => onChange({ ...filters, turnaround: null }) });
  if (filters.verifiedOnly) chips.push({ key: "ver", label: "Verified only", remove: () => onChange({ ...filters, verifiedOnly: false }) });
  if (filters.commercialSafeOnly)
    chips.push({ key: "safe", label: "Commercial-safe", remove: () => onChange({ ...filters, commercialSafeOnly: false }) });

  if (!chips.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {chips.map((c) => (
        <button
          key={c.key}
          type="button"
          onClick={c.remove}
          aria-label={`Remove filter ${c.label}`}
          className="inline-flex h-7 items-center gap-1 rounded-full border border-violet/30 bg-violet/10 pr-1.5 pl-2.5 text-xs transition-colors hover:border-violet/60"
        >
          {c.label} <X className="size-3 opacity-70" />
        </button>
      ))}
      <button type="button" onClick={() => onChange(EMPTY_FILTERS)} className="ml-1 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
        Clear all
      </button>
    </div>
  );
}
