import { Skeleton } from "@/components/ui/skeleton";

/** Khung chờ trang khóa học: tiêu đề, thẻ chương với danh sách bài và cột chương bên phải */
export function CourseDetailSkeleton() {
  return (
    <div aria-busy="true" aria-label="Đang tải khóa học" className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-14">
      <div>
        <Skeleton className="h-4 w-72 max-w-full" />
        <Skeleton className="mt-4 h-12 w-4/5" />
        <div className="mt-8 rounded-lg border border-line bg-card">
          <div className="border-b border-line px-8 py-5">
            <Skeleton className="h-4 w-48" />
          </div>
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="flex items-center gap-4 border-b border-line px-8 py-5 last:border-b-0">
              <Skeleton className="h-4 w-6" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-32" />
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-9 w-full" />
        ))}
      </div>
    </div>
  );
}
