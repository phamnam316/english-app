"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowRight } from "lucide-react";

import { AppHeader } from "@/components/app-header";
import { CourseDetailSkeleton } from "@/components/course/course-skeleton";
import { UnitCard } from "@/components/course/unit-list";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { Button } from "@/components/ui/button";
import { useApiQuery } from "@/hooks/use-api-query";
import { api } from "@/lib/api-client";
import { getCourseStatus, getNextLesson, shortUnitTitle, withLessonStates } from "@/lib/course-progress";
import { LEVEL_META } from "@/lib/ui-constants";
import { cn } from "@/lib/utils";
import type { CourseSummary } from "@/types/api";

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  // Dùng lại GET /api/courses (đã có sẵn tiến độ của user) rồi lọc theo id
  const { data, error, isLoading, refetch } = useApiQuery((signal) => api.getCourses(signal), []);
  const course = data?.courses.find((c) => c.id === id);

  let content: React.ReactNode;
  if (isLoading) content = <CourseDetailSkeleton />;
  else if (error) {
    content = <ErrorState title="Không tải được khóa học" error={error} onRetry={refetch} backHref="/dashboard" />;
  } else if (!course) {
    content = (
      <EmptyState
        title="Không tìm thấy khóa học"
        description="Khóa học có thể đã bị ẩn hoặc đường dẫn không đúng."
        action={
          <Button asChild variant="outline">
            <Link href="/dashboard">Về trang chủ</Link>
          </Button>
        }
      />
    );
  } else {
    content = <CourseDetail course={course} otherCourses={data?.courses.filter((c) => c.id !== course.id) ?? []} />;
  }

  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-[1180px] px-4 pt-8 pb-28 sm:px-8 sm:pt-12 md:pb-20">{content}</main>
    </>
  );
}

