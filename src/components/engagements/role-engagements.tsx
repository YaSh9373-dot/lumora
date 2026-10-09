"use client";

import { useEffect } from "react";
import { PageEnter } from "@/components/effects/motion";
import { Container, PageHeader } from "@/components/layout/states";
import { useDemoStore } from "@/lib/store";
import type { Role } from "@/lib/types";
import { EngagementBoard } from "./board";

const COPY: Record<Role, { eyebrow: string; title: string; accent: string; description: string }> = {
  brand: {
    eyebrow: "Brand · Hiring pipeline",
    title: "Your",
    accent: "hires",
    description: "Every creator you've invited, from first invite to approved delivery. Review submissions, request revisions and approve work.",
  },
  creator: {
    eyebrow: "Creator · My jobs",
    title: "Your",
    accent: "jobs",
    description: "Invites from brands and the work you're delivering. Accept jobs, bring collaborators onto your team, and submit for review.",
  },
};

export function RoleEngagements({ role }: { role: Role }) {
  const setRole = useDemoStore((s) => s.setRole);
  // The URL is the source of truth; keep the nav label and Demo Controls in sync with it.
  useEffect(() => setRole(role), [role, setRole]);
  const copy = COPY[role];
  return (
    <Container className="pt-12">
      <PageEnter className="space-y-10">
        <PageHeader
          eyebrow={copy.eyebrow}
          title={
            <>
              {copy.title} <span className="accent text-aurora pr-1">{copy.accent}</span>
            </>
          }
          description={copy.description}
        />
        <EngagementBoard role={role} />
      </PageEnter>
    </Container>
  );
}
