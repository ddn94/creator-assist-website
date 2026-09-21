"use client";

import { useRouter } from "next/navigation";
import { AuthScreen } from "@/components/AuthScreen";
import { Button } from "@/components/Button";
import { SignupTypeToggle } from "@/components/SignupTypeToggle";
import { Text } from "@/components/Text";
import { TextField } from "@/components/TextField";

export default function TalentSignupPage() {
  const router = useRouter();

  return (
    <AuthScreen
      title="Create your talent account"
      description="Track deals, content, and payments in one place."
      aboveCard={<SignupTypeToggle active="talent" />}
      card={
        <form
          className="space-y-2.5"
          onSubmit={(e) => {
            e.preventDefault();
            router.push("/onboarding");
          }}
        >
          <div className="space-y-0.5">
            <Text as="label" variant="label" htmlFor="invite">
              Invite code
            </Text>
            <TextField
              id="invite"
              name="invite"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="From your early access email"
              size="sm"
              full
            />
          </div>
          <div className="space-y-0.5">
            <Text as="label" variant="label" htmlFor="name">
              Your name
            </Text>
            <TextField id="name" name="name" placeholder="Your name" size="sm" full />
          </div>
          <div className="space-y-0.5">
            <Text as="label" variant="label" htmlFor="email">
              Email
            </Text>
            <TextField
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              size="sm"
              full
            />
          </div>
          <div className="space-y-0.5">
            <Text as="label" variant="label" htmlFor="password">
              Password
            </Text>
            <TextField
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="8+ chars"
              size="sm"
              full
            />
          </div>
          <Button type="submit" size="md" full iconRight="→" className="h-10">
            Create account
          </Button>
        </form>
      }
      additional={
        <Text variant="description">
          Already have an account? <Button href="/login">Sign in</Button>
        </Text>
      }
    />
  );
}
