"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Eye, EyeOff, LoaderCircle, Snail, Volume2 } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

import { HighlightWord } from "@/components/rich-text";
import { Kbd, LessonFooter } from "@/components/lesson/lesson-footer";
import { Button } from "@/components/ui/button";
import { useSpeech } from "@/hooks/use-speech";
import { isTypingTarget } from "@/lib/dom";
import { WORD_RATINGS } from "@/lib/word-rating";
import { cn } from "@/lib/utils";
import { useLessonStore } from "@/store/useLessonStore";
import type { VocabularyItem, WordRating } from "@/types/api";

const HIDE_MEANING_KEY = "lesson.hideMeaning";

/** Chế độ "ẩn nghĩa để tự kiểm tra" được nhớ trên trình duyệt này (lỗi đọc/ghi thì coi như tắt) */
function useHideMeaningPreference() {
  const [hideMeaning, setHideMeaning] = useState(false);
  useEffect(() => {
    try {
      setHideMeaning(window.localStorage.getItem(HIDE_MEANING_KEY) === "1");
    } catch {
      // Trình duyệt chặn bộ nhớ: dùng mặc định
    }
  }, []);
  const update = useCallback((value: boolean) => {
    setHideMeaning(value);
    try {
      window.localStorage.setItem(HIDE_MEANING_KEY, value ? "1" : "0");
    } catch {
      // Không lưu được cũng không sao
    }
  }, []);
  return [hideMeaning, update] as const;
}

