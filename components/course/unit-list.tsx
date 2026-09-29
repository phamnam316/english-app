"use client";

import Link from "next/link";
import { Check, CircleCheck, LockKeyhole, Play } from "lucide-react";
import { toast } from "sonner";

import { Progress } from "@/components/ui/progress";
import type { LessonWithState, UnitWithStates } from "@/lib/course-progress";
import { LESSON_TILE_CLASSES } from "@/lib/ui-constants";
import { cn } from "@/lib/utils";

/**
 * Danh sách bài học theo chương, mỗi bài là 1 thẻ như danh sách bài trong màn "Detail Course":
 * thumbnail màu có nút play, số thứ tự "01 - Tên bài", thanh tiến độ và ổ khóa cho bài chưa mở.
 */
export function UnitList({ units }: { units: UnitWithStates[] }) {
  // Đánh số bài liên tục xuyên suốt khóa học: 01, 02, 03...
  let lessonNumber = 0;

  return (
    <div className="space-y-8">
      {units.map((unit) => {
        const completed = unit.lessons.filter((l) => l.state === "completed").length;
        const isUnitDone = unit.lessons.length > 0 && completed === unit.lessons.length;

        return (
          <section key={unit.id} aria-labelledby={`unit-${unit.id}`} className="space-y-3">
            <div className="flex items-baseline justify-between gap-3">
              <h3 id={`unit-${unit.id}`} className="text-base font-semibold">
                <span className="text-muted-foreground">Chương {unit.order} · </span>
                {unit.title}
              </h3>
              <span
                className={cn(
                  "inline-flex shrink-0 items-center gap-1 text-xs font-medium tabular-nums",
                  isUnitDone ? "text-success" : "text-muted-foreground",
                )}
              >
                {isUnitDone && <Check aria-hidden className="size-3.5" strokeWidth={3} />}
                {completed}/{unit.lessons.length} bài
              </span>
            </div>

            {unit.lessons.length === 0 ? (
              <p className="rounded-3xl bg-surface-soft p-5 text-sm text-muted-foreground">Chương này chưa có bài học.</p>
            ) : (
              <ol className="space-y-3">
                {unit.lessons.map((lesson) => {
                  lessonNumber += 1;
                  return (
                    <li key={lesson.id}>
                      <LessonRow lesson={lesson} number={lessonNumber} />
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
        );
      })}
    </div>
  );
}

const STATE_TEXT: Record<LessonWithState["state"], string> = {
  completed: "Đã hoàn thành",
  current: "Đang học",
  locked: "Chưa mở khóa",
};

function LessonRow({ lesson, number }: { lesson: LessonWithState; number: number }) {
  const isLocked = lesson.state === "locked";
  const progress = lesson.state === "completed" ? (lesson.score ?? 100) : 0;
  const tileClass = LESSON_TILE_CLASSES[(number - 1) % LESSON_TILE_CLASSES.length];

  const content = (
    <>
      <span
        aria-hidden
        className={cn(
          "relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-2xl text-tile-foreground",
          tileClass,
          isLocked && "opacity-55",
        )}
      >
        <span className="absolute -top-3 -right-3 size-9 rounded-full bg-white/35" />
        <span className="relative grid size-8 place-items-center rounded-full bg-white/85 shadow-sm">
          {lesson.state === "completed" ? (
            <Check className="size-4 text-success" strokeWidth={3} />
          ) : (
            <Play className="ml-0.5 size-3.5 fill-current" />
          )}
        </span>
      </span>

      <span className={cn("min-w-0 flex-1", isLocked && "opacity-55")}>
        <span
          className={cn(
            "block text-xs tabular-nums",
            lesson.state === "current" ? "font-medium text-primary" : "text-muted-foreground",
          )}
        >
          {STATE_TEXT[lesson.state]}
          {lesson.state === "completed" && lesson.score !== null && ` · ${lesson.score}%`}
          {` · +${lesson.xpReward} XP`}
        </span>
        <span className="mt-0.5 line-clamp-2 text-[15px] leading-snug font-medium">
          <span className="tabular-nums">{String(number).padStart(2, "0")}</span> - {lesson.title}
        </span>
        <Progress
          aria-hidden
          value={progress}
          className={cn("mt-2.5 h-1", lesson.state === "completed" && "[&>*]:bg-success")}
        />
      </span>

      {isLocked ? (
        <LockKeyhole aria-hidden className="size-5 shrink-0 text-navy/70 dark:text-muted-foreground" />
      ) : lesson.state === "completed" ? (
        <CircleCheck aria-hidden className="size-5 shrink-0 text-success" />
      ) : null}
    </>
  );

  const rowClass =
    "flex w-full items-center gap-4 rounded-3xl border border-border/70 bg-card p-3 pr-4 text-left shadow-soft outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50";

  if (isLocked) {
    return (
      <button
        type="button"
        aria-disabled="true"
        aria-label={`${lesson.title}: bài đang khóa, hoàn thành bài trước để mở khóa`}
        onClick={() => toast.info("Bài này đang khóa. Hoàn thành bài trước để mở khóa.")}
        className={cn(rowClass, "cursor-not-allowed shadow-none")}
      >
        {content}
      </button>
    );
  }

  return (
    <Link
      href={`/lessons/${lesson.id}`}
      className={cn(rowClass, "transition-transform duration-200 hover:-translate-y-0.5 motion-reduce:transition-none")}
    >
      {content}
    </Link>
  );
}
