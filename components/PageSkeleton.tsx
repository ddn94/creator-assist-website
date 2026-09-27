export function PageSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-8 w-48 rounded-lg bg-card" />
      <div className="mt-3 h-4 w-72 max-w-full rounded bg-card" />
      <div className="mt-8 h-64 rounded-card border border-card-border bg-card" />
    </div>
  );
}
