import type { SubtitleLine } from "@/types/video";

/** Câu không có giờ kết thúc riêng hiện tối đa chừng này giây (tránh câu cũ đứng mãi trong đoạn không thoại) */
export const MAX_CUE_SECONDS = 7;

/** Câu dài hơn chừng này ký tự được tách theo dấu câu khi nhập lời thoại, cho dễ đọc khi xem */
const MAX_LINE_CHARS = 90;

/** Câu đã căn thời gian, đủ giờ bắt đầu và kết thúc */
export interface SubtitleCue extends SubtitleLine {
  start: number;
  end: number;
  /** Vị trí của câu trong mảng lines gốc (trang căn phụ đề dùng để tô dòng đang phát) */
  lineIndex: number;
}

/**
 * Các câu người xem thấy: chỉ câu đã có giờ bắt đầu, xếp theo thời gian.
 * Câu không có giờ kết thúc: kết thúc khi câu sau bắt đầu, tối đa MAX_CUE_SECONDS và không quá cuối clip.
 */
export function toCues(lines: SubtitleLine[], clipEndSec?: number | null): SubtitleCue[] {
  const timed = lines
    .map((line, lineIndex) => ({ ...line, lineIndex }))
    .filter((line): line is SubtitleLine & { start: number; lineIndex: number } => line.start !== null)
    .sort((a, b) => a.start - b.start);

  return timed.map((line, i) => {
    const nextStart = timed[i + 1]?.start ?? Number.POSITIVE_INFINITY;
    const autoEnd = Math.min(nextStart, line.start + MAX_CUE_SECONDS, clipEndSec ?? Number.POSITIVE_INFINITY);
    const end = line.end !== null && line.end > line.start ? Math.min(line.end, nextStart) : autoEnd;
    return { ...line, end: Math.max(end, line.start + 0.2) };
  });
}

export function countCues(lines: SubtitleLine[]): number {
  return lines.filter((line) => line.start !== null).length;
}

/** Câu đang được nói tại thời điểm `time`; -1 khi đang ở khoảng lặng */
export function findActiveCue(cues: SubtitleCue[], time: number): number {
  const index = findLastStartedCue(cues, time);
  return index !== -1 && time < cues[index].end ? index : -1;
}

/** Câu gần nhất đã bắt đầu (kể cả khi đã nói xong); -1 khi chưa tới câu đầu tiên. Dùng cho nút câu trước / câu sau */
export function findLastStartedCue(cues: SubtitleCue[], time: number): number {
  let low = 0;
  let high = cues.length - 1;
  let found = -1;
  while (low <= high) {
    const mid = (low + high) >> 1;
    if (cues[mid].start <= time) {
      found = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  return found;
}

/** 75 -> "1:15" */
export function formatClock(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

/** 75.36 -> "1:15.3" (trang căn phụ đề cần chính xác tới 0,1 giây) */
export function formatClockPrecise(seconds: number): string {
  const safe = Math.max(0, seconds);
  const whole = Math.floor(safe);
  return `${formatClock(whole)}.${Math.floor((safe - whole) * 10)}`;
}

export interface WordToken {
  text: string;
  /** Từ để tra nghĩa (đã bỏ dấu câu ở hai đầu); null với khoảng trắng / dấu câu đứng riêng */
  word: string | null;
}

/** Tách câu thành các từ bấm được, giữ nguyên khoảng trắng và dấu câu để hiển thị y như câu gốc */
export function tokenizeWords(sentence: string): WordToken[] {
  return sentence
    .split(/(\s+)/)
    .filter((part) => part.length > 0)
    .map((part) => {
      const word = part.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");
      return { text: part, word: word.length > 0 ? word : null };
    });
}

/** Tách câu dài theo dấu câu thành các đoạn ngắn hơn MAX_LINE_CHARS (đoạn chỉ có 1 câu dài vẫn giữ nguyên) */
function splitLongLine(text: string): string[] {
  if (text.length <= MAX_LINE_CHARS) return [text];
  const sentences = text.split(/(?<=[.!?…])\s+/);
  const pieces: string[] = [];
  for (const sentence of sentences) {
    const last = pieces.at(-1);
    if (last !== undefined && last.length + 1 + sentence.length <= MAX_LINE_CHARS) {
      pieces[pieces.length - 1] = `${last} ${sentence}`;
    } else {
      pieces.push(sentence);
    }
  }
  return pieces;
}

const SPEAKER_PATTERN = /^([A-Z][\p{L}\p{N} .'&-]{0,30}):\s+(.+)$/u;

/**
 * Đọc lời thoại dán vào trang căn phụ đề (vd chép từ trang Transcript của We Bare Bears Wiki).
 * Mỗi dòng 1 câu, dạng "Grizzly: Hey guys!" hoặc chỉ câu thoại; muốn kèm bản dịch thì viết "câu tiếng Anh | bản dịch".
 * Bỏ phần mô tả hành động trong [ngoặc vuông] và các dòng chỉ có mô tả.
 */
export function parseTranscript(text: string): SubtitleLine[] {
  const lines: SubtitleLine[] = [];

  for (const raw of text.split(/\r?\n/)) {
    const cleaned = raw
      .replace(/\[[^\]]*\]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (!cleaned) continue;

    const [enPart, ...viParts] = cleaned.split(" | ");
    const vi = viParts.join(" | ").trim();
    const match = SPEAKER_PATTERN.exec(enPart);
    const speaker = match ? match[1].trim() : "";
    const en = (match ? match[2] : enPart).trim();
    if (!en) continue;

    const pieces = vi ? [en] : splitLongLine(en);
    for (const piece of pieces) lines.push({ speaker, en: piece, vi, start: null, end: null });
  }

  return lines;
}
