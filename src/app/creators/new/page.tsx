import type { Metadata } from "next";
import { JoinWizard } from "@/components/creators/join-wizard";
import { PageEnter } from "@/components/effects/motion";
import { Container, PageHeader } from "@/components/layout/states";

export const metadata: Metadata = { title: "Join as creator" };

export default function JoinPage() {
  return (
    <Container className="pt-12">
      <PageEnter className="space-y-10">
        <PageHeader
          eyebrow="Join as creator"
          title={
            <>
              Show <span className="accent text-aurora pr-1">how</span> you make it
            </>
          }
          description="Four quick steps. Your tools, your terms, and one piece with its workflow. That's what brands trust."
        />
        <JoinWizard />
      </PageEnter>
    </Container>
  );
}
