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

// ---------------------------------------------------------------------------
// Bản chép lời có mốc giờ: tự căn thời gian thay vì nhấn Space từng câu
// ---------------------------------------------------------------------------

/** 1 đoạn trong bản chép lời có mốc giờ (YouTube "Hiện bản chép lời", file SRT / VTT) */
export interface TimedSegment {
  start: number;
  /** Chỉ SRT / VTT có giờ kết thúc */
  end: number | null;
  text: string;
}

const CLOCK = String.raw`(?:\d{1,2}:)?\d{1,2}:\d{2}(?:[.,]\d{1,3})?`;
const RANGE_LINE = new RegExp(String.raw`^(${CLOCK})\s*-->\s*(${CLOCK})`);
const STAMP_LINE = new RegExp(String.raw`^[([]?(${CLOCK})[)\]]?(?:\s+(.*))?$`);
/** Dòng mô tả độ dài cho trình đọc màn hình mà YouTube chép kèm, vd "1 phút, 5 giây" / "5 seconds" */
const DURATION_LINE = /^(\d+\s*(giờ|phút|giây|hours?|minutes?|seconds?)[,\s]*)+$/i;

function parseClock(value: string): number {
  const [whole, fraction] = value.replace(",", ".").split(".");
  const seconds = whole.split(":").reduce((total, part) => total * 60 + Number(part), 0);
  return fraction ? seconds + Number(`0.${fraction}`) : seconds;
}

/** Bỏ [Music], (laughs), ♪, dấu đổi người nói ">>" và thẻ định dạng của SRT / VTT */
function cleanCaption(text: string): string {
  return text
    .replace(/<[^>]+>|\{[^}]*\}/g, " ")
    .replace(/\[[^\]]*\]|\([^)]*\)/g, " ")
    .replace(/[♪♫]|>>|&gt;&gt;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Đọc bản chép lời có mốc giờ: chép từ YouTube (bấm "...thêm" dưới video → "Hiện bản chép lời", chọn hết rồi chép),
 * hoặc nội dung file .srt / .vtt. Trả về [] khi văn bản không có mốc giờ.
 */
export function parseTimedTranscript(text: string): TimedSegment[] {
  const segments: TimedSegment[] = [];
  let current: TimedSegment | null = null;

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    // Dòng trống, tiêu đề WEBVTT, số thứ tự của SRT
    if (!line || line.startsWith("WEBVTT") || /^\d+$/.test(line) || DURATION_LINE.test(line)) continue;

    const range = RANGE_LINE.exec(line);
    const stamp = range ? null : STAMP_LINE.exec(line);
    if (range || stamp) {
      current = range
        ? { start: parseClock(range[1]), end: parseClock(range[2]), text: "" }
        : { start: parseClock(stamp![1]), end: null, text: stamp![2] ?? "" };
      segments.push(current);
    } else if (current) {
      current.text = current.text ? `${current.text} ${line}` : line;
    }
  }

  return segments
    .map((segment) => ({ ...segment, text: cleanCaption(segment.text) }))
    .filter((segment) => segment.text.length > 0)
    .sort((a, b) => a.start - b.start);
}

/** Mỗi đoạn có mốc giờ thành 1 câu (khi chưa có lời thoại chuẩn để căn theo) */
export function segmentsToLines(segments: TimedSegment[]): SubtitleLine[] {
  return segments.map((segment) => ({ speaker: "", en: segment.text, vi: "", start: segment.start, end: segment.end }));
}

/** Từ để so khớp: chữ thường, bỏ dấu nháy ("it's" -> "its") */
function matchWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/['’`]/g, "")
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
}

/** Từ quá phổ biến: vẫn so khớp nhưng ít trọng số, để câu không "khớp nhầm" chỉ nhờ vài từ như "the", "you" */
const COMMON_WORDS = new Set(
  "a an the i you he she it we they me him her us them my your is am are was were be to of in on at for with and or but so not no yes oh ok okay hey what that this do dont im its".split(
    " ",
  ),
);

const wordWeight = (word: string) => (COMMON_WORDS.has(word) ? 1 : 3);

