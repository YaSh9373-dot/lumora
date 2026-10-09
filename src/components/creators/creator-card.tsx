"use client";

import { Star } from "lucide-react";
import Link from "next/link";
import { AuroraCover } from "@/components/effects/aurora-cover";
import { SpotlightCard } from "@/components/effects/spotlight-card";
import { formatPrice } from "@/lib/format";
import type { Creator } from "@/lib/types";
import { AvailabilityDot, Avatar, ScoreRing, ShortlistButton, ToolChip, VerifiedCluster } from "./bits";

interface Props {
  creator: Creator;
  matchScore?: number;
}

export function CreatorCard({ creator, matchScore }: Props) {
  const [a, b, c] = creator.portfolio;
  const extraTools = creator.tools.length - 3;
  return (
    <SpotlightCard className="h-full">
      <Link href={`/creators/${creator.slug}`} className="flex h-full flex-col outline-none focus-visible:ring-2 focus-visible:ring-violet rounded-[20px]">
        <div className="relative grid h-44 grid-cols-3 grid-rows-2 gap-1 p-1">
          {a && (
            <div className="col-span-2 row-span-2 overflow-hidden rounded-[16px_6px_6px_6px]">
              <AuroraCover seed={a.id} palette={a.palette} coverUrl={a.coverUrl} contentType={a.contentType} showBadges={false} className="transition-transform duration-700 group-hover/spot:scale-105" />
            </div>
          )}
          {[b, c].map((p, i) =>
            p ? (
              <div key={p.id} className={i === 0 ? "overflow-hidden rounded-[6px_16px_6px_6px]" : "overflow-hidden rounded-[6px]"}>
                <AuroraCover seed={p.id} palette={p.palette} coverUrl={p.coverUrl} showBadges={false} className="transition-transform duration-700 group-hover/spot:scale-110" />
              </div>
            ) : (
              <div key={i} className="rounded-md bg-surface-2" />
            ),
          )}
          <div className="absolute top-3 right-3 flex items-center gap-2">
            {creator.isUserCreated && <span className="bg-aurora rounded-full px-2 py-0.5 text-[10px] font-semibold text-white">You</span>}
            <ShortlistButton creatorId={creator.id} />
          </div>
          {matchScore !== undefined && (
            <div className="absolute bottom-3 left-3 rounded-full bg-black/50 p-0.5 backdrop-blur-md">
              <ScoreRing value={matchScore} size={42} label="Match" />
            </div>
          )}
        </div>
        <div className="relative flex flex-1 flex-col px-5 pb-5">
          <Avatar creator={creator} size={52} className="-mt-7 ring-4 ring-surface" />
          <div className="mt-2 flex items-center gap-1.5">
            <h3 className="truncate text-[15px] font-semibold tracking-tight">{creator.name}</h3>
            <VerifiedCluster creator={creator} />
          </div>
          <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-muted-foreground">{creator.headline}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {creator.tools.slice(0, 3).map((t) => (
              <ToolChip key={t.toolId} toolId={t.toolId} />
            ))}
            {extraTools > 0 && <span className="inline-flex h-6 items-center rounded-full px-2 text-[11.5px] text-muted-foreground">+{extraTools}</span>}
          </div>
          <div className="mt-auto flex items-center justify-between border-t border-white/[0.06] pt-3 mt-4 text-xs">
            <span>
              <span className="text-subtle">From </span>
              <span className="font-medium text-foreground">{formatPrice(creator.startingPrice, creator.currency)}</span>
            </span>
            <span className="flex items-center gap-3">
              <AvailabilityDot availability={creator.availability} showLabel={false} />
              {creator.reviewCount ? (
                <span className="inline-flex items-center gap-1 text-foreground/90">
                  <Star className="size-3 fill-amber text-amber" />
                  {creator.rating.toFixed(1)}
                  <span className="text-subtle">({creator.reviewCount})</span>
                </span>
              ) : (
                <span className="text-verified">New</span>
              )}
            </span>
          </div>
        </div>
      </Link>
    </SpotlightCard>
  );
}
