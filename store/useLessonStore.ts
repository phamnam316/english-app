import { create } from "zustand";

import { api, toApiClientError } from "@/lib/api-client";
import type {
  CheckAnswerResponse,
  ExerciseItem,
  LessonDetail,
  SubmitLessonResponse,
  VocabularyItem,
} from "@/types/api";

/**
 * Store cho 1 phiên học: từ vựng (flashcard) -> bài tập (quiz) -> hoàn thành.
 *
 * Lưu ý với Next.js: store này ở cấp module nên dùng chung trên server giữa các request.
 * Nó an toàn vì dữ liệu chỉ được ghi trong useEffect / sự kiện click (chỉ chạy ở trình duyệt),
 * server luôn render với state rỗng ban đầu.
 */

export type LessonPhase = "vocabulary" | "quiz" | "completed";
export type SubmitStatus = "idle" | "submitting" | "success" | "error";

interface LessonData {
  lesson: LessonDetail | null;
  vocabularies: VocabularyItem[];
  exercises: ExerciseItem[];
  phase: LessonPhase;
  /** Thẻ từ vựng đang xem */
  vocabIndex: number;
  /** Câu hỏi đang làm */
  currentIndex: number;
  /** quizId -> câu trả lời của user */
  userAnswers: Record<string, string>;
  /** quizId -> kết quả chấm (đáp án đúng + giải thích) */
  results: Record<string, CheckAnswerResponse>;
  /** Kết quả câu hiện tại; null khi chưa kiểm tra */
  isCorrect: boolean | null;
  /** Câu hiện tại đã bấm "Kiểm tra" (khóa đáp án, hiện banner) */
  isSubmitted: boolean;
  /** Đang chờ server chấm câu hiện tại */
  isChecking: boolean;
  /** Đã làm xong toàn bộ bài tập */
  isCompleted: boolean;
  submitStatus: SubmitStatus;
  submitResult: SubmitLessonResponse | null;
  submitError: string | null;
}

interface LessonActions {
  setLesson: (lesson: LessonDetail) => void;
  goToVocab: (index: number) => void;
  startQuiz: () => void;
  selectOption: (answer: string) => void;
  /** Gửi câu trả lời lên server chấm. Trả về kết quả, hoặc null nếu không có gì để kiểm tra */
  checkAnswer: () => Promise<CheckAnswerResponse | null>;
  nextQuestion: () => void;
  /** Nộp cả bài (chỉ gửi 1 lần, gọi lại khi đang gửi / đã thành công sẽ bị bỏ qua) */
  submitLesson: () => Promise<void>;
  /** Làm lại phần bài tập (giữ nguyên bài học, bỏ qua phần từ vựng) */
  retryQuiz: () => void;
  resetLesson: () => void;
}

export type LessonStore = LessonData & LessonActions;

const initialState: LessonData = {
  lesson: null,
  vocabularies: [],
  exercises: [],
  phase: "vocabulary",
  vocabIndex: 0,
  currentIndex: 0,
  userAnswers: {},
  results: {},
  isCorrect: null,
  isSubmitted: false,
  isChecking: false,
  isCompleted: false,
  submitStatus: "idle",
  submitResult: null,
  submitError: null,
};

const quizInitialState: Pick<
  LessonData,
  | "currentIndex"
  | "userAnswers"
  | "results"
  | "isCorrect"
  | "isSubmitted"
  | "isChecking"
  | "isCompleted"
  | "submitStatus"
  | "submitResult"
  | "submitError"
> = {
  currentIndex: 0,
  userAnswers: {},
  results: {},
  isCorrect: null,
  isSubmitted: false,
  isChecking: false,
  isCompleted: false,
  submitStatus: "idle",
  submitResult: null,
  submitError: null,
};