/** Phần 1 của bài: học từng từ (nghĩa, ví dụ, phát âm) và tự đánh giá mức nhớ */
export function VocabularyView() {
  const { lesson, vocabularies, vocabIndex, ratings, exerciseCount, goToVocab, finishVocabulary, rateWord } = useLessonStore(
    useShallow((s) => ({
      lesson: s.lesson,
      vocabularies: s.vocabularies,
      vocabIndex: s.vocabIndex,
      ratings: s.ratings,
      exerciseCount: s.exercises.length,
      goToVocab: s.goToVocab,
      finishVocabulary: s.finishVocabulary,
      rateWord: s.rateWord,
    })),
  );
  const [hideMeaning, setHideMeaning] = useHideMeaningPreference();
  const [revealedId, setRevealedId] = useState<string | null>(null);

  const vocab = vocabularies[vocabIndex];
  const isFirst = vocabIndex === 0;
  const isLast = vocabIndex === vocabularies.length - 1;
  const isRevealed = !hideMeaning || revealedId === vocab?.id;
  const rating = vocab ? (ratings[vocab.id] ?? null) : null;

  const go = useCallback(
    (step: 1 | -1) => {
      if (step === 1 && isLast) finishVocabulary();
      else if (!(step === -1 && isFirst)) goToVocab(vocabIndex + step);
    },
    [finishVocabulary, goToVocab, isFirst, isLast, vocabIndex],
  );

  const toggleRating = useCallback(
    (value: WordRating) => {
      if (vocab) void rateWord(vocab.id, rating === value ? null : value);
    },
    [rateWord, rating, vocab],
  );

  // Phím tắt: ← → chuyển từ, Space xem nghĩa, 1–3 chọn mức nhớ
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || isTypingTarget(event.target) || event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === "ArrowRight") go(1);
      else if (event.key === "ArrowLeft") go(-1);
      else if (event.key === " " && !isRevealed && vocab) {
        if (event.target instanceof HTMLElement && event.target.closest("button, a")) return;
        event.preventDefault();
        setRevealedId(vocab.id);
      } else if (/^[1-3]$/.test(event.key)) toggleRating(Number(event.key) as WordRating);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [go, isRevealed, toggleRating, vocab]);

  if (!vocab || !lesson) return null;

  const nextLabel = isLast
    ? lesson.grammarNote
      ? "Xem ghi chú ngữ pháp"
      : exerciseCount > 0
        ? `Làm bài tập (${exerciseCount} câu)`
        : "Hoàn thành"
    : `Từ tiếp theo: ${vocabularies[vocabIndex + 1].word}`;

  return (
    <>
      <div className="w-full max-w-[720px] pt-6 pb-36 sm:pt-10 lg:pt-12">
        <WordEntry
          key={vocab.id}
          vocab={vocab}
          index={vocabIndex}
          total={vocabularies.length}
          isRevealed={isRevealed}
          onReveal={() => setRevealedId(vocab.id)}
        />

        <div className="mt-9 flex flex-wrap items-center gap-x-4 gap-y-1">
          <p id="rating-label" className="text-[15px] font-medium">
            Bạn nhớ từ này đến đâu?
          </p>
          <p className="text-[13px] text-muted-foreground">Không bắt buộc, giúp phần Luyện tập ưu tiên từ chưa nhớ.</p>
        </div>
        <div role="group" aria-labelledby="rating-label" className="mt-3 flex flex-wrap gap-2">
          {WORD_RATINGS.map(({ value, label }) => {
            const active = rating === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={active}
                onClick={() => toggleRating(value)}
                className={cn(
                  "inline-flex h-11 items-center gap-2 rounded-full border px-5 text-[15px] font-medium outline-none transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                  !active && "border-line-strong",
                  !active && value === 1 && "hover:border-destructive hover:text-destructive",
                  !active && value === 2 && "hover:border-clay hover:text-clay-strong",
                  !active && value === 3 && "hover:border-moss hover:text-moss-strong",
                  active && value === 1 && "border-2 border-destructive bg-danger-soft font-semibold text-destructive",
                  active && value === 2 && "border-2 border-clay bg-clay-soft font-semibold text-clay-strong",
                  active && value === 3 && "border-2 border-moss bg-moss-soft font-semibold text-moss-strong",
                )}
              >
                {active && <Check aria-hidden className="size-4" />}
                {label}
                <span aria-hidden className="hidden text-[11px] font-normal text-muted-foreground sm:inline">
                  {value}
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setHideMeaning(!hideMeaning)}
          className="mt-8 -ml-2 inline-flex items-center gap-2 rounded-md px-2 py-1.5 text-[14px] font-medium text-muted-foreground outline-none hover:bg-card hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
        >
          {hideMeaning ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
          {hideMeaning ? "Luôn hiện nghĩa" : "Ẩn nghĩa để tự kiểm tra"}
        </button>
      </div>

      <LessonFooter className="justify-end">
        <p className="mr-auto hidden text-[13px] text-muted-foreground md:block">
          <Kbd>←</Kbd>
          <Kbd>→</Kbd> để chuyển từ
          {hideMeaning && (
            <>
              , <Kbd>Space</Kbd> để xem nghĩa
            </>
          )}
        </p>
        <Button variant="outline" size="lg" className="px-4 sm:px-5" onClick={() => go(-1)} disabled={isFirst} aria-label="Từ trước">
          <ChevronLeft className="size-4" />
          <span className="hidden sm:inline">Từ trước</span>
        </Button>
        <Button size="lg" className="min-w-0 flex-1 sm:max-w-80 sm:flex-none sm:min-w-56" onClick={() => go(1)}>
          <span className="truncate">{nextLabel}</span>
          <ChevronRight className="size-4" />
        </Button>
      </LessonFooter>
    </>
  );
}

interface WordEntryProps {
  vocab: VocabularyItem;
  index: number;
  total: number;
  isRevealed: boolean;
  onReveal: () => void;
}

/** Mục từ: từ, phát âm, nghĩa và câu ví dụ (có bản dịch). Chế độ tự kiểm tra: nghĩa ẩn cho tới khi bấm xem */
function WordEntry({ vocab, index, total, isRevealed, onReveal }: WordEntryProps) {
  const { speak, isLoading } = useSpeech();

  const listen = (text: string, speed = 1, audioUrl?: string | null) => void speak(text, { speed, audioUrl });
  const busy = (text: string, speed = 1) => isLoading(text, { speed });

  return (
    <article aria-label={`Từ ${vocab.word}`} className="animate-in fade-in duration-300 motion-reduce:animate-none">
      <p className="text-[14px] text-muted-foreground tabular-nums">
        Từ {index + 1} trên {total}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-3">
        <h1 className="text-[3.25rem] leading-none tracking-[-0.015em] break-words sm:text-[4.5rem]">{vocab.word}</h1>
        <div className="flex gap-2">
          <button
            type="button"
            aria-label={`Nghe phát âm từ ${vocab.word}`}
            onClick={() => listen(vocab.word, 1, vocab.audioUrl)}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-moss px-4 text-[15px] font-semibold text-white outline-none hover:bg-moss-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss dark:text-primary-foreground"
          >
            {busy(vocab.word) ? <LoaderCircle className="size-[18px] animate-spin" /> : <Volume2 className="size-[18px]" />}
            Nghe
          </button>
          <button
            type="button"
            aria-label={`Nghe chậm từ ${vocab.word}`}
            onClick={() => listen(vocab.word, 0.75, vocab.audioUrl)}
            className="inline-flex h-11 items-center gap-2 rounded-full border border-line-strong px-4 text-[15px] font-medium outline-none hover:bg-card focus-visible:outline-2 focus-visible:outline-ring"
          >
            {busy(vocab.word, 0.75) ? <LoaderCircle className="size-[18px] animate-spin" /> : <Snail className="size-[18px]" />}
            Nghe chậm
          </button>
        </div>
      </div>
      {(vocab.phonetic || vocab.cefr) && (
        <p className="mt-3 font-ipa text-xl text-muted-foreground">
          {vocab.phonetic}
          {vocab.cefr && <span className="ml-2 font-sans text-[14px]">· {vocab.cefr}</span>}
        </p>
      )}

      {isRevealed ? (
        <dl className="mt-10 border-t-2 border-foreground">
          <div className="grid gap-2 border-b border-line py-6 sm:grid-cols-[120px_1fr] sm:gap-6">
            <dt className="text-[14px] font-medium text-muted-foreground sm:pt-2">Nghĩa</dt>
            <dd className="text-[1.75rem] leading-tight font-semibold sm:text-[2rem]">{vocab.meaning}</dd>
          </div>
          {vocab.exampleSentence && (
            <div className="grid gap-2 border-b border-line py-6 sm:grid-cols-[120px_1fr] sm:gap-6">
              <dt className="text-[14px] font-medium text-muted-foreground sm:pt-1">Ví dụ</dt>
              <dd className="flex items-start justify-between gap-5">
                <div className="min-w-0">
                  <p className="font-serif text-[1.375rem] leading-snug sm:text-[1.5rem]">
                    <HighlightWord sentence={vocab.exampleSentence} word={vocab.word} />
                  </p>
                  {vocab.exampleTranslation && (
                    <p className="mt-1.5 text-[15px] text-muted-foreground">{vocab.exampleTranslation}</p>
                  )}
                </div>
                <button
                  type="button"
                  aria-label="Nghe câu ví dụ"
                  onClick={() => listen(vocab.exampleSentence!)}
                  className="grid size-11 shrink-0 place-items-center rounded-full border border-line-strong text-moss outline-none hover:border-moss hover:bg-card focus-visible:outline-2 focus-visible:outline-ring"
                >
                  {busy(vocab.exampleSentence) ? (
                    <LoaderCircle className="size-[18px] animate-spin" />
                  ) : (
                    <Volume2 className="size-[18px]" />
                  )}
                </button>
              </dd>
            </div>
          )}
        </dl>
      ) : (
        <div className="mt-10 border-t-2 border-foreground pt-6">
          <button
            type="button"
            onClick={onReveal}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-md border border-dashed border-line-strong text-[15px] font-semibold text-moss-strong outline-none hover:border-moss hover:bg-moss-soft focus-visible:outline-2 focus-visible:outline-ring"
          >
            <Eye className="size-[18px]" />
            Xem nghĩa
            <Kbd>Space</Kbd>
          </button>
          <p className="mt-3 text-[14px] text-muted-foreground">Thử nhớ nghĩa của từ trước khi xem.</p>
        </div>
      )}
    </article>
  );
}
