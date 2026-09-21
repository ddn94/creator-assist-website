"use client";

import { useState } from "react";
import { AuthScreen } from "@/components/AuthScreen";
import { Button } from "@/components/Button";
import { Text } from "@/components/Text";
import { TextField } from "@/components/TextField";
import { talentShell } from "@/lib/home";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState<string>(talentShell.userEmail);

  return (
    <AuthScreen
      title="Reset your password"
      description={
        sent
          ? "If an account exists for that email, a reset link is on its way."
          : "Enter your email and we’ll send a reset link."
      }
      density="comfortable"
      card={
        sent ? (
          <div className="space-y-3.5 text-center">
            <Text variant="description">
              For this UI demo, continue to choose a new password.
            </Text>
            <Button href="/auth/reset" size="md" full iconRight="→" className="h-10">
              Set new password
            </Button>
          </div>
        ) : (
          <form
            className="space-y-3.5"
            onSubmit={(event) => {
              event.preventDefault();
              if (!email.trim()) return;
              setSent(true);
            }}
          >
            <div className="space-y-1">
              <Text as="label" variant="label" htmlFor="forgot-email">
                Email
              </Text>
              <TextField
                id="forgot-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                size="sm"
                full
              />
            </div>
            <Button type="submit" size="md" full iconRight="→" className="h-10">
              Send reset link
            </Button>
          </form>
        )
      }
      additional={
        <Text variant="description">
          Remembered it? <Button href="/login">Sign in</Button>
        </Text>
      }
    />
  );
}
