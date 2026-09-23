import { Button } from "@/components/Button";
import { TalentFrame } from "@/components/TalentFrame";
import { Text } from "@/components/Text";

export default async function ProfileComingSoonPage({
  searchParams,
}: {
  searchParams: Promise<{ f?: string }>;
}) {
  const { f } = await searchParams;
  const feature = f || "This section";

  return (
    <TalentFrame>
      <div className="mx-auto max-w-md py-12 text-center sm:py-16">
        <Text as="h1" variant="heading" className="text-2xl sm:text-2xl">
          {feature}
        </Text>
        <Text variant="description" className="mt-2">
          Nothing here yet — this lives in a future version of Creator Assist.
        </Text>
        <Button href="/home/profile" variant="primary" size="sm" className="mt-7">
          Back to profile
        </Button>
      </div>
    </TalentFrame>
  );
}
