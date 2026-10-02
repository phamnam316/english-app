"use client";

import { useEffect, useRef, useState } from "react";
import { KeyRound, Snail, Volume2 } from "lucide-react";

import { FeedbackBanner } from "@/components/lesson/feedback-banner";
import { LessonFooter } from "@/components/lesson/lesson-footer";
import { PracticeIntro, PracticeShell } from "@/components/practice/practice-shell";
import { PracticeResult } from "@/components/practice/practice-result";
import type { GamePhase, PracticeGameProps } from "@/components/practice/types";
import { WordChips } from "@/components/word-chips";
import { Button } from "@/components/ui/button";
import { useSpeech } from "@/hooks/use-speech";
import { sameTokens, shuffle, tokenizeSentence, weightedShuffle } from "@/lib/practice";
import { playCorrectSound, playWrongSound } from "@/lib/sounds";
import { praiseFor } from "@/lib/ui-constants";
import { cn } from "@/lib/utils";
import type { PracticeWord } from "@/types/api";

const ROUND_SIZE = 6;
const MIN_TOKENS = 3;
const MAX_TOKENS = 9;

interface SentenceItem {
  word: PracticeWord;
  sentence: string;
  tokens: string[];
  chips: string[];
}

/** Xáo thẻ từ, chắc chắn không trùng thứ tự đúng */
function scramble(tokens: string[]): string[] {
  for (let attempt = 0; attempt < 10; attempt++) {
    const chips = shuffle(tokens);
    if (!sameTokens(chips, tokens)) return chips;
  }
  return [...tokens.slice(1), tokens[0]];
}

export function buildSentenceItems(words: PracticeWord[]): SentenceItem[] {
  const items: SentenceItem[] = [];
  for (const word of weightedShuffle(words)) {
    if (!word.exampleSentence) continue;
    const tokens = tokenizeSentence(word.exampleSentence);
    if (tokens.length < MIN_TOKENS || tokens.length > MAX_TOKENS) continue;
    items.push({ word, sentence: word.exampleSentence, tokens, chips: scramble(tokens) });
    if (items.length === ROUND_SIZE) break;
  }
  return items;
}

/** Xếp câu: nghe câu ví dụ, sắp xếp thẻ từ theo đúng thứ tự */
export function SentenceGame({ meta, words, bestScore, skipIntro, onReplay, onSubmitted }: PracticeGameProps) {
  const { speak } = useSpeech();
  const [items] = useState(() => buildSentenceItems(words));
  const [phase, setPhase] = useState<GamePhase>(skipIntro && items.length > 0 ? "playing" : "intro");
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number[]>([]);
  const [result, setResult] = useState<boolean | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const missedRef = useRef<PracticeWord[]>([]);

  const item = items[index];

  // Mỗi câu mới: tự đọc 1 lần
  useEffect(() => {
    if (phase === "playing" && item) void speak(item.sentence);
  }, [item, phase, speak]);

  const check = () => {
    if (result !== null || !item) return;
    const isCorrect = sameTokens(
      selected.map((i) => item.chips[i]),
      item.tokens,
    );
    setResult(isCorrect);
    if (isCorrect) {
      playCorrectSound();
      setCorrectCount((c) => c + 1);
    } else {
      playWrongSound();
      missedRef.current.push(item.word);
    }
  };

  const next = () => {
    if (index + 1 >= items.length) {
      setPhase("done");
      return;
    }
    setIndex((i) => i + 1);
    setSelected([]);
    setResult(null);
  };

  return (
    <PracticeShell
      title={meta.title}
      progress={phase === "done" ? 100 : items.length ? ((index + (result !== null ? 1 : 0)) / items.length) * 100 : 0}
      progressLabel={phase === "intro" ? meta.length : `${Math.min(index + 1, items.length)}/${items.length}`}
    >
      {phase === "intro" && (
        <PracticeIntro
          meta={meta}
          bestScore={bestScore}
          onStart={() => setPhase("playing")}
          blockedReason={
            items.length === 0 ? "Các bài bạn đã mở chưa có câu ví dụ nào đủ ngắn. Học thêm bài để mở khóa trò này nhé." : null
          }
        />
      )}

      {phase === "playing" && item && (
        <>
          <div className={cn("mx-auto w-full max-w-xl flex-1 px-4 pt-6", result !== null ? "pb-80 sm:pb-48" : "pb-32")}>
            <p className="text-center text-sm font-medium text-muted-foreground">Nghe rồi sắp xếp thành câu</p>

            <div className="mt-5 flex items-center justify-center gap-3">
              <Button size="lg" className="rounded-full px-6" onClick={() => void speak(item.sentence)}>
                <Volume2 className="size-5" />
                Nghe câu
              </Button>
              <Button variant="outline" size="lg" className="rounded-full" onClick={() => void speak(item.sentence, { speed: 0.7 })}>
                <Snail className="size-5" />
                Chậm
              </Button>
            </div>

            <p className="mx-auto mt-5 flex w-fit max-w-full items-center gap-2 rounded-md border border-line bg-card px-4 py-2 text-sm">
              <KeyRound aria-hidden className="size-4 shrink-0 text-clay" />
              <span className="truncate">
                Có từ <span className="font-serif text-base font-medium">{item.word.word}</span>: {item.word.meaning}
              </span>
            </p>

            <div className="mt-6">
              <WordChips
                key={index}
                chips={item.chips}
                selected={selected}
                onChange={setSelected}
                disabled={result !== null}
                isCorrect={result ?? undefined}
              />
            </div>
          </div>

          {result !== null ? (
            <FeedbackBanner
              isCorrect={result}
              praise={praiseFor(index)}
              correctAnswer={item.sentence}
              explanation={item.word.exampleTranslation}
              onContinue={next}
            />
          ) : (
            <LessonFooter className="justify-end">
              <Button
                size="lg"
                className="w-full sm:w-auto sm:min-w-48"
                disabled={selected.length !== item.chips.length}
                onClick={check}
              >
                Kiểm tra
              </Button>
            </LessonFooter>
          )}
        </>
      )}

      {phase === "done" && (
        <PracticeResult
          mode={meta.mode}
          timed={false}
          title="Hoàn thành!"
          summary={`Bạn xếp đúng ${correctCount}/${items.length} câu.`}
          correct={correctCount}
          total={items.length}
          score={correctCount}
          review={missedRef.current}
          onReplay={onReplay}
          onSubmitted={onSubmitted}
        />
      )}
    </PracticeShell>
  );
}
