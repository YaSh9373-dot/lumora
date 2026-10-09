"use client";

import { BadgeCheck, Check, ChevronLeft, ChevronRight, Clock, Copy, Layers, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AuroraCover } from "@/components/effects/aurora-cover";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { CONTENT_TYPE_LABELS } from "@/lib/constants";
import { formatDuration } from "@/lib/format";
import type { Creator, PortfolioPiece } from "@/lib/types";
import { Avatar, ToolChip } from "./bits";

export interface LightboxItem {
  creator: Creator;
  piece: PortfolioPiece;
}

interface Props {
  items: LightboxItem[];
  index: number | null;
  onIndexChange: (index: number | null) => void;
}

function youTubeId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
  return m ? m[1] : null;
}

function Media({ piece }: { piece: PortfolioPiece }) {
  const yt = piece.mediaUrl ? youTubeId(piece.mediaUrl) : null;
  if (yt) {
    return (
      <iframe
        className="absolute inset-0 h-full w-full"
        src={`https://www.youtube-nocookie.com/embed/${yt}`}
        title={piece.title}
        allow="accelerometer; autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
      />
    );
  }
  if (piece.mediaUrl?.startsWith("/media/")) {
    return <video className="absolute inset-0 h-full w-full object-contain" src={piece.mediaUrl} controls playsInline poster={piece.coverUrl} />;
  }
  return (
    <AuroraCover seed={piece.id} palette={piece.palette} coverUrl={piece.coverUrl} contentType={piece.contentType} durationSec={piece.durationSec} title={piece.title} />
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      aria-label="Copy prompt"
      onClick={() => {
        void navigator.clipboard?.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="absolute top-2 right-2 flex size-7 items-center justify-center rounded-md bg-white/5 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
    >
      {copied ? <Check className="size-3.5 text-verified" /> : <Copy className="size-3.5" />}
    </button>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
      <Icon className="mb-2 size-3.5 text-muted-foreground" />
      <div className="font-mono text-base tabular-nums">{value}</div>
      <div className="eyebrow mt-0.5 !text-[10px]">{label}</div>
    </div>
  );
}

const ASPECT_STYLE: Record<PortfolioPiece["aspectRatio"], string> = {
  "9:16": "9 / 16",
  "16:9": "16 / 9",
  "1:1": "1 / 1",
  "4:5": "4 / 5",
  "21:9": "21 / 9",
};

export function WorkLightbox({ items, index, onIndexChange }: Props) {
  const item = index !== null ? items[index] : null;

  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") onIndexChange((index + 1) % items.length);
      if (e.key === "ArrowLeft") onIndexChange((index - 1 + items.length) % items.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, items.length, onIndexChange]);

  const piece = item?.piece;
  const creator = item?.creator;
  const wf = piece?.workflow;

  return (
    <Dialog open={item !== null} onOpenChange={(open) => !open && onIndexChange(null)}>
      <DialogContent className="max-h-[92vh] gap-0 overflow-hidden rounded-[24px] border border-white/10 bg-surface p-0 sm:max-w-6xl">
        {piece && creator && (
          <div className="grid max-h-[92vh] overflow-y-auto lg:grid-cols-[1fr_400px] lg:overflow-hidden">
            <div className="relative flex min-h-[280px] items-center justify-center bg-black/40 p-4 lg:p-8">
              <div
                className="relative max-h-[70vh] w-full overflow-hidden rounded-2xl ring-1 ring-white/10"
                style={{ aspectRatio: ASPECT_STYLE[piece.aspectRatio], maxWidth: piece.aspectRatio === "9:16" ? 380 : undefined }}
              >
                <Media piece={piece} />
              </div>
              {items.length > 1 && (
                <>
                  <button
                    type="button"
                    aria-label="Previous work"
                    onClick={() => onIndexChange((index! - 1 + items.length) % items.length)}
                    className="glass absolute top-1/2 left-3 flex size-9 -translate-y-1/2 items-center justify-center rounded-full hover:bg-white/10"
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Next work"
                    onClick={() => onIndexChange((index! + 1) % items.length)}
                    className="glass absolute top-1/2 right-3 flex size-9 -translate-y-1/2 items-center justify-center rounded-full hover:bg-white/10"
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </>
              )}
            </div>

            <div className="flex flex-col gap-5 border-white/10 p-6 lg:max-h-[92vh] lg:overflow-y-auto lg:border-l">
              <div>
                <p className="eyebrow">
                  {CONTENT_TYPE_LABELS[piece.contentType]} · {piece.aspectRatio}
                  {piece.durationSec ? ` · ${formatDuration(piece.durationSec)}` : ""} · {piece.year}
                </p>
                <DialogTitle className="mt-2 text-2xl font-semibold tracking-tight">{piece.title}</DialogTitle>
                <DialogDescription className="sr-only">How this work was made</DialogDescription>
                <Link href={`/creators/${creator.slug}`} className="mt-3 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                  <Avatar creator={creator} size={22} /> {creator.name}
                </Link>
                {(piece.client || piece.result) && (
                  <div className="mt-4 flex flex-wrap gap-2 text-xs">
                    {piece.client && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1">
                        Client: <span className="text-foreground">{piece.client}</span>
                        {piece.clientVerified && <BadgeCheck className="size-3.5 text-verified" aria-label="Client verified" />}
                      </span>
                    )}
                    {piece.result && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-verified/10 px-2.5 py-1 text-verified">
                        <TrendingUp className="size-3.5" /> {piece.result}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5">
                {piece.toolIds.map((id) => (
                  <ToolChip key={id} toolId={id} size="md" />
                ))}
              </div>

              {wf ? (
                <>
                  <div>
                    <p className="eyebrow mb-1 flex items-center gap-1.5">
                      <Sparkles className="size-3" /> How it was made
                    </p>
                    <p className="mb-4 text-sm text-muted-foreground">{wf.summary}</p>
                    <ol className="relative space-y-4 pl-6 before:absolute before:top-2 before:bottom-2 before:left-[7px] before:w-px before:bg-gradient-to-b before:from-violet before:via-pink before:to-amber">
                      {wf.steps.map((s, i) => (
                        <li key={i} className="relative">
                          <span className="absolute top-1 -left-6 flex size-[15px] items-center justify-center rounded-full bg-surface ring-1 ring-violet/60 font-mono text-[8px]">
                            {i + 1}
                          </span>
                          <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
                            {s.title}
                            {s.toolId && <ToolChip toolId={s.toolId} />}
                          </div>
                          <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{s.detail}</p>
                        </li>
                      ))}
                    </ol>
                  </div>
                  {wf.promptExample && (
                    <div>
                      <p className="eyebrow mb-2">Prompt example</p>
                      <div className="relative rounded-xl border border-white/[0.06] bg-black/40 p-3 pr-10 font-mono text-[12px] leading-relaxed text-foreground/85">
                        {wf.promptExample}
                        <CopyButton text={wf.promptExample} />
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-2">
                    <Stat icon={Layers} label="Generations" value={String(wf.generations)} />
                    <Stat icon={Clock} label="Hours" value={String(wf.hoursSpent)} />
                    <Stat icon={Sparkles} label="Post tools" value={String(wf.postProduction.length)} />
                  </div>
                  {wf.postProduction.length > 0 && (
                    <p className="text-xs text-muted-foreground">Post-production: {wf.postProduction.join(", ")}</p>
                  )}
                </>
              ) : (
                <p className="rounded-xl border border-dashed border-white/10 p-4 text-sm text-muted-foreground">
                  The creator hasn&apos;t shared a workflow breakdown for this piece yet.
                </p>
              )}

              <div className="flex items-start gap-2 rounded-xl bg-white/[0.03] p-3 text-xs text-muted-foreground">
                <ShieldCheck className={piece.commercialUseCleared ? "size-4 shrink-0 text-verified" : "size-4 shrink-0 text-warning"} />
                {piece.commercialUseCleared
                  ? "Cleared for commercial use by the creator. Rights depend on the license you agree."
                  : "Personal / spec work. Not cleared for commercial use."}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
