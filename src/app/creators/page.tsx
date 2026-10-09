import type { Metadata } from "next";
import { Suspense } from "react";
import { Discover } from "@/components/creators/discover";
import { CardGridSkeleton, Container } from "@/components/layout/states";

export const metadata: Metadata = { title: "Discover creators" };

export default function CreatorsPage() {
  return (
    <Container className="pt-12 pb-8">
      <Suspense fallback={<CardGridSkeleton />}>
        <Discover />
      </Suspense>
    </Container>
  );
}
