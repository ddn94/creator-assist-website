"use client";

import { Button } from "@/components/Button";

export type SignupType = "talent" | "workspace";

const OPTIONS: { value: SignupType; label: string; href: string }[] = [
  { value: "talent", label: "Talent", href: "/signup/talent" },
  { value: "workspace", label: "Workspace", href: "/signup/agency" },
];

export function SignupTypeToggle({ active }: { active: SignupType }) {
  return (
    <div className="mb-3 grid w-full grid-cols-2 rounded-full border border-card-border bg-card p-0.5 shadow-card">
      {OPTIONS.map(({ value, label, href }) => {
        const isActive = value === active;
        return (
          <Button
            key={value}
            href={href}
            size="sm"
            variant={isActive ? "primary" : "secondary"}
            full
            className={[
              "h-9 text-sm",
              isActive
                ? ""
                : "border-transparent bg-transparent hover:bg-background",
            ]
              .filter(Boolean)
              .join(" ")}
            aria-current={isActive ? "page" : undefined}
          >
            {label}
          </Button>
        );
      })}
    </div>
  );
}
