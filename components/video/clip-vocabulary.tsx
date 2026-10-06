"use client";

import { useState } from "react";
import { LoaderCircle, Play, Volume2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { RatingChips } from "@/components/video/rating-chips";
import { ToggleChip } from "@/components/video/toggle-chip";
import { useSpeech } from "@/hooks/use-speech";
import { formatClock } from "@/lib/videos/subtitles";
import { wordKey } from "@/lib/word-rating";
import type { WordRating } from "@/types/api";
import type { ClipWord } from "@/types/video";

interface ClipVocabularyProps {
  words: ClipWord[];
  ratings: Record<string, WordRating | null>;
  onRate: (word: string, rating: WordRating | null) => void;
  /** Phát câu thoại có từ này */
  onPlaySentence: (start: number) => void;
}

/** Danh sách từ vựng trong clip theo thứ tự xuất hiện: nghĩa, nghe, phát câu có từ đó, chọn mức nhớ để lưu vào lịch ôn */
export function ClipVocabulary({ words, ratings, onRate, onPlaySentence }: ClipVocabularyProps) {
  const [hideKnown, setHideKnown] = useState(false);
  const { speak, isLoading } = useSpeech();

  const savedCount = words.filter((w) => (ratings[wordKey(w.word)] ?? null) !== null).length;
  const visible = hideKnown ? words.filter((w) => ratings[wordKey(w.word)] !== 3) : words;

  if (words.length === 0) {
    return (
      <p className="mt-3 rounded-lg border border-dashed border-line-strong p-5 text-[14px] leading-relaxed text-muted-foreground">
        Chưa tìm thấy từ nào của bộ từ vựng A1–A2 trong lời thoại clip này. Rê chuột (hoặc chạm) vào từ trong phụ đề để tra
        nghĩa.
      </p>
    );
  }

  return (
    <div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[13px] text-muted-foreground">
          {words.length} từ trong bộ từ vựng của app · đã lưu {savedCount}
        </p>
        <ToggleChip pressed={hideKnown} onPressedChange={setHideKnown} className="h-8 px-3 text-[13px]">
          Ẩn từ đã nhớ
        </ToggleChip>
      </div>

      <ul className="mt-3 max-h-[28rem] overflow-y-auto border-t-2 border-foreground lg:max-h-[calc(100dvh-12rem)]">
        {visible.map((item) => {
          const rating = ratings[wordKey(item.word)] ?? null;
          return (
            <li key={item.word} className="border-b border-line px-2 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-baseline gap-x-2">
                    <span className="font-serif text-[1.3rem] leading-tight">{item.word}</span>
                    {item.phonetic && <span className="font-ipa text-[13px] text-muted-foreground">{item.phonetic}</span>}
                    {item.cefr && (
                      <span className="rounded-sm bg-panel px-1.5 py-px text-[11px] font-semibold text-muted-foreground">
                        {item.cefr}
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-[14px] leading-snug font-medium">{item.meaning}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    aria-label={`Nghe phát âm từ ${item.word}`}
                    onClick={() => void speak(item.word)}
                  >
                    {isLoading(item.word) ? <LoaderCircle className="animate-spin" /> : <Volume2 />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-[12px] tabular-nums"
                    aria-label={`Phát câu có từ ${item.word} (${formatClock(item.cueStart)})`}
                    onClick={() => onPlaySentence(item.cueStart)}
                  >
                    <Play />
                    {formatClock(item.cueStart)}
                  </Button>
                </div>
              </div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                <span className="italic">“{item.sentence}”</span>
                {item.count > 1 && <span className="ml-1.5 not-italic">· {item.count} lần</span>}
              </p>
              <RatingChips className="mt-2" word={item.word} rating={rating} onRate={(next) => onRate(item.word, next)} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
