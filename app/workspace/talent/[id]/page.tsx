import { PageWrapper } from "@/components/PageWrapper";
import { TalentDetailView } from "@/components/TalentDetailView";
import { workspaceNav, workspaceShell } from "@/lib/workspace";

type TalentDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function TalentDetailPage({
  params,
}: TalentDetailPageProps) {
  const { id } = await params;

  return (
    <PageWrapper {...workspaceShell} navItems={workspaceNav}>
      <TalentDetailView id={id} />
    </PageWrapper>
  );
}
