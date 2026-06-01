function SkeletonBar({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-[var(--app-border)]/60 ${className ?? ''}`}
      aria-hidden
    />
  );
}

export default function DashboardLoading() {
  return (
    <div className="flex h-full min-h-0 flex-col" aria-busy="true" aria-label="Loading dashboard">
      <SkeletonBar className="mb-4 h-8 w-48" />
      <div className="min-h-0 flex-1 rounded-lg border border-[var(--app-border)] bg-[var(--app-surface-2)] p-8">
        <SkeletonBar className="mx-auto h-6 w-56" />
        <SkeletonBar className="mx-auto mt-3 h-4 w-72" />
      </div>
    </div>
  );
}
