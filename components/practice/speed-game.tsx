"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Flame, X } from "lucide-react";

import { PracticeIntro, PracticeShell } from "@/components/practice/practice-shell";
import { PracticeResult } from "@/components/practice/practice-result";
import type { GamePhase, PracticeGameProps } from "@/components/practice/types";
import { useCountdown } from "@/hooks/use-countdown";
import { TIMED_ROUND_SECONDS, shuffle } from "@/lib/practice";
import { isTypingTarget } from "@/lib/dom";
import { playCorrectSound, playWrongSound } from "@/lib/sounds";
import { cn } from "@/lib/utils";
import type { PracticeWord } from "@/types/api";

/** Hỏi nghĩa của từ (Anh -> Việt) hoặc hỏi từ theo nghĩa (Việt -> Anh), xen kẽ ngẫu nhiên */
type Direction = "en-vi" | "vi-en";

interface Question {
  key: number;
  word: PracticeWord;
  direction: Direction;
  answer: string;
  options: string[];
}

function makeQuestion(words: PracticeWord[], key: number, previousId?: string): Question {
  const candidates = words.length > 1 ? words.filter((w) => w.id !== previousId) : words;
  const word = candidates[Math.floor(Math.random() * candidates.length)];
  const direction: Direction = Math.random() < 0.5 ? "en-vi" : "vi-en";
  const textOf = (w: PracticeWord) => (direction === "en-vi" ? w.meaning : w.word);
  const answer = textOf(word);

  const distractors: string[] = [];
  for (const other of shuffle(words)) {
    if (distractors.length === 3) break;
    const text = textOf(other);
    const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();
    if (other.id === word.id || same(text, answer) || distractors.some((d) => same(d, text))) continue;
    distractors.push(text);
  }

  return { key, word, direction, answer, options: shuffle([answer, ...distractors]) };
}

