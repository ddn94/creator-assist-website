import { ContentDetailView } from "@/components/ContentDetailView";
import { PageWrapper } from "@/components/PageWrapper";
import { talentNav, talentShell } from "@/lib/home";

export default async function ContentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <PageWrapper {...talentShell} navItems={talentNav}>
      <ContentDetailView id={id} />
    </PageWrapper>
  );
}
