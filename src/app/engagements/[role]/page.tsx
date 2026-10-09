import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RoleEngagements } from "@/components/engagements/role-engagements";
import type { Role } from "@/lib/types";

const ROLES: Role[] = ["brand", "creator"];

export function generateStaticParams() {
  return ROLES.map((role) => ({ role }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ role: string }> }): Promise<Metadata> {
  const { role } = await params;
  return { title: role === "creator" ? "My jobs" : "Hiring pipeline" };
}

export default async function RoleEngagementsPage({ params }: { params: Promise<{ role: string }> }) {
  const { role } = await params;
  if (!ROLES.includes(role as Role)) notFound();
  return <RoleEngagements role={role as Role} />;
}
