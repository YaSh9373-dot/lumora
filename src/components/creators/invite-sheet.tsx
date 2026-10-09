"use client";

import { Check, FileText, Plus, Send } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactElement } from "react";
import { toast } from "sonner";
import { ScoreRing } from "@/components/creators/bits";
import { buttonClass } from "@/components/effects/gradient-button";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { formatPrice } from "@/lib/format";
import { scoreCreatorForBrief } from "@/lib/matching";
import { useAllBriefs, useDemoStore } from "@/lib/store";
import type { Creator } from "@/lib/types";

export function InviteSheet({ creator, trigger }: { creator: Creator; trigger: ReactElement }) {
  const briefs = useAllBriefs().filter((b) => b.status === "published");
  const engagements = useDemoStore((s) => s.engagements);
  const invite = useDemoStore((s) => s.invite);
  const router = useRouter();

  return (
    <Sheet>
      <SheetTrigger render={trigger} />
      <SheetContent side="right" className="w-full border-white/10 bg-surface sm:max-w-md">
        <div className="border-b border-white/10 p-6">
          <SheetTitle className="text-lg">Invite {creator.name.split(" ")[0]} to a brief</SheetTitle>
          <SheetDescription className="mt-1">Pick one of your published briefs. They&apos;ll see the full brief and can accept or decline.</SheetDescription>
        </div>
        <div className="flex-1 space-y-2 overflow-y-auto p-4">
          {briefs.map((b) => {
            const already = engagements.some((e) => e.briefId === b.id && e.creatorId === creator.id && !["declined", "cancelled"].includes(e.status));
            const score = scoreCreatorForBrief(creator, b).score;
            return (
              <button
                key={b.id}
                type="button"
                disabled={already}
                onClick={() => {
                  if (invite(b.id, creator.id)) {
                    toast.success(`Invited ${creator.name}`, {
                      description: b.title,
                      action: { label: "View", onClick: () => router.push("/engagements/brand") },
                    });
                  }
                }}
                className="group flex w-full items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3 text-left transition-colors hover:border-white/15 hover:bg-white/[0.05] disabled:opacity-60"
              >
                <ScoreRing value={score} size={44} label="Match" />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 truncate text-sm font-medium">
                    {b.title}
                    {b.isSample && <span className="rounded-full bg-white/10 px-1.5 text-[10px] text-muted-foreground">Sample</span>}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {b.brandName} · {formatPrice(b.budget.min, b.budget.currency)}–{formatPrice(b.budget.max, b.budget.currency)}
                  </span>
                </span>
                {already ? (
                  <span className="flex items-center gap-1 text-xs text-verified">
                    <Check className="size-3.5" /> Invited
                  </span>
                ) : (
                  <Send className="size-4 text-muted-foreground transition-colors group-hover:text-foreground" />
                )}
              </button>
            );
          })}
          {briefs.length === 0 && (
            <p className="flex items-center gap-2 rounded-xl border border-dashed border-white/10 p-4 text-sm text-muted-foreground">
              <FileText className="size-4" /> No published briefs yet.
            </p>
          )}
        </div>
        <div className="border-t border-white/10 p-4">
          <Link href="/briefs/new" className={buttonClass("secondary", "md", "w-full")}>
            <Plus /> Create a new brief
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}
