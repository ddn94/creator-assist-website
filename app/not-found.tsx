"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { PageWrapper } from "@/components/PageWrapper";
import { Text } from "@/components/Text";
import { talentNav, talentShell } from "@/lib/home";
import { workspaceNav, workspaceShell } from "@/lib/workspace";

function isArea(pathname: string, base: string) {
  return pathname === base || pathname.startsWith(`${base}/`);
}

function NotFoundCard({
  homeHref,
  homeLabel,
  showSignIn,
}: {
  homeHref: string;
  homeLabel: string;
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
          That link doesn’t lead anywhere. Head back and keep creating.
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

export default function NotFound() {
  const pathname = usePathname();
  const inWorkspace = isArea(pathname, "/workspace");
  const inTalent = isArea(pathname, "/home");

  if (inWorkspace) {
    return (
      <PageWrapper {...workspaceShell} navItems={workspaceNav}>
        <div className="flex min-h-[calc(100dvh-7rem)] flex-col items-center justify-center py-8">
          <NotFoundCard homeHref="/workspace" homeLabel="Back to overview" />
        </div>
      </PageWrapper>
    );
  }

  if (inTalent) {
    return (
      <PageWrapper {...talentShell} navItems={talentNav}>
        <div className="flex min-h-[calc(100dvh-7rem)] flex-col items-center justify-center py-8">
          <NotFoundCard homeHref="/home" homeLabel="Back to overview" />
        </div>
      </PageWrapper>
    );
  }

  return (
    <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-lg flex-col items-center justify-center px-4 py-8 sm:px-6">
      <NotFoundCard homeHref="/" homeLabel="Back to home" showSignIn />
    </div>
  );
}
