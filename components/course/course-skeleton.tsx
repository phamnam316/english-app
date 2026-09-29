import { Skeleton } from "@/components/ui/skeleton";

/** Khung chờ trang chi tiết khóa học: header navy + tấm nền trắng với danh sách bài */
export function CourseDetailSkeleton() {
  return (
    <div aria-busy="true" aria-label="Đang tải khóa học">
      <div className="bg-hero-navy">
        <div className="mx-auto max-w-3xl space-y-4 px-5 pt-6 pb-20 sm:px-6">
          <Skeleton className="h-6 w-40 bg-white/15" />
          <Skeleton className="mt-10 h-9 w-3/4 bg-white/15" />
          <Skeleton className="h-4 w-40 bg-white/15" />
        </div>
      </div>
      <div className="relative -mt-8 rounded-t-[2rem] bg-background">
        <div className="mx-auto max-w-3xl space-y-4 px-5 pt-7 pb-16 sm:px-6">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-12 w-full rounded-2xl" />
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="flex items-center gap-4 rounded-3xl border border-border/70 p-3">
              <Skeleton className="size-16 rounded-2xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-1 w-full rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
