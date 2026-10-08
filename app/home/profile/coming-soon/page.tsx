import { Button } from "@/components/Button";
import { AppFrame } from "@/components/AppFrame";
import { Text } from "@/components/Text";

export default async function ProfileComingSoonPage({
  searchParams,
}: {
  searchParams: Promise<{ f?: string }>;
}) {
  const { f } = await searchParams;
  const feature = f || "This section";

  return (
    <AppFrame role="talent">
      <div className="mx-auto max-w-md py-12 text-center sm:py-16">
        <Text as="h1" variant="heading" className="text-2xl sm:text-2xl">
          {feature}
        </Text>
        <Text variant="description" className="mt-2">
          Not here yet. It's on the way.
        </Text>
        <Button href="/home/profile" variant="primary" size="sm" className="mt-7">
          Back to profile
        </Button>
      </div>
    </AppFrame>
  );
}
