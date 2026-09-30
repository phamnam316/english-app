"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Headphones, LoaderCircle, Mic, Snail, Square, Volume2, X } from "lucide-react";
import { toast } from "sonner";
import { useShallow } from "zustand/react/shallow";

import { FeedbackBanner } from "@/components/lesson/feedback-banner";
import { WordChips } from "@/components/word-chips";
import { LessonFooter } from "@/components/lesson/lesson-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSpeech } from "@/hooks/use-speech";
import {
  RECOGNITION_ERROR_MESSAGES,
  SpeechRecognitionError,
  useSpeechRecognition,
} from "@/hooks/use-speech-recognition";
import { toApiClientError } from "@/lib/api-client";
import { isInsideDialog, isInteractiveTarget, isTypingTarget } from "@/lib/dom";
import { isAnswerCorrect } from "@/lib/scoring";
import { playCorrectSound, playWrongSound } from "@/lib/sounds";
import { QUIZ_TYPE_LABEL, praiseFor } from "@/lib/ui-constants";
import { cn } from "@/lib/utils";
import { useLessonStore } from "@/store/useLessonStore";
import type { CheckAnswerResponse } from "@/types/api";

/** Phần 2 của bài: làm bài tập (trắc nghiệm, điền từ, nghe, xếp câu, nói), kiểm tra từng câu và xem phản hồi ngay */
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
  const isWordOrder = exercise?.type === "WORD_ORDER";
  // Thẻ từ của câu xếp chữ không phải là các đáp án để chọn (không dùng phím 1-9)
  const choiceOptions = isWordOrder ? null : options;
  const audioText = exercise ? (exercise.audioText ?? (exercise.audioUrl ? exercise.question : null)) : null;
  const canCheck = answer.trim().length > 0 && !isChecking && !isSubmitted;

  const playAudio = useCallback(
    (speed = 1) => {
      if (!exercise || !audioText) return;
      void speak(audioText, { speed, audioUrl: exercise.audioUrl });
    },
    [audioText, exercise, speak],
  );

  // Bài nghe: tự phát 1 lần khi sang câu mới
  const exerciseId = exercise?.id;
  const isListeningExercise = exercise?.type === "LISTENING";
  useEffect(() => {
    if (isListeningExercise) playAudio();
    // Chỉ phát lại khi đổi câu, không phát lại khi đổi trạng thái khác
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exerciseId]);

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

      if (choiceOptions && !isSubmitted && /^[1-9]$/.test(event.key)) {
        const option = choiceOptions[Number(event.key) - 1];
        if (option) selectOption(option);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [canCheck, choiceOptions, handleCheck, isSubmitted, nextQuestion, selectOption]);

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

          {audioText &&
            (isListeningExercise ? (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  aria-label="Nghe lại"
                  onClick={() => playAudio()}
                  className="grid size-20 place-items-center rounded-full bg-primary text-primary-foreground shadow-[0_16px_30px_-12px_var(--primary)] outline-none transition-transform hover:scale-105 focus-visible:ring-[3px] focus-visible:ring-ring active:scale-95"
                >
                  <Volume2 className="size-9" />
                </button>
                <Button variant="secondary" size="lg" className="rounded-full" onClick={() => playAudio(0.7)}>
                  <Snail className="size-5" />
                  Nghe chậm
                </Button>
              </div>
            ) : (
              <Button variant="secondary" size="lg" className="h-12 rounded-full px-6" onClick={() => playAudio()}>
                <Headphones className="size-5" />
                Nghe đoạn audio
              </Button>
            ))}
        </div>

        <div className="mt-8">
          {isWordOrder && options ? (
            <WordOrderAnswer
              key={exercise.id}
              chips={options}
              result={isSubmitted ? result : undefined}
              disabled={isSubmitted || isChecking}
              onChange={selectOption}
            />
          ) : choiceOptions ? (
            <OptionList
              options={choiceOptions}
              answer={answer}
              result={isSubmitted ? result : undefined}
              disabled={isSubmitted || isChecking}
              onSelect={selectOption}
            />
          ) : (
            <TextAnswer
              key={exercise.id}
              allowSpeech={exercise.type === "SPEAKING"}
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
  /** Câu nói: có thêm nút micro, nói xong câu nhận dạng được điền vào ô (vẫn sửa được trước khi kiểm tra) */
  allowSpeech?: boolean;
  answer: string;
  result: CheckAnswerResponse | undefined;
  disabled: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

function TextAnswer({ allowSpeech = false, answer, result, disabled, onChange, onSubmit }: TextAnswerProps) {
  const { isSupported, isListening, listen, stop } = useSpeechRecognition();
  const canSpeak = allowSpeech && isSupported;

  const record = async () => {
    if (isListening) {
      stop();
      return;
    }
    try {
      const [best] = await listen();
      if (best) onChange(best.trim());
      else toast.info(RECOGNITION_ERROR_MESSAGES["no-speech"]);
    } catch (error) {
      if (error instanceof SpeechRecognitionError && error.code !== "aborted") {
        toast.error(RECOGNITION_ERROR_MESSAGES[error.code]);
      }
    }
  };

  return (
    <div className="space-y-2">
      <label htmlFor="quiz-answer" className="text-sm font-medium text-muted-foreground">
        {canSpeak ? "Bấm micro để nói, hoặc gõ câu trả lời" : "Câu trả lời của bạn"}
      </label>
      <div className="flex gap-2">
        <Input
          id="quiz-answer"
          autoFocus={!canSpeak}
          value={answer}
          disabled={disabled}
          maxLength={200}
          placeholder={isListening ? "Đang nghe…" : "Nhập câu trả lời"}
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
            "h-14 flex-1 rounded-2xl border-2 bg-card px-4 text-lg font-medium shadow-soft md:text-lg disabled:opacity-100",
            result?.isCorrect && "border-success bg-success-soft text-success",
            result && !result.isCorrect && "border-destructive bg-danger-soft text-destructive line-through decoration-2",
          )}
        />
        {canSpeak && !disabled && (
          <button
            type="button"
            onClick={() => void record()}
            aria-label={isListening ? "Dừng nghe" : "Nói câu trả lời"}
            className={cn(
              "relative grid size-14 shrink-0 place-items-center rounded-2xl outline-none transition-transform focus-visible:ring-[3px] focus-visible:ring-ring/50 active:scale-95",
              isListening ? "bg-destructive text-white" : "bg-primary text-primary-foreground",
            )}
          >
            {isListening && (
              <span aria-hidden className="absolute inset-0 animate-ping rounded-2xl bg-destructive/40 motion-reduce:animate-none" />
            )}
            {isListening ? <Square className="size-5 fill-current" /> : <Mic className="size-6" />}
          </button>
        )}
      </div>
    </div>
  );
}

interface WordOrderAnswerProps {
  chips: string[];
  result: CheckAnswerResponse | undefined;
  disabled: boolean;
  /** Câu ghép được (các thẻ nối bằng dấu cách), server chấm như câu tự gõ */
  onChange: (sentence: string) => void;
}

/** Câu xếp chữ: chạm thẻ từ để ghép câu; có thể có thẻ thừa để gây nhiễu */
function WordOrderAnswer({ chips, result, disabled, onChange }: WordOrderAnswerProps) {
  const [selected, setSelected] = useState<number[]>([]);

  return (
    <WordChips
      chips={chips}
      selected={selected}
      disabled={disabled}
      isCorrect={result?.isCorrect}
      onChange={(next) => {
        setSelected(next);
        onChange(next.map((i) => chips[i]).join(" "));
      }}
    />
  );
}
