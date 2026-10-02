"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { LayoutGrid, LoaderCircle, RotateCcw, Volume2 } from "lucide-react";
import type { PracticeMode } from "@prisma/client";

import { LessonFooter } from "@/components/lesson/lesson-footer";
import { Button } from "@/components/ui/button";
import { useSpeech } from "@/hooks/use-speech";
import { api, toApiClientError } from "@/lib/api-client";
import { fireConfetti, stopConfetti } from "@/lib/confetti";
import { cn } from "@/lib/utils";
import type { PracticeResultResponse, PracticeWord } from "@/types/api";

interface PracticeResultProps {
  mode: PracticeMode;
  /** Trò tính giờ: hiện ô Kỷ lục thay cho ô Chính xác */
  timed: boolean;
  title: string;
  summary: string;
  correct: number;
  total: number;
  score: number;
  /** Chỉ số riêng của từng trò, vd combo dài nhất */
  extra?: string;
  /** Các từ làm sai, để ôn lại */
  review?: PracticeWord[];
  onReplay: () => void;
  onSubmitted?: (result: PracticeResultResponse) => void;
}

type SaveState =
  | { status: "saving" }
  | { status: "saved"; result: PracticeResultResponse }
  | { status: "error"; message: string };

/** Màn kết quả sau 1 lượt chơi: tự lưu kết quả (1 lần), hiện XP, kỷ lục và các từ cần ôn */
export function PracticeResult({
  mode,
  timed,
  title,
  summary,
  correct,
  total,
  score,
  extra,
  review = [],
  onReplay,
  onSubmitted,
}: PracticeResultProps) {
  const { update: refreshSession } = useSession();
  const [state, setState] = useState<SaveState>({ status: "saving" });
  const submittedRef = useRef(false);
  const onSubmittedRef = useRef(onSubmitted);
  useEffect(() => {
    onSubmittedRef.current = onSubmitted;
  });

  const accuracy = total === 0 ? 0 : Math.round((correct / total) * 100);

  const save = useCallback(async () => {
    setState({ status: "saving" });
    try {
      const result = await api.submitPractice({ mode, correct, total: Math.max(total, 1), score });
      setState({ status: "saved", result });
      onSubmittedRef.current?.(result);
      // Header hiện XP/streak mới ngay (xem giải thích trong completion-screen)
      void refreshSession({});
      if (result.isNewBest || (!timed && total >= 4 && correct === total)) void fireConfetti();
    } catch (error) {
      setState({ status: "error", message: toApiClientError(error).message });
    }
  }, [correct, mode, refreshSession, score, timed, total]);

  // Lưu đúng 1 lần khi vào màn kết quả
  useEffect(() => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    void save();
  }, [save]);

  useEffect(() => stopConfetti, []);

  const saved = state.status === "saved" ? state.result : null;
  const pending = state.status === "saving" ? <LoaderCircle aria-label="Đang lưu" className="size-5 animate-spin text-muted-foreground" /> : "–";

  return (
    <>
      <div className="mx-auto w-full max-w-[560px] px-4 pt-10 pb-36 sm:pt-14">
        <section className="rounded-lg border border-line bg-card p-6 animate-in fade-in zoom-in-[0.98] duration-300 sm:p-9 motion-reduce:animate-none">
          <p className="text-[13px] font-medium text-muted-foreground">Kết quả lượt chơi</p>
          <h1 className="mt-3 text-[2.5rem] leading-[1.05] tracking-[-0.015em]">{title}</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{summary}</p>
          {extra && <p className="mt-1 text-[14px] text-muted-foreground">{extra}</p>}

          <dl className="mt-7 grid grid-cols-3 divide-x divide-line border-y border-line py-4 text-center">
            <Stat label="câu đúng" value={`${correct}/${total}`} />
            <Stat
              label="XP nhận được"
              value={saved ? `+${saved.xpEarned}` : pending}
              highlight={Boolean(saved && saved.xpEarned > 0)}
            />
            {timed ? (
              <Stat
                label={saved?.isNewBest ? "Kỷ lục mới!" : "Kỷ lục"}
                value={saved ? saved.bestScore : pending}
                highlight={Boolean(saved?.isNewBest)}
              />
            ) : (
              <Stat label="chính xác" value={`${accuracy}%`} />
            )}
          </dl>

          {saved && (
            <div className="mt-5">
              <div className="flex items-baseline justify-between gap-3 text-[14px]">
                <span className="text-muted-foreground">XP luyện tập hôm nay</span>
                <span className="font-semibold tabular-nums">
                  {saved.todayXp}/{saved.dailyXpCap}
                </span>
              </div>
              <div className="mt-2 h-[5px] overflow-hidden rounded-full bg-line" aria-hidden>
                <div
                  className="h-full rounded-full bg-clay"
                  style={{ width: `${Math.min(100, (saved.todayXp / saved.dailyXpCap) * 100)}%` }}
                />
              </div>
              {saved.todayXp >= saved.dailyXpCap && (
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                  Bạn đã nhận đủ XP luyện tập hôm nay. Chơi tiếp vẫn giúp nhớ từ lâu hơn!
                </p>
              )}
            </div>
          )}

          {state.status === "error" && (
            <div role="alert" className="mt-5 space-y-3 rounded-md bg-danger-soft p-4 text-[14px] text-destructive">
              <p>Chưa lưu được kết quả: {state.message}</p>
              <Button variant="outline" size="sm" onClick={() => void save()}>
                <RotateCcw />
                Thử lưu lại
              </Button>
            </div>
          )}

          {review.length > 0 && <ReviewList words={review} />}
        </section>
      </div>

      <LessonFooter className="justify-end">
        <Button asChild variant="outline" size="lg" className="px-4 sm:px-5">
          <Link href="/practice" aria-label="Chọn trò khác">
            <LayoutGrid />
            <span className="hidden sm:inline">Trò khác</span>
          </Link>
        </Button>
        <Button size="lg" className="flex-1 sm:max-w-64 sm:flex-none sm:min-w-56" onClick={onReplay}>
          <RotateCcw />
          Chơi lại
        </Button>
      </LessonFooter>
    </>
  );
}

