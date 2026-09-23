const sizes = {
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-12 text-base",
  xl: "size-24 text-4xl",
} as const;

type AvatarProps = {
  name: string;
  size?: keyof typeof sizes;
  className?: string;
};

export function Avatar({ name, size = "md", className = "" }: AvatarProps) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";

  return (
    <span
      aria-hidden
      className={[
        "inline-flex shrink-0 items-center justify-center rounded-full bg-ink font-display font-bold text-on-primary cursor-pointer",
        sizes[size],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {initial}
    </span>
  );
}
