import { Skeleton } from "@/components/ui/skeleton";

export function LessonSkeleton() {
  return (
    <div className="min-h-dvh bg-background" aria-busy="true" aria-label="Đang tải bài học">
      <div className="border-b border-line">
        <div className="mx-auto flex h-16 max-w-[1180px] items-center gap-4 px-4 sm:px-8">
          <Skeleton className="size-9" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="ml-auto h-[5px] w-28 sm:w-56" />
        </div>
      </div>
      <div className="mx-auto grid max-w-[1180px] lg:grid-cols-12 lg:gap-12 lg:px-8">
        <div className="hidden space-y-3 border-r border-line py-9 pr-8 lg:col-span-3 lg:block">
          <Skeleton className="h-3 w-24" />
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
        <div className="px-4 pt-10 sm:px-8 lg:col-span-9 lg:px-0 lg:pt-12">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-4 h-16 w-64" />
          <Skeleton className="mt-4 h-5 w-32" />
          <Skeleton className="mt-10 h-px w-full max-w-[720px]" />
          <Skeleton className="mt-6 h-10 w-72" />
          <Skeleton className="mt-8 h-14 w-full max-w-[720px]" />
        </div>
      </div>
    </div>
  );
}
