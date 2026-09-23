import { ContentDetailView } from "@/components/ContentDetailView";
import { TalentFrame } from "@/components/TalentFrame";

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
    <TalentFrame>
      <ContentDetailView id={id} backHref={backHref} />
    </TalentFrame>
  );
}
