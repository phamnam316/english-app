"use client";

import { useState, type ComponentType } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { SearchX } from "lucide-react";
import type { PracticeMode } from "@prisma/client";

import { ErrorState } from "@/components/error-state";
import { DictationGame } from "@/components/practice/dictation-game";
import { MatchGame } from "@/components/practice/match-game";
import { SentenceGame } from "@/components/practice/sentence-game";
import { SpeakGame } from "@/components/practice/speak-game";
import { SpeedGame } from "@/components/practice/speed-game";
import type { PracticeGameProps } from "@/components/practice/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useApiQuery } from "@/hooks/use-api-query";
import { api } from "@/lib/api-client";
import { PRACTICE_MIN_WORDS, getPracticeMode } from "@/lib/practice";

const GAMES: Record<PracticeMode, ComponentType<PracticeGameProps>> = {
  MATCH: MatchGame,
  SPEED: SpeedGame,
  DICTATION: DictationGame,
  SENTENCE: SentenceGame,
  PRONUNCIATION: SpeakGame,
};

export default function PracticeGamePage() {
  const { mode: slug } = useParams<{ mode: string }>();
  const meta = getPracticeMode(slug);
  const { data, error, isLoading, refetch } = useApiQuery((signal) => api.getPractice(signal), []);
  const [round, setRound] = useState(0);
  // Kỷ lục mới nhất sau mỗi lượt, theo từng trò (dữ liệu tải lúc đầu không tự cập nhật)
  const [latestBest, setLatestBest] = useState<Partial<Record<PracticeMode, number>>>({});

  if (!meta) {
    return (
      <Centered>
        <SearchX className="size-8 text-muted-foreground" />
        <h1 className="text-lg font-semibold">Không tìm thấy trò chơi</h1>
        <Button asChild variant="outline">
          <Link href="/practice">Về trang Luyện tập</Link>
        </Button>
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

  if (isLoading || !data) {
    return (
      <div className="min-h-dvh bg-background" aria-busy="true" aria-label="Đang tải trò chơi">
        <div className="mx-auto flex h-16 max-w-3xl items-center gap-4 px-4 sm:px-6">
          <Skeleton className="size-10" />
          <Skeleton className="h-2.5 flex-1 rounded-full" />
          <Skeleton className="h-4 w-10" />
        </div>
        <div className="mx-auto flex max-w-md flex-col items-center gap-5 px-5 pt-10">
          <Skeleton className="size-24 rounded-[1.75rem]" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-36 w-full rounded-3xl" />
        </div>
      </div>
    );
  }

  if (data.words.length < PRACTICE_MIN_WORDS) {
    return (
      <Centered>
        <h1 className="text-lg font-semibold">Chưa đủ từ để chơi</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Cần ít nhất {PRACTICE_MIN_WORDS} từ. Học bài đầu tiên của một khóa học để mở khóa trò chơi.
        </p>
        <Button asChild>
          <Link href="/dashboard">Về trang chủ</Link>
        </Button>
      </Centered>
    );
  }

  const Game = GAMES[meta.mode];
  return (
    <Game
      key={`${meta.mode}-${round}`}
      meta={meta}
      words={data.words}
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
      <div className="flex flex-col items-center gap-3 text-center">{children}</div>
    </main>
  );
}