function CourseDetail({ course, otherCourses }: { course: CourseSummary; otherCourses: CourseSummary[] }) {
  const meta = LEVEL_META[course.level];
  const units = withLessonStates(course);
  const next = getNextLesson(course);
  const status = getCourseStatus(course);
  const currentUnit = units.find((u) => u.id === next?.unit.id) ?? units[0];
  const [showAll, setShowAll] = useState(false);

  const preview = useApiQuery(
    (signal) => (next ? api.getLesson(next.lesson.id, signal) : Promise.resolve(null)),
    [next?.lesson.id],
    { toastOnError: false },
  );

  // Số thứ tự bài đầu tiên của từng chương (đánh số liên tục trong cả khóa)
  const firstNumbers = new Map<string, number>();
  let counter = 1;
  for (const unit of units) {
    firstNumbers.set(unit.id, counter);
    counter += unit.lessons.length;
  }

  const showUnit = (unitId: string) => {
    setShowAll(true);
    requestAnimationFrame(() => document.getElementById(`unit-${unitId}`)?.scrollIntoView({ behavior: "smooth" }));
  };

  const heading =
    status === "completed"
      ? "Bạn đã học xong khóa này"
      : currentUnit
        ? `${status === "not-started" ? "Bắt đầu với" : "Bạn đang ở"} Chương ${currentUnit.order}: ${shortUnitTitle(currentUnit.title)}`
        : course.title;

  const visibleUnits = showAll ? units : currentUnit ? [currentUnit] : [];

  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-14">
      <div className="min-w-0">
        <p className="text-[15px] text-muted-foreground">
          <Link href="/dashboard" className="underline decoration-line-strong underline-offset-4 hover:text-foreground">
            Trang chủ
          </Link>
          <span className="mx-1.5">/</span>
          <span className="font-medium text-foreground">{course.title}</span>
          <span className="mx-1.5">·</span>
          {meta.label} {meta.cefr}
          <span className="mx-1.5">·</span>
          <span className="tabular-nums">
            {course.completedLessons}/{course.totalLessons} bài xong
          </span>
        </p>
        <h1 className="mt-3 text-[2.4rem] leading-[1.08] tracking-[-0.015em] text-balance sm:text-[3.2rem]">{heading}</h1>
        {course.description && (
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">{course.description}</p>
        )}

        <div className="mt-8 space-y-6">
          {units.length === 0 ? (
            <EmptyState title="Khóa học này chưa có chương nào" description="Nội dung đang được biên soạn, quay lại sau nhé." />
          ) : (
            visibleUnits.map((unit) => (
              <UnitCard
                key={unit.id}
                unit={unit}
                firstNumber={firstNumbers.get(unit.id) ?? 1}
                currentLessonId={next?.lesson.id}
                previewWords={unit.id === next?.unit.id ? preview.data?.lesson.vocabularies : undefined}
                footer={
                  !showAll && units.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => setShowAll(true)}
                      className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-moss-strong outline-none hover:underline focus-visible:underline"
                    >
                      Xem toàn bộ {units.length} chương
                      <ArrowRight className="size-4" />
                    </button>
                  ) : undefined
                }
              />
            ))
          )}
        </div>
      </div>

      <aside className="space-y-10 lg:pt-2">
        {units.length > 0 && (
          <section aria-labelledby="chapters-heading">
            <h2 id="chapters-heading" className="font-sans text-[15px] font-semibold tracking-normal">
              {units.length} chương của khóa
            </h2>
            <ol className="mt-3 space-y-1">
              {units.map((unit) => {
                const isCurrent = unit.id === currentUnit?.id;
                const done = unit.lessons.filter((l) => l.state === "completed").length;
                return (
                  <li key={unit.id}>
                    <button
                      type="button"
                      onClick={() => showUnit(unit.id)}
                      aria-current={isCurrent ? "step" : undefined}
                      className={cn(
                        "flex w-full items-center gap-4 rounded-md px-3.5 py-2.5 text-left text-[15px] outline-none transition-colors focus-visible:outline-2 focus-visible:outline-ring",
                        isCurrent ? "bg-card font-semibold ring-1 ring-line" : "text-muted-foreground hover:bg-card hover:text-foreground",
                      )}
                    >
                      <span className="w-4 shrink-0 text-[13px] tabular-nums">{unit.order}</span>
                      <span className="min-w-0 flex-1 truncate">{shortUnitTitle(unit.title)}</span>
                      <span className="shrink-0 text-[13px] font-normal tabular-nums">
                        {done}/{unit.lessons.length}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
            <div className="mt-4 h-[5px] overflow-hidden rounded-full bg-line" aria-hidden>
              <div className="h-full rounded-full bg-moss" style={{ width: `${course.progressPercent}%` }} />
            </div>
            <p className="mt-2 text-[13px] text-muted-foreground tabular-nums">
              {course.completedLessons} trên {course.totalLessons} bài · {course.progressPercent}%
            </p>
          </section>
        )}

        {otherCourses.length > 0 && (
          <section aria-labelledby="other-courses-heading">
            <h2 id="other-courses-heading" className="font-sans text-[15px] font-semibold tracking-normal">
              Khóa học khác
            </h2>
            <ul className="mt-3 border-t border-line">
              {otherCourses.map((other) => {
                const otherMeta = LEVEL_META[other.level];
                const empty = getCourseStatus(other) === "empty";
                return (
                  <li key={other.id} className="border-b border-line">
                    <Link
                      href={`/courses/${other.id}`}
                      className="block py-3.5 outline-none hover:text-moss-strong focus-visible:underline"
                    >
                      <span className={cn("block text-[15px] font-semibold", empty && "text-muted-foreground")}>
                        {other.title}
                      </span>
                      <span className="text-[13px] text-muted-foreground tabular-nums">
                        {otherMeta.label} · {otherMeta.cefr} ·{" "}
                        {empty ? "Chưa có bài học" : `${other.completedLessons}/${other.totalLessons} bài`}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </aside>
    </div>
  );
}
