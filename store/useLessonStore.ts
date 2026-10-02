import { create } from "zustand";

import { toast } from "sonner";

import { api, toApiClientError } from "@/lib/api-client";
import type {
  CheckAnswerResponse,
  ExerciseItem,
  LessonDetail,
  SubmitLessonResponse,
  VocabularyItem,
  WordRating,
} from "@/types/api";

/**
 * Store cho 1 phiên học: từ vựng -> ghi chú ngữ pháp (nếu có) -> bài tập (quiz) -> hoàn thành.
 *
 * Lưu ý với Next.js: store này ở cấp module nên dùng chung trên server giữa các request.
 * Nó an toàn vì dữ liệu chỉ được ghi trong useEffect / sự kiện click (chỉ chạy ở trình duyệt),
 * server luôn render với state rỗng ban đầu.
 */

export type LessonPhase = "vocabulary" | "grammar" | "quiz" | "completed";
export type SubmitStatus = "idle" | "submitting" | "success" | "error";

interface LessonData {
  lesson: LessonDetail | null;
  vocabularies: VocabularyItem[];
  exercises: ExerciseItem[];
  phase: LessonPhase;
  /** Thẻ từ vựng đang xem */
  vocabIndex: number;
  /** Từ xa nhất đã xem (để đánh dấu đã học trong dàn bài) */
  maxVocabIndex: number;
  /** vocabId -> mức nhớ tự đánh giá */
  ratings: Record<string, WordRating | null>;
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
  /** Sang phần ghi chú ngữ pháp (bài không có ghi chú thì vào thẳng bài tập) */
  goToGrammar: () => void;
  /** Hết phần từ vựng: sang ghi chú ngữ pháp nếu có, không thì vào bài tập */
  finishVocabulary: () => void;
  startQuiz: () => void;
  /** Lưu mức nhớ (cập nhật ngay trên giao diện, lỗi thì trả lại như cũ) */
  rateWord: (vocabId: string, rating: WordRating | null) => Promise<void>;
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
  maxVocabIndex: 0,
  ratings: {},
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
      ratings: Object.fromEntries(lesson.vocabularies.map((v) => [v.id, v.rating])),
      phase: hasVocab ? "vocabulary" : lesson.grammarNote ? "grammar" : hasQuiz ? "quiz" : "completed",
      isCompleted: !hasVocab && !lesson.grammarNote && !hasQuiz,
    });
  },

  goToVocab: (index) => {
    const { vocabularies } = get();
    if (vocabularies.length === 0) return;
    const next = Math.min(Math.max(index, 0), vocabularies.length - 1);
    set((state) => ({ phase: "vocabulary", vocabIndex: next, maxVocabIndex: Math.max(state.maxVocabIndex, next) }));
  },

  goToGrammar: () => {
    const { lesson, vocabularies } = get();
    if (!lesson?.grammarNote) {
      get().startQuiz();
      return;
    }
    set({ phase: "grammar", maxVocabIndex: Math.max(vocabularies.length - 1, 0) });
  },

  finishVocabulary: () => {
    if (get().lesson?.grammarNote) get().goToGrammar();
    else {
      set((state) => ({ maxVocabIndex: Math.max(state.vocabularies.length - 1, 0) }));
      get().startQuiz();
    }
  },

  rateWord: async (vocabId, rating) => {
    const vocab = get().vocabularies.find((v) => v.id === vocabId);
    if (!vocab) return;
    const previous = get().ratings[vocabId] ?? null;
    set((state) => ({ ratings: { ...state.ratings, [vocabId]: rating } }));
    try {
      await api.rateWord({ word: vocab.word, rating });
    } catch (error) {
      set((state) => ({ ratings: { ...state.ratings, [vocabId]: previous } }));
      toast.error(toApiClientError(error).message);
    }
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

/** Phần trăm tiến độ của cả bài: mỗi thẻ từ vựng đã xem, phần ngữ pháp, mỗi câu đã kiểm tra là 1 bước */
export function selectLessonProgress(state: LessonStore): number {
  const grammarSteps = state.lesson?.grammarNote ? 1 : 0;
  const totalSteps = state.vocabularies.length + grammarSteps + state.exercises.length;
  if (totalSteps === 0) return 0;

  const vocabDone = state.phase === "vocabulary" ? state.vocabIndex : state.vocabularies.length;
  const grammarDone = state.phase === "quiz" || state.phase === "completed" ? grammarSteps : 0;
  let quizDone = 0;
  if (state.phase === "completed") quizDone = state.exercises.length;
  else if (state.phase === "quiz") quizDone = state.currentIndex + (state.isSubmitted ? 1 : 0);

  return Math.round(((vocabDone + grammarDone + quizDone) / totalSteps) * 100);
}
