import { Calendar, Check, Globe2, RefreshCw, Wallet, X } from "lucide-react";
import { ToolChip } from "@/components/creators/bits";
import { CONTENT_TYPE_LABELS, EXCLUSIVITY_LABELS, LICENSE_LABELS, OBJECTIVE_LABELS, OWNERSHIP_LABELS } from "@/lib/constants";
import { formatDuration, formatPrice } from "@/lib/format";
import type { BriefDraft } from "@/lib/types";
import { cn } from "@/lib/utils";

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-white/[0.06] pt-5">
      <h3 className="eyebrow mb-3">{title}</h3>
      {children}
    </section>
  );
}

function Flag({ on, label }: { on: boolean; label: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs", on ? "text-foreground/90" : "text-subtle")}>
      {on ? <Check className="size-3.5 text-verified" /> : <X className="size-3.5" />} {label}
    </span>
  );
}

const Placeholder = ({ children }: { children: React.ReactNode }) => <span className="text-subtle italic">{children}</span>;

/** Renders a brief like a premium one-pager. */
export function BriefPreview({ brief, className }: { brief: BriefDraft; className?: string }) {
  const c = brief.commercial;
  return (
    <article className={cn("card-surface relative overflow-hidden p-6 sm:p-8", className)}>
      {brief.palette.length > 0 && (
        <div className="absolute inset-x-0 top-0 flex h-1">
          {brief.palette.map((p, i) => (
            <span key={`${p}-${i}`} className="flex-1" style={{ background: p }} />
          ))}
        </div>
      )}
      <p className="eyebrow">{brief.brandName || <Placeholder>Brand</Placeholder>} · Creative brief</p>
      <h2 className="mt-2 text-2xl leading-tight font-semibold tracking-[-0.03em]">{brief.title || <Placeholder>Untitled brief</Placeholder>}</h2>
      {brief.idea && <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{brief.idea}</p>}
      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        {brief.objective && <span className="bg-aurora rounded-full px-2.5 py-0.5 font-medium text-white">{OBJECTIVE_LABELS[brief.objective]}</span>}
        {brief.audience && <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-foreground/80">For: {brief.audience}</span>}
      </div>

      <div className="mt-6 space-y-5">
        <Block title="Deliverables">
          {brief.deliverables.length ? (
            <table className="w-full text-left text-sm">
              <thead className="text-[11px] text-subtle">
                <tr>
                  <th className="pb-2 font-normal">Type</th>
                  <th className="pb-2 font-normal">Qty</th>
                  <th className="pb-2 font-normal">Format</th>
                  <th className="pb-2 font-normal">Length</th>
                  <th className="pb-2 text-right font-normal">Res</th>
                </tr>
              </thead>
              <tbody>
                {brief.deliverables.map((d) => (
                  <tr key={d.id} className="border-t border-white/[0.04]">
                    <td className="py-2">{CONTENT_TYPE_LABELS[d.contentType]}</td>
                    <td className="py-2 font-mono">×{d.quantity}</td>
                    <td className="py-2 font-mono">{d.aspectRatio}</td>
                    <td className="py-2 font-mono">{d.durationSec ? formatDuration(d.durationSec) : "—"}</td>
                    <td className="py-2 text-right font-mono">{d.resolution}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <Placeholder>No deliverables yet</Placeholder>
          )}
        </Block>

        <Block title="Style & mood">
          <div className="flex flex-wrap items-center gap-1.5">
            {brief.moods.map((m) => (
              <span key={m} className="rounded-full border border-white/10 px-2.5 py-0.5 text-xs capitalize">
                {m}
              </span>
            ))}
            {brief.palette.map((p, i) => (
              <span key={`${p}-${i}`} className="size-5 rounded-full ring-1 ring-white/15" style={{ background: p }} title={p} />
            ))}
            {!brief.moods.length && !brief.palette.length && <Placeholder>Pick a mood</Placeholder>}
          </div>
          {brief.avoid && <p className="mt-2 text-xs text-muted-foreground">Avoid: {brief.avoid}</p>}
        </Block>

        <Block title="Skills & tools">
          <div className="flex flex-wrap gap-1.5">
            {brief.requiredSkills.map((s) => (
              <span key={s} className="rounded-full bg-white/5 px-2.5 py-0.5 text-xs">
                {s}
              </span>
            ))}
            {brief.preferredToolIds.map((id) => (
              <ToolChip key={id} toolId={id} />
            ))}
            {!brief.requiredSkills.length && !brief.preferredToolIds.length && <Placeholder>Any skills</Placeholder>}
          </div>
        </Block>

        <Block title="Commercial use">
          <div className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            <p>
              <span className="text-subtle">Usage: </span>
              {c.usageTypes.length ? c.usageTypes.map((u) => LICENSE_LABELS[u]).join(", ") : <Placeholder>not set</Placeholder>}
            </p>
            <p>
              <span className="text-subtle">Platforms: </span>
              {c.platforms.length ? c.platforms.join(", ") : <Placeholder>not set</Placeholder>}
            </p>
            <p className="flex items-center gap-1.5">
              <Globe2 className="size-3.5 text-subtle" /> {c.territory || "—"} · {c.licenseDuration || "—"}
            </p>
            <p>
              <span className="text-subtle">Rights: </span>
              {OWNERSHIP_LABELS[c.ownership]} · {EXCLUSIVITY_LABELS[c.exclusivity]} exclusivity
            </p>
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
            <Flag on={c.aiDisclosureRequired} label="AI disclosure" />
            <Flag on={c.watermarkFree} label="Watermark-free" />
            <Flag on={c.derivativeRights} label="Edit rights" />
            <Flag on={c.commerciallySafeToolsOnly} label="Commercial-safe tools only" />
          </div>
        </Block>

        <Block title="Budget & timeline">
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-white/[0.03] p-3">
              <Wallet className="mb-1.5 size-3.5 text-subtle" />
              <p className="font-mono text-[13px]">
                {brief.budget.max > 0
                  ? `${formatPrice(brief.budget.min, brief.budget.currency)}–${formatPrice(brief.budget.max, brief.budget.currency)}`
                  : "—"}
              </p>
            </div>
            <div className="rounded-xl bg-white/[0.03] p-3">
              <Calendar className="mb-1.5 size-3.5 text-subtle" />
              <p className="font-mono text-[13px]">{brief.deadline || "—"}</p>
            </div>
            <div className="rounded-xl bg-white/[0.03] p-3">
              <RefreshCw className="mb-1.5 size-3.5 text-subtle" />
              <p className="font-mono text-[13px]">{brief.revisionRounds} revisions</p>
            </div>
          </div>
        </Block>
      </div>
    </article>
  );
}
