import { Plus } from "lucide-react";
import type { Metadata } from "next";
import { BriefList } from "@/components/briefs/brief-list";
import { GradientLink } from "@/components/effects/gradient-button";
import { PageEnter } from "@/components/effects/motion";
import { Container, PageHeader } from "@/components/layout/states";

export const metadata: Metadata = { title: "Briefs" };

export default function BriefsPage() {
  return (
    <Container className="pt-12">
      <PageEnter className="space-y-10">
        <PageHeader
          eyebrow="Briefs"
          title={
            <>
              Your <span className="accent text-aurora pr-1">briefs</span>
            </>
          }
          description="Drafts and published briefs. Open a published brief to see ranked creator matches."
        >
          <GradientLink href="/briefs/new">
            <Plus /> New brief
          </GradientLink>
        </PageHeader>
        <BriefList />
      </PageEnter>
    </Container>
  );
}