export const useLessonStore = create<LessonStore>()((set, get) => ({
  ...initialState,

  setLesson: (lesson) => {
    const hasVocab = lesson.vocabularies.length > 0;
    const hasQuiz = lesson.exercises.length > 0;
    set({
      ...initialState,
      lesson,
      vocabularies: lesson.vocabularies,
      exercises: lesson.exercises,
      phase: hasVocab ? "vocabulary" : hasQuiz ? "quiz" : "completed",
      isCompleted: !hasVocab && !hasQuiz,
    });
  },

  goToVocab: (index) => {
    const { vocabularies } = get();
    if (vocabularies.length === 0) return;
    set({ vocabIndex: Math.min(Math.max(index, 0), vocabularies.length - 1) });
  },

  startQuiz: () => {
    const hasQuiz = get().exercises.length > 0;
    set({ ...quizInitialState, phase: hasQuiz ? "quiz" : "completed", isCompleted: !hasQuiz });
  },

  selectOption: (answer) => {
    const { exercises, currentIndex, isSubmitted, isChecking } = get();
    const exercise = exercises[currentIndex];
    // Đã bấm "Kiểm tra" thì không đổi được đáp án nữa
    if (!exercise || isSubmitted || isChecking) return;
    set((state) => ({ userAnswers: { ...state.userAnswers, [exercise.id]: answer } }));
  },

  checkAnswer: async () => {
    const { lesson, exercises, currentIndex, userAnswers, isSubmitted, isChecking } = get();
    const exercise = exercises[currentIndex];
    if (!lesson || !exercise || isSubmitted || isChecking) return null;

    const answer = (userAnswers[exercise.id] ?? "").trim();
    if (!answer) return null;

    set({ isChecking: true });
    try {
      const result = await api.checkAnswer(lesson.id, { quizId: exercise.id, answer });
      // User đã thoát / chuyển bài trong lúc chờ server -> bỏ qua kết quả cũ
      if (get().lesson?.id !== lesson.id || get().currentIndex !== currentIndex) return null;

      set((state) => ({
        results: { ...state.results, [exercise.id]: result },
        isCorrect: result.isCorrect,
        isSubmitted: true,
        isChecking: false,
      }));
      return result;
    } catch (error) {
      set({ isChecking: false });
      throw toApiClientError(error);
    }
  },

  nextQuestion: () => {
    const { currentIndex, exercises, isSubmitted } = get();
    if (!isSubmitted) return;

    const isLastQuestion = currentIndex >= exercises.length - 1;
    set(
      isLastQuestion
        ? { phase: "completed", isCompleted: true, isSubmitted: false, isCorrect: null }
        : { currentIndex: currentIndex + 1, isSubmitted: false, isCorrect: null },
    );
  },

  submitLesson: async () => {
    const { lesson, exercises, userAnswers, submitStatus } = get();
    if (!lesson || exercises.length === 0) return;
    if (submitStatus === "submitting" || submitStatus === "success") return;

    set({ submitStatus: "submitting", submitError: null });
    try {
      const result = await api.submitLesson(lesson.id, {
        answers: exercises.map((exercise) => ({
          quizId: exercise.id,
          selectedOption: userAnswers[exercise.id] ?? "",
        })),
      });
      if (get().lesson?.id !== lesson.id) return;
      set({ submitStatus: "success", submitResult: result });
    } catch (error) {
      if (get().lesson?.id !== lesson.id) return;
      set({ submitStatus: "error", submitError: toApiClientError(error).message });
    }
  },

  retryQuiz: () => {
    const hasQuiz = get().exercises.length > 0;
    set({ ...quizInitialState, phase: hasQuiz ? "quiz" : "completed", isCompleted: !hasQuiz });
  },

  resetLesson: () => set(initialState),
}));

/** Phần trăm tiến độ của cả bài: mỗi thẻ từ vựng đã xem + mỗi câu đã kiểm tra là 1 bước */
export function selectLessonProgress(state: LessonStore): number {
  const totalSteps = state.vocabularies.length + state.exercises.length;
  if (totalSteps === 0) return 0;

  const vocabDone = state.phase === "vocabulary" ? state.vocabIndex : state.vocabularies.length;
  let quizDone = 0;
  if (state.phase === "completed") quizDone = state.exercises.length;
  else if (state.phase === "quiz") quizDone = state.currentIndex + (state.isSubmitted ? 1 : 0);

  return Math.round(((vocabDone + quizDone) / totalSteps) * 100);
}
