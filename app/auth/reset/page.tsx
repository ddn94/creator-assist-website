import { AuthScreen } from "@/components/AuthScreen";
import { Button } from "@/components/Button";
import { ResetPasswordForm } from "@/components/ResetPasswordForm";
import { Text } from "@/components/Text";

export default function ResetPasswordPage() {
  return (
    <AuthScreen
      title="Set a new password"
      description="Choose a new password for your account"
      density="comfortable"
      card={<ResetPasswordForm />}
      additional={
        <Text variant="description">
          Back to <Button href="/login">Sign in</Button>
        </Text>
      }
    />
  );
}
