"use client";

import { useRouter } from "next/navigation";
import { AuthScreen } from "@/components/AuthScreen";
import { Button } from "@/components/Button";
import { Select } from "@/components/Select";
import { SignupTypeToggle } from "@/components/SignupTypeToggle";
import { Text } from "@/components/Text";
import { TextField } from "@/components/TextField";

const ROSTER_OPTIONS = [
  { value: "1-10", label: "1–10 talent" },
  { value: "11-25", label: "11–25 talent" },
  { value: "26-50", label: "26–50 talent" },
  { value: "50+", label: "50+ talent" },
];

export default function AgencySignupPage() {
  const router = useRouter();

  return (
    <AuthScreen
      title="Create an agency workspace"
      description="Manage your roster’s deals and invoicing in one place."
      aboveCard={<SignupTypeToggle active="workspace" />}
      card={
        <form
          className="space-y-2.5"
          onSubmit={(e) => {
            e.preventDefault();
            router.push("/workspace");
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
            <Text as="label" variant="label" htmlFor="agencyName">
              Agency name
            </Text>
            <TextField
              id="agencyName"
              name="agencyName"
              placeholder="Bright Talent"
              size="sm"
              full
            />
          </div>

          <div className="space-y-0.5">
            <Text as="label" variant="label" htmlFor="yourName">
              Your name
            </Text>
            <TextField
              id="yourName"
              name="yourName"
              placeholder="Priya Raman"
              size="sm"
              full
            />
          </div>

          <div className="space-y-0.5">
            <Text as="label" variant="label" htmlFor="workEmail">
              Work email
            </Text>
            <TextField
              id="workEmail"
              name="workEmail"
              type="email"
              autoComplete="email"
              placeholder="priya@brighttalent.co"
              size="sm"
              full
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-0.5">
              <Text as="label" variant="label" htmlFor="rosterSize">
                Roster size
              </Text>
              <Select
                id="rosterSize"
                name="rosterSize"
                defaultValue="1-10"
                options={ROSTER_OPTIONS}
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
          </div>

          <Button type="submit" size="md" full iconRight="→" className="h-10">
            Create workspace
          </Button>
        </form>
      }
      additional={
        <Text variant="description">
          Already have a workspace? <Button href="/login">Sign in</Button>
        </Text>
      }
    />
  );
}
