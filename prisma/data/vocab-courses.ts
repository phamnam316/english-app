/**
 * Khóa "Từ vựng A1/A2 theo chủ đề", tạo tự động từ bộ từ prisma/data/vocab/a1-a2.json
 * (xem scripts/vocab/build-vocab.ts).
 *
 * - Mỗi chủ đề là 1 chương; chủ đề quá ít từ được gộp vào chủ đề liền trước.
 * - Mỗi bài khoảng 10 từ, chia đều trong chương; tên bài là 3 từ đầu tiên.
 * - Bài tập sinh cố định theo nội dung (seed lại không đổi): 3 câu Anh → Việt, 2 câu Việt → Anh,
 *   2 câu nghe, 1 câu điền từ vào câu ví dụ, 1 câu xếp thẻ thành câu ví dụ.
 */
import fs from "node:fs";
import path from "node:path";

import { fill, listen, mc, order, seededShuffle, type SeedCourse, type SeedExercise, type SeedLesson } from "./types";
import { VOCAB_UNITS } from "./vocab/units";

type CefrLevel = "A1" | "A2";

interface BankWord {
  word: string;
  level: CefrLevel;
  pos: string[];
  unit: string;
  phonetic: string;
  meaning: string;
  example: string;
  exampleVi: string;
  exampleSource: string;
}

const BANK: BankWord[] = JSON.parse(fs.readFileSync(path.join(__dirname, "vocab", "a1-a2.json"), "utf8"));

const LESSON_SIZE = 10;
/** Chủ đề ít hơn số từ này thì gộp vào chủ đề trước */
const MIN_UNIT_SIZE = 6;

const CEFR_BY_WORD = new Map(BANK.map((w) => [w.word.toLowerCase(), w.level]));

/** Cấp độ CEFR của 1 từ trong bộ A1–A2 (null nếu không có trong bộ) */
export function cefrOf(word: string): string | null {
  return CEFR_BY_WORD.get(word.toLowerCase()) ?? null;
}

/** Chia mảng thành các nhóm gần bằng nhau, mỗi nhóm tối đa `size` phần tử */
function splitEvenly<T>(items: T[], size: number): T[][] {
  const count = Math.max(1, Math.ceil(items.length / size));
  const base = Math.floor(items.length / count);
  const extra = items.length % count;
  const groups: T[][] = [];
  let start = 0;
  for (let i = 0; i < count; i++) {
    const length = base + (i < extra ? 1 : 0);
    groups.push(items.slice(start, start + length));
    start += length;
  }
  return groups;
}

function groupByUnit(words: BankWord[]): Array<{ title: string; words: BankWord[] }> {
  const groups: Array<{ title: string; words: BankWord[] }> = [];
  for (const unit of VOCAB_UNITS) {
    const unitWords = words.filter((w) => w.unit === unit.key);
    if (unitWords.length === 0) continue;
    const previous = groups.at(-1);
    if (unitWords.length < MIN_UNIT_SIZE && previous) {
      previous.title = `${previous.title} · ${unit.title}`;
      previous.words.push(...unitWords);
    } else {
      groups.push({ title: unit.title, words: [...unitWords] });
    }
  }
  return groups;
}

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Vị trí từ trong câu ví dụ (đúng nguyên từ, không phân biệt hoa thường); null nếu không có hoặc xuất hiện > 1 lần */
function findWordInSentence(word: string, sentence: string): { start: number; text: string } | null {
  const pattern = new RegExp(`(?<![\\p{L}'’-])${escapeRegExp(word)}(?![\\p{L}'’-])`, "giu");
  const matches = [...sentence.matchAll(pattern)];
  if (matches.length !== 1) return null;
  return { start: matches[0].index ?? 0, text: matches[0][0] };
}

