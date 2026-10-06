import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  estimateMinutes,
  getCourseStatus,
  lessonNumberInCourse,
  shortUnitTitle,
  type NextLessonInfo,
} from "@/lib/course-progress";
import type { CourseSummary, HomeResponse } from "@/types/api";

interface TodayCardProps {
  course: CourseSummary;
  next: NextLessonInfo;
  /** Tên để chào, vd "Minh Anh" */
  name: string;
  /** Từ của bài để xem trước; undefined khi đang tải */
  words: HomeResponse["nextLessonWords"] | undefined;
}

/**
 * Khối "Bài hôm nay" ở trang chủ: bài cần học tiếp, độ dài bài, các từ sẽ học và 1 nút để vào học ngay.
 * Ruy băng màu đất nung đánh dấu đây là chỗ đang học dở. Trên điện thoại nút "Học tiếp" đứng trước
 * danh sách từ để luôn nằm trong màn hình đầu tiên.
 */
export function TodayCard({ course, next, name, words }: TodayCardProps) {
  const { lesson, unit } = next;
  const isResuming = getCourseStatus(course) === "in-progress";
  const number = lessonNumberInCourse(course, lesson.id);
  const minutes = estimateMinutes(lesson.vocabCount, lesson.exerciseCount);

  return (
    <section
      aria-labelledby="today-heading"
      className="relative rounded-lg border border-line bg-card px-6 pt-10 pb-8 sm:px-10 sm:pt-12 sm:pb-10"
    >
      <span aria-hidden className="ribbon absolute top-0 right-8 h-12 w-5 bg-clay sm:right-10" />

      <p className="pr-10 text-[15px] text-muted-foreground">
        {isResuming ? `${name}, học tiếp từ chỗ bạn dừng lại` : `${name}, bắt đầu bài học đầu tiên`}
      </p>
      <h1
        id="today-heading"
        className="mt-2 text-[2.5rem] leading-[1.05] tracking-[-0.015em] text-balance sm:text-[3.25rem]"
      >
        {lesson.title}
      </h1>
      <p className="mt-4 text-[15px] text-muted-foreground">
        Chương {unit.order} · {shortUnitTitle(unit.title)}
        <span className="mx-2">—</span>
        bài {number} trên {course.totalLessons}
      </p>

      <p className="mt-6 flex flex-wrap items-center gap-x-2.5 gap-y-2 text-[17px]">
        {lesson.vocabCount > 0 && (
          <>
            <span>
              <b className="font-semibold">{lesson.vocabCount}</b> từ mới
            </span>
            <Dot />
          </>
        )}
        <span>
          <b className="font-semibold">{lesson.exerciseCount}</b> bài tập
        </span>
        <Dot />
        <span>
          khoảng <b className="font-semibold">{minutes}</b> phút
        </span>
        <span className="ml-1 rounded-sm bg-clay-soft px-1.5 py-0.5 text-[13px] font-semibold text-clay-strong">
          +{lesson.xpReward} XP
        </span>
      </p>

      <div className="flex flex-col">
        {lesson.vocabCount > 0 && (
          <div className="order-2 mt-8 border-t border-dashed border-line-strong pt-6 lg:order-1">
            <p className="text-[13px] font-medium text-muted-foreground">Trong bài này</p>
            {words ? (
              <ul className="mt-3 flex flex-wrap gap-x-7 gap-y-3">
                {words.slice(0, 10).map((word) => (
                  <li key={word.id} className="flex items-baseline gap-2">
                    <span className="font-serif text-[19px]">{word.word}</span>
                    {word.phonetic && (
                      <span className="hidden font-ipa text-[13px] text-muted-foreground sm:inline">
                        {word.phonetic}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3" aria-hidden>
                {Array.from({ length: Math.min(lesson.vocabCount, 6) }, (_, i) => (
                  <Skeleton key={i} className="h-6 w-24" />
                ))}
              </div>
            )}
          </div>
        )}

        <div className="order-1 mt-8 flex flex-wrap items-center gap-x-7 gap-y-4 lg:order-2">
          <Button asChild size="lg" className="h-auto min-h-[52px] py-3 text-base leading-snug whitespace-normal">
            <Link href={`/lessons/${lesson.id}`}>
              {isResuming ? "Học tiếp" : "Bắt đầu"}: {lesson.title}
              <ArrowRight className="size-[18px]" />
            </Link>
          </Button>
          <Link
            href={`/courses/${course.id}`}
            className="text-[15px] font-medium text-moss-strong underline decoration-line-strong underline-offset-[5px] outline-none hover:decoration-moss focus-visible:decoration-moss"
          >
            Xem lộ trình khóa học
          </Link>
        </div>
      </div>
    </section>
  );
}

function Dot() {
  return (
    <span aria-hidden className="text-line-strong">
      ·
    </span>
  );
}

export function TodayCardSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Đang tải bài hôm nay"
      className="rounded-lg border border-line bg-card px-6 py-10 sm:px-10"
    >
      <Skeleton className="h-4 w-56" />
      <Skeleton className="mt-4 h-12 w-3/4" />
      <Skeleton className="mt-5 h-4 w-48" />
      <Skeleton className="mt-7 h-5 w-72 max-w-full" />
      <Skeleton className="mt-10 h-12 w-56" />
    </div>
  );
}
