"use client";

type FilterPillItem = {
  id: string;
  label: string;
  count?: number;
};

type FilterPillsProps = {
  items: FilterPillItem[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
};

export function FilterPills({
  items,
  value,
  onChange,
  className = "",
}: FilterPillsProps) {
  return (
    <div
      className={[
        "flex flex-wrap items-center gap-2",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      role="tablist"
    >
      {items.map((item) => {
        const active = item.id === value;
        const label =
          item.count == null ? item.label : `${item.label} ${item.count}`;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.id)}
            className={[
              "rounded-full px-3.5 py-2 font-display text-sm font-semibold transition-colors",
              active
                ? "bg-primary text-on-primary"
                : "border border-border bg-card text-ink hover:bg-background",
            ].join(" ")}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
