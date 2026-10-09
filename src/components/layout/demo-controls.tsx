"use client";

import { AnimatePresence, motion } from "motion/react";
import { Building2, ChevronDown, FlaskConical, Palette, RotateCcw, Sparkles, UserCheck } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { EASE } from "@/components/effects/motion";
import { useDemoStore } from "@/lib/store";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";

const ROLES: { role: Role; label: string; icon: typeof Building2 }[] = [
  { role: "brand", label: "Brand", icon: Building2 },
  { role: "creator", label: "Creator", icon: Palette },
];

/** Hydrates persisted demo data after mount (store uses skipHydration). */
export function StoreHydrator() {
  useEffect(() => {
    void useDemoStore.persist.rehydrate();
  }, []);
  return null;
}

export function DemoControls() {
  const [open, setOpen] = useState(false);
  const role = useDemoStore((s) => s.role);
  const setRole = useDemoStore((s) => s.setRole);
  const simulateAccept = useDemoStore((s) => s.simulateAccept);
  const loadSampleData = useDemoStore((s) => s.loadSampleData);
  const resetDemo = useDemoStore((s) => s.resetDemo);
  const pathname = usePathname();
  const router = useRouter();

  const action = "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] text-foreground/85 transition-colors hover:bg-white/[0.06]";

  return (
    <div className="fixed right-4 bottom-4 z-50 flex flex-col items-end gap-2">
      <AnimatePresence>
        {open && (
          <motion.div
            id="demo-panel"
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.25, ease: EASE }}
            className="glass w-72 origin-bottom-right rounded-2xl bg-surface/80 p-3 shadow-2xl"
          >
            <p className="eyebrow px-1 pb-2">View as</p>
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-black/30 p-1" role="radiogroup" aria-label="Demo role">
              {ROLES.map(({ role: r, label, icon: Icon }) => (
                <button
                  key={r}
                  type="button"
                  role="radio"
                  aria-checked={role === r}
                  onClick={() => {
                    setRole(r);
                    if (pathname.startsWith("/engagements")) router.push(`/engagements/${r}`);
                    toast.success(`Now viewing as ${label}`);
                  }}
                  className={cn(
                    "flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-[13px] transition-all",
                    role === r ? "bg-white/10 text-foreground shadow-inner" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="size-3.5" /> {label}
                </button>
              ))}
            </div>
            <div className="mt-2 space-y-0.5">
              <button
                type="button"
                className={action}
                onClick={() => {
                  const err = simulateAccept();
                  if (err) toast.error(err);
                  else toast.success("Creator accepted the latest invite");
                }}
              >
                <UserCheck className="size-4 text-verified" /> Simulate creator accepts latest invite
              </button>
              <button
                type="button"
                className={action}
                onClick={() => {
                  loadSampleData();
                  toast.success("Sample engagements loaded");
                }}
              >
                <Sparkles className="size-4 text-amber" /> Load sample engagements
              </button>
              <button
                type="button"
                className={cn(action, "text-danger/90")}
                onClick={() => {
                  resetDemo();
                  toast("Demo data reset");
                }}
              >
                <RotateCcw className="size-4" /> Reset demo data
              </button>
            </div>
            <p className="mt-2 border-t border-white/10 px-1 pt-2 text-[11px] leading-snug text-subtle">
              Demo mode: no login. Your briefs, invites and profile live in this browser.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="demo-panel"
        className="glass flex h-10 items-center gap-2 rounded-full bg-surface/70 pr-3 pl-3.5 text-[13px] shadow-xl transition-colors hover:bg-white/10"
      >
        <FlaskConical className="size-4 text-amber" />
        Demo mode
        <span className="rounded-full bg-white/10 px-1.5 py-0.5 font-mono text-[10px] uppercase">{role}</span>
        <ChevronDown className={cn("size-3.5 transition-transform", open ? "" : "rotate-180")} />
      </button>
    </div>
  );
}
