/**
 * Type của dữ liệu các API trả về. Dùng chung cho frontend (fetch, React Query...)
 * để gọi API có kiểm tra kiểu đầy đủ.
 */
import type { Level, ProgressStatus, QuizType, Role } from "@prisma/client";
import type { ChatFeedback, GrammarCorrection } from "@/lib/ai";

// ---------------------------------------------------------------------------
// POST /api/auth/register
// ---------------------------------------------------------------------------

export interface PublicUser {
  id: string;
  name: string | null;
  email: string | null;
  role: Role;
  xp: number;
  streak: number;
  createdAt: string;
}

export interface RegisterResponse {
  user: PublicUser;
}

// ---------------------------------------------------------------------------
// GET /api/courses
// ---------------------------------------------------------------------------

export interface LessonSummary {
  id: string;
  title: string;
  order: number;
  xpReward: number;
  /** Chưa đăng nhập hoặc chưa học: NOT_STARTED */
  status: ProgressStatus;
  score: number | null;
}

export interface UnitSummary {
  id: string;
  title: string;
  order: number;
  totalLessons: number;
  completedLessons: number;
  lessons: LessonSummary[];
}

export interface CourseSummary {
  id: string;
  title: string;
  description: string | null;
  level: Level;
  imageUrl: string | null;
  totalLessons: number;
  completedLessons: number;
  /** Phần trăm bài đã hoàn thành, 0-100 */
  progressPercent: number;
  units: UnitSummary[];
}

export interface CourseListResponse {
  /** false: tiến độ trả về đều là NOT_STARTED vì không có user */
  isAuthenticated: boolean;
  courses: CourseSummary[];
}

// ---------------------------------------------------------------------------
// GET /api/lessons/[id]
// ---------------------------------------------------------------------------

export interface VocabularyItem {
  id: string;
  word: string;
  phonetic: string | null;
  meaning: string;
  exampleSentence: string | null;
  audioUrl: string | null;
}

/** Không chứa correctAnswer/explanation để user không xem được đáp án trước khi nộp */
export interface ExerciseItem {
  id: string;
  question: string;
  type: QuizType;
  options: string[] | null;
  audioUrl: string | null;
  order: number;
}

export interface LessonProgressInfo {
  status: ProgressStatus;
  score: number | null;
  completedAt: string | null;
}

export interface LessonDetail {
  id: string;
  title: string;
  order: number;
  xpReward: number;
  unit: { id: string; title: string; order: number };
  course: { id: string; title: string; level: Level };
  vocabularies: VocabularyItem[];
  exercises: ExerciseItem[];
  progress: LessonProgressInfo;
}

export interface LessonDetailResponse {
  lesson: LessonDetail;
}

// ---------------------------------------------------------------------------
// POST /api/lessons/[id]/check
// ---------------------------------------------------------------------------

export interface CheckAnswerRequest {
  quizId: string;
  answer: string;
}

export interface CheckAnswerResponse {
  quizId: string;
  isCorrect: boolean;
  correctAnswer: string;
  explanation: string | null;
}

// ---------------------------------------------------------------------------
// POST /api/lessons/[id]/submit
// ---------------------------------------------------------------------------

export interface SubmitLessonRequest {
  answers: Array<{ quizId: string; selectedOption: string }>;
}

export interface AnswerResult {
  quizId: string;
  selectedOption: string | null;
  correctAnswer: string;
  isCorrect: boolean;
  explanation: string | null;
}

export interface SubmitLessonResponse {
  passed: boolean;
  /** Điểm lần làm này, 0-100 */
  score: number;
  /** XP nhận được lần này (chỉ > 0 ở lần đầu tiên đậu bài) */
  xpEarned: number;
  newStreak: number;
  totalXp: number;
  correctCount: number;
  totalQuestions: number;
  isFirstCompletion: boolean;
  /** Đáp án đúng và giải thích từng câu, trả về SAU khi nộp */
  results: AnswerResult[];
}

// ---------------------------------------------------------------------------
// POST /api/ai/correct-grammar
// ---------------------------------------------------------------------------

export interface CorrectGrammarRequest {
  text: string;
  context?: string;
}

export type CorrectGrammarResponse = GrammarCorrection;

// ---------------------------------------------------------------------------
// POST /api/ai/chat
// ---------------------------------------------------------------------------

export interface AIChatRequest {
  /** Bỏ trống ở tin nhắn đầu tiên: server tạo phiên mới và trả sessionId */
  sessionId?: string;
  topic: string;
  userMessage: string;
  level: Level;
}

export interface AIChatResponse {
  sessionId: string;
  reply: string;
  feedback: ChatFeedback;
  userMessageId: string;
  assistantMessageId: string;
}

// ---------------------------------------------------------------------------
// POST /api/ai/stt  (multipart/form-data, field "audio")
// POST /api/ai/tts  (trả về audio/mpeg)
// ---------------------------------------------------------------------------

export interface SpeechToTextResponse {
  text: string;
}

export interface TextToSpeechRequest {
  text: string;
  voice?: "alloy" | "echo";
  /** 0.5 - 1.5, mặc định 1 */
  speed?: number;
}
