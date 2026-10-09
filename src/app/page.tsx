import { ArrowRight, BadgeCheck, Fingerprint, Plus, Search, Workflow, Wrench } from "lucide-react";
import { CreatorCard } from "@/components/creators/creator-card";
import { AuroraBackground } from "@/components/effects/aurora-background";
import { GradientLink } from "@/components/effects/gradient-button";
import { Eyebrow, Marquee } from "@/components/effects/misc";
import { PageEnter, Reveal } from "@/components/effects/motion";
import { HeroCards } from "@/components/landing/hero-cards";
import { Bento, BriefTeaser, HowItWorks } from "@/components/landing/sections";
import { Container } from "@/components/layout/states";
import { CREATORS } from "@/data/creators";
import { TOOLS } from "@/data/tools";
import { PROOF_FOOTNOTE } from "@/lib/constants";

const FEATURED = ["aarav-mehta", "maya-chen", "zoya-khan", "omar-haddad"].map((s) => CREATORS.find((c) => c.slug === s)!);

const TRUST = [
  { icon: Wrench, title: "Tools verified", body: "Project files or screen recordings prove real tool use." },
  { icon: Workflow, title: "Workflow shared", body: "3+ step breakdowns on their portfolio pieces." },
  { icon: BadgeCheck, title: "Past work verified", body: "Clients confirm the work was delivered." },
  { icon: Fingerprint, title: "Identity verified", body: "A real, checked person behind the profile." },
];

function SectionHead({ eyebrow, title, body }: { eyebrow: string; title: React.ReactNode; body?: string }) {
  return (
    <Reveal className="mx-auto mb-12 max-w-2xl text-center">
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="mt-3 text-[clamp(1.9rem,4vw,3rem)] leading-[1.05] font-semibold tracking-[-0.04em]">{title}</h2>
      {body && <p className="mt-4 text-muted-foreground">{body}</p>}
    </Reveal>
  );
}

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <AuroraBackground intensity={0.4} />
        <Container className="relative pt-20 pb-10 text-center sm:pt-28">
          <PageEnter>
            <Eyebrow pulse>AI-native creative marketplace</Eyebrow>
            <h1 className="mx-auto mt-7 max-w-4xl text-[clamp(2.5rem,7vw,5.25rem)] leading-[1.02] font-semibold tracking-[-0.045em]">
              Hire the people who <span className="accent text-aurora pr-2">direct</span> the machines.
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-[17px] text-muted-foreground">
              Discover AI filmmakers, animators and designers by the tools they master and the workflows they prove. Brief them properly.
              Ship faster.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <GradientLink href="/creators" size="lg">
                <Search /> Find creators
              </GradientLink>
              <GradientLink href="/briefs/new" variant="secondary" size="lg">
                <Plus /> Post a brief
              </GradientLink>
            </div>
          </PageEnter>
          <HeroCards />
        </Container>
      </section>

      {/* Tool marquee */}
      <section className="border-y border-white/[0.06] py-6" aria-label="Tools our creators use">
        <Marquee duration={45}>
          {TOOLS.map((t) => (
            <span key={t.id} className="flex shrink-0 items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.02] px-4 py-2 text-sm text-foreground/75">
              <span className="size-1.5 rounded-full" style={{ background: t.color }} />
              {t.name}
            </span>
          ))}
        </Marquee>
      </section>

      <Container className="space-y-28 pt-28 sm:space-y-32">
        <section>
          <SectionHead
            eyebrow="Why Lumora"
            title={
              <>
                Built for <span className="accent text-aurora pr-1">AI-native</span> work
              </>
            }
            body="Generic freelance marketplaces can't tell you which models were used, how a piece was made, or whether it's safe to run in an ad. We can."
          />
          <Bento />
        </section>

        <section>
          <SectionHead eyebrow="How it works" title="Describe. Match. Deliver." />
          <HowItWorks />
        </section>

        <section>
          <BriefTeaser />
        </section>

        <section>
          <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <Reveal>
              <p className="eyebrow">Featured creators</p>
              <h2 className="mt-3 text-[clamp(1.9rem,4vw,3rem)] leading-[1.05] font-semibold tracking-[-0.04em]">
                Proven <span className="accent text-aurora pr-1">process</span>, not just pretty output
              </h2>
            </Reveal>
            <GradientLink href="/creators" variant="secondary">
              All creators <ArrowRight />
            </GradientLink>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURED.map((c, i) => (
              <Reveal key={c.id} delay={i * 0.06}>
                <CreatorCard creator={c} />
              </Reveal>
            ))}
          </div>
        </section>

        <section>
          <SectionHead
            eyebrow="Trust"
            title={
              <>
                Signals you can <span className="accent text-aurora pr-1">verify</span>
              </>
            }
            body="Four signals roll up into a 0–100 trust score on every creator, computed from their data, never hand-set."
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TRUST.map((t, i) => (
              <Reveal key={t.title} delay={i * 0.06}>
                <div className="card-surface h-full p-6">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-verified/10 text-verified">
                    <t.icon className="size-5" />
                  </span>
                  <h3 className="mt-4 font-semibold">{t.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{t.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <p className="mx-auto mt-6 max-w-2xl text-center text-[11px] text-subtle">{PROOF_FOOTNOTE}</p>
        </section>

        <section className="relative overflow-hidden rounded-[32px] border border-white/10 px-6 py-20 text-center">
          <AuroraBackground intensity={0.5} />
          <div className="relative">
            <h2 className="mx-auto max-w-3xl text-[clamp(2rem,5vw,3.6rem)] leading-[1.03] font-semibold tracking-[-0.045em]">
              Your next campaign is <span className="accent text-aurora pr-2">one line</span> away.
            </h2>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <GradientLink href="/briefs/new" size="lg">
                <Plus /> Post a brief
              </GradientLink>
              <GradientLink href="/creators/new" variant="secondary" size="lg">
                Join as creator
              </GradientLink>
            </div>
          </div>
        </section>
      </Container>
    </>
  );
}
