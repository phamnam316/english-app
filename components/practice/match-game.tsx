"use client";

import { useRef, useState } from "react";

import { PracticeIntro, PracticeShell } from "@/components/practice/practice-shell";
import { PracticeResult } from "@/components/practice/practice-result";
import type { GamePhase, PracticeGameProps } from "@/components/practice/types";
import { useCountdown } from "@/hooks/use-countdown";
import { useSpeech } from "@/hooks/use-speech";
import { TIMED_ROUND_SECONDS, shuffle, weightedShuffle } from "@/lib/practice";
import { playCorrectSound, playWrongSound } from "@/lib/sounds";
import { cn } from "@/lib/utils";
import type { PracticeWord } from "@/types/api";

const PAIRS_PER_BOARD = 5;

interface Tile {
  key: string;
  wordId: string;
  text: string;
}

interface Board {
  id: number;
  left: Tile[];
  right: Tile[];
}

/**
 * Rút từ lần lượt trong bộ đã xáo, hết thì xáo lại (ít từ thì lặp lại, cũng là ôn tập).
 * Trong 1 bảng không có 2 từ trùng nghĩa, để mỗi nghĩa chỉ ghép được với đúng 1 từ.
 */
function createDrawer(words: PracticeWord[]) {
  let deck: PracticeWord[] = [];
  return (count: number): PracticeWord[] => {
    const picked: PracticeWord[] = [];
    for (let attempts = 0; picked.length < count && attempts < words.length * 3; attempts++) {
      if (deck.length === 0) deck = weightedShuffle(words).reverse(); // pop() lấy từ cuối
      const word = deck.pop()!;
      const meaning = word.meaning.trim().toLowerCase();
      if (picked.some((p) => p.id === word.id || p.meaning.trim().toLowerCase() === meaning)) continue;
      picked.push(word);
    }
    return picked;
  };
}

function makeBoard(id: number, words: PracticeWord[]): Board {
  return {
    id,
    left: shuffle(words.map((w) => ({ key: `${id}-en-${w.id}`, wordId: w.id, text: w.word }))),
    right: shuffle(words.map((w) => ({ key: `${id}-vi-${w.id}`, wordId: w.id, text: w.meaning }))),
  };
}

type TileState = "idle" | "selected" | "wrong" | "matched";

