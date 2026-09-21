import Link from "next/link";
import { ArrowLeftIcon } from "@phosphor-icons/react/dist/ssr";
import { Text } from "@/components/Text";

type BackLinkProps = {
  href: string;
  label: string;
  className?: string;
};

export function BackLink({ href, label, className = "" }: BackLinkProps) {
  return (
    <Link
      href={href}
      className={[
        "inline-flex items-center gap-1.5 text-muted transition-colors hover:text-ink",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <ArrowLeftIcon size={14} weight="bold" aria-hidden />
      <Text as="span" variant="caption" className="font-medium text-inherit">
        {label}
      </Text>
    </Link>
  );
}
