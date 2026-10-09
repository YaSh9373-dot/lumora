import { ArrowRight, Building2, Palette } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageEnter } from "@/components/effects/motion";
import { SpotlightCard } from "@/components/effects/spotlight-card";
import { Container, PageHeader } from "@/components/layout/states";

export const metadata: Metadata = { title: "Engagements" };

const SIDES = [
  {
    href: "/engagements/brand",
    icon: Building2,
    tone: "bg-info/10 text-info",
    title: "I'm a brand",
    body: "See the creators you've invited, review their work, request revisions and approve delivery.",
    cta: "Open hiring pipeline",
  },
  {
    href: "/engagements/creator",
    icon: Palette,
    tone: "bg-pink/10 text-pink",
    title: "I'm a creator",
    body: "Accept invites from brands, build a team with other creators, and submit your work for review.",
    cta: "Open my jobs",
  },
];

export default function EngagementsPage() {
  return (
    <Container className="pt-12">
      <PageEnter className="space-y-10">
        <PageHeader
          eyebrow="Engagements"
          title={
            <>
              Which <span className="accent text-aurora pr-1">side</span> are you on?
            </>
          }
          description="Every engagement has two sides. In this demo you can play both: open one view, then the other."
        />
        <div className="grid gap-5 sm:grid-cols-2">
          {SIDES.map((s) => (
            <SpotlightCard key={s.href} className="h-full">
              <Link href={s.href} className="flex h-full flex-col rounded-[20px] p-7 outline-none focus-visible:ring-2 focus-visible:ring-violet">
                <span className={`flex size-12 items-center justify-center rounded-2xl ${s.tone}`}>
                  <s.icon className="size-6" />
                </span>
                <h2 className="mt-5 text-xl font-semibold tracking-tight">{s.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
                <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-violet">
                  {s.cta} <ArrowRight className="size-4" />
                </span>
              </Link>
            </SpotlightCard>
          ))}
        </div>
      </PageEnter>
    </Container>
  );
}