/** Câu được coi là có trong clip khi phần khớp chiếm ít nhất tỉ lệ này (theo trọng số từ) */
const MIN_MATCH_RATIO = 0.5;
/** Giới hạn kích thước bảng so khớp (số từ lời thoại × số từ bản chép lời) */
const MAX_ALIGN_CELLS = 25_000_000;

interface TimedWord {
  word: string;
  /** Vị trí đoạn chứa từ trong mảng segments */
  segment: number;
}

/** Thời gian nói trung bình của 1 từ (giây) */
const SECONDS_PER_WORD = 0.35;
/** Chỗ đổi câu (thường là đổi người nói) trong 1 đoạn được tính như khoảng nghỉ dài bằng chừng này từ */
const LINE_PAUSE_WORDS = 2.5;
/** Mốc giờ chỉ ghi tới giây (YouTube): lời thật nằm đâu đó trong giây đó, cộng thêm để bớt lệch sớm */
const WHOLE_SECOND_OFFSET = 0.3;

/**
 * Giờ ước lượng của từng từ trong bản chép lời. Mỗi đoạn kéo dài tới khi đoạn sau bắt đầu (không quá xa so với số từ);
 * trong đoạn, mỗi từ chiếm 1 phần như nhau và chỗ đổi sang câu khác (theo kết quả so khớp) có thêm 1 khoảng nghỉ.
 */
function estimateWordTimes(segments: TimedSegment[], timed: TimedWord[], matchedLine: Int32Array): number[] {
  // Câu của từng từ: từ không khớp tính vào câu của từ khớp gần nhất phía trước
  const lineOf: number[] = [];
  let lastLine = -1;
  for (let j = 0; j < timed.length; j++) {
    if (matchedLine[j] !== -1) lastLine = matchedLine[j];
    lineOf.push(lastLine);
  }

  const times = new Array<number>(timed.length).fill(0);
  let j = 0;
  segments.forEach((segment, index) => {
    const from = j;
    while (j < timed.length && timed[j].segment === index) j++;
    if (j === from) return;

    const offsets: number[] = [];
    let units = 0;
    for (let k = from; k < j; k++) {
      if (k > from && lineOf[k] !== lineOf[k - 1]) units += LINE_PAUSE_WORDS;
      offsets.push(units);
      units += 1;
    }
    const start = segment.start + (segment.end === null && Number.isInteger(segment.start) ? WHOLE_SECOND_OFFSET : 0);
    const next = segments[index + 1]?.start ?? Number.POSITIVE_INFINITY;
    const end = segment.end ?? Math.min(next, start + units * SECONDS_PER_WORD * 1.5 + 1);
    const span = Math.max(0.1, end - start);
    offsets.forEach((offset, k) => {
      times[from + k] = start + (span * offset) / units;
    });
  });
  return times;
}

export interface AlignResult {
  lines: SubtitleLine[];
  /** Câu khớp được với bản chép lời */
  matched: number;
  /** Câu nằm giữa 2 câu khớp nhưng không tự khớp được: giờ được ước lượng, nên nghe lại */
  estimated: number;
  /** Câu nằm ngoài đoạn clip (trước câu khớp đầu tiên / sau câu khớp cuối cùng): bỏ giờ */
  outside: number;
}

/**
 * Gán giờ bắt đầu cho từng câu lời thoại chuẩn (vd chép từ Wiki, có người nói, đúng chính tả) theo bản chép lời
 * có mốc giờ (vd phụ đề tự động của YouTube: đúng giờ nhưng hay sai chữ, không có dấu câu).
 * So khớp 2 chuỗi từ bằng dãy con chung dài nhất có trọng số, rồi ước lượng giờ của từng từ trong đoạn
 * (xem estimateWordTimes). Lời thoại có thể là cả tập phim: câu ngoài đoạn clip sẽ không có giờ.
 */