/** Thử thách 60 giây: 4 lựa chọn, đúng liên tiếp để lên combo */
export function SpeedGame({ meta, words, bestScore, skipIntro, onReplay, onSubmitted }: PracticeGameProps) {
  const [phase, setPhase] = useState<GamePhase>(skipIntro ? "playing" : "intro");
  const [question, setQuestion] = useState<Question>(() => makeQuestion(words, 0));
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const missedRef = useRef(new Map<string, PracticeWord>());

  const remaining = useCountdown(TIMED_ROUND_SECONDS, phase === "playing", () => setPhase("done"));

  const pick = (option: string) => {
    if (phase !== "playing" || picked !== null) return;
    setPicked(option);
    const isCorrect = option === question.answer;
    if (isCorrect) {
      playCorrectSound();
      setScore((s) => s + 1);
      const nextCombo = combo + 1;
      setCombo(nextCombo);
      setBestCombo((b) => Math.max(b, nextCombo));
    } else {
      playWrongSound();
      setWrong((w) => w + 1);
      setCombo(0);
      missedRef.current.set(question.word.id, question.word);
    }
    // Sai thì dừng lâu hơn một chút để kịp nhìn đáp án đúng
    window.setTimeout(
      () => {
        setQuestion((q) => makeQuestion(words, q.key + 1, q.word.id));
        setPicked(null);
      },
      isCorrect ? 350 : 1000,
    );
  };

  // Phím 1-4 để chọn
  const pickRef = useRef(pick);
  useEffect(() => {
    pickRef.current = pick;
  });
  useEffect(() => {
    if (phase !== "playing") return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target) || !/^[1-4]$/.test(event.key)) return;
      const option = question.options[Number(event.key) - 1];
      if (option) pickRef.current(option);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [phase, question]);

  const seconds = Math.ceil(remaining / 1000);
  const isEnVi = question.direction === "en-vi";

  return (
    <PracticeShell
      title={meta.title}
      progress={(remaining / (TIMED_ROUND_SECONDS * 1000)) * 100}
      progressLabel={phase === "intro" ? meta.length : `${seconds}s`}
      urgent={phase === "playing" && seconds <= 10}
    >
      {phase === "intro" && <PracticeIntro meta={meta} bestScore={bestScore} onStart={() => setPhase("playing")} />}

      {phase === "playing" && (
        <div className="mx-auto w-full max-w-xl flex-1 px-4 pt-4 pb-10">
          <div className="flex h-8 items-center justify-between gap-3 text-sm font-semibold">
            <span className="rounded-full bg-secondary px-3 py-1 text-secondary-foreground tabular-nums">{score} điểm</span>
            {combo >= 3 && (
              <span
                key={combo}
                className="inline-flex items-center gap-1 rounded-full bg-streak-soft px-3 py-1 text-streak animate-in zoom-in-75 duration-200"
              >
                <Flame aria-hidden className="size-4 fill-streak" />
                Combo x{combo}
              </span>
            )}
          </div>

          <section
            key={question.key}
            aria-live="polite"
            className="mt-4 rounded-[2rem] border border-border/70 bg-card px-6 py-9 text-center shadow-soft animate-in fade-in slide-in-from-right-4 duration-200 motion-reduce:animate-none"
          >
            <p className="text-sm text-muted-foreground">{isEnVi ? "Nghĩa của từ này là gì?" : "Từ tiếng Anh nào có nghĩa là"}</p>
            <p
              className={cn(
                "mt-2 font-heading font-semibold text-balance break-words",
                isEnVi ? "text-4xl text-primary sm:text-5xl" : "text-2xl sm:text-3xl",
              )}
            >
              {isEnVi ? question.word.word : question.word.meaning}
            </p>
            {isEnVi && question.word.phonetic && <p className="mt-1 text-muted-foreground">{question.word.phonetic}</p>}
          </section>

          <div role="group" aria-label="Các đáp án" className="mt-6 grid gap-3 sm:grid-cols-2">
            {question.options.map((option, index) => {
              const isAnswer = option === question.answer;
              const isPicked = option === picked;
              const reveal = picked !== null;
              return (
                <button
                  key={option}
                  type="button"
                  disabled={reveal}
                  onClick={() => pick(option)}
                  className={cn(
                    "flex min-h-14 items-center gap-3 rounded-2xl border-2 border-border bg-card px-4 py-3 text-left text-base font-medium shadow-soft outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-default",
                    !reveal && "hover:border-primary/40 hover:bg-secondary/50",
                    reveal && isAnswer && "border-success bg-success-soft text-success",
                    reveal && isPicked && !isAnswer && "border-destructive bg-danger-soft text-destructive",
                    reveal && !isAnswer && !isPicked && "text-muted-foreground opacity-60",
                  )}
                >
                  <span
                    aria-hidden
                    className="grid size-7 shrink-0 place-items-center rounded-full border-2 border-current/25 text-xs font-semibold"
                  >
                    {index + 1}
                  </span>
                  <span className="flex-1">{option}</span>
                  {reveal && isAnswer && <Check aria-label="Đáp án đúng" className="size-5 shrink-0" strokeWidth={3} />}
                  {reveal && isPicked && !isAnswer && <X aria-label="Bạn đã chọn sai" className="size-5 shrink-0" strokeWidth={3} />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {phase === "done" && (
        <PracticeResult
          mode={meta.mode}
          timed
          title="Hết giờ!"
          summary={score > 0 ? `Bạn trả lời đúng ${score} câu trong 60 giây.` : "Chưa đúng câu nào, thử lại nhé!"}
          extra={bestCombo >= 3 ? `Combo dài nhất: x${bestCombo}` : undefined}
          correct={score}
          total={Math.max(1, score + wrong)}
          score={score}
          review={[...missedRef.current.values()]}
          onReplay={onReplay}
          onSubmitted={onSubmitted}
        />
      )}
    </PracticeShell>
  );
}
