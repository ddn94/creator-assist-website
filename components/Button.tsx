import type { ButtonHTMLAttributes, ComponentPropsWithoutRef, ReactNode } from "react";
import Link from "next/link";
import { controlText, type ControlSize } from "@/lib/control";

const buttonSizes = {
  xs: "px-[24px] py-[6px] text-xs",
  sm: "h-[44px] px-[20px]",
  md: "h-[52px] px-[24px]",
  lg: "h-[60px] px-[26px]",
} as const;

const variants = {
  primary:
    "rounded-full bg-primary text-on-primary font-display font-bold hover:bg-primary-hover",
  secondary:
    "rounded-full border border-border bg-card text-ink font-display font-semibold hover:bg-background",
  link: "text-sm text-primary-hover font-medium underline underline-offset-2 hover:text-primary",
} as const;

const gaps = {
  xs: "gap-1",
  sm: "gap-1.5",
  md: "gap-2",
  lg: "gap-2.5",
} as const;

export type ButtonSize = "xs" | ControlSize;
export type ButtonVariant = keyof typeof variants;

type ButtonShared = {
  size?: ButtonSize;
  variant?: ButtonVariant;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  full?: boolean;
  className?: string;
  children?: ReactNode;
};

type ButtonAsButton = ButtonShared &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof ButtonShared> & {
    href?: undefined;
  };

type ButtonAsLink = ButtonShared &
  Omit<ComponentPropsWithoutRef<typeof Link>, keyof ButtonShared> & {
    href: string;
  };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

function Icon({ children }: { children: ReactNode }) {
  if (children == null || children === false) return null;
  return (
    <span className="inline-flex shrink-0 items-center" aria-hidden>
      {children}
    </span>
  );
}

export function Button({
  size = "md",
  variant,
  iconLeft,
  iconRight,
  full = false,
  className = "",
  children,
  ...props
}: ButtonProps) {
  const href = "href" in props ? props.href : undefined;
  const resolvedVariant = variant ?? (href ? "link" : "primary");
  const sizeClasses =
    size === "xs"
      ? `${buttonSizes.xs} ${gaps.xs}`
      : `${buttonSizes[size]} ${controlText[size]} ${gaps[size]}`;
  const classNames = [
    "inline-flex items-center justify-center cursor-pointer transition-colors disabled:opacity-60 outline-none",
    resolvedVariant === "link" ? "gap-1" : sizeClasses,
    variants[resolvedVariant],
    size === "xs" && resolvedVariant !== "link" ? "font-sans font-medium!" : "",
    full ? "w-full" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      <Icon>{iconLeft}</Icon>
      {children}
      <Icon>{iconRight}</Icon>
    </>
  );

  if (href != null) {
    const { href: linkHref, ...linkProps } = props as ButtonAsLink;
    return (
      <Link href={linkHref} className={classNames} {...linkProps}>
        {content}
      </Link>
    );
  }

  const { type = "button", ...buttonProps } = props as ButtonAsButton;
  return (
    <button type={type} className={classNames} {...buttonProps}>
      {content}
    </button>
  );
}
