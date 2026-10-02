"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

import { AppHeader } from "@/components/app-header";
import { CourseListSkeleton, CourseRow } from "@/components/dashboard/course-card";
import { ReviewPanel } from "@/components/dashboard/review-panel";
import { TodayCard, TodayCardSkeleton } from "@/components/dashboard/today-card";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { Button } from "@/components/ui/button";
import { useApiQuery } from "@/hooks/use-api-query";
import { api } from "@/lib/api-client";
import { getCourseStatus, getNextLesson, pickContinueCourse, type NextLessonInfo } from "@/lib/course-progress";
import { getGreetingName } from "@/lib/user-display";

/** Bài ôn tập cuối chương đang học còn khóa -> nhắc người học khi nào mở */
function reviewLockNote(next: NextLessonInfo | null) {
  if (!next) return null;
  const lessons = next.unit.lessons;
  const last = lessons.at(-1);
  if (!last || last.id === next.lesson.id || last.state !== "locked" || !/^(Ôn tập|Tổng ôn)/.test(last.title)) {
    return null;
  }
  return {
    title: last.title,
    text: `là bài cuối chương ${next.unit.order}, mở sau khi bạn xong bài ${lessons.length - 1}.`,
  };
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const courses = useApiQuery((signal) => api.getCourses(signal), []);
  const practice = useApiQuery((signal) => api.getPractice(signal), [], { toastOnError: false });

  const list = courses.data?.courses ?? [];
  const course = pickContinueCourse(list);
  const next = course ? getNextLesson(course) : null;
  const nextId = next?.lesson.id;
  // Từ của bài sắp học (để xem trước trong thẻ "Bài hôm nay")
  const preview = useApiQuery(
    (signal) => (nextId ? api.getLesson(nextId, signal) : Promise.resolve(null)),
    [nextId],
    { toastOnError: false },
  );

  const withLessons = list.filter((c) => getCourseStatus(c) !== "empty");
  const allDone = withLessons.length > 0 && withLessons.every((c) => getCourseStatus(c) === "completed");

  let today: React.ReactNode;
  if (courses.isLoading) today = <TodayCardSkeleton />;
  else if (courses.error) {
    today = <ErrorState title="Không tải được danh sách khóa học" error={courses.error} onRetry={courses.refetch} />;
  } else if (course && next) {
    today = (
      <TodayCard
        course={course}
        next={next}
        name={getGreetingName(session?.user)}
        words={preview.data?.lesson.vocabularies ?? (preview.isLoading ? undefined : [])}
      />
    );
  } else if (allDone) {
    today = (
      <EmptyState
        title="Bạn đã học hết các khóa hiện có"
        description="Giữ phong độ bằng các lượt ôn lại mỗi ngày, hoặc mở lại một khóa bất kỳ để làm lại bài."
        action={
          <Button asChild>
            <Link href="/practice">Ôn lại từ đã học</Link>
          </Button>
        }
      />
    );
  } else {
    today = (
      <EmptyState
        title="Chưa có khóa học nào được mở"
        description="Khi quản trị viên đăng khóa học mới, khóa học sẽ xuất hiện ở đây."
      />
    );
  }

  return (
    <>
      <AppHeader />

      <main className="mx-auto w-full max-w-[1180px] px-4 pt-8 pb-28 sm:px-8 sm:pt-12 md:pb-20">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.12fr)_minmax(0,1fr)] lg:gap-12">
          <div>{today}</div>
          <ReviewPanel
            data={practice.data}
            isLoading={practice.isLoading || courses.isLoading}
            lockNote={reviewLockNote(next)}
          />
        </div>

        {!courses.error && (
          <section aria-labelledby="courses-heading" className="mt-16 sm:mt-20">
            <div className="flex items-baseline justify-between gap-4 border-b-2 border-foreground pb-3">
              <h2 id="courses-heading" className="text-[1.75rem] leading-tight">
                Khóa học của bạn
              </h2>
              {!courses.isLoading && (
                <span className="text-[15px] text-muted-foreground tabular-nums">{list.length} khóa</span>
              )}
            </div>
            {courses.isLoading ? (
              <CourseListSkeleton />
            ) : list.length === 0 ? (
              <p className="py-6 text-[15px] text-muted-foreground">Chưa có khóa học nào.</p>
            ) : (
              <ul>
                {list.map((item) => (
                  <li key={item.id} className="border-b border-line">
                    <CourseRow course={item} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </main>
    </>
  );
}
