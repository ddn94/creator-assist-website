"use client";

type PillToggleItem = {
  id: string;
  label: string;
};

type PillToggleProps = {
  items: PillToggleItem[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
};

export function PillToggle({
  items,
  value,
  onChange,
  className = "",
}: PillToggleProps) {
  return (
    <div
      className={[
        "inline-flex w-full rounded-full bg-card p-1 shadow-card sm:w-auto",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      role="tablist"
    >
      {items.map((item) => {
        const active = item.id === value;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.id)}
            className={[
              "flex-1 rounded-full px-4 py-2 font-display text-sm font-semibold transition-colors sm:flex-none sm:py-1.5",
              active
                ? "bg-primary text-on-primary"
                : "text-ink hover:bg-background",
            ].join(" ")}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
