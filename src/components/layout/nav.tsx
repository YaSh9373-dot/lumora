"use client";

import { Menu, Plus, Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { GradientLink } from "@/components/effects/gradient-button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useDemoStore, useHydrated } from "@/lib/store";
import { cn } from "@/lib/utils";
import { openCommandPalette } from "./command-palette";

const LINKS = [
  { href: "/creators", label: "Discover" },
  { href: "/briefs", label: "Briefs" },
  { href: "/engagements", label: "Engagements" },
];

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-violet" aria-label="Lumora home">
      <span className="bg-aurora relative flex size-7 items-center justify-center rounded-[9px] shadow-[0_0_20px_-4px_rgba(255,92,170,0.7)]">
        <span className="size-2.5 rotate-45 rounded-[3px] bg-white/95" />
      </span>
      <span className="text-[17px] font-semibold tracking-tight">Lumora</span>
    </Link>
  );
}

export function Nav() {
  const pathname = usePathname();
  const hydrated = useHydrated();
  const role = useDemoStore((s) => s.role);
  const [open, setOpen] = useState(false);
  const isActive = (href: string) => pathname !== "/creators/new" && (pathname === href || pathname.startsWith(`${href}/`));

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-background/60 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-[1280px] items-center gap-6 px-4 sm:px-6" aria-label="Main">
        <Logo />
        <div className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm transition-colors",
                isActive(l.href) ? "bg-white/[0.06] text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {l.label}
            </Link>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={openCommandPalette}
            className="glass hidden h-9 items-center gap-2 rounded-[10px] pr-1.5 pl-3 text-sm text-muted-foreground transition-colors hover:text-foreground sm:flex"
            aria-label="Open command palette"
          >
            <Search className="size-3.5" />
            <span className="hidden lg:inline">Search creators, tools…</span>
            <kbd className="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[10px]">⌘K</kbd>
          </button>
          <span className="eyebrow hidden rounded-full border border-white/10 px-2.5 py-1 !text-[10px] lg:inline">
            Viewing as <span className="text-foreground">{hydrated && role === "creator" ? "Creator" : "Brand"}</span>
          </span>
          <GradientLink href="/briefs/new" size="sm" className="hidden sm:inline-flex">
            <Plus /> Post a brief
          </GradientLink>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              render={<button type="button" className="glass flex size-9 items-center justify-center rounded-[10px] md:hidden" aria-label="Open menu" />}
            >
              <Menu className="size-4" />
            </SheetTrigger>
            <SheetContent side="right" className="w-72 border-white/10 bg-surface p-6">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <Logo />
              <div className="mt-8 flex flex-col gap-1">
                {LINKS.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className={cn("rounded-lg px-3 py-2.5 text-base", isActive(l.href) ? "bg-white/[0.06]" : "text-muted-foreground")}
                  >
                    {l.label}
                  </Link>
                ))}
                <Link href="/creators/new" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-base text-muted-foreground">
                  Join as creator
                </Link>
              </div>
              <div className="mt-6" onClick={() => setOpen(false)}>
                <GradientLink href="/briefs/new" className="w-full">
                  <Plus /> Post a brief
                </GradientLink>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
