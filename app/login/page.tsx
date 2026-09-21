import AuthForm from "@/components/AuthForm";
import { AuthScreen } from "@/components/AuthScreen";
import { Button } from "@/components/Button";
import { Text } from "@/components/Text";

export default function LoginPage() {
  return (
    <AuthScreen
      title="Creator Assist"
      description="Sign in to your creator workspace"
      density="comfortable"
      card={<AuthForm />}
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
