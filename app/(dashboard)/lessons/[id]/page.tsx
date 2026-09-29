"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useShallow } from "zustand/react/shallow";

import { ErrorState } from "@/components/error-state";
import { CompletionScreen } from "@/components/lesson/completion-screen";
import { LessonHeader } from "@/components/lesson/lesson-header";
import { LessonSkeleton } from "@/components/lesson/lesson-skeleton";
import { QuizView } from "@/components/lesson/quiz-view";
import { VocabularyView } from "@/components/lesson/vocabulary-view";
import { useApiQuery } from "@/hooks/use-api-query";
import { api } from "@/lib/api-client";
import { useLessonStore } from "@/store/useLessonStore";

/**
 * Màn học 1 bài: Từ vựng (flashcard) -> Bài tập (quiz) -> Hoàn thành.
 * Toàn màn hình, không có thanh điều hướng để người học tập trung.
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
    // overflow-x-clip: thẻ từ vựng trượt vào từ bên phải không được làm trang rộng ra
    // (trên điện thoại, trang rộng ra sẽ đẩy thanh nút cố định ở đáy lệch khỏi màn hình)
    <div className="flex min-h-dvh flex-col overflow-x-clip bg-background">
      <LessonHeader />
      <main className="flex flex-1 flex-col">
        {phase === "vocabulary" && <VocabularyView />}
        {phase === "quiz" && <QuizView />}
        {phase === "completed" && <CompletionScreen />}
      </main>
    </div>
  );
}
