import type { Metadata } from "next";
import { BriefDetail } from "@/components/briefs/brief-detail";

export const metadata: Metadata = { title: "Brief" };

export default async function BriefPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BriefDetail id={id} />;
}
