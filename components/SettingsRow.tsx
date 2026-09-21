import Link from "next/link";
import { CaretRightIcon } from "@phosphor-icons/react/dist/ssr";
import { Text } from "@/components/Text";

type SettingsRowProps = {
  title: string;
  description?: string;
  href?: string;
  danger?: boolean;
  className?: string;
  onClick?: () => void;
};

const rowClass =
  "flex w-full items-center justify-between gap-3 rounded-card border border-card-border bg-card px-5 py-4 text-left shadow-card transition-colors";

export function SettingsRow({
  title,
  description,
  href,
  danger = false,
  className = "",
  onClick,
}: SettingsRowProps) {
  const content = (
    <>
      <span className="min-w-0">
        <Text
          variant="cardTitle"
          className={["text-base", danger ? "text-danger!" : ""].filter(Boolean).join(" ")}
        >
          {title}
        </Text>
        {description ? (
          <Text variant="caption" className="mt-0.5">
            {description}
          </Text>
        ) : null}
      </span>
      {!danger ? (
        <CaretRightIcon
          size={16}
          weight="bold"
          className="shrink-0 text-muted"
          aria-hidden
        />
      ) : null}
    </>
  );

  const classes = [
    rowClass,
    danger ? "hover:bg-organic/50" : "hover:bg-background/60",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (href) {
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={[classes, "cursor-pointer"].filter(Boolean).join(" ")}
    >
      {content}
    </button>
  );
}
