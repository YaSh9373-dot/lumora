import type { Metadata } from "next";
import { EngagementBoard } from "@/components/engagements/board";
import { PageEnter } from "@/components/effects/motion";
import { Container, PageHeader } from "@/components/layout/states";

export const metadata: Metadata = { title: "Engagements" };

export default function EngagementsPage() {
  return (
    <Container className="pt-12">
      <PageEnter className="space-y-10">
        <PageHeader
          eyebrow="Pipeline"
          title={
            <>
              From invite to <span className="accent text-aurora pr-1">delivered</span>
            </>
          }
          description="Track every engagement. Open a card to act on it; switch between Brand and Creator in Demo Controls to play both sides."
        />
        <EngagementBoard />
      </PageEnter>
    </Container>
  );
}
