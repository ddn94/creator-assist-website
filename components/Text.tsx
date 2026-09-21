import type { ElementType, ComponentPropsWithoutRef } from "react";

const variants = {
  hero: {
    as: "h1",
    className:
      "font-display font-bold text-ink text-balance leading-tight text-2xl sm:text-3xl min-[900px]:text-4xl xl:text-5xl",
  },
  heading: {
    as: "h1",
    className: "font-display font-bold text-ink text-3xl leading-tight",
  },
  title: {
    as: "h2",
    className: "font-display font-bold text-ink text-base leading-snug",
  },
  cardTitle: {
    as: "h3",
    className: "font-display font-semibold text-ink text-sm leading-snug",
  },
  nav: {
    as: "span",
    className: "font-display font-semibold text-muted text-xs",
  },
  wordmark: {
    as: "p",
    className: "font-display font-bold text-ink text-xl min-[900px]:text-2xl",
  },
  subtitle: {
    as: "p",
    className:
      "font-display font-semibold tracking-wide text-primary text-sm sm:text-base",
  },
  body: {
    as: "p",
    className: "font-sans text-ink text-base",
  },
  description: {
    as: "p",
    className: "font-sans text-muted text-sm",
  },
  caption: {
    as: "p",
    className: "font-sans text-muted text-xs",
  },
  label: {
    as: "label",
    className:
      "block font-sans font-medium uppercase tracking-wider text-muted text-[11px]",
  },
  stat: {
    as: "p",
    className: "font-display font-bold text-ink",
  },
  mono: {
    as: "span",
    className: "font-mono text-ink",
  },
} as const;

export type TextVariant = keyof typeof variants;

type TextProps<T extends ElementType = "p"> = {
  as?: T;
  variant?: TextVariant;
  className?: string;
} & Omit<ComponentPropsWithoutRef<T>, "as">;

export function Text<T extends ElementType = "p">({
  as,
  variant = "body",
  className = "",
  ...props
}: TextProps<T>) {
  const preset = variants[variant];
  const Tag = (as ?? preset.as) as ElementType;
  return (
    <Tag
      className={[preset.className, className].filter(Boolean).join(" ")}
      {...props}
    />
  );
}
