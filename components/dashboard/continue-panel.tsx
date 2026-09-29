import Link from "next/link";
import { PartyPopper, Play, Star } from "lucide-react";

import { HeroDecor } from "@/components/hero-decor";
import { getCourseStatus, getNextLesson, pickContinueCourse } from "@/lib/course-progress";
import type { CourseSummary } from "@/types/api";

/**
 * Thẻ nổi bật đầu trang chủ (như thẻ khóa học lớn có nút play trong thiết kế):
 * đưa người học vào thẳng bài cần học tiếp theo bằng 1 cú bấm.
 */
export function ContinuePanel({ courses }: { courses: CourseSummary[] }) {
  const course = pickContinueCourse(courses);
  const next = course ? getNextLesson(course) : null;

  if (!course || !next) {
    // Khóa chưa có bài (empty) không tính: chỉ cần mọi khóa có bài đều đã xong
    const withLessons = courses.filter((c) => getCourseStatus(c) !== "empty");
    const allDone = withLessons.length > 0 && withLessons.every((c) => getCourseStatus(c) === "completed");
    if (!allDone) return null;
    return (
      <section className="flex items-center gap-4 rounded-3xl bg-surface-soft p-6">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-tile-mint text-tile-foreground">
          <PartyPopper className="size-6" />
        </span>
        <div>
          <h2 className="font-semibold">Bạn đã học hết các khóa hiện có</h2>
          <p className="text-sm text-muted-foreground">Mở lại một khóa bất kỳ để ôn tập.</p>
        </div>
      </section>
    );
  }

  const isResuming = getCourseStatus(course) === "in-progress";

  return (
    <section aria-labelledby="continue-heading" className="rounded-[2rem] bg-surface-soft p-2.5">
      <Link
        href={`/lessons/${next.lesson.id}`}
        className="group relative flex min-h-80 flex-col justify-between overflow-hidden rounded-3xl bg-hero-navy p-5 text-navy-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring sm:min-h-96 sm:p-7"
      >
        <HeroDecor />

        <div className="relative flex items-start justify-between gap-3">
          <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur-sm">
            {isResuming ? "Học tiếp từ chỗ bạn dừng lại" : "Bài học đầu tiên của bạn"}
          </span>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold backdrop-blur-sm">
            <Star aria-hidden className="size-3.5 fill-xp text-xp" />+{next.lesson.xpReward} XP
          </span>
        </div>

        <span
          aria-hidden
          className="absolute top-1/2 left-1/2 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/80 text-navy shadow-lg backdrop-blur-sm transition-transform duration-200 group-hover:scale-110 motion-reduce:transition-none"
        >
          <Play className="ml-0.5 size-6 fill-current" />
        </span>

        <div className="relative space-y-1.5">
          <h2 id="continue-heading" className="text-3xl leading-tight font-semibold text-balance sm:text-4xl">
            {next.lesson.title}
          </h2>
          <p className="text-sm text-white/75">
            {next.unit.title} · {course.title}
          </p>
        </div>
      </Link>
    </section>
  );
}
