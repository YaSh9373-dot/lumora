"use client";

import { AnimatePresence, motion } from "motion/react";
import { FileText, LayoutGrid, Plus, Search, SearchX, Sparkles } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GradientButton, GradientLink } from "@/components/effects/gradient-button";
import { AnimatedNumber, EASE } from "@/components/effects/motion";
import { CardGridSkeleton, EmptyState } from "@/components/layout/states";
import {
  defaultSort,
  EMPTY_FILTERS,
  filterCreators,
  filterWorks,
  parseDiscoverParams,
  serializeDiscoverState,
  sortCreators,
  SORT_LABELS,
  type CreatorFilters,
  type DiscoverState,
  type SortKey,
} from "@/lib/filters";
import { rankCreatorsForBrief } from "@/lib/matching";
import { useAllBriefs, useAllCreators, useHydrated } from "@/lib/store";
import { cn } from "@/lib/utils";
import { CreatorCard } from "./creator-card";
import { ActiveFilters, FilterBar } from "./filter-bar";
import { WorkLightbox } from "./work-lightbox";
import { WorkTile } from "./work-tile";

const selectClass =
  "glass h-9 appearance-none rounded-full bg-[length:12px] bg-[right_12px_center] bg-no-repeat pr-8 pl-3.5 text-[13px] text-foreground/90 outline-none focus-visible:ring-2 focus-visible:ring-violet [background-image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%239A9AB0' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")]";

type Work = ReturnType<typeof filterWorks>["results"][number];

/** Round-robin works across creators (in creator order) so the masonry mixes styles. */
function interleaveByCreator(works: Work[], creatorOrder: { id: string }[]): Work[] {
  const groups = creatorOrder.map((c) => works.filter((w) => w.creator.id === c.id)).filter((g) => g.length);
  const out: Work[] = [];
  for (let i = 0; groups.some((g) => g[i]); i++) for (const g of groups) if (g[i]) out.push(g[i]);
  return out;
}

