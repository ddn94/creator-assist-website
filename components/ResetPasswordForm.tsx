"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { Text } from "@/components/Text";
import { TextField } from "@/components/TextField";

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="space-y-3.5"
      onSubmit={(event) => {
        event.preventDefault();
        setError(null);
        if (password.length < 8) {
          setError("Use at least 8 characters.");
          return;
        }
        if (password !== confirm) {
          setError("Passwords don’t match.");
          return;
        }
        router.push("/login");
      }}
    >
      <div className="space-y-1">
        <Text as="label" variant="label" htmlFor="new-password">
          New password
        </Text>
        <TextField
          id="new-password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="8+ characters"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          size="sm"
          full
        />
      </div>
      <div className="space-y-1">
        <Text as="label" variant="label" htmlFor="confirm-password">
          Repeat new password
        </Text>
        <TextField
          id="confirm-password"
          name="confirm"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="Same again"
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          size="sm"
          full
        />
      </div>
      {error ? (
        <Text
          variant="caption"
          className="rounded-input bg-organic px-3.5 py-2.5 text-sm text-danger"
        >
          {error}
        </Text>
      ) : null}
      <Button type="submit" size="md" full iconRight="→" className="h-10">
        Save new password
      </Button>
    </form>
  );
}
