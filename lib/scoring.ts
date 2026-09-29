import type { QuizType } from "@prisma/client";

/** Ngưỡng đậu: đạt từ 70% trở lên */
export const PASSING_SCORE = 70;

export interface GradableExercise {
  id: string;
  type: QuizType;
  correctAnswer: string;
  explanation: string | null;
}

export interface SubmittedAnswer {
  quizId: string;
  selectedOption: string;
}

export interface GradedAnswer {
  quizId: string;
  /** null = user bỏ qua câu này */
  selectedOption: string | null;
  correctAnswer: string;
  isCorrect: boolean;
  explanation: string | null;
}

export interface GradeResult {
  correctCount: number;
  totalQuestions: number;
  /** Điểm phần trăm, làm tròn, thang 0-100 */
  score: number;
  passed: boolean;
  results: GradedAnswer[];
}

/**
 * Chuẩn hóa câu trả lời trước khi so sánh, để " Greeted. " và "greeted" đều đúng:
 * bỏ khoảng trắng thừa, chữ thường, thống nhất dấu nháy cong/thẳng, bỏ dấu câu ở cuối.
 */
export function normalizeAnswer(value: string): string {
  return value
    .normalize("NFC")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[.!?,;:]+$/u, "")
    .trim();
}

/** So sánh câu trả lời với đáp án (dùng chung cho chấm từng câu và chấm cả bài) */
export function isAnswerCorrect(answer: string | null | undefined, correctAnswer: string): boolean {
  if (answer === null || answer === undefined) return false;
  const normalized = normalizeAnswer(answer);
  return normalized.length > 0 && normalized === normalizeAnswer(correctAnswer);
}

/**
 * Chấm bài. Mẫu số là TỔNG số câu của bài học (không phải số câu user gửi lên),
 * nên câu bị bỏ qua tính là sai.
 */
export function gradeAnswers(
  exercises: GradableExercise[],
  answers: SubmittedAnswer[],
): GradeResult {
  const answerByQuizId = new Map(answers.map((a) => [a.quizId, a.selectedOption]));

  const results: GradedAnswer[] = exercises.map((exercise) => {
    const selectedOption = answerByQuizId.get(exercise.id) ?? null;
    const isCorrect = isAnswerCorrect(selectedOption, exercise.correctAnswer);

    return {
      quizId: exercise.id,
      selectedOption,
      correctAnswer: exercise.correctAnswer,
      isCorrect,
      explanation: exercise.explanation,
    };
  });

  const totalQuestions = exercises.length;
  const correctCount = results.filter((r) => r.isCorrect).length;
  const score = totalQuestions === 0 ? 0 : Math.round((correctCount / totalQuestions) * 100);

  return {
    correctCount,
    totalQuestions,
    score,
    passed: score >= PASSING_SCORE,
    results,
  };
}
