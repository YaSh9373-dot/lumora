"use client";

import { Compass, FileText, KanbanSquare, Plus, Sparkles, UserPlus, Wrench } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Avatar } from "@/components/creators/bits";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { TOOLS } from "@/data/tools";
import { SKILLS } from "@/lib/constants";
import { useAllCreators } from "@/lib/store";

const EVENT = "lumora:open-command";

export function openCommandPalette() {
  window.dispatchEvent(new Event(EVENT));
}

const PAGES = [
  { label: "Discover creators", href: "/creators", icon: Compass },
  { label: "Browse works", href: "/creators?view=works", icon: Sparkles },
  { label: "Post a brief", href: "/briefs/new", icon: Plus },
  { label: "My briefs", href: "/briefs", icon: FileText },
  { label: "Engagements", href: "/engagements", icon: KanbanSquare },
  { label: "Join as creator", href: "/creators/new", icon: UserPlus },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const creators = useAllCreators();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener(EVENT, onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(EVENT, onOpen);
    };
  }, []);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen} title="Search Lumora" className="rounded-[20px]! border border-white/10 sm:max-w-xl">
      <CommandInput placeholder="Search creators, tools, skills or pages…" />
      <CommandList className="max-h-[60vh]">
        <CommandEmpty>No results.</CommandEmpty>
        <CommandGroup heading="Pages">
          {PAGES.map((p) => (
            <CommandItem key={p.href} value={`page ${p.label}`} onSelect={() => go(p.href)}>
              <p.icon /> {p.label}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Creators">
          {creators.map((c) => (
            <CommandItem
              key={c.id}
              value={`creator ${c.name} ${c.headline} ${c.specializations.join(" ")}`}
              onSelect={() => go(`/creators/${c.slug}`)}
            >
              <Avatar creator={c} size={20} />
              <span>{c.name}</span>
              <span className="ml-auto truncate text-xs text-muted-foreground">{c.specializations[0]}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Tools">
          {TOOLS.map((t) => (
            <CommandItem key={t.id} value={`tool ${t.name}`} onSelect={() => go(`/creators?tools=${t.id}`)}>
              <span className="size-2 rounded-full" style={{ background: t.color }} /> Creators using {t.name}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Skills">
          {SKILLS.map((s) => (
            <CommandItem key={s} value={`skill ${s}`} onSelect={() => go(`/creators?skills=${encodeURIComponent(s)}`)}>
              <Wrench /> {s}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
