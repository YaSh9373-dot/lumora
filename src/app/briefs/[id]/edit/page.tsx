import type { Metadata } from "next";
import { EditBrief } from "@/components/briefs/edit-brief";

export const metadata: Metadata = { title: "Edit brief" };

export default async function EditBriefPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EditBrief id={id} />;
}
