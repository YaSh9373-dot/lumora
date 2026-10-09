"use client";

import { BadgeCheck, Clock, Globe2, Link2, MapPin, MessageSquare, RefreshCw, Send, ShieldCheck, Star, UserX } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AuroraBackground } from "@/components/effects/aurora-background";
import { GradientButton, GradientLink } from "@/components/effects/gradient-button";
import { PageEnter, Reveal } from "@/components/effects/motion";
import { Container, EmptyState, SkeletonBlock } from "@/components/layout/states";
import { getCreatorBySlug } from "@/data/creators";
import { TOOL_MAP } from "@/data/tools";
import {
  AVAILABILITY_LABELS,
  CONTENT_TYPE_LABELS,
  EXCLUSIVITY_LABELS,
  LICENSE_LABELS,
  LICENSE_USES,
  OWNERSHIP_LABELS,
  SAFETY_FOOTNOTE,
} from "@/lib/constants";
import { formatPrice } from "@/lib/format";
import { useDemoStore, useHydrated } from "@/lib/store";
import type { Creator } from "@/lib/types";
import { cn } from "@/lib/utils";
import { commercialSafeRatio, hasWorkflow } from "@/lib/verification";
import { AvailabilityDot, Avatar, Chip, ShortlistButton, ToolChip, VerifiedCluster } from "./bits";
import { InviteSheet } from "./invite-sheet";
import { TrustPopover } from "./trust-popover";
import { WorkLightbox } from "./work-lightbox";
import { CONTENT_ICONS, WorkTile } from "./work-tile";

const SECTIONS = [
  { id: "portfolio", label: "Portfolio" },
  { id: "workflows", label: "Workflows" },
  { id: "tools", label: "Tools & Skills" },
  { id: "terms", label: "Commercial terms" },
  { id: "reviews", label: "Reviews" },
];

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <Reveal>
      <section id={id} className="scroll-mt-32">
        <h2 className="mb-5 text-xl font-semibold tracking-tight">{title}</h2>
        {children}
      </section>
    </Reveal>
  );
}

export function CreatorProfile({ slug }: { slug: string }) {
  const hydrated = useHydrated();
  const userCreator = useDemoStore((s) => s.userCreator);
  const creator = getCreatorBySlug(slug, userCreator ? [userCreator] : []);

  if (!creator) {
    if (!hydrated) {
      return (
        <Container className="space-y-6 pt-12">
          <SkeletonBlock className="h-64 rounded-[24px]" />
          <SkeletonBlock className="h-96 rounded-[24px]" />
        </Container>
      );
    }
    return (
      <Container className="pt-16">
        <EmptyState icon={UserX} title="Creator not found" description="This profile doesn't exist or was removed.">
          <GradientLink href="/creators">Browse creators</GradientLink>
        </EmptyState>
      </Container>
    );
  }
  return <Profile creator={creator} />;
}

