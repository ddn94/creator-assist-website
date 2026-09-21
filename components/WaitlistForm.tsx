"use client";

import { Button } from "@/components/Button";
import { Text } from "@/components/Text";
import { TextField } from "@/components/TextField";

export default function WaitlistForm() {
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
      }}
    >
      <TextField
        type="email"
        name="email"
        autoComplete="email"
        placeholder="you@example.com"
        size="md"
        full
      />
      <Button type="submit" size="lg" full iconRight="→">
        Join the waitlist
      </Button>
      <Text variant="caption" className="text-center">
        Early access + founding pricing. No spam.
      </Text>
    </form>
  );
}
