import type { Metadata } from "next";
import { BriefForm } from "@/components/briefs/brief-form";
import { PageEnter } from "@/components/effects/motion";
import { Container, PageHeader } from "@/components/layout/states";

export const metadata: Metadata = { title: "Post a brief" };

export default function NewBriefPage() {
  return (
    <Container className="pt-12">
      <PageEnter className="space-y-8">
        <PageHeader
          eyebrow="New brief"
          title={
            <>
              Brief it like a <span className="accent text-aurora pr-1">producer</span>
            </>
          }
          description="Formats, tools, style and commercial terms in one structured brief, so creators can quote and start without a single back-and-forth."
        />
        <BriefForm />
      </PageEnter>
    </Container>
  );
}
