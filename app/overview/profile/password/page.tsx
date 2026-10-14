import { BackLink } from "@/components/BackLink";
import { ChangePasswordForm } from "@/components/ChangePasswordForm";
import { AppFrame } from "@/components/AppFrame";
import { requireProfile } from "@/lib/auth/session";

export default async function TalentPasswordPage() {
  const profile = await requireProfile("talent");

  return (
    <AppFrame role="talent" profile={profile}>
      <div className="mx-auto w-full max-w-xl">
        <div className="mb-4">
          <BackLink href="/overview/profile" label="Back to profile" />
        </div>
        <ChangePasswordForm />
      </div>
    </AppFrame>
  );
}
