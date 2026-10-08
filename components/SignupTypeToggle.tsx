"use client";

import { Button } from "@/components/Button";

export type SignupType = "talent" | "agency";

const OPTIONS: { value: SignupType; label: string; href: string }[] = [
  { value: "talent", label: "Creator", href: "/signup/talent" },
  { value: "agency", label: "Agency", href: "/signup/agency" },
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
