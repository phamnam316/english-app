"use client";

import { useEffect, useState, type ComponentType } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { PracticeMode } from "@prisma/client";

import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { DictationGame } from "@/components/practice/dictation-game";
import { MatchGame } from "@/components/practice/match-game";
import { SentenceGame, buildSentenceItems } from "@/components/practice/sentence-game";
import { SpeakGame } from "@/components/practice/speak-game";
import { SpeedGame } from "@/components/practice/speed-game";
import type { PracticeGameProps } from "@/components/practice/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useApiQuery } from "@/hooks/use-api-query";
import { api } from "@/lib/api-client";
import { PRACTICE_MIN_WORDS, PRACTICE_MODES, QUICK_REVIEW_SLUG, getPracticeMode, weightedShuffle } from "@/lib/practice";
import type { PracticeWord } from "@/types/api";

const GAMES: Record<PracticeMode, ComponentType<PracticeGameProps>> = {
  MATCH: MatchGame,
  SPEED: SpeedGame,
  DICTATION: DictationGame,
  SENTENCE: SentenceGame,
  PRONUNCIATION: SpeakGame,
};

/** "Ôn nhanh": web tự chọn 1 trò (không lặp lại trò của lần trước), không dùng trò cần micro */
const QUICK_MODES: PracticeMode[] = ["MATCH", "SPEED", "DICTATION", "SENTENCE"];
const LAST_QUICK_KEY = "practice.lastQuickMode";

function pickQuickMode(words: PracticeWord[]): PracticeMode {
  let last: string | null = null;
  try {
    last = window.localStorage.getItem(LAST_QUICK_KEY);
  } catch {
    // Trình duyệt chặn bộ nhớ: chọn ngẫu nhiên hoàn toàn
  }
  const candidates = QUICK_MODES.filter(
    (mode) => mode !== last && (mode !== "SENTENCE" || buildSentenceItems(words).length >= 3),
  );
  const mode = candidates[Math.floor(Math.random() * candidates.length)] ?? "SPEED";
  try {
    window.localStorage.setItem(LAST_QUICK_KEY, mode);
  } catch {
    // Không lưu được cũng không sao
  }
  return mode;
}

/** Từ cho lượt Ôn nhanh: từ đến hạn ôn trước; ít từ đến hạn thì thêm từ khác cho đủ 1 lượt */
function quickWords(words: PracticeWord[]): PracticeWord[] {
  const due = words.filter((w) => w.due);
  if (due.length >= 8) return due;
  return [...due, ...weightedShuffle(words.filter((w) => !w.due)).slice(0, 12 - due.length)];
}

export default function PracticeGamePage() {
  const { mode: slug } = useParams<{ mode: string }>();
  const isQuick = slug === QUICK_REVIEW_SLUG;
  const { data, error, isLoading, refetch } = useApiQuery((signal) => api.getPractice(signal), [], { cacheKey: "practice" });
  const [round, setRound] = useState(0);
  // Kỷ lục mới nhất sau mỗi lượt, theo từng trò (dữ liệu tải lúc đầu không tự cập nhật)
  const [latestBest, setLatestBest] = useState<Partial<Record<PracticeMode, number>>>({});
  const [quick, setQuick] = useState<{ mode: PracticeMode; words: PracticeWord[] } | null>(null);

  // Chọn trò và từ cho lượt Ôn nhanh 1 lần khi có dữ liệu
  useEffect(() => {
    if (!isQuick || !data || quick || data.words.length < PRACTICE_MIN_WORDS) return;
    setQuick({ mode: pickQuickMode(data.words), words: quickWords(data.words) });
  }, [data, isQuick, quick]);

  const baseMeta = isQuick ? PRACTICE_MODES.find((m) => m.mode === quick?.mode) : getPracticeMode(slug);
  const meta = baseMeta && isQuick ? { ...baseMeta, title: `Ôn nhanh · ${baseMeta.title}` } : baseMeta;

  if (!isQuick && !meta) {
    return (
      <Centered>
        <EmptyState
          title="Không tìm thấy trò chơi"
          description="Đường dẫn có thể đã cũ. Chọn một trò khác trong trang Luyện tập nhé."
          action={
            <Button asChild variant="outline">
              <Link href="/practice">Về trang Luyện tập</Link>
            </Button>
          }
        />
      </Centered>
    );
  }

  if (error) {
    return (
      <Centered>
        <ErrorState title="Không tải được từ vựng" error={error} onRetry={refetch} backHref="/practice" backLabel="Về Luyện tập" />
      </Centered>
    );
  }

  if (data && data.words.length < PRACTICE_MIN_WORDS) {
    return (
      <Centered>
        <EmptyState
          title="Chưa đủ từ để chơi"
          description={`Cần ít nhất ${PRACTICE_MIN_WORDS} từ. Học xong bài đầu tiên của một khóa học là chơi được ngay.`}
          action={
            <Button asChild>
              <Link href="/dashboard">Về trang chủ</Link>
            </Button>
          }
        />
      </Centered>
    );
  }

  if (isLoading || !data || !meta) {
    return (
      <div className="min-h-dvh bg-background" aria-busy="true" aria-label="Đang tải trò chơi">
        <div className="border-b border-line">
          <div className="mx-auto flex h-16 max-w-[1180px] items-center gap-4 px-4 sm:px-8">
            <Skeleton className="size-9" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="ml-auto h-[5px] w-28 sm:w-56" />
          </div>
        </div>
        <div className="mx-auto max-w-[560px] px-4 pt-10 sm:pt-14">
          <Skeleton className="h-80 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  const Game = GAMES[meta.mode];
  return (
    <Game
      key={`${meta.mode}-${round}`}
      meta={meta}
      words={isQuick && quick ? quick.words : data.words}
      bestScore={latestBest[meta.mode] ?? data.stats.bestScores[meta.mode] ?? null}
      skipIntro={round > 0}
      onReplay={() => setRound((r) => r + 1)}
      onSubmitted={(result) => setLatestBest((best) => ({ ...best, [meta.mode]: result.bestScore }))}
    />
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-dvh place-items-center bg-background px-4">
      <div className="w-full max-w-md">{children}</div>
    </main>
  );
}
