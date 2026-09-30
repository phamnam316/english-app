"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Crown, LayoutGrid, LoaderCircle, RotateCcw, Star, Target, Trophy, Volume2 } from "lucide-react";
import type { PracticeMode } from "@prisma/client";

import { LessonFooter } from "@/components/lesson/lesson-footer";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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
  const good = accuracy >= 70 && correct > 0;

  return (
    <>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center gap-7 px-5 pt-8 pb-32 text-center">
        <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-500 motion-reduce:animate-none">
          <span
            className={cn(
              "grid size-24 place-items-center rounded-full",
              good ? "bg-xp-soft text-xp" : "bg-secondary text-primary",
            )}
          >
            {good ? <Trophy className="size-12" /> : <Target className="size-11" />}
          </span>
          <div className="space-y-1.5">
            <h1 className="text-3xl font-semibold">{title}</h1>
            <p className="leading-relaxed text-muted-foreground">{summary}</p>
            {extra && <p className="text-sm font-medium text-muted-foreground">{extra}</p>}
          </div>
        </div>

        <dl className="grid w-full grid-cols-3 gap-3">
          <Stat label="câu đúng" value={`${correct}/${total}`} />
          <Stat
            label="XP nhận được"
            value={
              saved ? (
                <span className="inline-flex items-center gap-1">
                  <Star className="size-5 fill-xp text-xp" />+{saved.xpEarned}
                </span>
              ) : state.status === "saving" ? (
                <LoaderCircle aria-label="Đang lưu" className="size-6 animate-spin text-muted-foreground" />
              ) : (
                "–"
              )
            }
            highlight={Boolean(saved && saved.xpEarned > 0)}
          />
          {timed ? (
            <Stat
              label={saved?.isNewBest ? "Kỷ lục mới!" : "Kỷ lục"}
              value={
                <span className="inline-flex items-center gap-1">
                  <Crown className="size-5 text-xp" />
                  {saved ? saved.bestScore : "–"}
                </span>
              }
              highlight={Boolean(saved?.isNewBest)}
            />
          ) : (
            <Stat label="chính xác" value={`${accuracy}%`} />
          )}
        </dl>

        {saved && (
          <div className="w-full space-y-2 rounded-3xl bg-surface-soft p-4 text-left">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="font-medium">XP luyện tập hôm nay</span>
              <span className="font-semibold tabular-nums">
                {saved.todayXp}/{saved.dailyXpCap}
              </span>
            </div>
            <Progress value={(saved.todayXp / saved.dailyXpCap) * 100} aria-label="XP luyện tập hôm nay" />
            {saved.todayXp >= saved.dailyXpCap && (
              <p className="text-xs leading-relaxed text-muted-foreground">
                Bạn đã nhận đủ XP luyện tập hôm nay. Chơi tiếp vẫn giúp nhớ từ lâu hơn!
              </p>
            )}
          </div>
        )}

        {state.status === "error" && (
          <div role="alert" className="w-full space-y-3 rounded-3xl bg-danger-soft p-4 text-sm text-destructive">
            <p>Chưa lưu được kết quả: {state.message}</p>
            <Button variant="outline" size="sm" onClick={() => void save()}>
              <RotateCcw />
              Thử lưu lại
            </Button>
          </div>
        )}

        {review.length > 0 && <ReviewList words={review} />}
      </div>

      <LessonFooter className="justify-between">
        <Button asChild variant="outline" size="lg" className="px-5">
          <Link href="/practice" aria-label="Chọn trò khác">
            <LayoutGrid />
            <span className="hidden sm:inline">Trò khác</span>
          </Link>
        </Button>
        <Button size="lg" className="flex-1 sm:ml-auto sm:max-w-64" onClick={onReplay}>
          <RotateCcw />
          Chơi lại
        </Button>
      </LessonFooter>
    </>
  );
}

function Stat({ label, value, highlight = false }: { label: string; value: React.ReactNode; highlight?: boolean }) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse items-center gap-1 rounded-3xl border border-border/70 bg-card px-2 py-4 shadow-soft",
        highlight && "border-xp/40 bg-xp-soft",
      )}
    >
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="flex h-8 items-center text-2xl font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

function ReviewList({ words }: { words: PracticeWord[] }) {
  const { speak } = useSpeech();

  return (
    <section aria-labelledby="review-heading" className="w-full space-y-3 text-left">
      <h2 id="review-heading" className="text-base font-semibold">
        Ôn lại các từ này
      </h2>
      <ul className="space-y-2">
        {words.map((word) => (
          <li key={word.id} className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card px-4 py-3">
            <span className="min-w-0 flex-1">
              <span className="font-semibold text-primary">{word.word}</span>
              {word.phonetic && <span className="ml-2 text-sm text-muted-foreground">{word.phonetic}</span>}
              <span className="block text-sm text-muted-foreground">{word.meaning}</span>
            </span>
            <Button
              variant="secondary"
              size="icon"
              className="shrink-0 rounded-full"
              aria-label={`Nghe từ ${word.word}`}
              onClick={() => void speak(word.word, { audioUrl: word.audioUrl })}
            >
              <Volume2 className="size-[18px]" />
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
