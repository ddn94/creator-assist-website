import AuthForm from "@/components/AuthForm";
import { AuthScreen } from "@/components/AuthScreen";
import { Button } from "@/components/Button";
import { Text } from "@/components/Text";

const NOTICES: Record<string, string> = {
  profile: "Signed in, but this account has no profile yet.",
  link: "That link is invalid or has expired.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const notice = error ? NOTICES[error] : null;

  return (
    <AuthScreen
      title="Creator Assist"
      description="Sign in to your creator workspace"
      density="comfortable"
      card={<AuthForm notice={notice} />}
      additional={
        <div className="flex flex-col gap-6 items-center">
          <Button href="/auth/forgot" variant="link">
            Forgot password?
          </Button>
          <Text variant="description">
            Don’t have an account? <Button href="/signup/talent">Sign up</Button>
          </Text>
        </div>
      }
    />
  );
}