/** Ghép cặp: nối từ tiếng Anh với nghĩa, 60 giây, ghép hết bảng thì ra bảng mới */
export function MatchGame({ meta, words, bestScore, skipIntro, onReplay, onSubmitted }: PracticeGameProps) {
  const { speak } = useSpeech();
  const [draw] = useState(() => createDrawer(words));
  const [board, setBoard] = useState<Board>(() => makeBoard(0, draw(PAIRS_PER_BOARD)));
  const [phase, setPhase] = useState<GamePhase>(skipIntro ? "playing" : "intro");
  const [selected, setSelected] = useState<{ left: string | null; right: string | null }>({ left: null, right: null });
  const [matched, setMatched] = useState<Set<string>>(() => new Set());
  const [wrongKeys, setWrongKeys] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const missedRef = useRef(new Map<string, PracticeWord>());

  const remaining = useCountdown(TIMED_ROUND_SECONDS, phase === "playing", () => setPhase("done"));

  const tryMatch = (leftKey: string, rightKey: string) => {
    const left = board.left.find((t) => t.key === leftKey);
    const right = board.right.find((t) => t.key === rightKey);
    setSelected({ left: null, right: null });
    if (!left || !right) return;

    if (left.wordId === right.wordId) {
      playCorrectSound();
      setScore((s) => s + 1);
      const next = new Set(matched).add(left.wordId);
      setMatched(next);
      if (next.size === board.left.length) {
        // Để cặp cuối kịp hiện màu xanh rồi mới ra bảng mới
        window.setTimeout(() => {
          setBoard((current) => makeBoard(current.id + 1, draw(PAIRS_PER_BOARD)));
          setMatched(new Set());
        }, 350);
      }
    } else {
      playWrongSound();
      setMistakes((m) => m + 1);
      const word = words.find((w) => w.id === left.wordId);
      if (word) missedRef.current.set(word.id, word);
      setWrongKeys([leftKey, rightKey]);
      window.setTimeout(() => setWrongKeys([]), 450);
    }
  };

  const onTap = (side: "left" | "right", tile: Tile) => {
    if (phase !== "playing" || matched.has(tile.wordId) || wrongKeys.length > 0) return;
    if (side === "left") {
      void speak(tile.text);
      if (selected.right) tryMatch(tile.key, selected.right);
      else setSelected((s) => ({ ...s, left: s.left === tile.key ? null : tile.key }));
    } else if (selected.left) {
      tryMatch(selected.left, tile.key);
    } else {
      setSelected((s) => ({ ...s, right: s.right === tile.key ? null : tile.key }));
    }
  };

  const stateOf = (tile: Tile): TileState => {
    if (matched.has(tile.wordId)) return "matched";
    if (wrongKeys.includes(tile.key)) return "wrong";
    if (selected.left === tile.key || selected.right === tile.key) return "selected";
    return "idle";
  };

  const seconds = Math.ceil(remaining / 1000);

  return (
    <PracticeShell
      title={meta.title}
      progress={(remaining / (TIMED_ROUND_SECONDS * 1000)) * 100}
      progressLabel={phase === "intro" ? meta.length : `${seconds}s`}
      urgent={phase === "playing" && seconds <= 10}
    >
      {phase === "intro" && <PracticeIntro meta={meta} bestScore={bestScore} onStart={() => setPhase("playing")} />}

      {phase === "playing" && (
        <div className="mx-auto w-full max-w-2xl flex-1 px-4 pt-8 pb-10">
          <div className="flex items-center justify-between gap-3 text-sm">
            <p className="font-medium text-muted-foreground">Chạm 1 từ rồi chạm nghĩa của nó</p>
            <p className="rounded-sm bg-moss-soft px-2 py-0.5 font-semibold text-moss-strong tabular-nums">
              {score} cặp
            </p>
          </div>

          <div key={board.id} className="mt-5 grid grid-cols-2 gap-3 animate-in fade-in duration-300 sm:gap-4">
            {(["left", "right"] as const).map((side) => (
              <div key={side} role="group" aria-label={side === "left" ? "Từ tiếng Anh" : "Nghĩa tiếng Việt"} className="space-y-3">
                {board[side].map((tile) => {
                  const state = stateOf(tile);
                  return (
                    <button
                      key={tile.key}
                      type="button"
                      aria-pressed={state === "selected"}
                      disabled={state === "matched"}
                      onClick={() => onTap(side, tile)}
                      className={cn(
                        "flex min-h-16 w-full items-center justify-center rounded-md border px-3 py-2 text-center text-[15px] leading-snug font-medium outline-none transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:text-base",
                        side === "left" && "font-serif text-[17px] sm:text-lg",
                        state === "idle" && "border-line-strong bg-card hover:border-moss",
                        state === "selected" && "border-2 border-moss bg-moss-soft text-moss-strong",
                        state === "wrong" && "animate-shake border-destructive bg-danger-soft text-destructive",
                        state === "matched" && "scale-95 border-success bg-success-soft text-success opacity-45",
                      )}
                    >
                      {tile.text}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {phase === "done" && (
        <PracticeResult
          mode={meta.mode}
          timed
          title="Hết giờ!"
          summary={score > 0 ? `Bạn ghép đúng ${score} cặp trong 60 giây.` : "Chưa ghép được cặp nào, thử lại nhé!"}
          extra={mistakes > 0 ? `Chọn nhầm ${mistakes} lần` : score > 0 ? "Không chọn nhầm lần nào!" : undefined}
          correct={score}
          total={Math.max(1, score + mistakes)}
          score={score}
          review={[...missedRef.current.values()]}
          onReplay={onReplay}
          onSubmitted={onSubmitted}
        />
      )}
    </PracticeShell>
  );
}
