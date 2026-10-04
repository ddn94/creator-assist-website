import { BackLink } from "@/components/BackLink";
import { ChangePasswordForm } from "@/components/ChangePasswordForm";
import { AppFrame } from "@/components/AppFrame";
import { requireProfile } from "@/lib/auth/session";

export default async function AgencyPasswordPage() {
  const profile = await requireProfile("agency");

  return (
    <AppFrame role="agency" profile={profile}>
      <div className="mx-auto w-full max-w-xl">
        <div className="mb-4">
          <BackLink href="/workspace/profile" label="Back to profile" />
        </div>
        <ChangePasswordForm />
      </div>
    </AppFrame>
  );
}
