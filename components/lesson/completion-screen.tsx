"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ArrowRight, House, LoaderCircle, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useShallow } from "zustand/react/shallow";

import { ErrorState } from "@/components/error-state";
import { Button } from "@/components/ui/button";
import { fireConfetti, stopConfetti } from "@/lib/confetti";
import { PASSING_SCORE } from "@/lib/scoring";
import { cn } from "@/lib/utils";
import { useLessonStore } from "@/store/useLessonStore";

/** Phần cuối: nộp bài, hiện kết quả, XP và streak mới, nút học bài tiếp theo */
export function CompletionScreen() {
  const { update: refreshSession } = useSession();
  const { lesson, vocabCount, exerciseCount, submitStatus, submitResult, submitError, submitLesson, retryQuiz } =
    useLessonStore(
      useShallow((s) => ({
        lesson: s.lesson,
        vocabCount: s.vocabularies.length,
        exerciseCount: s.exercises.length,
        submitStatus: s.submitStatus,
        submitResult: s.submitResult,
        submitError: s.submitError,
        submitLesson: s.submitLesson,
        retryQuiz: s.retryQuiz,
      })),
    );
  const celebratedRef = useRef(false);

  // Vào màn hình này là nộp bài ngay (store tự chặn gửi trùng)
  useEffect(() => {
    if (submitStatus === "idle" && exerciseCount > 0) void submitLesson();
  }, [exerciseCount, submitLesson, submitStatus]);

  useEffect(() => {
    if (submitStatus === "error" && submitError) toast.error(submitError);
  }, [submitError, submitStatus]);

  // Chỉ ăn mừng 1 lần cho mỗi lần nộp thành công
  useEffect(() => {
    if (submitStatus !== "success" || !submitResult) {
      celebratedRef.current = false;
      return;
    }
    if (celebratedRef.current) return;
    celebratedRef.current = true;
    // Làm mới XP/streak trong session để header hiện số mới ngay.
    // Phải truyền object: next-auth v4 chỉ gửi POST (kích hoạt trigger "update" ở callback jwt)
    // khi update() có tham số; update() rỗng chỉ đọc lại session cũ.
    void refreshSession({});
    if (submitResult.passed) void fireConfetti();
  }, [refreshSession, submitResult, submitStatus]);

  // Rời màn hình này (về trang chủ, làm lại) -> dọn pháo giấy
  useEffect(() => stopConfetti, []);

  if (!lesson) return null;
  const next = lesson.nextLesson;

  const nextButton = next && (
    <Button asChild size="lg" className="h-auto min-h-12 w-full py-3 leading-snug whitespace-normal">
      <Link href={`/lessons/${next.id}`}>
        Học bài tiếp: {next.title}
        <ArrowRight className="size-4" />
      </Link>
    </Button>
  );
  const homeLink = (
    <Button asChild variant="outline" size="lg" className="w-full">
      <Link href="/dashboard">
        <House />
        Về trang chủ
      </Link>
    </Button>
  );

  // Bài chỉ có từ vựng, không có bài tập -> không cần chấm điểm
  if (exerciseCount === 0) {
    return (
      <ResultCard eyebrow="Hoàn thành" title="Bạn đã học xong từ mới" subtitle={`${vocabCount} từ trong bài ${lesson.title}`}>
        <div className="mt-7 space-y-2.5">
          {nextButton}
          {homeLink}
        </div>
      </ResultCard>
    );
  }

  if (submitStatus === "error") {
    return (
      <div className="w-full max-w-[560px] pt-8 pb-16 sm:pt-12">
        <ErrorState
          title="Chưa lưu được kết quả"
          description={`${submitError ?? "Đã có lỗi xảy ra."} Câu trả lời của bạn vẫn được giữ lại, hãy thử gửi lại.`}
          onRetry={() => void submitLesson()}
          retryLabel="Gửi lại kết quả"
          backHref="/dashboard"
        />
      </div>
    );
  }

  if (submitStatus !== "success" || !submitResult) {
    return (
      <div className="flex w-full max-w-[560px] items-center gap-3 pt-16 text-muted-foreground" role="status">
        <LoaderCircle className="size-5 animate-spin text-moss" />
        Đang chấm điểm và lưu kết quả…
      </div>
    );
  }

  const { passed, score, xpEarned, newStreak, totalXp, correctCount, totalQuestions } = submitResult;

  if (!passed) {
    return (
      <ResultCard
        eyebrow={`Chưa đạt (dưới ${PASSING_SCORE}%)`}
        title="Chưa đạt, làm lại nhé!"
        subtitle={`Bạn đúng ${correctCount}/${totalQuestions} câu. Cần đạt từ ${PASSING_SCORE}% để hoàn thành bài.`}
      >
        <p className="mt-6 flex items-baseline gap-2 border-y border-line py-4">
          <span className="text-[2rem] leading-none font-semibold text-destructive tabular-nums">{score}%</span>
          <span className="text-[14px] text-muted-foreground">/ cần {PASSING_SCORE}%</span>
        </p>
        <div className="mt-6 space-y-2.5">
          <Button size="lg" className="w-full" onClick={retryQuiz}>
            <RotateCcw />
            Làm lại bài tập
          </Button>
          <Button asChild variant="ghost" size="lg" className="w-full">
            <Link href="/dashboard">
              <House />
              Về trang chủ
            </Link>
          </Button>
        </div>
      </ResultCard>
    );
  }

  return (
    <ResultCard eyebrow={`Hoàn thành (đạt ≥ ${PASSING_SCORE}%)`} title="Hoàn thành bài học!" subtitle={lesson.title}>
      <dl className="mt-7 grid grid-cols-3 divide-x divide-line border-y border-line py-4 text-center">
        <Stat value={`+${xpEarned}`} label="XP nhận được" highlight={xpEarned > 0} />
        <Stat value={newStreak} label="ngày liên tiếp" />
        <Stat value={`${score}%`} label={`${correctCount}/${totalQuestions} câu đúng`} />
      </dl>
      <p className="mt-4 text-[14px] text-muted-foreground">
        {xpEarned > 0
          ? `Tổng XP của bạn: ${totalXp}`
          : `Bạn đã nhận XP của bài này ở lần hoàn thành đầu tiên. Tổng XP: ${totalXp}`}
      </p>

      <div className="mt-6 space-y-2.5">
        {nextButton}
        <div className="grid grid-cols-2 gap-2.5">
          <Button variant="outline" size="lg" onClick={retryQuiz}>
            <RotateCcw />
            Làm lại
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/dashboard">
              <House />
              <span className="sm:hidden">Trang chủ</span>
              <span className="hidden sm:inline">Về trang chủ</span>
            </Link>
          </Button>
        </div>
      </div>
      <p className="mt-6 text-center">
        <Link
          href="/practice"
          className="text-[15px] font-medium text-moss-strong underline decoration-line-strong underline-offset-[5px] hover:decoration-moss"
        >
          Ôn từ vừa học bằng trò chơi
        </Link>
      </p>
    </ResultCard>
  );
}

interface ResultCardProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

function ResultCard({ eyebrow, title, subtitle, children }: ResultCardProps) {
  return (
    <div className="w-full max-w-[560px] pt-8 pb-16 sm:pt-12">
      <section className="rounded-lg border border-line bg-card p-6 animate-in fade-in zoom-in-[0.98] duration-300 sm:p-9 motion-reduce:animate-none">
        <p className="text-[13px] font-medium text-muted-foreground">{eyebrow}</p>
        <h1 className="mt-3 text-[2.5rem] leading-[1.05] tracking-[-0.015em] text-balance">{title}</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{subtitle}</p>
        {children}
      </section>
    </div>
  );
}

function Stat({ value, label, highlight = false }: { value: React.ReactNode; label: string; highlight?: boolean }) {
  return (
    <div className="flex flex-col-reverse items-center gap-1 px-1">
      <dt className="text-[12px] leading-tight text-muted-foreground">{label}</dt>
      <dd className={cn("text-2xl font-semibold tabular-nums", highlight && "text-clay-strong")}>{value}</dd>
    </div>
  );
}
