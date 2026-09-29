"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, LoaderCircle, RotateCw, Snail, Volume2 } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

import { LessonFooter } from "@/components/lesson/lesson-footer";
import { Button } from "@/components/ui/button";
import { useSpeech } from "@/hooks/use-speech";
import { isTypingTarget } from "@/lib/dom";
import { cn } from "@/lib/utils";
import { useLessonStore } from "@/store/useLessonStore";
import type { VocabularyItem } from "@/types/api";

type Direction = "next" | "prev";

/** Phần 1 của bài: học từ vựng bằng flashcard (lật thẻ, trượt sang từ tiếp theo) */
export function VocabularyView() {
  const { vocabularies, vocabIndex, hasExercises, goToVocab, startQuiz } = useLessonStore(
    useShallow((s) => ({
      vocabularies: s.vocabularies,
      vocabIndex: s.vocabIndex,
      hasExercises: s.exercises.length > 0,
      goToVocab: s.goToVocab,
      startQuiz: s.startQuiz,
    })),
  );
  const [direction, setDirection] = useState<Direction>("next");

  const vocab = vocabularies[vocabIndex];
  const isFirst = vocabIndex === 0;
  const isLast = vocabIndex === vocabularies.length - 1;

  const go = useCallback(
    (step: 1 | -1) => {
      if (step === 1 && isLast) {
        startQuiz();
        return;
      }
      if (step === -1 && isFirst) return;
      setDirection(step === 1 ? "next" : "prev");
      goToVocab(vocabIndex + step);
    },
    [goToVocab, isFirst, isLast, startQuiz, vocabIndex],
  );

  // Phím tắt trên máy tính: ← → để chuyển thẻ
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || isTypingTarget(event.target)) return;
      if (event.key === "ArrowRight") go(1);
      if (event.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [go]);

  if (!vocab) return null;

  return (
    <>
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col px-4 pt-4 pb-32 sm:pt-8">
        <div className="mb-4 flex items-baseline justify-between gap-3">
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Từ mới</h1>
          <span className="text-sm font-semibold text-muted-foreground tabular-nums">
            {vocabIndex + 1}/{vocabularies.length}
          </span>
        </div>

        {/* key đổi theo từ -> thẻ mới được tạo lại: tự về mặt trước và chạy hiệu ứng trượt */}
        <Flashcard key={vocab.id} vocab={vocab} direction={direction} onSwipe={go} />

        <p className="mt-4 hidden text-center text-sm text-muted-foreground sm:block">
          Nhấn <Kbd>Space</Kbd> để lật thẻ, <Kbd>←</Kbd> <Kbd>→</Kbd> để chuyển từ
        </p>
      </div>

      <LessonFooter className="justify-between">
        <Button
          variant="outline"
          size="lg"
          className="px-4"
          onClick={() => go(-1)}
          disabled={isFirst}
          aria-label="Từ trước"
        >
          <ChevronLeft className="size-5" />
          <span className="hidden sm:inline">Từ trước</span>
        </Button>
        <Button size="lg" className="flex-1 sm:ml-auto sm:max-w-64" onClick={() => go(1)}>
          {isLast ? (hasExercises ? "Làm bài tập" : "Hoàn thành") : "Từ tiếp theo"}
          {!isLast && <ChevronRight className="size-5" />}
        </Button>
      </LessonFooter>
    </>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="mx-0.5 rounded-md border bg-card px-1.5 py-0.5 font-sans text-xs font-semibold">{children}</kbd>
  );
}

/** Tô đậm từ đang học trong câu ví dụ (kể cả dạng chia: greet -> greeted) */
function highlightWord(sentence: string, word: string): React.ReactNode {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = sentence.split(new RegExp(`(${escaped}\\w*)`, "i"));
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-bold text-primary">
        {part}
      </strong>
    ) : (
      part
    ),
  );
}

interface FlashcardProps {
  vocab: VocabularyItem;
  direction: Direction;
  onSwipe: (step: 1 | -1) => void;
}

