import Link from "next/link";

import { Skeleton } from "@/components/ui/skeleton";
import { getCourseStatus, getNextLesson } from "@/lib/course-progress";
import { LEVEL_META } from "@/lib/ui-constants";
import { cn } from "@/lib/utils";
import type { CourseSummary } from "@/types/api";

/** Khóa có nhiều chương hơn số này thì hiện 1 thanh tiến độ chung thay vì từng chương */
const MAX_CHAPTER_BARS = 6;

/** 1 hàng trong danh sách "Khóa học của bạn": tên khóa, tiến độ theo chương, số bài đã xong */
export function CourseRow({ course }: { course: CourseSummary }) {
  const meta = LEVEL_META[course.level];
  const status = getCourseStatus(course);
  const isEmpty = status === "empty";

  const details = (
    <>
      <span className="min-w-0">
        <span className={cn("block text-[17px] leading-snug font-semibold", isEmpty && "text-muted-foreground")}>
          {course.title}
        </span>
        <span className="mt-1 block text-[14px] text-muted-foreground">
          {meta.label} · {meta.cefr}
          {!isEmpty && ` · ${course.units.length} chương · ${course.totalLessons} bài`}
        </span>
      </span>

      <span className="min-w-0 text-[14px] text-muted-foreground">
        {isEmpty ? "Chưa có bài học" : status === "not-started" ? "Chưa bắt đầu" : <ChapterProgress course={course} />}
      </span>

      {!isEmpty && (
        <span className="text-[15px] whitespace-nowrap tabular-nums sm:text-right">
          <b className="font-semibold">
            {course.completedLessons}/{course.totalLessons}
          </b>{" "}
          bài
        </span>
      )}
    </>
  );

  const layout = "grid gap-3 py-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)_5.5rem] sm:items-center sm:gap-8";

  if (isEmpty) return <div className={cn(layout, "opacity-80")}>{details}</div>;

  return (
    <Link
      href={`/courses/${course.id}`}
      prefetch={false}
      className={cn(
        layout,
        "-mx-3 rounded-md px-3 outline-none transition-colors hover:bg-card focus-visible:bg-card focus-visible:outline-2 focus-visible:outline-ring",
      )}
    >
      {details}
    </Link>
  );
}

/** Tiến độ từng chương (ít chương) hoặc 1 thanh chung kèm chương đang học (nhiều chương) */
function ChapterProgress({ course }: { course: CourseSummary }) {
  const status = getCourseStatus(course);
  const currentUnitId = getNextLesson(course)?.unit.id;

  if (course.units.length > MAX_CHAPTER_BARS) {
    const current = course.units.find((u) => u.id === currentUnitId);
    return (
      <span className="block" aria-label={`Đã xong ${course.progressPercent}% khóa học`}>
        <Bar value={course.progressPercent} />
        <span className="mt-2 block truncate text-[13px]">
          {status === "completed"
            ? "Đã học xong"
            : current
              ? `Chương ${current.order}/${course.units.length} · ${current.completedLessons}/${current.totalLessons} bài`
              : `${course.progressPercent}%`}
        </span>
      </span>
    );
  }

  return (
    <span className="flex gap-1.5" aria-label={`Đã xong ${course.completedLessons}/${course.totalLessons} bài`}>
      {course.units.map((unit) => {
        const percent = unit.totalLessons === 0 ? 0 : (unit.completedLessons / unit.totalLessons) * 100;
        const isCurrent = unit.id === currentUnitId;
        return (
          <span key={unit.id} className="min-w-0 flex-1">
            <Bar value={percent} />
            <span className={cn("mt-2 block truncate text-[13px] tabular-nums", isCurrent && "text-foreground")}>
              Ch.{unit.order}
              {isCurrent && ` · ${unit.completedLessons}/${unit.totalLessons}`}
            </span>
          </span>
        );
      })}
    </span>
  );
}

function Bar({ value }: { value: number }) {
  return (
    <span aria-hidden className="block h-[5px] overflow-hidden rounded-full bg-line">
      <span className="block h-full rounded-full bg-moss" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </span>
  );
}

export function CourseListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div aria-busy="true" aria-label="Đang tải khóa học">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="grid gap-3 border-b border-line py-5 sm:grid-cols-[1fr_1.1fr_5.5rem] sm:items-center sm:gap-8">
          <div className="space-y-2">
            <Skeleton className="h-5 w-56 max-w-full" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="h-[5px] w-full" />
          <Skeleton className="h-5 w-16" />
        </div>
      ))}
    </div>
  );
}