export function alignToTranscript(lines: SubtitleLine[], segments: TimedSegment[]): AlignResult | null {
  // Bản chép lời: từng từ kèm đoạn chứa nó
  const timed: TimedWord[] = [];
  segments.forEach((segment, index) => {
    for (const word of matchWords(segment.text)) timed.push({ word, segment: index });
  });

  // Lời thoại: từng từ kèm câu chứa nó
  const script: Array<{ word: string; line: number }> = [];
  lines.forEach((line, index) => {
    for (const word of matchWords(line.en)) script.push({ word, line: index });
  });

  const n = script.length;
  const m = timed.length;
  if (n === 0 || m === 0 || (n + 1) * (m + 1) > MAX_ALIGN_CELLS) return null;

  // Bảng quy hoạch động: score[i][j] = tổng trọng số khớp tốt nhất của i từ lời thoại đầu và j từ bản chép lời đầu
  const width = m + 1;
  const score = new Int32Array((n + 1) * width);
  for (let i = 1; i <= n; i++) {
    const word = script[i - 1].word;
    const weight = wordWeight(word);
    for (let j = 1; j <= m; j++) {
      const skip = Math.max(score[(i - 1) * width + j], score[i * width + j - 1]);
      const take = word === timed[j - 1].word ? score[(i - 1) * width + j - 1] + weight : 0;
      score[i * width + j] = Math.max(skip, take);
    }
  }

  // Lần ngược để lấy các cặp từ khớp
  const matchedWeight = new Array<number>(lines.length).fill(0);
  const matchedLine = new Int32Array(m).fill(-1);
  /** Từ khớp đầu tiên của mỗi câu: vị trí trong bản chép lời và trong lời thoại */
  const firstMatch = new Array<{ timedIndex: number; scriptIndex: number } | null>(lines.length).fill(null);
  for (let i = n, j = m; i > 0 && j > 0; ) {
    const current = score[i * width + j];
    const { line, word } = script[i - 1];
    if (word === timed[j - 1].word && current === score[(i - 1) * width + j - 1] + wordWeight(word)) {
      matchedWeight[line] += wordWeight(word);
      matchedLine[j - 1] = line;
      firstMatch[line] = { timedIndex: j - 1, scriptIndex: i - 1 }; // đi ngược nên giá trị cuối cùng là từ khớp đầu tiên
      i--;
      j--;
    } else if (current === score[(i - 1) * width + j]) {
      i--;
    } else {
      j--;
    }
  }

  const times = estimateWordTimes(segments, timed, matchedLine);
  const firstScriptIndex = new Map<number, number>();
  script.forEach(({ line }, index) => {
    if (!firstScriptIndex.has(line)) firstScriptIndex.set(line, index);
  });

  let previousStart = 0;
  const starts: Array<number | null> = lines.map((line, index) => {
    const total = matchWords(line.en).reduce((sum, word) => sum + wordWeight(word), 0);
    const match = firstMatch[index];
    if (!match || total === 0 || matchedWeight[index] / total < MIN_MATCH_RATIO) return null;
    // Vài từ đầu câu không khớp (nghe nhầm / bị bỏ trong bản chép lời): lùi giờ lại tương ứng, không trước câu trước
    const skippedWords = match.scriptIndex - (firstScriptIndex.get(index) ?? match.scriptIndex);
    const start = Math.max(previousStart, times[match.timedIndex] - skippedWords * SECONDS_PER_WORD);
    previousStart = start;
    return start;
  });

  const matchedIndexes = starts.flatMap((start, index) => (start === null ? [] : [index]));
  if (matchedIndexes.length === 0) return { lines, matched: 0, estimated: 0, outside: lines.length };

  // Câu nằm giữa 2 câu khớp chắc chắn có trong clip: chia đều khoảng giờ giữa 2 câu đó
  let estimated = 0;
  for (let k = 0; k < matchedIndexes.length - 1; k++) {
    const from = matchedIndexes[k];
    const to = matchedIndexes[k + 1];
    for (let index = from + 1; index < to; index++) {
      starts[index] = starts[from]! + ((starts[to]! - starts[from]!) * (index - from)) / (to - from);
      estimated++;
    }
  }

  const first = matchedIndexes[0];
  const last = matchedIndexes[matchedIndexes.length - 1];
  return {
    lines: lines.map((line, index) => {
      const start = starts[index];
      return { ...line, start: start === null ? null : Math.round(start * 100) / 100, end: null };
    }),
    matched: matchedIndexes.length,
    estimated,
    outside: first + (lines.length - 1 - last),
  };
}
