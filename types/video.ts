/**
 * Kiểu dữ liệu của trang Xem phim (video YouTube nhúng + phụ đề song ngữ).
 * Danh sách clip nằm trong lib/videos/catalog.ts; phụ đề lưu ở bảng VideoSubtitle.
 */

/** 1 câu thoại. Thời gian tính bằng giây theo video YouTube */
export interface SubtitleLine {
  /** Người nói (Grizz, Panda...); "" nếu không ghi */
  speaker: string;
  en: string;
  /** Bản dịch tiếng Việt; "" nếu chưa dịch */
  vi: string;
  /** Lúc câu bắt đầu; null = chưa căn thời gian (người xem không thấy câu này) */
  start: number | null;
  /** Lúc câu kết thúc; null = tự tính tới câu sau (xem toCues trong lib/videos/subtitles.ts) */
  end: number | null;
}

export interface VideoClipSummary {
  slug: string;
  youtubeId: string;
  /** Tiêu đề tiếng Việt */
  title: string;
  /** Tiêu đề gốc trên YouTube */
  originalTitle: string;
  series: string;
  /** Tập phim gốc, vd "Mùa 1, tập 7: Burrito" */
  episode: string;
  summary: string;
  durationSec: number;
  /** Số câu đã căn thời gian (người xem thấy được) */
  cueCount: number;
}

export interface VideoClipDetail extends VideoClipSummary {
  /** Chỉ dùng 1 đoạn của video dài: phát từ giây startSec tới endSec */
  startSec: number | null;
  endSec: number | null;
  lines: SubtitleLine[];
  /** Trang lời thoại của tập phim trên We Bare Bears Wiki (nguồn để chép lời khi căn phụ đề) */
  transcriptUrl: string;
  /** Lần lưu phụ đề gần nhất (ISO); null = chưa có phụ đề */
  updatedAt: string | null;
}

export interface VideoListResponse {
  clips: VideoClipSummary[];
  /** ADMIN: được căn và lưu phụ đề */
  canEdit: boolean;
}

export interface VideoDetailResponse {
  clip: VideoClipDetail;
  canEdit: boolean;
}

export interface SaveSubtitlesRequest {
  lines: SubtitleLine[];
}

export interface SaveSubtitlesResponse {
  lines: SubtitleLine[];
  updatedAt: string;
}

export interface TranslateLinesRequest {
  lines: string[];
}

export interface TranslateLinesResponse {
  /** Cùng độ dài và thứ tự với lines gửi lên */
  translations: string[];
}

/** Nghĩa của 1 từ lấy từ bộ từ vựng của app (bảng Vocabulary) */
export interface WordLookupEntry {
  word: string;
  phonetic: string | null;
  meaning: string;
  exampleSentence: string | null;
  exampleTranslation: string | null;
}

export interface WordLookupResponse {
  /** null: từ chưa có trong bộ từ vựng của app */
  entry: WordLookupEntry | null;
}
