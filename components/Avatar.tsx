import Image from "next/image";

const sizes = {
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-12 text-base",
  xl: "size-24 text-4xl",
} as const;

type AvatarProps = {
  name: string;
  size?: keyof typeof sizes;
  src?: string | null;
  className?: string;
};

export function Avatar({ name, size = "md", src, className = "" }: AvatarProps) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  const classes = [
    "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-ink font-display font-bold text-on-primary cursor-pointer",
    sizes[size],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (src) {
    return (
      <span aria-hidden className={classes}>
        <Image src={src} alt="" fill unoptimized className="object-cover" sizes="96px" />
      </span>
    );
  }

  return (
    <span aria-hidden className={classes}>
      {initial}
    </span>
  );
}
