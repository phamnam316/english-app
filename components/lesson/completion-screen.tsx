"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { BookCheck, Flame, House, LoaderCircle, RotateCcw, Star, Target, Trophy } from "lucide-react";
import { toast } from "sonner";
import { useShallow } from "zustand/react/shallow";

import { ErrorState } from "@/components/error-state";
import { LessonFooter } from "@/components/lesson/lesson-footer";
import { Button } from "@/components/ui/button";
import { fireConfetti, stopConfetti } from "@/lib/confetti";
import { PASSING_SCORE } from "@/lib/scoring";
import { cn } from "@/lib/utils";
import { useLessonStore } from "@/store/useLessonStore";

/** Phần 3: nộp bài, hiện kết quả, XP và streak mới */
export function CompletionScreen() {
  const router = useRouter();
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
    // Làm mới XP/streak trong session để header ở Dashboard hiện số mới ngay.
    // Phải truyền object: next-auth v4 chỉ gửi POST (kích hoạt trigger "update" ở callback jwt)
    // khi update() có tham số; update() rỗng chỉ đọc lại session cũ.
    void refreshSession({});
    if (submitResult.passed) void fireConfetti();
  }, [refreshSession, submitResult, submitStatus]);

  // Rời màn hình này (về trang chủ, làm lại) -> dọn pháo giấy
  useEffect(() => stopConfetti, []);

  const goHome = () => router.push("/dashboard");

  // Bài chỉ có từ vựng, không có bài tập -> không cần chấm điểm
  if (exerciseCount === 0) {
    return (
      <ResultLayout
        icon={<BookCheck className="size-12" />}
        iconClass="bg-success-soft text-success"
        title="Bạn đã học xong từ mới"
        subtitle={`${vocabCount} từ trong bài ${lesson?.title ?? ""}`}
        footer={
          <Button size="lg" className="w-full sm:ml-auto sm:w-auto sm:min-w-48" onClick={goHome}>
            <House />
            Về trang chủ
          </Button>
        }
      />
    );
  }

  if (submitStatus === "error") {
    return (
      <div className="flex flex-1 items-center px-4 py-10">
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
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 pb-24" role="status">
        <LoaderCircle className="size-10 animate-spin text-primary" />
        <p className="font-medium text-muted-foreground">Đang chấm điểm và lưu kết quả</p>
      </div>
    );
  }

  const { passed, score, xpEarned, newStreak, totalXp, correctCount, totalQuestions } = submitResult;

  return (
    <ResultLayout
      icon={passed ? <Trophy className="size-12" /> : <RotateCcw className="size-11" />}
      iconClass={passed ? "bg-xp-soft text-xp" : "bg-danger-soft text-destructive"}
      title={passed ? "Hoàn thành bài học!" : "Chưa đạt, làm lại nhé!"}
      subtitle={
        passed
          ? (lesson?.title ?? "")
          : `Bạn đúng ${correctCount}/${totalQuestions} câu. Cần đạt từ ${PASSING_SCORE}% để hoàn thành bài.`
      }
      stats={
        <dl className="grid w-full grid-cols-3 gap-3">
          <Stat
            label="XP nhận được"
            value={`+${xpEarned}`}
            icon={<Star className="size-5 fill-xp text-xp" />}
            className={xpEarned > 0 ? "border-xp/40 bg-xp-soft" : undefined}
          />
          <Stat
            label="ngày liên tiếp"
            value={newStreak}
            icon={<Flame className="size-5 fill-streak text-streak" />}
            className="border-streak/30 bg-streak-soft"
          />
          <Stat
            label={`${correctCount}/${totalQuestions} câu đúng`}
            value={`${score}%`}
            icon={<Target className={cn("size-5", passed ? "text-success" : "text-destructive")} />}
          />
        </dl>
      }
      note={
        passed
          ? xpEarned > 0
            ? `Tổng XP của bạn: ${totalXp}`
            : `Bạn đã nhận XP của bài này ở lần hoàn thành đầu tiên. Tổng XP: ${totalXp}`
          : undefined
      }
      footer={
        passed ? (
          <>
            <Button variant="outline" size="lg" className="px-5" onClick={retryQuiz} aria-label="Làm lại bài tập">
              <RotateCcw />
              <span className="hidden sm:inline">Làm lại</span>
            </Button>
            <Button size="lg" className="flex-1 sm:ml-auto sm:max-w-64" onClick={goHome}>
              <House />
              Về trang chủ
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline" size="lg" className="px-5" onClick={goHome} aria-label="Về trang chủ">
              <House />
              <span className="hidden sm:inline">Về trang chủ</span>
            </Button>
            <Button size="lg" className="flex-1 sm:ml-auto sm:max-w-64" onClick={retryQuiz}>
              <RotateCcw />
              Làm lại bài tập
            </Button>
          </>
        )
      }
    />
  );
}

interface ResultLayoutProps {
  icon: React.ReactNode;
  iconClass: string;
  title: string;
  subtitle: string;
  stats?: React.ReactNode;
  note?: string;
  footer: React.ReactNode;
}

function ResultLayout({ icon, iconClass, title, subtitle, stats, note, footer }: ResultLayoutProps) {
  return (
    <>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-8 px-4 pt-6 pb-32 text-center">
        <div className="flex flex-col items-center gap-5 animate-in fade-in zoom-in-95 duration-500 motion-reduce:animate-none">
          <span className={cn("grid size-24 place-items-center rounded-full", iconClass)}>{icon}</span>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-balance">{title}</h1>
            <p className="leading-relaxed text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        {stats}
        {note && <p className="text-sm text-muted-foreground">{note}</p>}
      </div>
      <LessonFooter className="justify-between">{footer}</LessonFooter>
    </>
  );
}

function Stat({
  label,
  value,
  icon,
  className,
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col-reverse items-center gap-1 rounded-3xl border border-border/70 bg-card px-2 py-4 shadow-soft", className)}>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="flex items-center gap-1.5 text-2xl font-semibold tabular-nums">
        {icon}
        {value}
      </dd>
    </div>
  );
}