function Stat({ label, value, highlight = false }: { label: string; value: React.ReactNode; highlight?: boolean }) {
  return (
    <div className="flex flex-col-reverse items-center gap-1 px-1">
      <dt className="text-[12px] text-muted-foreground">{label}</dt>
      <dd className={cn("flex h-8 items-center text-2xl font-semibold tabular-nums", highlight && "text-clay-strong")}>{value}</dd>
    </div>
  );
}

function ReviewList({ words }: { words: PracticeWord[] }) {
  const { speak } = useSpeech();

  return (
    <section aria-labelledby="review-heading" className="mt-8">
      <h2 id="review-heading" className="font-sans text-[15px] font-semibold tracking-normal">
        Ôn lại các từ này
      </h2>
      <ul className="mt-2 border-t border-line">
        {words.map((word) => (
          <li key={word.id} className="flex items-center gap-3 border-b border-line py-3">
            <span className="min-w-0 flex-1">
              <span className="font-serif text-[19px]">{word.word}</span>
              {word.phonetic && <span className="ml-2 font-ipa text-[13px] text-muted-foreground">{word.phonetic}</span>}
              <span className="block text-[14px] text-muted-foreground">{word.meaning}</span>
            </span>
            <button
              type="button"
              aria-label={`Nghe từ ${word.word}`}
              onClick={() => void speak(word.word, { audioUrl: word.audioUrl })}
              className="grid size-9 shrink-0 place-items-center rounded-full border border-line-strong text-moss outline-none hover:border-moss focus-visible:outline-2 focus-visible:outline-ring"
            >
              <Volume2 className="size-4" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