function Flashcard({ vocab, direction, onSwipe }: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const { speak, isLoading } = useSpeech();
  const touchStartX = useRef<number | null>(null);
  const frontFlipRef = useRef<HTMLButtonElement>(null);
  const backFlipRef = useRef<HTMLButtonElement>(null);
  const moveFocusRef = useRef(false);

  const flip = useCallback(() => setIsFlipped((value) => !value), []);

  // Lật bằng nút (bàn phím / trình đọc màn hình) -> chuyển focus sang nút của mặt vừa hiện ra
  useEffect(() => {
    if (!moveFocusRef.current) return;
    moveFocusRef.current = false;
    (isFlipped ? backFlipRef : frontFlipRef).current?.focus();
  }, [isFlipped]);

  // Space ở bất kỳ đâu trên trang (trừ khi đang gõ / đang focus 1 nút) -> lật thẻ
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== " " || event.defaultPrevented || isTypingTarget(event.target)) return;
      if (event.target instanceof HTMLElement && event.target.closest("button, a")) return;
      event.preventDefault();
      flip();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [flip]);

  const flipButton = (label: string, ref: React.RefObject<HTMLButtonElement | null>) => (
    <button
      ref={ref}
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        moveFocusRef.current = true;
        flip();
      }}
      className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      <RotateCw className="size-4" />
      {label}
    </button>
  );

  const speakButton = (text: string, options: { speed?: number; label: string; slow?: boolean; audioUrl?: string | null }) => {
    const loading = isLoading(text, { speed: options.speed });
    return (
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="h-10 rounded-full px-4"
        aria-label={options.label}
        onClick={(event) => {
          event.stopPropagation(); // không lật thẻ khi bấm nút nghe
          void speak(text, { speed: options.speed, audioUrl: options.audioUrl });
        }}
      >
        {loading ? (
          <LoaderCircle className="animate-spin" />
        ) : options.slow ? (
          <Snail className="size-[18px]" />
        ) : (
          <Volume2 className="size-[18px]" />
        )}
        {options.slow ? "Nghe chậm" : "Nghe"}
      </Button>
    );
  };

  return (
    <div
      className={cn(
        "animate-in fade-in duration-300 motion-reduce:animate-none",
        direction === "next" ? "slide-in-from-right-8" : "slide-in-from-left-8",
      )}
      onTouchStart={(event) => {
        touchStartX.current = event.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(event) => {
        const startX = touchStartX.current;
        touchStartX.current = null;
        const endX = event.changedTouches[0]?.clientX;
        if (startX === null || endX === undefined) return;
        const deltaX = endX - startX;
        // Vuốt ngang đủ xa mới tính là chuyển thẻ; chạm nhẹ vẫn là lật thẻ
        if (Math.abs(deltaX) > 60) onSwipe(deltaX < 0 ? 1 : -1);
      }}
    >
      <div className="perspective-[1400px]">
        {/* Chạm/bấm vào bất kỳ đâu trên thẻ để lật. Bàn phím: nút lật bên trong thẻ hoặc phím Space */}
        <div
          onClick={flip}
          className={cn(
            "relative grid min-h-[22rem] cursor-pointer transition-transform duration-500 ease-out transform-3d motion-reduce:transition-none sm:min-h-[24rem]",
            isFlipped && "rotate-y-180",
          )}
        >
          {/* Mặt trước: từ, phiên âm, nút nghe. inert khi đang úp: không focus, không đọc được */}
          <section
            aria-label={`Từ ${vocab.word}`}
            inert={isFlipped}
            className="col-start-1 row-start-1 flex flex-col items-center justify-center gap-5 rounded-[2rem] border border-border/70 bg-card px-6 py-10 text-center shadow-soft backface-hidden"
          >
            <div className="space-y-2">
              <p className="text-5xl font-semibold tracking-tight break-words text-primary sm:text-6xl">{vocab.word}</p>
              {vocab.phonetic && <p className="text-lg text-muted-foreground">{vocab.phonetic}</p>}
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {speakButton(vocab.word, { label: `Nghe phát âm từ ${vocab.word}`, audioUrl: vocab.audioUrl })}
              {speakButton(vocab.word, {
                speed: 0.75,
                slow: true,
                label: `Nghe chậm từ ${vocab.word}`,
                audioUrl: vocab.audioUrl,
              })}
            </div>
            {flipButton("Xem nghĩa", frontFlipRef)}
          </section>

          {/* Mặt sau: nghĩa tiếng Việt, câu ví dụ */}
          <section
            aria-label={`Nghĩa của từ ${vocab.word}`}
            inert={!isFlipped}
            className="col-start-1 row-start-1 flex flex-col justify-center gap-6 rounded-[2rem] border border-border/70 bg-card px-6 py-8 shadow-soft backface-hidden rotate-y-180 sm:px-8"
          >
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-heading text-lg font-semibold text-primary">{vocab.word}</span>
              {vocab.phonetic && <span className="text-sm text-muted-foreground">{vocab.phonetic}</span>}
            </div>
            <p className="text-3xl leading-tight font-semibold text-balance sm:text-4xl">{vocab.meaning}</p>
            {vocab.exampleSentence && (
              <figure className="space-y-3 rounded-2xl bg-surface-soft p-4">
                <blockquote className="text-base leading-relaxed">{highlightWord(vocab.exampleSentence, vocab.word)}</blockquote>
                {speakButton(vocab.exampleSentence, { label: "Nghe câu ví dụ" })}
              </figure>
            )}
            <div className="-ml-3">{flipButton("Xem lại từ", backFlipRef)}</div>
          </section>
        </div>
      </div>
    </div>
  );
}
