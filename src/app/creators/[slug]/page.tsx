import type { Metadata } from "next";
import { CreatorProfile } from "@/components/creators/creator-profile";
import { CREATORS, getCreatorBySlug } from "@/data/creators";

export function generateStaticParams() {
  return CREATORS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const c = getCreatorBySlug(slug);
  return c ? { title: c.name, description: c.headline } : { title: "Creator" };
}

export default async function CreatorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <CreatorProfile slug={slug} />;
}
