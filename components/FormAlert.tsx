import { Text } from "@/components/Text";

export function FormAlert({
  error,
  message,
}: {
  error?: string | null;
  message?: string | null;
}) {
  if (error) {
    return (
      <Text
        variant="caption"
        className="rounded-input bg-organic px-3.5 py-2.5 text-sm text-danger"
      >
        {error}
      </Text>
    );
  }
  if (message) {
    return (
      <Text variant="caption" className="text-center text-sm text-ink">
        {message}
      </Text>
    );
  }
  return null;
}
