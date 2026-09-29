import { Skeleton } from "@/components/ui/skeleton";

export function LessonSkeleton() {
  return (
    <div className="min-h-dvh bg-background" aria-busy="true" aria-label="Đang tải bài học">
      <div className="mx-auto flex h-16 max-w-3xl items-center gap-4 px-4 sm:px-6">
        <Skeleton className="size-10" />
        <Skeleton className="h-3 flex-1 rounded-full" />
        <Skeleton className="h-4 w-10" />
      </div>
      <div className="mx-auto max-w-xl space-y-4 px-4 pt-4 sm:pt-8">
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-[22rem] w-full rounded-[2rem] sm:h-[24rem]" />
      </div>
      <div className="fixed inset-x-0 bottom-0 border-t bg-background">
        <div className="mx-auto flex max-w-3xl gap-3 px-4 py-4 sm:px-6">
          <Skeleton className="h-12 w-14 rounded-2xl" />
          <Skeleton className="h-12 flex-1 rounded-2xl sm:ml-auto sm:max-w-64" />
        </div>
      </div>
    </div>
  );
}
