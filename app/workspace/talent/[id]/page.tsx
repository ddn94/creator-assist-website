import { notFound } from "next/navigation";
import { AgencyFrame } from "@/components/AgencyFrame";
import { TalentDetailView } from "@/components/TalentDetailView";
import { requireProfile } from "@/lib/auth/session";
import { getTalentRecord, toTalentItem } from "@/lib/auth/talentRecords";

type TalentDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function TalentDetailPage({ params }: TalentDetailPageProps) {
  const { id } = await params;
  const profile = await requireProfile("agency");
  const record = await getTalentRecord(id);
  if (!record) notFound();

  const item = toTalentItem(record);

  return (
    <AgencyFrame profile={profile}>
      <TalentDetailView
        talent={{
          ...item,
          firstName: item.name.split(/\s+/)[0] || item.name,
          deals: [],
          invoicing: null,
          activity: record.notes
            ? [{ id: "notes", title: "Notes", meta: record.notes }]
            : [],
        }}
        inviteCode={record.invite_code}
        recordEmail={record.email}
      />
    </AgencyFrame>
  );
}
