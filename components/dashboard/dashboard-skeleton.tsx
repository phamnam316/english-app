import { Skeleton } from "@/components/ui/skeleton";

/** Khung chờ cho thẻ "Học tiếp" và danh sách khóa học, giữ đúng bố cục thật để trang không bị giật */
export function ContinuePanelSkeleton() {
  return (
    <div className="rounded-[2rem] bg-surface-soft p-2.5">
      <Skeleton className="h-80 w-full rounded-3xl sm:h-96" />
    </div>
  );
}

export function CourseGridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Đang tải khóa học">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-3xl border border-border/70 bg-card p-3 shadow-soft">
          <Skeleton className="size-20 rounded-2xl" />
          <div className="flex-1 space-y-2.5">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-1.5 w-full rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
