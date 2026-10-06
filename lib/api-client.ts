/**
 * Client gọi API cho frontend: type-safe, lỗi luôn được chuẩn hóa thành ApiClientError
 * với thông báo tiếng Việt lấy từ server ({ error: { code, message, details } }).
 */
import type { ApiErrorBody, ApiErrorDetail } from "@/lib/api-error";
import type {
  CheckAnswerRequest,
  CheckAnswerResponse,
  CourseListResponse,
  HomeResponse,
  LeaderboardPeriod,
  LeaderboardResponse,
  LessonDetailResponse,
  PracticeDataResponse,
  PracticeResultRequest,
  PracticeResultResponse,
  RegisterResponse,
  SubmitLessonRequest,
  SubmitLessonResponse,
  TextToSpeechRequest,
  WordRatingRequest,
  WordRatingResponse,
} from "@/types/api";

export class ApiClientError extends Error {
  constructor(
    /** HTTP status; 0 = không kết nối được máy chủ */
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details: ApiErrorDetail[] = [],
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

const FALLBACK_MESSAGES: Record<number, string> = {
  0: "Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.",
  401: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
  404: "Không tìm thấy dữ liệu.",
  429: "Bạn thao tác quá nhanh. Thử lại sau ít giây.",
};

function fallbackMessage(status: number): string {
  if (FALLBACK_MESSAGES[status]) return FALLBACK_MESSAGES[status];
  return status >= 500
    ? "Máy chủ đang gặp sự cố. Thử lại sau ít phút."
    : "Yêu cầu không thành công. Vui lòng thử lại.";
}

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

export function toApiClientError(error: unknown): ApiClientError {
  if (error instanceof ApiClientError) return error;
  return new ApiClientError(0, "UNKNOWN", error instanceof Error ? error.message : "Đã có lỗi xảy ra.");
}

async function send(path: string, init: RequestInit = {}): Promise<Response> {
  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      headers: {
        ...(typeof init.body === "string" ? { "Content-Type": "application/json" } : {}),
        ...init.headers,
      },
    });
  } catch (error) {
    // Bị hủy chủ động (rời trang, đổi bài) không phải lỗi -> ném lại nguyên trạng để nơi gọi bỏ qua
    if (isAbortError(error)) throw error;
    throw new ApiClientError(0, "NETWORK_ERROR", fallbackMessage(0));
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ApiErrorBody | null;
    throw new ApiClientError(
      response.status,
      body?.error?.code ?? "UNKNOWN",
      body?.error?.message ?? fallbackMessage(response.status),
      body?.error?.details ?? [],
    );
  }
  return response;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await send(path, init);
  return (await response.json()) as T;
}

function postJson(body: unknown, signal?: AbortSignal): RequestInit {
  return { method: "POST", body: JSON.stringify(body), signal };
}

const lessonPath = (lessonId: string) => `/api/lessons/${encodeURIComponent(lessonId)}`;

export const api = {
  getCourses: (signal?: AbortSignal) => request<CourseListResponse>("/api/courses", { signal }),

  getHome: (signal?: AbortSignal) => request<HomeResponse>("/api/home", { signal }),

  getLesson: (lessonId: string, signal?: AbortSignal) =>
    request<LessonDetailResponse>(lessonPath(lessonId), { signal }),

  checkAnswer: (lessonId: string, body: CheckAnswerRequest) =>
    request<CheckAnswerResponse>(`${lessonPath(lessonId)}/check`, postJson(body)),

  submitLesson: (lessonId: string, body: SubmitLessonRequest) =>
    request<SubmitLessonResponse>(`${lessonPath(lessonId)}/submit`, postJson(body)),

  getPractice: (signal?: AbortSignal) => request<PracticeDataResponse>("/api/practice", { signal }),

  submitPractice: (body: PracticeResultRequest) => request<PracticeResultResponse>("/api/practice", postJson(body)),

  rateWord: (body: WordRatingRequest) =>
    request<WordRatingResponse>("/api/words/rating", { method: "PUT", body: JSON.stringify(body) }),

  getLeaderboard: (period: LeaderboardPeriod, signal?: AbortSignal) =>
    request<LeaderboardResponse>(`/api/leaderboard?period=${period}`, { signal }),

  register: (body: { name?: string; email: string; password: string }) =>
    request<RegisterResponse>("/api/auth/register", postJson(body)),

  /** Trả về file mp3 (Blob) */
  textToSpeech: async (body: TextToSpeechRequest, signal?: AbortSignal): Promise<Blob> => {
    const response = await send("/api/ai/tts", postJson(body, signal));
    return response.blob();
  },
};