function Profile({ creator }: { creator: Creator }) {
  const [lightbox, setLightbox] = useState<number | null>(null);
  const items = creator.portfolio.map((piece) => ({ creator, piece }));
  const palette = creator.portfolio[0]?.palette ?? ["#7C5CFF", "#FF5CAA", "#FFB45C"];
  const safePct = Math.round(commercialSafeRatio(creator) * 100);
  const workflowPieces = creator.portfolio.filter(hasWorkflow);

  const share = () => {
    void navigator.clipboard?.writeText(window.location.href);
    toast.success("Profile link copied");
  };

  const inviteButton = (
    <GradientButton size="lg" className="w-full sm:w-auto">
      <Send /> Invite to a brief
    </GradientButton>
  );

  return (
    <PageEnter>
      {/* Banner */}
      <div className="relative overflow-hidden border-b border-white/[0.06]">
        <AuroraBackground colors={[palette[0], palette[1] ?? palette[0], palette[2] ?? palette[0]]} intensity={0.45} />
        <Container className="relative pt-16 pb-10 sm:pt-24">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
              <div className="rounded-full bg-aurora p-[2px] shadow-[0_0_40px_-8px_rgba(255,92,170,0.6)]">
                <Avatar creator={creator} size={112} className="ring-4 ring-background" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-[clamp(2rem,4vw,2.8rem)] leading-none font-semibold tracking-[-0.04em]">{creator.name}</h1>
                  <VerifiedCluster creator={creator} />
                  {creator.isUserCreated && <span className="bg-aurora rounded-full px-2 py-0.5 text-[11px] font-semibold text-white">You</span>}
                </div>
                <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                  <span className="font-mono text-xs">{creator.handle}</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3.5" /> {creator.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="size-3.5 fill-amber text-amber" /> {creator.reviewCount ? `${creator.rating.toFixed(1)} (${creator.reviewCount})` : "New"}
                  </span>
                  <AvailabilityDot availability={creator.availability} />
                </p>
                <p className="mt-3 max-w-xl text-[17px] text-foreground/90">{creator.headline}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {creator.specializations.map((s) => (
                    <Chip key={s}>{s}</Chip>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex flex-col items-start gap-4 lg:items-end">
              <TrustPopover creator={creator} />
              <div className="flex w-full flex-wrap gap-2 sm:w-auto">
                <InviteSheet creator={creator} trigger={inviteButton} />
                <ShortlistButton creatorId={creator.id} withLabel />
                <GradientButton variant="secondary" size="lg" onClick={share} aria-label="Copy profile link">
                  <Link2 /> Share
                </GradientButton>
              </div>
            </div>
          </div>
        </Container>
      </div>

      {/* Sticky sub-nav */}
      <div className="sticky top-16 z-30 border-b border-white/[0.06] bg-background/70 backdrop-blur-xl">
        <Container>
          <nav className="no-scrollbar flex gap-1 overflow-x-auto py-2" aria-label="Profile sections">
            {SECTIONS.map((s) => (
              <a key={s.id} href={`#${s.id}`} className="shrink-0 rounded-lg px-3 py-1.5 text-[13px] text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground">
                {s.label}
              </a>
            ))}
          </nav>
        </Container>
      </div>

      <Container className="grid gap-12 pt-10 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-16">
          <p className="max-w-2xl text-[15px] leading-relaxed text-muted-foreground">{creator.bio}</p>

          <Section id="portfolio" title="Portfolio">
            <div className="masonry columns-2 xl:columns-3">
              {creator.portfolio.map((p, i) => (
                <div key={p.id}>
                  <WorkTile piece={p} onOpen={() => setLightbox(i)} />
                  <div className="mt-2 flex items-center justify-between px-1 text-xs">
                    <span className="truncate font-medium">{p.title}</span>
                    <span className="font-mono text-subtle">{p.aspectRatio}</span>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section id="workflows" title="Workflows">
            {workflowPieces.length ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {workflowPieces.map((p) => {
                  const Icon = CONTENT_ICONS[p.contentType];
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setLightbox(creator.portfolio.indexOf(p))}
                      className="card-surface group p-5 text-left transition-colors hover:border-border-strong"
                    >
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Icon className="size-4 text-muted-foreground" /> {p.title}
                      </div>
                      <p className="mt-1 line-clamp-2 text-[13px] text-muted-foreground">{p.workflow?.summary}</p>
                      <div className="mt-4 flex items-center gap-1">
                        {p.workflow?.steps.map((s, i) => (
                          <span key={i} className="flex items-center gap-1">
                            <span className="h-1.5 w-6 rounded-full bg-gradient-to-r from-violet to-pink opacity-80" title={s.title} />
                          </span>
                        ))}
                        <span className="ml-2 font-mono text-[11px] text-subtle">{p.workflow?.steps.length} steps</span>
                      </div>
                      <div className="mt-3 flex gap-4 font-mono text-[11px] text-muted-foreground">
                        <span>{p.workflow?.generations} gens</span>
                        <span>{p.workflow?.hoursSpent} hrs</span>
                        <span className="ml-auto text-violet opacity-0 transition-opacity group-hover:opacity-100">View →</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No workflows shared yet.</p>
            )}
          </Section>

          <Section id="tools" title="Tools & Skills">
            <div className="card-surface divide-y divide-white/[0.06]">
              {creator.tools.map((t) => {
                const tool = TOOL_MAP[t.toolId];
                if (!tool) return null;
                return (
                  <div key={t.toolId} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5">
                    <div className="flex min-w-[180px] flex-1 items-center gap-2.5">
                      <span className="size-2 rounded-full" style={{ background: tool.color }} />
                      <span className="text-sm font-medium">{tool.name}</span>
                      <span className="eyebrow !text-[10px]">{tool.category}</span>
                    </div>
                    <div className="flex items-center gap-1" role="img" aria-label={`Proficiency ${t.level} of 5`}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <span key={n} className={cn("h-1.5 w-5 rounded-full", n <= t.level ? "bg-aurora" : "bg-white/10")} />
                      ))}
                    </div>
                    <span className="w-14 font-mono text-xs text-muted-foreground">{t.yearsUsing} yr{t.yearsUsing === 1 ? "" : "s"}</span>
                    <span className="flex w-40 items-center justify-end gap-2">
                      {t.verified && (
                        <span className="flex items-center gap-1 text-xs text-verified">
                          <BadgeCheck className="size-3.5" /> Verified
                        </span>
                      )}
                      {tool.commerciallySafe && (
                        <span className="rounded-full bg-info/10 px-2 py-0.5 text-[10.5px] text-info" title={SAFETY_FOOTNOTE}>
                          Commercial-safe
                        </span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <div>
                <p className="eyebrow mb-2">Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {creator.skills.map((s) => (
                    <Chip key={s}>{s}</Chip>
                  ))}
                </div>
              </div>
              <div>
                <p className="eyebrow mb-2">Styles</p>
                <div className="flex flex-wrap gap-1.5">
                  {creator.styles.map((s) => (
                    <Chip key={s} className="capitalize">{s}</Chip>
                  ))}
                </div>
              </div>
              <div>
                <p className="eyebrow mb-2">Content types & formats</p>
                <div className="flex flex-wrap gap-1.5">
                  {creator.contentTypes.map((t) => (
                    <Chip key={t}>{CONTENT_TYPE_LABELS[t]}</Chip>
                  ))}
                  {creator.formats.map((f) => (
                    <Chip key={f} className="font-mono">{f}</Chip>
                  ))}
                </div>
              </div>
              <div>
                <p className="eyebrow mb-2">Languages</p>
                <p className="flex items-center gap-1.5 text-sm text-foreground/85">
                  <Globe2 className="size-3.5 text-muted-foreground" /> {creator.languages.join(", ")}
                </p>
              </div>
            </div>
          </Section>

          <Section id="terms" title="Commercial terms">
            <div className="card-surface overflow-hidden">
              <dl className="divide-y divide-white/[0.06] text-sm">
                <div className="grid gap-2 px-5 py-4 sm:grid-cols-[200px_1fr]">
                  <dt className="text-muted-foreground">Licenses offered</dt>
                  <dd className="flex flex-wrap gap-1.5">
                    {LICENSE_USES.map((u) => {
                      const on = creator.commercial.licensesOffered.includes(u);
                      return (
                        <span key={u} className={cn("rounded-full px-2.5 py-0.5 text-xs", on ? "bg-verified/10 text-verified" : "bg-white/5 text-subtle line-through")}>
                          {LICENSE_LABELS[u]}
                        </span>
                      );
                    })}
                  </dd>
                </div>
                <Row label="Ownership" value={creator.commercial.ownershipOptions.map((o) => OWNERSHIP_LABELS[o]).join(" · ")} />
                <Row label="Exclusivity available" value={creator.commercial.exclusivityAvailable.map((e) => EXCLUSIVITY_LABELS[e]).join(" · ")} />
                <Row label="Usage durations" value={creator.commercial.usageDurations.join(" · ")} />
                <div className="grid gap-2 px-5 py-4 sm:grid-cols-[200px_1fr]">
                  <dt className="text-muted-foreground">Commercial-safe tools</dt>
                  <dd className="flex items-center gap-3">
                    <span className="h-1.5 w-32 overflow-hidden rounded-full bg-white/10">
                      <span className="block h-full rounded-full bg-gradient-to-r from-verified to-info" style={{ width: `${safePct}%` }} />
                    </span>
                    <span className="font-mono text-xs">{safePct}%</span>
                  </dd>
                </div>
                <Row label="AI disclosure" value={creator.commercial.aiDisclosure} />
                <Row label="Training data" value={creator.commercial.trainingDataStatement} />
                <Row label="Revisions included" value={String(creator.revisionsIncluded)} />
                <Row label="Turnaround" value={`${creator.turnaroundDays} days`} />
              </dl>
            </div>
            <p className="mt-3 text-[11px] text-subtle">{SAFETY_FOOTNOTE}</p>
          </Section>

          <Section id="reviews" title="Reviews">
            <div className="grid gap-4 sm:grid-cols-2">
              {creator.testimonials.map((t) => (
                <figure key={t.brand} className="card-surface p-6">
                  <div className="flex gap-0.5" aria-label={`${t.rating} out of 5 stars`}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star key={n} className={cn("size-3.5", n <= Math.round(t.rating) ? "fill-amber text-amber" : "text-white/15")} />
                    ))}
                  </div>
                  <blockquote className="mt-3 text-[15px] leading-relaxed">&ldquo;{t.quote}&rdquo;</blockquote>
                  <figcaption className="eyebrow mt-4">{t.brand}</figcaption>
                </figure>
              ))}
              {creator.testimonials.length === 0 && <p className="text-sm text-muted-foreground">No reviews yet.</p>}
            </div>
          </Section>
        </div>

        {/* Hire card */}
        <aside className="lg:sticky lg:top-32 lg:self-start">
          <div className="card-surface relative overflow-hidden p-6">
            <div className="bg-aurora pointer-events-none absolute -top-20 -right-20 size-40 rounded-full opacity-20 blur-3xl" />
            <p className="eyebrow">Starting at</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight">{formatPrice(creator.startingPrice, creator.currency)}</p>
            <ul className="mt-5 space-y-3 text-sm">
              <HireRow icon={Clock} label="Typical turnaround" value={`${creator.turnaroundDays} days`} />
              <HireRow icon={RefreshCw} label="Revisions included" value={String(creator.revisionsIncluded)} />
              <HireRow icon={ShieldCheck} label="Availability" value={AVAILABILITY_LABELS[creator.availability]} />
              <HireRow icon={MessageSquare} label="Responds in" value={`~${creator.responseTimeHours}h`} />
              <HireRow icon={BadgeCheck} label="Projects completed" value={String(creator.projectsCompleted)} />
            </ul>
            <div className="mt-6 flex flex-col gap-2">
              <InviteSheet
                creator={creator}
                trigger={
                  <GradientButton className="w-full" size="lg">
                    <Send /> Invite to a brief
                  </GradientButton>
                }
              />
              <ShortlistButton creatorId={creator.id} withLabel className="w-full" />
            </div>
            <div className="mt-5 flex flex-wrap gap-1.5 border-t border-white/[0.06] pt-4">
              {creator.tools.map((t) => (
                <ToolChip key={t.toolId} toolId={t.toolId} />
              ))}
            </div>
          </div>
        </aside>
      </Container>

      <WorkLightbox items={items} index={lightbox} onIndexChange={setLightbox} />
    </PageEnter>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 px-5 py-4 sm:grid-cols-[200px_1fr] sm:gap-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-foreground/90">{value}</dd>
    </div>
  );
}

function HireRow({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string }) {
  return (
    <li className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-3.5" /> {label}
      </span>
      <span className="font-medium">{value}</span>
    </li>
  );
}
