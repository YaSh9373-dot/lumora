"use client";

import { FileQuestion } from "lucide-react";
import Link from "next/link";
import { buttonClass } from "@/components/effects/gradient-button";
import { Container, EmptyState, PageHeader, SkeletonBlock } from "@/components/layout/states";
import { useDemoStore, useHydrated } from "@/lib/store";
import { BriefForm } from "./brief-form";

export function EditBrief({ id }: { id: string }) {
  const hydrated = useHydrated();
  const brief = useDemoStore((s) => s.briefs.find((b) => b.id === id));

  return (
    <Container className="space-y-8 pt-12">
      {!hydrated ? (
        <SkeletonBlock className="h-96 rounded-[24px]" />
      ) : brief ? (
        <>
          <PageHeader eyebrow="Edit brief" title={brief.title || "Untitled brief"} />
          <BriefForm initial={brief} />
        </>
      ) : (
        <EmptyState icon={FileQuestion} title="Brief not found" description="Only briefs you created can be edited.">
          <Link href="/briefs" className={buttonClass("primary")}>
            All briefs
          </Link>
        </EmptyState>
      )}
    </Container>
  );
}
