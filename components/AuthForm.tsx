"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { Text } from "@/components/Text";
import { TextField } from "@/components/TextField";
import { talentShell } from "@/lib/home";

/** Prefill so UI demos land on the shared Fatima mock account. */
const DUMMY_EMAIL = talentShell.userEmail;
const DUMMY_PASSWORD = "demo-pass";

export default function AuthForm() {
  const router = useRouter();

  return (
    <form
      className="space-y-3.5"
      onSubmit={(e) => {
        e.preventDefault();
        router.push("/home");
      }}
    >
      <div className="space-y-1">
        <Text as="label" variant="label" htmlFor="email">
          Email
        </Text>
        <TextField
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          defaultValue={DUMMY_EMAIL}
          size="sm"
          full
        />
      </div>
      <div className="space-y-1">
        <Text as="label" variant="label" htmlFor="password">
          Password
        </Text>
        <TextField
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Your password"
          defaultValue={DUMMY_PASSWORD}
          size="sm"
          full
        />
      </div>
      <Button type="submit" size="md" full iconRight="→" className="h-10">
        Sign in
      </Button>
    </form>
  );
}
