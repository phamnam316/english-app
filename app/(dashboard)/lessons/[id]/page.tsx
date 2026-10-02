"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useShallow } from "zustand/react/shallow";

import { ErrorState } from "@/components/error-state";
import { CompletionScreen } from "@/components/lesson/completion-screen";
import { GrammarView } from "@/components/lesson/grammar-view";
import { LessonHeader } from "@/components/lesson/lesson-header";
import { LessonOutline, LessonSteps } from "@/components/lesson/lesson-outline";
import { LessonSkeleton } from "@/components/lesson/lesson-skeleton";
import { QuizView } from "@/components/lesson/quiz-view";
import { VocabularyView } from "@/components/lesson/vocabulary-view";
import { useApiQuery } from "@/hooks/use-api-query";
import { api } from "@/lib/api-client";
import { useLessonStore } from "@/store/useLessonStore";

/**
 * Màn học 1 bài: Học từ -> Ghi chú ngữ pháp (nếu có) -> Làm bài -> Hoàn thành.
 * Toàn màn hình, không có thanh điều hướng để người học tập trung; máy tính có thêm cột dàn bài bên trái.
 */
export default function LessonPage() {
  const { id } = useParams<{ id: string }>();
  const { data, error, isLoading, refetch } = useApiQuery((signal) => api.getLesson(id, signal), [id]);
  const { phase, loadedLessonId, setLesson, resetLesson } = useLessonStore(
    useShallow((s) => ({
      phase: s.phase,
      loadedLessonId: s.lesson?.id,
      setLesson: s.setLesson,
      resetLesson: s.resetLesson,
    })),
  );

  // Nạp bài vào store khi tải xong; rời trang -> xóa sạch để lần sau học lại từ đầu
  useEffect(() => {
    if (data) setLesson(data.lesson);
  }, [data, setLesson]);
  useEffect(() => resetLesson, [resetLesson]);

  // Sang phần khác của bài -> về đầu trang
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [phase]);

  if (error) {
    return (
      <main className="grid min-h-dvh place-items-center bg-background px-4">
        <ErrorState
          title={error.status === 404 ? "Không tìm thấy bài học" : "Không tải được bài học"}
          error={error}
          onRetry={error.status === 404 ? undefined : refetch}
          backHref="/dashboard"
        />
      </main>
    );
  }

  if (isLoading || !data || loadedLessonId !== data.lesson.id) {
    return <LessonSkeleton />;
  }

  return (
    // overflow-x-clip: hiệu ứng trượt không được làm trang rộng ra
    // (trên điện thoại, trang rộng ra sẽ đẩy thanh nút cố định ở đáy lệch khỏi màn hình)
    <div className="flex min-h-dvh flex-col overflow-x-clip bg-background">
      <LessonHeader />
      <LessonSteps className="border-b border-line lg:hidden" />
      <div className="mx-auto grid w-full max-w-[1180px] flex-1 lg:grid-cols-12 lg:gap-12 lg:px-8">
        <LessonOutline className="hidden lg:col-span-3 lg:block" />
        <main className="flex min-w-0 flex-col px-4 sm:px-8 lg:col-span-9 lg:px-0">
          {phase === "vocabulary" && <VocabularyView />}
          {phase === "grammar" && <GrammarView />}
          {phase === "quiz" && <QuizView />}
          {phase === "completed" && <CompletionScreen />}
        </main>
      </div>
    </div>
  );
}
