import Image from "next/image";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Text } from "@/components/Text";
import { getProfile } from "@/lib/auth/session";

function NotFoundCard({
  homeHref,
  homeLabel,
  description,
  showSignIn,
}: {
  homeHref: string;
  homeLabel: string;
  description: string;
  showSignIn?: boolean;
}) {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col items-center">
      <Image
        src="/icons/icon-192.png"
        alt=""
        width={56}
        height={56}
        className="size-11 rounded-2xl"
        priority
      />

      <Card className="mt-5 w-full p-5 text-center sm:p-6">
        <Text
          variant="nav"
          className="font-display text-xs font-semibold tracking-wider text-primary uppercase"
        >
          404
        </Text>
        <Text variant="heading" className="mt-2 text-2xl sm:text-[1.75rem]">
          Page not found
        </Text>
        <Text variant="description" className="mt-1.5">
          {description}
        </Text>
        <Button href={homeHref} size="sm" full iconRight="→" className="mt-5 h-10">
          {homeLabel}
        </Button>
      </Card>

      {showSignIn ? (
        <Text variant="description" className="mt-4 text-center">
          Looking for your account? <Button href="/login">Sign in</Button>
        </Text>
      ) : null}
    </div>
  );
}

export default async function NotFound() {
  const profile = await getProfile();
  const agency = profile?.role === "agency";

  return (
    <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-lg flex-col items-center justify-center px-4 py-8 sm:px-6">
      <NotFoundCard
        homeHref={agency ? "/workspace" : profile ? "/home" : "/"}
        homeLabel={profile ? "Back to overview" : "Back to home"}
        description={
          agency
            ? "That link doesn’t lead anywhere. Head back to your workspace."
            : "That link doesn’t lead anywhere. Head back and keep creating."
        }
        showSignIn={!profile}
      />
    </div>
  );
}
