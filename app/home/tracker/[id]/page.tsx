import { ContentDetailView } from "@/components/ContentDetailView";
import { PageWrapper } from "@/components/PageWrapper";
import { talentNav, talentShell } from "@/lib/home";

export default async function ContentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { id } = await params;
  const { from } = await searchParams;
  const backHref = from === "payments" ? "/home/payments" : "/home/tracker";

  return (
    <PageWrapper {...talentShell} navItems={talentNav}>
      <ContentDetailView id={id} backHref={backHref} />
    </PageWrapper>
  );
}
