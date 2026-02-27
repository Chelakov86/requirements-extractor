export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-stone/15 rounded ${className}`} />
}

export function CardSkeleton() {
  return (
    <div
      className="bg-white rounded border border-border border-l-4 p-4 flex flex-col gap-3 animate-pulse"
      style={{ borderLeftColor: '#e5e7eb' }}
      data-testid="card-skeleton"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="h-3 bg-stone/15 rounded w-20" />
        <div className="h-5 bg-stone/10 rounded-full w-14" />
      </div>
      <div className="h-4 bg-stone/20 rounded w-3/4" />
      <div className="h-3 bg-stone/10 rounded w-full" />
      <div className="h-3 bg-stone/10 rounded w-5/6" />
      <div className="h-3 bg-stone/10 rounded w-2/3" />
    </div>
  )
}
