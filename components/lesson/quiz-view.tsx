"use client";

import { useCallback, useEffect } from "react";
import { Check, Headphones, LoaderCircle, X } from "lucide-react";
import { toast } from "sonner";
import { useShallow } from "zustand/react/shallow";

import { FeedbackBanner } from "@/components/lesson/feedback-banner";
import { LessonFooter } from "@/components/lesson/lesson-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSpeech } from "@/hooks/use-speech";
import { toApiClientError } from "@/lib/api-client";
import { isInsideDialog, isInteractiveTarget, isTypingTarget } from "@/lib/dom";
import { isAnswerCorrect } from "@/lib/scoring";
import { playCorrectSound, playWrongSound } from "@/lib/sounds";
import { QUIZ_TYPE_LABEL, praiseFor } from "@/lib/ui-constants";
import { cn } from "@/lib/utils";
import { useLessonStore } from "@/store/useLessonStore";
import type { CheckAnswerResponse } from "@/types/api";

/** Phần 2 của bài: làm bài tập (trắc nghiệm / điền từ), kiểm tra từng câu và xem phản hồi ngay */
export function QuizView() {
  const {
    exercises,
    currentIndex,
    userAnswers,
    results,
    isSubmitted,
    isChecking,
    selectOption,
    checkAnswer,
    nextQuestion,
  } = useLessonStore(
    useShallow((s) => ({
      exercises: s.exercises,
      currentIndex: s.currentIndex,
      userAnswers: s.userAnswers,
      results: s.results,
      isSubmitted: s.isSubmitted,
      isChecking: s.isChecking,
      selectOption: s.selectOption,
      checkAnswer: s.checkAnswer,
      nextQuestion: s.nextQuestion,
    })),
  );
  const { speak } = useSpeech();

  const exercise = exercises[currentIndex];
  const answer = exercise ? (userAnswers[exercise.id] ?? "") : "";
  const result: CheckAnswerResponse | undefined = exercise ? results[exercise.id] : undefined;
  const options = exercise?.options && exercise.options.length > 0 ? exercise.options : null;
  const canCheck = answer.trim().length > 0 && !isChecking && !isSubmitted;

  const handleCheck = useCallback(async () => {
    try {
      const checked = await checkAnswer();
      if (!checked) return;
      if (checked.isCorrect) playCorrectSound();
      else playWrongSound();
    } catch (error) {
      toast.error(toApiClientError(error).message);
    }
  }, [checkAnswer]);

  // Phím tắt: 1-9 chọn đáp án, Enter để kiểm tra / tiếp tục
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || isInsideDialog(event.target) || isTypingTarget(event.target)) return;

      if (event.key === "Enter") {
        const onOption = event.target instanceof HTMLElement && event.target.closest("[data-quiz-option]");
        // Nút khác đang được focus (vd "Tiếp tục") -> để trình duyệt tự bấm nút đó, tránh xử lý 2 lần
        if (isInteractiveTarget(event.target) && !onOption) return;
        event.preventDefault();
        if (isSubmitted) nextQuestion();
        else if (canCheck) void handleCheck();
        return;
      }

      if (options && !isSubmitted && /^[1-9]$/.test(event.key)) {
        const option = options[Number(event.key) - 1];
        if (option) selectOption(option);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [canCheck, handleCheck, isSubmitted, nextQuestion, options, selectOption]);

  if (!exercise) return null;

  return (
    <>
      {/* Chừa chỗ dưới cùng cho thanh nút / banner phản hồi */}
      <div className={cn("mx-auto w-full max-w-2xl px-4 pt-4 sm:pt-8", isSubmitted ? "pb-80 sm:pb-48" : "pb-32")}>
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-3 text-sm font-semibold">
            <span className="rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground">{QUIZ_TYPE_LABEL[exercise.type]}</span>
            <span className="text-muted-foreground tabular-nums">
              Câu {currentIndex + 1}/{exercises.length}
            </span>
          </div>

          {exercise.type === "FILL_IN_BLANK" && !options ? (
            <FillBlankQuestion
              question={exercise.question}
              answer={answer}
              isCorrect={isSubmitted && result ? result.isCorrect : undefined}
            />
          ) : (
            <h1 className="text-2xl leading-snug font-semibold text-balance sm:text-3xl">{exercise.question}</h1>
          )}

          {exercise.audioUrl && (
            <Button
              variant="secondary"
              size="lg"
              className="h-12 rounded-full px-6"
              onClick={() => void speak(exercise.question, { audioUrl: exercise.audioUrl })}
            >
              <Headphones className="size-5" />
              Nghe đoạn audio
            </Button>
          )}
        </div>

        <div className="mt-8">
          {options ? (
            <OptionList
              options={options}
              answer={answer}
              result={isSubmitted ? result : undefined}
              disabled={isSubmitted || isChecking}
              onSelect={selectOption}
            />
          ) : (
            <TextAnswer
              key={exercise.id}
              answer={answer}
              result={isSubmitted ? result : undefined}
              disabled={isSubmitted || isChecking}
              onChange={selectOption}
              onSubmit={() => {
                if (canCheck) void handleCheck();
              }}
            />
          )}
        </div>
      </div>

      {isSubmitted && result ? (
        <FeedbackBanner
          isCorrect={result.isCorrect}
          praise={praiseFor(currentIndex)}
          correctAnswer={result.correctAnswer}
          explanation={result.explanation}
          onContinue={nextQuestion}
        />
      ) : (
        <LessonFooter className="justify-end">
          <p className="mr-auto hidden text-sm text-muted-foreground sm:block">
            Nhấn <kbd className="rounded-md border bg-card px-1.5 py-0.5 font-sans text-xs font-semibold">Enter</kbd> để kiểm tra
          </p>
          <Button
            size="lg"
            className="w-full sm:w-auto sm:min-w-48"
            disabled={!canCheck}
            onClick={() => void handleCheck()}
          >
            {isChecking ? (
              <>
                <LoaderCircle className="animate-spin" />
                Đang kiểm tra
              </>
            ) : (
              "Kiểm tra"
            )}
          </Button>
        </LessonFooter>
      )}
    </>
  );
}

