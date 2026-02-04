import { notFound } from "next/navigation";
import ServicePageContent from "@/components/ServicePageContent";
import { getServicePage, servicePages } from "@/lib/servicePages";

export const dynamic = "force-static";

export function generateStaticParams() {
  return servicePages.map((page) => ({ slug: page.slug }));
}

export default async function ServicePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = getServicePage(slug);
  if (!page) return notFound();

  return <ServicePageContent page={page} />;
}
