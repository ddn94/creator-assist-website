type OnboardingProgressProps = {
  step: 1 | 2;
  className?: string;
};

export function OnboardingProgress({
  step,
  className = "",
}: OnboardingProgressProps) {
  return (
    <div
      className={["flex justify-center gap-2", className]
        .filter(Boolean)
        .join(" ")}
      aria-label={`Step ${step} of 2`}
    >
      <span
        className={[
          "h-1.5 w-16 rounded-full transition-colors",
          step === 1 ? "bg-primary" : "bg-border",
        ].join(" ")}
      />
      <span
        className={[
          "h-1.5 w-16 rounded-full transition-colors",
          step === 2 ? "bg-primary" : "bg-border",
        ].join(" ")}
      />
    </div>
  );
}
