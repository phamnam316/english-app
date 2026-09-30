"use client";

import { useEffect, useRef, useState } from "react";
import { Lightbulb, Snail, Volume2 } from "lucide-react";

import { FeedbackBanner } from "@/components/lesson/feedback-banner";
import { LessonFooter } from "@/components/lesson/lesson-footer";
import { PracticeIntro, PracticeShell } from "@/components/practice/practice-shell";
import { PracticeResult } from "@/components/practice/practice-result";
import type { GamePhase, PracticeGameProps } from "@/components/practice/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSpeech } from "@/hooks/use-speech";
import { shuffle } from "@/lib/practice";
import { isAnswerCorrect } from "@/lib/scoring";
import { playCorrectSound, playWrongSound } from "@/lib/sounds";
import { praiseFor } from "@/lib/ui-constants";
import { cn } from "@/lib/utils";
import type { PracticeWord } from "@/types/api";

const ROUND_SIZE = 8;

/** Gợi ý: giữ chữ cái đầu mỗi từ, che các chữ còn lại: "good morning" -> "g••• m••••••" */
function maskWord(word: string): string {
  return word
    .split(" ")
    .map((part) => [...part].map((char, i) => (i === 0 || !/\p{L}/u.test(char) ? char : "•")).join(""))
    .join(" ");
}

/** Nghe & viết: máy đọc từ, người học gõ lại đúng chính tả */
export function DictationGame({ meta, words, bestScore, skipIntro, onReplay, onSubmitted }: PracticeGameProps) {
  const { speak, isLoading } = useSpeech();
  const [items] = useState(() => shuffle(words).slice(0, ROUND_SIZE));
  const [phase, setPhase] = useState<GamePhase>(skipIntro ? "playing" : "intro");
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [isHintShown, setIsHintShown] = useState(false);
  const [result, setResult] = useState<boolean | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const missedRef = useRef<PracticeWord[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const item = items[index];
  const play = (speed = 1) => void speak(item.word, { speed, audioUrl: item.audioUrl });

  // Mỗi từ mới: tự đọc 1 lần và đặt con trỏ vào ô nhập
  useEffect(() => {
    if (phase !== "playing") return;
    void speak(item.word, { audioUrl: item.audioUrl });
    inputRef.current?.focus();
  }, [index, item, phase, speak]);

  const check = () => {
    if (result !== null || !input.trim()) return;
    const isCorrect = isAnswerCorrect(input, item.word);
    setResult(isCorrect);
    if (isCorrect) {
      playCorrectSound();
      setCorrectCount((c) => c + 1);
    } else {
      playWrongSound();
      missedRef.current.push(item);
    }
  };

  const next = () => {
    if (index + 1 >= items.length) {
      setPhase("done");
      return;
    }
    setIndex((i) => i + 1);
    setInput("");
    setIsHintShown(false);
    setResult(null);
  };

  return (
    <PracticeShell
      title={meta.title}
      progress={phase === "done" ? 100 : ((index + (result !== null ? 1 : 0)) / items.length) * 100}
      progressLabel={phase === "intro" ? meta.length : `${Math.min(index + 1, items.length)}/${items.length}`}
    >
      {phase === "intro" && <PracticeIntro meta={meta} bestScore={bestScore} onStart={() => setPhase("playing")} />}

      {phase === "playing" && (
        <>
          <div className={cn("mx-auto w-full max-w-xl flex-1 px-4 pt-6", result !== null ? "pb-80 sm:pb-48" : "pb-32")}>
            <p className="text-center text-sm font-medium text-muted-foreground">Nghe và viết lại từ bạn nghe được</p>

            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                aria-label="Nghe lại"
                onClick={() => play()}
                className="grid size-24 place-items-center rounded-full bg-primary text-primary-foreground shadow-[0_18px_34px_-14px_var(--primary)] outline-none transition-transform hover:scale-105 focus-visible:ring-[3px] focus-visible:ring-ring active:scale-95"
              >
                <Volume2 className={cn("size-10", isLoading(item.word) && "animate-pulse")} />
              </button>
              <Button variant="secondary" size="lg" className="rounded-full" onClick={() => play(0.7)}>
                <Snail className="size-5" />
                Chậm
              </Button>
            </div>

            <div className="mt-8 space-y-2">
              <label htmlFor="dictation-input" className="text-sm font-medium text-muted-foreground">
                Từ bạn nghe được
              </label>
              <Input
                ref={inputRef}
                id="dictation-input"
                value={input}
                disabled={result !== null}
                maxLength={60}
                placeholder="Gõ tại đây"
                autoComplete="off"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint="done"
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    check();
                  }
                }}
                className={cn(
                  "h-14 rounded-2xl border-2 bg-card text-center text-xl font-medium shadow-soft md:text-xl disabled:opacity-100",
                  result === true && "border-success bg-success-soft text-success",
                  result === false && "border-destructive bg-danger-soft text-destructive line-through decoration-2",
                )}
              />
            </div>

            <div className="mt-4 flex min-h-12 justify-center">
              {isHintShown ? (
                <p className="rounded-2xl bg-surface-soft px-4 py-3 text-center text-sm">
                  <span className="font-heading text-base font-semibold tracking-wider">{maskWord(item.word)}</span>
                  <span className="text-muted-foreground"> · {item.meaning}</span>
                </p>
              ) : (
                result === null && (
                  <Button variant="ghost" className="text-muted-foreground" onClick={() => setIsHintShown(true)}>
                    <Lightbulb />
                    Gợi ý
                  </Button>
                )
              )}
            </div>
          </div>

          {result !== null ? (
            <FeedbackBanner
              isCorrect={result}
              praise={praiseFor(index)}
              correctAnswer={item.word}
              explanation={[item.phonetic, item.meaning].filter(Boolean).join(" · ")}
              onContinue={next}
            />
          ) : (
            <LessonFooter className="justify-end">
              <Button size="lg" className="w-full sm:w-auto sm:min-w-48" disabled={!input.trim()} onClick={check}>
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
          summary={`Bạn viết đúng ${correctCount}/${items.length} từ.`}
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
