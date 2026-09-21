import type { ReactNode } from "react";
import Image from "next/image";
import { Card } from "@/components/Card";
import { Text } from "@/components/Text";

type AuthScreenProps = {
  title: string;
  description: string;
  logo?: ReactNode;
  aboveCard?: ReactNode;
  card: ReactNode;
  additional?: ReactNode;
  /** Sign-in uses a bit more space; signup stays compact. */
  density?: "compact" | "comfortable";
};

function DefaultLogo({ density }: { density: "compact" | "comfortable" }) {
  const comfortable = density === "comfortable";
  return (
    <Image
      src="/icons/icon-192.png"
      alt=""
      width={comfortable ? 64 : 56}
      height={comfortable ? 64 : 56}
      className={
        comfortable
          ? "mx-auto size-12 rounded-2xl"
          : "mx-auto size-11 rounded-2xl"
      }
      priority
    />
  );
}

export function AuthScreen({
  title,
  description,
  logo,
  aboveCard,
  card,
  additional,
  density = "compact",
}: AuthScreenProps) {
  const comfortable = density === "comfortable";

  return (
    <div
      className={[
        "relative mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center px-4 sm:px-6",
        comfortable ? "py-6" : "py-4",
      ].join(" ")}
    >
      <div className={comfortable ? "mb-5 text-center" : "mb-3 text-center"}>
        {logo ?? <DefaultLogo density={density} />}
        <Text
          variant="heading"
          className={
            comfortable
              ? "mt-4 text-2xl sm:text-[1.75rem]"
              : "mt-3 text-xl sm:text-2xl"
          }
        >
          {title}
        </Text>
        <Text
          variant="description"
          className={comfortable ? "mt-1.5" : "mt-1"}
        >
          {description}
        </Text>
      </div>

      {aboveCard}

      <Card className={comfortable ? "p-5 sm:p-6" : "p-4 sm:p-5"}>{card}</Card>

      {additional ? (
        <div
          className={
            comfortable
              ? "mt-5 space-y-2 text-center"
              : "mt-4 space-y-1.5 text-center"
          }
        >
          {additional}
        </div>
      ) : null}
    </div>
  );
}
