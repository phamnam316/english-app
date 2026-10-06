"use client";

import Link from "next/link";
import { CircleCheck, LockKeyhole, Play } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { estimateMinutes, shortUnitTitle, type LessonWithState, type UnitWithStates } from "@/lib/course-progress";
import { cn } from "@/lib/utils";
import type { VocabularyItem } from "@/types/api";

interface UnitCardProps {
  unit: UnitWithStates;
  /** Số thứ tự bài đầu tiên của chương trong cả khóa (đánh số liên tục 01, 02…) */
  firstNumber: number;
  /** Bài đang học: hiện mở rộng với nút vào học */
  currentLessonId?: string;
  /** Từ của bài đang học (tải riêng) */
  previewWords?: VocabularyItem[];
  /** Hàng cuối của thẻ, vd nút "Xem toàn bộ chương" */
  footer?: React.ReactNode;
}

/** Thẻ 1 chương: danh sách bài với trạng thái đã xong / đang học / chưa mở, bài đang học được mở rộng */
export function UnitCard({ unit, firstNumber, currentLessonId, previewWords, footer }: UnitCardProps) {
  const completed = unit.lessons.filter((l) => l.state === "completed").length;
  const subtitle = unit.title.match(/\(([^)]*)\)\s*$/)?.[1];

  return (
    <section
      id={`unit-${unit.id}`}
      aria-labelledby={`unit-title-${unit.id}`}
      className="scroll-mt-6 overflow-hidden rounded-lg border border-line bg-card"
    >
      <header className="flex items-baseline justify-between gap-4 border-b border-line px-5 py-4 sm:px-8 sm:py-5">
        <h2 id={`unit-title-${unit.id}`} className="font-sans text-[15px] font-semibold tracking-normal">
          Chương {unit.order} · {shortUnitTitle(unit.title)}
          {subtitle && <span className="font-normal text-muted-foreground"> ({subtitle})</span>}
        </h2>
        <span className="shrink-0 text-[15px] text-muted-foreground tabular-nums">
          {completed}/{unit.lessons.length} bài
        </span>
      </header>

      {unit.lessons.length === 0 ? (
        <p className="px-5 py-5 text-[15px] text-muted-foreground sm:px-8">Chương này chưa có bài học.</p>
      ) : (
        <ol>
          {unit.lessons.map((lesson, index) => (
            <li key={lesson.id} className="border-b border-line last:border-b-0">
              {lesson.id === currentLessonId ? (
                <CurrentLesson lesson={lesson} number={firstNumber + index} words={previewWords} />
              ) : (
                <LessonRow lesson={lesson} number={firstNumber + index} />
              )}
            </li>
          ))}
        </ol>
      )}

      {footer && <div className="border-t border-line px-5 py-4 sm:px-8">{footer}</div>}
    </section>
  );
}

const pad = (n: number) => String(n).padStart(2, "0");

function LessonRow({ lesson, number }: { lesson: LessonWithState; number: number }) {
  const isLocked = lesson.state === "locked";
  const isReview = lesson.vocabCount === 0;

  const content = (
    <>
      <span className="w-7 shrink-0 text-[15px] text-muted-foreground tabular-nums">{pad(number)}</span>
      <span className={cn("min-w-0 flex-1 text-[15px] leading-snug", lesson.state === "completed" && "text-muted-foreground")}>
        {lesson.title}
        {isReview && (
          <span className="ml-1.5 text-[13px] text-muted-foreground">
            · không có từ mới · +{lesson.xpReward} XP
          </span>
        )}
      </span>
      {lesson.state === "completed" ? (
        <span className="inline-flex shrink-0 items-center gap-2 text-[13px] text-moss-strong">
          <span className="hidden sm:inline">Đã hoàn thành{lesson.score !== null && ` · ${lesson.score}%`}</span>
          <CircleCheck aria-label="Đã hoàn thành" className="size-[18px]" />
        </span>
      ) : isLocked ? (
        <span className="inline-flex shrink-0 items-center gap-2 text-[13px] text-muted-foreground">
          <span className="hidden sm:inline">Chưa mở khóa</span>
          <LockKeyhole aria-label="Chưa mở khóa" className="size-4" />
        </span>
      ) : (
        <span className="shrink-0 text-[13px] font-medium text-clay-strong">Đang học</span>
      )}
    </>
  );

  const rowClass = "flex w-full items-center gap-4 px-5 py-4 text-left outline-none sm:px-8";

  if (isLocked) {
    return (
      <button
        type="button"
        aria-disabled="true"
        aria-label={`${lesson.title}: bài đang khóa, hoàn thành bài trước để mở khóa`}
        onClick={() => toast.info("Bài này đang khóa. Hoàn thành bài trước để mở khóa.")}
        className={cn(rowClass, "cursor-not-allowed focus-visible:bg-paper")}
      >
        {content}
      </button>
    );
  }

  return (
    <Link
      href={`/lessons/${lesson.id}`}
      prefetch={false}
      className={cn(rowClass, "transition-colors hover:bg-paper focus-visible:bg-paper")}
    >
      {content}
    </Link>
  );
}

function CurrentLesson({ lesson, number, words }: { lesson: LessonWithState; number: number; words?: VocabularyItem[] }) {
  const isStarted = lesson.status === "IN_PROGRESS";
  const minutes = estimateMinutes(lesson.vocabCount, lesson.exerciseCount);

  return (
    <div className="relative flex gap-4 bg-paper px-5 py-7 sm:px-8">
      <span aria-hidden className="ribbon absolute top-0 right-6 h-11 w-[18px] bg-clay sm:right-8" />
      <span className="w-7 shrink-0 pt-0.5 text-[15px] font-semibold text-clay-strong tabular-nums">{pad(number)}</span>
      <div className="min-w-0 flex-1 pr-6">
        <p className="text-[13px] font-medium text-clay-strong">{isStarted ? "Đang học" : "Bài tiếp theo"}</p>
        <h3 className="mt-1 font-serif text-[2rem] leading-tight font-medium text-balance">{lesson.title}</h3>
        <p className="mt-3 text-[15px]">
          {lesson.vocabCount > 0 && (
            <>
              <b className="font-semibold">{lesson.vocabCount}</b> từ mới ·{" "}
            </>
          )}
          <b className="font-semibold">{lesson.exerciseCount}</b> bài tập · khoảng{" "}
          <b className="font-semibold">{minutes}</b> phút
          <span className="ml-2 text-[13px] text-muted-foreground">+{lesson.xpReward} XP</span>
        </p>
        {lesson.vocabCount > 0 &&
          (words ? (
            <p className="mt-3 font-serif text-[17px] text-muted-foreground">
              {words.map((w) => w.word).join(", ")}
            </p>
          ) : (
            <Skeleton className="mt-3 h-5 w-64 max-w-full" />
          ))}
        <Button asChild size="lg" className="mt-6 h-auto min-h-12 py-3 leading-snug whitespace-normal">
          <Link href={`/lessons/${lesson.id}`}>
            <Play className="size-4" />
            Học bài: {lesson.title}
          </Link>
        </Button>
      </div>
    </div>
  );
}
