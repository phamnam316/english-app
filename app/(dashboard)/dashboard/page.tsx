"use client";

import { useSession } from "next-auth/react";
import { BookOpen } from "lucide-react";

import { AppHeader } from "@/components/app-header";
import { ContinuePanel } from "@/components/dashboard/continue-panel";
import { CourseCard } from "@/components/dashboard/course-card";
import { ContinuePanelSkeleton, CourseGridSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { ErrorState } from "@/components/error-state";
import { useApiQuery } from "@/hooks/use-api-query";
import { api } from "@/lib/api-client";
import { getCourseStatus } from "@/lib/course-progress";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const { data: session } = useSession();
  const { data, error, isLoading, refetch } = useApiQuery((signal) => api.getCourses(signal), []);

  const streak = session?.user?.streak ?? 0;
  const courses = data?.courses ?? [];
  // Thẻ "Học tiếp" chỉ có khi có ít nhất 1 khóa đã có bài
  const showPanel = isLoading || courses.some((c) => getCourseStatus(c) !== "empty");

  return (
    <>
      <AppHeader />

      <main className="mx-auto w-full max-w-5xl px-5 pt-6 pb-16 sm:px-6 sm:pt-8">
        <div className="space-y-2">
          <h1 className="text-[2rem] leading-[1.2] font-medium sm:text-5xl sm:leading-[1.15]">
            Sẵn sàng cho
            <br />
            <span className="text-primary">bài học mới</span> hôm nay!
          </h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            {streak > 0
              ? `Bạn đang giữ chuỗi ${streak} ngày học liên tiếp. Tiếp tục nhé!`
              : "Học một bài hôm nay để bắt đầu chuỗi ngày học của bạn."}
          </p>
        </div>

        <div
          className={cn(
            "mt-8 grid gap-8",
            showPanel && "lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-start lg:gap-10",
          )}
        >
          {showPanel && (
            <div>{isLoading ? <ContinuePanelSkeleton /> : data && <ContinuePanel courses={courses} />}</div>
          )}

          <section aria-labelledby="courses-heading" className="space-y-4">
            <h2 id="courses-heading" className="text-lg font-semibold">
              Khóa học của bạn
            </h2>

            {isLoading ? (
              <CourseGridSkeleton />
            ) : error ? (
              <ErrorState title="Không tải được danh sách khóa học" error={error} onRetry={refetch} />
            ) : courses.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-3xl bg-surface-soft px-6 py-12 text-center">
                <span className="grid size-14 place-items-center rounded-2xl bg-tile-lavender text-tile-foreground">
                  <BookOpen className="size-7" />
                </span>
                <p className="font-semibold">Chưa có khóa học nào được mở</p>
                <p className="max-w-sm text-sm text-muted-foreground">
                  Khi quản trị viên đăng khóa học mới, khóa học sẽ xuất hiện ở đây.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {courses.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
