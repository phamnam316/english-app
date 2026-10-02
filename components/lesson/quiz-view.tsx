"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Headphones, LoaderCircle, Mic, Snail, Square, Volume2, X } from "lucide-react";
import { toast } from "sonner";
import { useShallow } from "zustand/react/shallow";

import { FeedbackBanner } from "@/components/lesson/feedback-banner";
import { Kbd, LessonFooter } from "@/components/lesson/lesson-footer";
import { WordChips } from "@/components/word-chips";
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

const questionClass = "font-sans text-2xl leading-snug font-semibold tracking-normal text-balance sm:text-[1.75rem]";

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
      {/* Chừa chỗ dưới cùng cho thanh nút / khung phản hồi */}
      <div className={cn("w-full max-w-[720px] pt-6 sm:pt-10 lg:pt-12", isSubmitted ? "pb-80 sm:pb-56" : "pb-36")}>
        <div className="space-y-4">
          <p className="flex items-center justify-between gap-3 text-[14px]">
            <span className="font-semibold text-muted-foreground">{QUIZ_TYPE_LABEL[exercise.type]}</span>
            <span className="text-muted-foreground tabular-nums">
              Câu {currentIndex + 1}/{exercises.length}
            </span>
          </p>

          {exercise.type === "FILL_IN_BLANK" && !options ? (
            <FillBlankQuestion
              question={exercise.question}
              answer={answer}
              isCorrect={isSubmitted && result ? result.isCorrect : undefined}
            />
          ) : (
            <h1 className={questionClass}>{exercise.question}</h1>
          )}

          {audioText &&
            (isListeningExercise ? (
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  aria-label="Nghe lại"
                  onClick={() => playAudio()}
                  className="grid size-16 place-items-center rounded-full bg-moss text-white outline-none transition-colors hover:bg-moss-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss dark:text-primary-foreground"
                >
                  <Volume2 className="size-7" />
                </button>
                <button
                  type="button"
                  onClick={() => playAudio(0.7)}
                  className="inline-flex h-11 items-center gap-2 rounded-full border border-line-strong px-4 text-[15px] font-medium outline-none hover:bg-card focus-visible:outline-2 focus-visible:outline-ring"
                >
                  <Snail className="size-[18px]" />
                  Nghe chậm
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => playAudio()}
                className="inline-flex h-11 items-center gap-2 rounded-full border border-line-strong px-5 text-[15px] font-medium outline-none hover:bg-card focus-visible:outline-2 focus-visible:outline-ring"
              >
                <Headphones className="size-[18px]" />
                Nghe đoạn audio
              </button>
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
          <p className="mr-auto hidden text-[13px] text-muted-foreground md:block">
            {choiceOptions && (
              <>
                <Kbd>1</Kbd>–<Kbd>{Math.min(choiceOptions.length, 9)}</Kbd> để chọn,{" "}
              </>
            )}
            <Kbd>Enter</Kbd> để kiểm tra
          </p>
          <Button size="lg" className="w-full sm:w-auto sm:min-w-56" disabled={!canCheck} onClick={() => void handleCheck()}>
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
  if (parts.length === 1) return <h1 className={questionClass}>{question}</h1>;

  return (
    <h1 className={cn(questionClass, "leading-relaxed")}>
      {parts.map((part, i) => (
        <span key={i}>
          {part}
          {i < parts.length - 1 && (
            <span
              className={cn(
                "mx-1 inline-block min-w-24 border-b-2 border-dashed px-1 text-center",
                isCorrect === undefined && "border-moss text-moss-strong",
                isCorrect === true && "border-success text-success",
                isCorrect === false && "border-destructive text-destructive line-through decoration-2",
              )}
            >
              {answer.trim() || " "}
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
  // Lựa chọn ngắn (1–2 từ) xếp 2 cột cho gọn, câu dài xếp 1 cột cho dễ đọc
  const isShort = options.every((option) => option.length <= 18);

  return (
    <div role="group" aria-label="Các đáp án" className={cn("grid gap-2.5", isShort && "sm:grid-cols-2")}>
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
              "flex min-h-14 items-center gap-3 rounded-md border bg-card px-4 py-3 text-left text-base font-medium outline-none transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-default",
              !result && !isSelected && "border-line-strong hover:border-moss",
              !result && isSelected && "border-2 border-moss bg-moss-soft px-[15px] text-moss-strong",
              isRightOption && "border-2 border-success bg-success-soft px-[15px] text-success",
              isWrongPick && "border-2 border-destructive bg-danger-soft px-[15px] text-destructive",
              isDimmed && "border-line text-muted-foreground",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "grid size-6 shrink-0 place-items-center rounded-full border text-[12px] font-semibold",
                isSelected || isRightOption || isWrongPick ? "border-current" : "border-line-strong text-muted-foreground",
              )}
            >
              {index + 1}
            </span>
            <span className={cn("flex-1", isWrongPick && "line-through decoration-2")}>{option}</span>
            {isRightOption && <Check aria-label="Đáp án đúng" className="size-5 shrink-0" strokeWidth={2.5} />}
            {isWrongPick && <X aria-label="Bạn đã chọn sai" className="size-5 shrink-0" strokeWidth={2.5} />}
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
      <label htmlFor="quiz-answer" className="text-[14px] font-medium text-muted-foreground">
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
            "h-14 flex-1 px-4 text-lg font-medium md:text-lg disabled:opacity-100",
            result?.isCorrect && "border-2 border-success bg-success-soft text-success",
            result && !result.isCorrect && "border-2 border-destructive bg-danger-soft text-destructive line-through decoration-2",
          )}
        />
        {canSpeak && !disabled && (
          <button
            type="button"
            onClick={() => void record()}
            aria-label={isListening ? "Dừng nghe" : "Nói câu trả lời"}
            className={cn(
              "relative grid size-14 shrink-0 place-items-center rounded-md text-white outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
              isListening ? "bg-destructive" : "bg-moss hover:bg-moss-strong dark:text-primary-foreground",
            )}
          >
            {isListening && (
              <span aria-hidden className="absolute inset-0 animate-ping rounded-md bg-destructive/40 motion-reduce:animate-none" />
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
