import { notFound } from "next/navigation";
import ServicePageContent from "@/components/ServicePageContent";
import { getServicePage, servicePages } from "@/lib/servicePages";

export const dynamic = "force-static";

export function generateStaticParams() {
  return servicePages.map((page) => ({ slug: page.slug }));
}

export default function ServicePage({
  params,
}: {
  params: { slug: string };
}) {
  const page = getServicePage(params.slug);
  if (!page) return notFound();

  return <ServicePageContent page={page} />;
}
