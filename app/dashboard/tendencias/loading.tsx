import { Skeleton } from "@/components/ui/skeleton"

export default function TrendingLoading() {
  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <Skeleton className="h-10 w-48 mb-2 md:mb-0" />
        <Skeleton className="h-9 w-32" />
      </div>

      <Skeleton className="h-10 w-64 mb-6" />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  )
}
