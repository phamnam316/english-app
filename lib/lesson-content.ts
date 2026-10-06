/**
 * Kiểm tra các cột Json của bài học (ghi chú ngữ pháp, đoạn hội thoại tình huống) trước khi trả cho client:
 * dữ liệu sai dạng thì coi như bài không có phần đó, không làm hỏng cả trang.
 */
import type { GrammarNote, LessonStory } from "@/types/api";

const isString = (value: unknown): value is string => typeof value === "string";
const isObject = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object";

export function toGrammarNote(value: unknown): GrammarNote | null {
  if (!isObject(value) || !isString(value.title) || !isString(value.intro)) return null;
  const patterns = Array.isArray(value.patterns) ? value.patterns.filter(isString) : [];
  const examples = Array.isArray(value.examples)
    ? value.examples.filter((e): e is { en: string; vi: string } => isObject(e) && isString(e.en) && isString(e.vi))
    : [];
  const avoid = isObject(value.avoid) ? value.avoid : undefined;
  return {
    title: value.title,
    intro: value.intro,
    patterns,
    examples: examples.map(({ en, vi }) => ({ en, vi })),
    avoid: avoid && isString(avoid.wrong) && isString(avoid.fix) ? { wrong: avoid.wrong, fix: avoid.fix } : undefined,
  };
}

export function toLessonStory(value: unknown): LessonStory | null {
  if (!isObject(value) || !isString(value.title) || !isString(value.main) || !Array.isArray(value.lines)) return null;
  const lines = value.lines.filter(
    (line): line is LessonStory["lines"][number] =>
      isObject(line) && isString(line.speaker) && isString(line.en) && isString(line.vi),
  );
  if (lines.length === 0) return null;
  return {
    title: value.title,
    intro: isString(value.intro) ? value.intro : "",
    main: value.main,
    lines: lines.map(({ speaker, en, vi }) => ({ speaker, en, vi })),
  };
}
