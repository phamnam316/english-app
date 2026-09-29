import Link from "next/link";
import { ArrowRight, CircleCheck } from "lucide-react";

import { CourseThumb } from "@/components/course/course-thumb";
import { Progress } from "@/components/ui/progress";
import { getCourseStatus } from "@/lib/course-progress";
import { LEVEL_META } from "@/lib/ui-constants";
import { cn } from "@/lib/utils";
import type { CourseSummary } from "@/types/api";

/** Thẻ khóa học dạng hàng ngang (như thẻ "Course of The Week" trong thiết kế) */
export function CourseCard({ course }: { course: CourseSummary }) {
  const meta = LEVEL_META[course.level];
  const status = getCourseStatus(course);

  return (
    <Link
      href={`/courses/${course.id}`}
      className="group flex items-center gap-4 rounded-3xl border border-border/70 bg-card p-3 pr-4 shadow-soft outline-none transition-transform duration-200 hover:-translate-y-0.5 focus-visible:ring-[3px] focus-visible:ring-ring/50 motion-reduce:transition-none"
    >
      <CourseThumb course={course} />

      <div className="min-w-0 flex-1 space-y-1.5">
        <h3 className="line-clamp-2 text-base leading-snug font-semibold">{course.title}</h3>
        <p className="text-xs text-muted-foreground">
          {meta.label} · {course.units.length} chương · {course.totalLessons} bài
        </p>

        {status === "empty" ? (
          <p className="text-xs font-medium text-muted-foreground">Chưa có bài học</p>
        ) : (
          <div className="flex items-center gap-2.5">
            <Progress
              value={course.progressPercent}
              aria-label={`Tiến độ khóa ${course.title}: ${course.progressPercent}%`}
              className={cn("h-1.5 flex-1", status === "completed" && "[&>*]:bg-success")}
            />
            {status === "completed" ? (
              <CircleCheck aria-label="Đã hoàn thành" className="size-4 shrink-0 text-success" />
            ) : (
              <span className="shrink-0 text-xs font-semibold text-muted-foreground tabular-nums">
                {course.completedLessons}/{course.totalLessons}
              </span>
            )}
          </div>
        )}
      </div>

      <ArrowRight
        aria-hidden
        className="size-5 shrink-0 text-navy transition-transform duration-200 group-hover:translate-x-0.5 dark:text-foreground"
      />
    </Link>
  );
}
