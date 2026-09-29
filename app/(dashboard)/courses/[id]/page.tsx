"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, BookOpenCheck, Play, SearchX } from "lucide-react";

import { CourseDetailSkeleton } from "@/components/course/course-skeleton";
import { UnitList } from "@/components/course/unit-list";
import { ErrorState } from "@/components/error-state";
import { HeroDecor } from "@/components/hero-decor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useApiQuery } from "@/hooks/use-api-query";
import { api } from "@/lib/api-client";
import { getNextLesson, withLessonStates } from "@/lib/course-progress";
import { LEVEL_META } from "@/lib/ui-constants";
import { cn } from "@/lib/utils";
import type { CourseSummary } from "@/types/api";

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  // Dùng lại GET /api/courses (đã có sẵn tiến độ của user) rồi lọc theo id
  const { data, error, isLoading, refetch } = useApiQuery((signal) => api.getCourses(signal), []);
  const course = data?.courses.find((c) => c.id === id);

  if (isLoading) return <CourseDetailSkeleton />;

  if (error || !course) {
    return (
      <main className="mx-auto w-full max-w-3xl px-5 pt-6 pb-16 sm:px-6">
        <BackLink className="mb-6 text-foreground" />
        {error ? (
          <ErrorState title="Không tải được khóa học" error={error} onRetry={refetch} backHref="/dashboard" />
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-3xl bg-surface-soft px-6 py-12 text-center">
            <SearchX className="size-8 text-muted-foreground" />
            <h1 className="text-lg font-semibold">Không tìm thấy khóa học</h1>
            <p className="text-sm text-muted-foreground">Khóa học có thể đã bị ẩn hoặc đường dẫn không đúng.</p>
            <Button asChild variant="outline" className="mt-2">
              <Link href="/dashboard">Về trang chủ</Link>
            </Button>
          </div>
        )}
      </main>
    );
  }

  return <CourseDetail course={course} />;
}

function BackLink({ className }: { className?: string }) {
  return (
    <Link
      href="/dashboard"
      className={cn(
        "-ml-1 inline-flex items-center gap-3 rounded-full p-1 pr-2 text-[15px] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
        className,
      )}
    >
      <ArrowLeft className="size-5" />
      Chi tiết khóa học
    </Link>
  );
}

function CourseDetail({ course }: { course: CourseSummary }) {
  const meta = LEVEL_META[course.level];
  const units = withLessonStates(course);
  const next = getNextLesson(course);

  return (
    <>
      {/* Header navy như màn "Detail Course" của thiết kế */}
      <header className="relative overflow-hidden bg-hero-navy text-navy-foreground">
        <HeroDecor />
        <div className="relative mx-auto max-w-3xl px-5 pt-6 pb-16 sm:px-6 sm:pb-20">
          <div className="flex items-center justify-between gap-3">
            <BackLink className="text-white" />
            <Badge className="border-transparent bg-white/15 text-white backdrop-blur-sm">
              {meta.label} · {meta.cefr}
            </Badge>
          </div>
          <h1 className="mt-10 text-3xl leading-tight font-semibold text-balance sm:mt-14 sm:text-4xl">{course.title}</h1>
          <p className="mt-2 text-sm text-white/75">
            {units.length} chương · {course.totalLessons} bài học
          </p>
        </div>
      </header>

      {/* Tấm nền trắng bo góc đè lên header */}
      <main className="relative -mt-8 rounded-t-[2rem] bg-background">
        <div className="mx-auto max-w-3xl px-5 pt-7 pb-16 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <p className="font-heading text-lg font-semibold">{course.totalLessons} bài học</p>
            <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground tabular-nums">
              <BookOpenCheck aria-hidden className="size-4" />
              {course.completedLessons}/{course.totalLessons} đã xong · {course.progressPercent}%
            </p>
          </div>
          {course.description && (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{course.description}</p>
          )}

          {next && (
            <Button asChild size="lg" className="mt-5 h-auto min-h-12 w-full py-3 leading-snug whitespace-normal sm:w-auto">
              <Link href={`/lessons/${next.lesson.id}`}>
                <Play className="fill-current" />
                {course.completedLessons > 0 ? "Học tiếp" : "Bắt đầu"}: {next.lesson.title}
              </Link>
            </Button>
          )}

          <section aria-label="Nội dung khóa học" className="mt-8">
            {units.length === 0 ? (
              <p className="rounded-3xl bg-surface-soft p-6 text-muted-foreground">Khóa học này chưa có chương nào.</p>
            ) : (
              <UnitList units={units} />
            )}
          </section>
        </div>
      </main>
    </>
  );
}