/** Câu điền từ: chỗ trống "____" hiện luôn chữ user đang gõ */
function FillBlankQuestion({ question, answer, isCorrect }: { question: string; answer: string; isCorrect?: boolean }) {
  const parts = question.split(/_{2,}/);
  if (parts.length === 1) {
    return <h1 className="text-2xl leading-snug font-semibold text-balance sm:text-3xl">{question}</h1>;
  }

  return (
    <h1 className="text-2xl leading-relaxed font-semibold sm:text-3xl">
      {parts.map((part, i) => (
        <span key={i}>
          {part}
          {i < parts.length - 1 && (
            <span
              className={cn(
                "mx-1 inline-block min-w-24 border-b-[3px] border-dashed px-1 text-center",
                isCorrect === undefined && "border-primary/60 text-primary",
                isCorrect === true && "border-success text-success",
                isCorrect === false && "border-destructive text-destructive line-through decoration-2",
              )}
            >
              {answer.trim() || " "}
            </span>
          )}
        </span>
      ))}
    </h1>
  );
}

interface OptionListProps {
  options: string[];
  answer: string;
  result: CheckAnswerResponse | undefined;
  disabled: boolean;
  onSelect: (option: string) => void;
}

function OptionList({ options, answer, result, disabled, onSelect }: OptionListProps) {
  return (
    <div role="group" aria-label="Các đáp án" className="grid gap-3 sm:grid-cols-2">
      {options.map((option, index) => {
        const isSelected = answer === option;
        const isRightOption = result ? isAnswerCorrect(option, result.correctAnswer) : false;
        const isWrongPick = Boolean(result) && isSelected && !isRightOption;
        const isDimmed = Boolean(result) && !isRightOption && !isWrongPick;

        return (
          <button
            key={option}
            type="button"
            data-quiz-option
            aria-pressed={isSelected}
            disabled={disabled}
            onClick={() => onSelect(option)}
            className={cn(
              "flex min-h-14 items-center gap-3 rounded-2xl border-2 border-border bg-card px-4 py-3 text-left text-base font-medium shadow-soft outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-default",
              !result && !isSelected && "hover:border-primary/40 hover:bg-secondary/50",
              !result && isSelected && "border-primary bg-secondary text-secondary-foreground",
              isRightOption && "border-success bg-success-soft text-success",
              isWrongPick && "border-destructive bg-danger-soft text-destructive",
              isDimmed && "text-muted-foreground",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "grid size-7 shrink-0 place-items-center rounded-full border-2 text-xs font-semibold",
                !result && isSelected ? "border-primary text-primary" : "border-current/25 text-muted-foreground",
                (isRightOption || isWrongPick) && "border-current text-current",
              )}
            >
              {index + 1}
            </span>
            <span className={cn("flex-1", isWrongPick && "line-through decoration-2")}>{option}</span>
            {isRightOption && <Check aria-label="Đáp án đúng" className="size-5 shrink-0" strokeWidth={3} />}
            {isWrongPick && <X aria-label="Bạn đã chọn sai" className="size-5 shrink-0" strokeWidth={3} />}
          </button>
        );
      })}
    </div>
  );
}

interface TextAnswerProps {
  answer: string;
  result: CheckAnswerResponse | undefined;
  disabled: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

function TextAnswer({ answer, result, disabled, onChange, onSubmit }: TextAnswerProps) {
  return (
    <div className="space-y-2">
      <label htmlFor="quiz-answer" className="text-sm font-medium text-muted-foreground">
        Câu trả lời của bạn
      </label>
      <Input
        id="quiz-answer"
        autoFocus
        value={answer}
        disabled={disabled}
        maxLength={200}
        placeholder="Nhập câu trả lời"
        autoComplete="off"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        enterKeyHint="done"
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            onSubmit();
          }
        }}
        className={cn(
          "h-14 rounded-2xl border-2 bg-card px-4 text-lg font-medium shadow-soft md:text-lg disabled:opacity-100",
          result?.isCorrect && "border-success bg-success-soft text-success",
          result && !result.isCorrect && "border-destructive bg-danger-soft text-destructive line-through decoration-2",
        )}
      />
    </div>
  );
}
