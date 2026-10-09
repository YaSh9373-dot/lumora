"use client";

import { AudioLines, Box, Clapperboard, Film, Image as ImageIcon, Shapes, Workflow } from "lucide-react";
import { AuroraCover } from "@/components/effects/aurora-cover";
import type { ContentType, Creator, PortfolioPiece } from "@/lib/types";
import { hasWorkflow } from "@/lib/verification";
import { Avatar, ToolChip } from "./bits";

export const CONTENT_ICONS: Record<ContentType, typeof Film> = {
  video: Film,
  animation: Clapperboard,
  image: ImageIcon,
  graphic: Shapes,
  audio: AudioLines,
  "3d": Box,
};

const ASPECT_CLASS: Record<PortfolioPiece["aspectRatio"], string> = {
  "9:16": "aspect-[9/16]",
  "16:9": "aspect-video",
  "1:1": "aspect-square",
  "4:5": "aspect-[4/5]",
  "21:9": "aspect-[21/9]",
};

interface Props {
  piece: PortfolioPiece;
  creator?: Creator;
  onOpen: () => void;
}

/** Cosmos-style masonry tile: image first, metadata revealed on hover. */
export function WorkTile({ piece, creator, onOpen }: Props) {
  const Icon = CONTENT_ICONS[piece.contentType];
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Open ${piece.title}${creator ? ` by ${creator.name}` : ""}`}
      className={`group relative block w-full overflow-hidden rounded-[18px] bg-surface-2 text-left ring-1 ring-white/[0.06] outline-none transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-violet ${ASPECT_CLASS[piece.aspectRatio]}`}
    >
      <AuroraCover
        seed={piece.id}
        palette={piece.palette}
        coverUrl={piece.coverUrl}
        contentType={piece.contentType}
        durationSec={piece.durationSec}
        className="transition-transform duration-700 group-hover:scale-[1.04]"
      />
      <span className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
        <span className="flex size-7 items-center justify-center rounded-full bg-black/35 text-white/90 backdrop-blur-md">
          <Icon className="size-3.5" />
        </span>
        {hasWorkflow(piece) && (
          <span className="flex h-7 items-center gap-1 rounded-full bg-black/35 px-2 text-[10.5px] text-white/90 backdrop-blur-md" title="Workflow shared">
            <Workflow className="size-3" /> <span className="hidden sm:inline">Workflow</span>
          </span>
        )}
      </span>
      <span className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/20 to-transparent p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
        <span className="text-sm font-medium text-white">{piece.title}</span>
        {creator && (
          <span className="mt-1 flex items-center gap-1.5 text-xs text-white/80">
            <Avatar creator={creator} size={18} /> {creator.name}
          </span>
        )}
        <span className="mt-2 flex flex-wrap gap-1">
          {piece.toolIds.slice(0, 3).map((id) => (
            <ToolChip key={id} toolId={id} className="border-white/15 bg-black/40" />
          ))}
        </span>
      </span>
    </button>
  );
}