export function Discover() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const state = useMemo(() => parseDiscoverParams(new URLSearchParams(params.toString())), [params]);
  const creators = useAllCreators();
  const briefs = useAllBriefs();
  const hydrated = useHydrated();
  const published = briefs.filter((b) => b.status === "published");

  const [query, setQuery] = useState(state.query);
  // Keep the input in sync when the URL changes externally (back button, command palette)
  const [urlQuery, setUrlQuery] = useState(state.query);
  if (state.query !== urlQuery) {
    setUrlQuery(state.query);
    setQuery(state.query);
  }
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const update = useCallback(
    (patch: Partial<DiscoverState>) => {
      const next = { ...state, ...patch };
      const qs = serializeDiscoverState(next);
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [state, router, pathname],
  );

  // Debounced search → URL
  useEffect(() => {
    if (query === state.query) return;
    const t = setTimeout(() => update({ query }), 150);
    return () => clearTimeout(t);
  }, [query, state.query, update]);

  // Short fake load for skeleton polish
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(t);
  }, []);

  // "/" focuses search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (e.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) && !target.isContentEditable) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const brief = state.briefId ? published.find((b) => b.id === state.briefId) : undefined;
  // Small in-memory dataset: recompute per render, no memoization needed.
  const matchScores = brief ? new Map(rankCreatorsForBrief(creators, brief).map((r) => [r.creator.id, r.match.score])) : undefined;
  const creatorResult = filterCreators(creators, state.filters, state.query);
  const workResult = filterWorks(creators, state.filters, state.query);
  const sorted = sortCreators(creatorResult.results, state.sort, matchScores);
  const works = interleaveByCreator(workResult.results, sortCreators(creators, state.sort, matchScores));

  const isWorks = state.view === "works";
  const facets = isWorks ? workResult.facets : creatorResult.facets;
  const count = isWorks ? works.length : sorted.length;
  const setFilters = (filters: CreatorFilters) => update({ filters });
  const showLoading = loading || !hydrated;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow mb-3">Discover</p>
          <h1 className="text-[clamp(2rem,4.5vw,3rem)] leading-[1.05] font-semibold tracking-[-0.04em]">
            Find your <span className="accent text-aurora pr-1">next</span> creator
          </h1>
          <p className="mt-2 text-sm text-muted-foreground" aria-live="polite">
            <AnimatedNumber value={count} className="font-mono text-foreground" /> {isWorks ? "works" : count === 1 ? "creator" : "creators"}{" "}
            match your filters
          </p>
        </div>
        <div className="glass inline-flex w-fit rounded-full p-1" role="tablist" aria-label="View">
          {(["creators", "works"] as const).map((v) => (
            <button
              key={v}
              type="button"
              role="tab"
              aria-selected={state.view === v}
              onClick={() => update({ view: v })}
              className="relative flex h-8 items-center gap-1.5 rounded-full px-4 text-[13px] capitalize"
            >
              {state.view === v && (
                <motion.span layoutId="view-pill" className="absolute inset-0 rounded-full bg-white/10" transition={{ duration: 0.35, ease: EASE }} />
              )}
              <span className="relative flex items-center gap-1.5">
                {v === "creators" ? <LayoutGrid className="size-3.5" /> : <Sparkles className="size-3.5" />} {v}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={searchRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, tool, skill or specialization…"
          aria-label="Search creators"
          className="glass h-13 w-full rounded-2xl pr-12 pl-11 text-[15px] outline-none placeholder:text-subtle focus-visible:border-violet/50 focus-visible:ring-4 focus-visible:ring-violet/15"
        />
        <kbd className="absolute top-1/2 right-4 hidden -translate-y-1/2 rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground sm:block">
          /
        </kbd>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <FilterBar filters={state.filters} facets={facets} onChange={setFilters} />
        <div className="flex shrink-0 flex-wrap items-center gap-2 lg:flex-nowrap">
          <select
            aria-label="Match for brief"
            className={cn(selectClass, "max-w-[220px]")}
            value={state.briefId ?? ""}
            onChange={(e) => {
              const briefId = e.target.value || null;
              update({ briefId, sort: state.sort === defaultSort(state.briefId) ? defaultSort(briefId) : state.sort });
            }}
          >
            <option value="">Match for brief…</option>
            {published.map((b) => (
              <option key={b.id} value={b.id}>
                {b.title}
              </option>
            ))}
          </select>
          <select aria-label="Sort" className={selectClass} value={state.sort} onChange={(e) => update({ sort: e.target.value as SortKey })}>
            {(Object.keys(SORT_LABELS) as SortKey[])
              .filter((k) => k !== "match" || brief)
              .map((k) => (
                <option key={k} value={k}>
                  {SORT_LABELS[k]}
                </option>
              ))}
          </select>
        </div>
      </div>

      <ActiveFilters filters={state.filters} onChange={setFilters} />

      {brief && (
        <div className="flex items-center gap-2 rounded-xl border border-violet/20 bg-violet/[0.06] px-4 py-2.5 text-[13px] text-foreground/85">
          <FileText className="size-4 text-violet" /> Showing match scores for <span className="font-medium text-foreground">{brief.title}</span>
        </div>
      )}

      {showLoading ? (
        <CardGridSkeleton />
      ) : count === 0 ? (
        <EmptyState icon={SearchX} title="No creators match these filters" description="Try removing a filter or two, or post a brief and let matching do the work.">
          <GradientButton
            variant="secondary"
            onClick={() => {
              setQuery("");
              update({ filters: EMPTY_FILTERS, query: "" });
            }}
          >
            Clear filters
          </GradientButton>
          <GradientLink href="/briefs/new">
            <Plus /> Post a brief
          </GradientLink>
        </EmptyState>
      ) : isWorks ? (
        <div className="masonry columns-2 md:columns-3 xl:columns-4">
          {works.map(({ creator, piece }, i) => (
            <motion.div key={piece.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE, delay: Math.min(i, 12) * 0.04 }}>
              <WorkTile piece={piece} creator={creator} onOpen={() => setLightbox(i)} />
            </motion.div>
          ))}
        </div>
      ) : (
        <motion.div layout className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {sorted.map((c, i) => (
              <motion.div
                key={c.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.4, ease: EASE, delay: Math.min(i, 9) * 0.04 }}
              >
                <CreatorCard creator={c} matchScore={matchScores?.get(c.id)} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      <WorkLightbox items={works} index={isWorks ? lightbox : null} onIndexChange={setLightbox} />
    </div>
  );
}
