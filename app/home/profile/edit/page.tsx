import { BackLink } from "@/components/BackLink";
import { EditProfileForm } from "@/components/EditProfileForm";
import { PageWrapper } from "@/components/PageWrapper";
import { talentNav, talentShell } from "@/lib/home";

export default function EditProfilePage() {
  return (
    <PageWrapper {...talentShell} navItems={talentNav}>
      <div className="mb-4">
        <BackLink href="/home/profile" label="Back to profile" />
      </div>
      <EditProfileForm />
    </PageWrapper>
  );
}