/** Câu ví dụ dùng được cho bài xếp thẻ: 3–8 từ, không có dấu câu ở giữa câu */
function orderSentence(example: string): string | null {
  const sentence = example.replace(/[.!?]+$/, "").trim();
  if (/[^\p{L}\p{N}' -]/u.test(sentence)) return null;
  const words = sentence.split(" ");
  if (words.length < 3 || words.length > 8) return null;
  return sentence;
}

/** Từ không hợp với bài nghe/điền/xếp câu: dạng viết tắt như 'm, 're, a.m. */
const isPlainWord = (word: string) => !/['.]/.test(word);

function pickDistractors<T>(items: T[], seed: string, count: number, accept: (item: T) => boolean): T[] {
  return seededShuffle(items, seed).filter(accept).slice(0, count);
}

function lessonExercises(words: BankWord[], seed: string): SeedExercise[] {
  const shuffled = seededShuffle(words, seed);
  const used = new Set<BankWord>();
  const take = (accept: (w: BankWord) => boolean = () => true) => {
    const word = shuffled.find((w) => !used.has(w) && accept(w));
    if (word) used.add(word);
    return word;
  };
  const others = (word: BankWord) => words.filter((w) => w !== word);

  const meaningQuestion = (word: BankWord) => {
    const wrong = pickDistractors(others(word), `${seed}:${word.word}:vi`, 3, (w) => w.meaning !== word.meaning);
    return mc(
      `Nghĩa của "${word.word}" là gì?`,
      [word.meaning, ...wrong.map((w) => w.meaning)],
      `${word.word} ${word.phonetic}: ${word.meaning}.`,
    );
  };
  const wordQuestion = (word: BankWord) => {
    const wrong = pickDistractors(
      others(word),
      `${seed}:${word.word}:en`,
      3,
      (w) => w.meaning !== word.meaning && w.word.toLowerCase() !== word.word.toLowerCase(),
    );
    return mc(
      `Từ nào có nghĩa là "${word.meaning}"?`,
      [word.word, ...wrong.map((w) => w.word)],
      `${word.word} ${word.phonetic}: ${word.meaning}.`,
    );
  };
  const listenQuestion = (word: BankWord) => {
    const wrong = pickDistractors(
      others(word),
      `${seed}:${word.word}:listen`,
      3,
      (w) => w.word.toLowerCase() !== word.word.toLowerCase(),
    );
    return listen(word.word, [word.word, ...wrong.map((w) => w.word)], "Nghe và chọn từ bạn nghe được", `${word.word}: ${word.meaning}.`);
  };

  const exercises: SeedExercise[] = [];
  for (let i = 0; i < 3; i++) {
    const word = take();
    if (word) exercises.push(meaningQuestion(word));
  }
  for (let i = 0; i < 2; i++) {
    const word = take();
    if (word) exercises.push(wordQuestion(word));
  }
  for (let i = 0; i < 2; i++) {
    const word = take((w) => isPlainWord(w.word));
    if (word) exercises.push(listenQuestion(word));
  }

  // Điền từ vào câu ví dụ (ưu tiên từ chưa có câu hỏi)
  const fillWord =
    take((w) => isPlainWord(w.word) && findWordInSentence(w.word, w.example) !== null) ??
    shuffled.find((w) => isPlainWord(w.word) && findWordInSentence(w.word, w.example) !== null);
  if (fillWord) {
    const match = findWordInSentence(fillWord.word, fillWord.example)!;
    const blanked = `${fillWord.example.slice(0, match.start)}___${fillWord.example.slice(match.start + match.text.length)}`;
    exercises.push(fill(`${blanked} (${fillWord.meaning})`, match.text, `${fillWord.example} — ${fillWord.exampleVi}`));
  } else {
    const word = take();
    if (word) exercises.push(meaningQuestion(word));
  }

  // Xếp thẻ thành câu ví dụ, thêm 1 thẻ gây nhiễu là từ khác trong bài
  const orderWord =
    take((w) => orderSentence(w.example) !== null) ?? shuffled.find((w) => w !== fillWord && orderSentence(w.example) !== null);
  if (orderWord) {
    const sentence = orderSentence(orderWord.example)!;
    const tokens = new Set(sentence.toLowerCase().split(" "));
    const [extra] = pickDistractors(
      others(orderWord),
      `${seed}:${orderWord.word}:order`,
      1,
      (w) => isPlainWord(w.word) && !w.word.includes(" ") && !tokens.has(w.word.toLowerCase()),
    );
    exercises.push(order(orderWord.exampleVi, sentence, extra ? [extra.word] : []));
  } else {
    const word = take();
    if (word) exercises.push(wordQuestion(word));
  }

  return exercises;
}

function buildLesson(words: BankWord[], level: CefrLevel): SeedLesson {
  const title = words
    .slice(0, 3)
    .map((w) => w.word)
    .join(" · ");
  return {
    title,
    vocab: words.map((w) => ({
      word: w.word,
      phonetic: w.phonetic,
      meaning: w.meaning,
      example: w.example,
      exampleVi: w.exampleVi,
      cefr: w.level,
    })),
    exercises: lessonExercises(words, `${level}:${title}`),
  };
}

function buildVocabCourse(level: CefrLevel, description: string): SeedCourse {
  const words = BANK.filter((w) => w.level === level);
  return {
    title: `Từ vựng ${level} theo chủ đề`,
    description,
    level: "BEGINNER",
    isPublished: true,
    units: groupByUnit(words).map((group) => ({
      title: group.title,
      lessons: splitEvenly(group.words, LESSON_SIZE).map((lessonWords) => buildLesson(lessonWords, level)),
    })),
  };
}

const countOf = (level: CefrLevel) => BANK.filter((w) => w.level === level).length;

export const VOCAB_A1 = buildVocabCourse(
  "A1",
  `${countOf("A1")} từ hay dùng nhất cho người mới bắt đầu: đồ ăn, gia đình, đi lại… Mỗi bài 10 từ, có người đọc mẫu và câu ví dụ có dịch.`,
);

export const VOCAB_A2 = buildVocabCourse(
  "A2",
  `${countOf("A2")} từ tiếp theo, học sau khi xong A1: mua sắm, công việc, sức khỏe… Mỗi bài 10 từ, có người đọc mẫu và câu ví dụ có dịch.`,
);
