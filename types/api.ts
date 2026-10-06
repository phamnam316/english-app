/**
 * Type của dữ liệu các API trả về. Dùng chung cho frontend (fetch, React Query...)
 * để gọi API có kiểm tra kiểu đầy đủ.
 */
import type { Level, PracticeMode, ProgressStatus, QuizType, Role } from "@prisma/client";
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
  vocabCount: number;
  exerciseCount: number;
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
  exampleTranslation: string | null;
  /** Cấp độ CEFR của từ (A1, A2...) nếu có */
  cefr: string | null;
  audioUrl: string | null;
  /** Mức nhớ người học tự đánh giá; null nếu chưa đánh giá hoặc chưa đăng nhập */
  rating: WordRating | null;
}

/** Mức nhớ tự đánh giá: 1 = Chưa nhớ, 2 = Hơi nhớ, 3 = Đã nhớ */
export type WordRating = 1 | 2 | 3;

/**
 * Ghi chú ngữ pháp của bài học. Các chuỗi hỗ trợ đánh dấu đơn giản: **đậm**, *nghiêng*.
 */
export interface GrammarNote {
  /** Tên điểm ngữ pháp, vd "Hỏi và nói tuổi" */
  title: string;
  /** 1–2 câu giải thích */
  intro: string;
  /** Công thức / mẫu câu, mỗi dòng 1 mẫu */
  patterns: string[];
  examples: Array<{ en: string; vi: string }>;
  /** Lỗi hay gặp: câu sai (gạch ngang) + cách sửa */
  avoid?: { wrong: string; fix: string };
}

/** Không chứa correctAnswer/explanation để user không xem được đáp án trước khi nộp */
export interface ExerciseItem {
  id: string;
  question: string;
  type: QuizType;
  /** WORD_ORDER: các thẻ từ (đã xáo) để xếp thành câu */
  options: string[] | null;
  audioUrl: string | null;
  /** Câu cho giọng máy đọc khi không có audioUrl (bài nghe) */
  audioText: string | null;
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
  grammarNote: GrammarNote | null;
  story: LessonStory | null;
  vocabularies: VocabularyItem[];
  exercises: ExerciseItem[];
  progress: LessonProgressInfo;
  /** Bài kế tiếp trong khóa (để nút "Học bài tiếp"); null nếu là bài cuối */
  nextLesson: { id: string; title: string } | null;
}

/** Đoạn hội thoại tình huống mở đầu bài học (đặt từ mới vào ngữ cảnh đời sống) */
export interface LessonStory {
  /** Tên tình huống, vd "Buổi sáng ở quán cà phê" */
  title: string;
  /** 1 câu dẫn: ai, ở đâu */
  intro: string;
  /** Nhân vật chính, hiển thị bên phải */
  main: string;
  lines: Array<{ speaker: string; en: string; vi: string }>;
}

// ---------------------------------------------------------------------------
// GET /api/home
// ---------------------------------------------------------------------------

export interface HomeResponse {
  courses: CourseSummary[];
  /** Mục tiêu mỗi ngày: học xong 1 bài + 1 lượt ôn */
  today: { lessonsCompleted: number; practiceRounds: number };
  review: {
    /** Số từ có thể ôn (từ của các bài đã mở) */
    wordCount: number;
    /** Số từ đến hạn ôn hôm nay */
    dueCount: number;
    /** Số từ tự đánh giá Chưa nhớ / Hơi nhớ */
    weakCount: number;
  };
  /** Từ của bài nên học tiếp, để xem trước */
  nextLessonWords: Array<{ id: string; word: string; phonetic: string | null }>;
}

// ---------------------------------------------------------------------------
// PUT /api/words/rating
// ---------------------------------------------------------------------------

export interface WordRatingRequest {
  word: string;
  /** null: bỏ đánh giá */
  rating: WordRating | null;
}

export interface WordRatingResponse {
  word: string;
  rating: WordRating | null;
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

// ---------------------------------------------------------------------------
// GET/POST /api/practice
// ---------------------------------------------------------------------------

export interface PracticeWord {
  id: string;
  word: string;
  phonetic: string | null;
  meaning: string;
  exampleSentence: string | null;
  exampleTranslation: string | null;
  cefr: string | null;
  audioUrl: string | null;
  /** Mức nhớ tự đánh giá; trò chơi ưu tiên từ chưa nhớ */
  rating: WordRating | null;
  /** Đến hạn ôn hôm nay (lịch lặp lại ngắt quãng) */
  due: boolean;
}

export interface PracticeStats {
  /** XP đã nhận từ luyện tập hôm nay */
  todayXp: number;
  dailyXpCap: number;
  /** Điểm cao nhất theo từng trò chơi */
  bestScores: Partial<Record<PracticeMode, number>>;
}

export interface PracticeDataResponse {
  /** Từ vựng của các bài đã mở khóa (đã học xong hoặc đang học), từ đến hạn ôn đứng trước */
  words: PracticeWord[];
  /** Số từ đến hạn ôn hôm nay */
  dueCount: number;
  stats: PracticeStats;
}

export interface PracticeResultRequest {
  mode: PracticeMode;
  /** Số câu đúng */
  correct: number;
  /** Số câu đã làm */
  total: number;
  /** Điểm để tính kỷ lục (trò tính giờ: số câu đúng trong 60 giây) */
  score: number;
  /** Đúng/sai từng từ trong lượt, để cập nhật lịch ôn */
  reviewed?: Array<{ word: string; correct: boolean }>;
}

export interface PracticeResultResponse {
  xpEarned: number;
  totalXp: number;
  newStreak: number;
  todayXp: number;
  dailyXpCap: number;
  bestScore: number;
  isNewBest: boolean;
}

// ---------------------------------------------------------------------------
// GET /api/leaderboard?period=week|all
// ---------------------------------------------------------------------------

export type LeaderboardPeriod = "week" | "all";

export interface LeaderboardEntry {
  rank: number;
  name: string;
  image: string | null;
  xp: number;
  streak: number;
  isMe: boolean;
}

export interface LeaderboardResponse {
  period: LeaderboardPeriod;
  /** Top 20 */
  entries: LeaderboardEntry[];
  /** Hạng của user hiện tại khi không nằm trong top; null nếu chưa có XP */
  me: LeaderboardEntry | null;
}
