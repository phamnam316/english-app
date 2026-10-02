"use client";

import { Check, X } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

import { cn } from "@/lib/utils";
import { useLessonStore } from "@/store/useLessonStore";

/**
 * Dàn bài (cột trái, máy tính): Phần 1 học từ (đã xem / đang xem / chưa xem), ghi chú ngữ pháp, Phần 2 làm bài.
 * Trong phần học từ và ngữ pháp có thể bấm để quay lại bất kỳ từ nào.
 */
export function LessonOutline({ className }: { className?: string }) {
  const { lesson, vocabularies, exercises, phase, vocabIndex, maxVocabIndex, currentIndex, results, goToVocab, goToGrammar } =
    useLessonStore(
      useShallow((s) => ({
        lesson: s.lesson,
        vocabularies: s.vocabularies,
        exercises: s.exercises,
        phase: s.phase,
        vocabIndex: s.vocabIndex,
        maxVocabIndex: s.maxVocabIndex,
        currentIndex: s.currentIndex,
        results: s.results,
        goToVocab: s.goToVocab,
        goToGrammar: s.goToGrammar,
      })),
    );
  if (!lesson) return null;

  const canNavigate = phase === "vocabulary" || phase === "grammar";
  const vocabFinished = phase !== "vocabulary";
  const quizStarted = phase === "quiz" || phase === "completed";

  return (
    <nav aria-label="Dàn bài" className={cn("border-r border-line py-9 pr-8", className)}>
      {vocabularies.length > 0 && (
        <>
          <p className="text-[13px] font-semibold text-muted-foreground">Phần 1 · Học từ</p>
          <ol className="mt-3 space-y-0.5">
            {vocabularies.map((vocab, index) => {
              const isCurrent = phase === "vocabulary" && index === vocabIndex;
              const isSeen = vocabFinished || index < vocabIndex || index <= maxVocabIndex;
              return (
                <li key={vocab.id}>
                  <button
                    type="button"
                    disabled={!canNavigate}
                    aria-current={isCurrent ? "step" : undefined}
                    onClick={() => goToVocab(index)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left outline-none transition-colors focus-visible:outline-2 focus-visible:outline-ring disabled:cursor-default",
                      isCurrent ? "bg-card font-semibold ring-1 ring-line" : isSeen ? "text-muted-foreground" : "",
                      canNavigate && !isCurrent && "hover:bg-card",
                    )}
                  >
                    {isCurrent ? (
                      <span aria-hidden className="mr-0.5 ml-1 size-2 shrink-0 rounded-full bg-clay" />
                    ) : isSeen ? (
                      <Check aria-label="Đã xem" className="size-3.5 shrink-0 text-success" strokeWidth={2.5} />
                    ) : (
                      <span aria-hidden className="mr-0.5 ml-1 size-2 shrink-0 rounded-full border border-line-strong" />
                    )}
                    <span className="truncate font-serif text-[17px]">{vocab.word}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </>
      )}

      {lesson.grammarNote && (
        <div className={cn(vocabularies.length > 0 && "mt-7 border-t border-line pt-5")}>
          <p className="text-[13px] font-semibold text-muted-foreground">Ghi chú ngữ pháp</p>
          <button
            type="button"
            disabled={!canNavigate}
            onClick={goToGrammar}
            aria-current={phase === "grammar" ? "step" : undefined}
            className={cn(
              "mt-2 flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left text-[15px] outline-none transition-colors focus-visible:outline-2 focus-visible:outline-ring disabled:cursor-default",
              phase === "grammar" ? "bg-card font-semibold ring-1 ring-line" : quizStarted && "text-muted-foreground",
              canNavigate && phase !== "grammar" && "hover:bg-card",
            )}
          >
            {quizStarted && <Check aria-label="Đã xem" className="size-3.5 shrink-0 text-success" strokeWidth={2.5} />}
            {lesson.grammarNote.title}
          </button>
        </div>
      )}

      {exercises.length > 0 && (
        <div className="mt-7 border-t border-line pt-5">
          <p className="text-[13px] font-semibold text-muted-foreground">Phần 2 · Làm bài</p>
          {quizStarted ? (
            <ol className="mt-3 flex flex-wrap gap-1.5 px-2.5" aria-label="Các câu hỏi">
              {exercises.map((exercise, index) => {
                const result = results[exercise.id];
                const isCurrent = phase === "quiz" && index === currentIndex && !result;
                return (
                  <li
                    key={exercise.id}
                    aria-label={`Câu ${index + 1}${result ? (result.isCorrect ? ": đúng" : ": sai") : ""}`}
                    className={cn(
                      "grid size-7 place-items-center rounded-full border text-[12px] font-semibold tabular-nums",
                      result?.isCorrect && "border-success bg-success-soft text-success",
                      result && !result.isCorrect && "border-destructive bg-danger-soft text-destructive",
                      !result && isCurrent && "border-moss text-moss-strong",
                      !result && !isCurrent && "border-line-strong text-muted-foreground",
                    )}
                  >
                    {result ? (
                      result.isCorrect ? (
                        <Check aria-hidden className="size-3.5" strokeWidth={3} />
                      ) : (
                        <X aria-hidden className="size-3.5" strokeWidth={3} />
                      )
                    ) : (
                      index + 1
                    )}
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="mt-2 px-2.5 text-[15px] text-muted-foreground">
              {exercises.length} câu · mở sau phần học từ
            </p>
          )}
        </div>
      )}
    </nav>
  );
}

/** Điện thoại: dải bước gọn dưới header (Học từ · Ngữ pháp · Làm bài) */
export function LessonSteps({ className }: { className?: string }) {
  const { lesson, vocabCount, exerciseCount, phase, vocabIndex, currentIndex } = useLessonStore(
    useShallow((s) => ({
      lesson: s.lesson,
      vocabCount: s.vocabularies.length,
      exerciseCount: s.exercises.length,
      phase: s.phase,
      vocabIndex: s.vocabIndex,
      currentIndex: s.currentIndex,
    })),
  );
  if (!lesson || phase === "completed") return null;

  const steps = [
    vocabCount > 0 && { key: "vocabulary", label: phase === "vocabulary" ? `Học từ ${vocabIndex + 1}/${vocabCount}` : "Học từ" },
    lesson.grammarNote && { key: "grammar", label: "Ngữ pháp" },
    exerciseCount > 0 && {
      key: "quiz",
      label: phase === "quiz" ? `Làm bài ${currentIndex + 1}/${exerciseCount}` : `Làm bài ${exerciseCount} câu`,
    },
  ].filter(Boolean) as Array<{ key: string; label: string }>;
  const order = ["vocabulary", "grammar", "quiz"];

  return (
    <ol className={cn("flex items-center gap-2 overflow-x-auto px-4 py-3 text-[13px] sm:px-8", className)}>
      {steps.map((step, i) => {
        const isCurrent = step.key === phase;
        const isDone = order.indexOf(step.key) < order.indexOf(phase);
        return (
          <li key={step.key} className="flex shrink-0 items-center gap-2">
            {i > 0 && <span aria-hidden className="h-px w-5 bg-line-strong" />}
            <span
              className={cn(
                "inline-flex items-center gap-1.5",
                isCurrent ? "font-semibold text-foreground" : "text-muted-foreground",
              )}
            >
              {isDone ? (
                <Check aria-hidden className="size-3.5 text-success" strokeWidth={2.5} />
              ) : (
                <span aria-hidden className={cn("size-1.5 rounded-full", isCurrent ? "bg-clay" : "border border-line-strong")} />
              )}
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
