/**
 * Gộp các nguồn đã tải (fetch-sources.ts) thành bộ từ vựng A1–A2 cho app:
 *   npx tsx scripts/vocab/build-vocab.ts
 *
 * Kết quả: prisma/data/vocab/a1-a2.json (đưa lên git, seed đọc file này).
 * Chỗ nào dữ liệu nguồn thiếu hoặc chưa hợp với người mới học thì sửa trong prisma/data/vocab/overrides/*.json
 * rồi chạy lại script (không sửa tay file a1-a2.json).
 */
import fs from "node:fs";
import path from "node:path";

import { VOCAB_UNITS as UNITS } from "../../prisma/data/vocab/units";
import {
  readCefrJ,
  readEnglishSentences,
  readTatoebaPairs,
  wiktionaryCacheFile,
  wordsOf,
  type Level,
  type SentencePair,
} from "./sources";

const DATA_DIR = path.join(__dirname, "../../prisma/data/vocab");
const OUT_FILE = path.join(DATA_DIR, "a1-a2.json");
const OVERRIDES_DIR = path.join(DATA_DIR, "overrides");

function unitOf(pos: string[], topics: string[]): string {
  for (const topic of topics) {
    const unit = UNITS.find((u) => u.topics?.includes(topic));
    if (unit) return unit.key;
  }
  const main = pos[0];
  if (main === "number") return "numbers";
  if (main === "noun") return "nouns";
  if (main === "adjective") return "adjectives";
  if (main === "adverb") return "adverbs";
  if (main === "verb") return "verbs";
  return "function";
}

// ---------------------------------------------------------------------------
// Wiktionary: phiên âm + nghĩa tiếng Việt
// ---------------------------------------------------------------------------

interface WiktEntry {
  word: string;
  pos: string;
  sounds?: Array<{ ipa?: string; tags?: string[] }>;
  translations?: Array<{ word?: string; code?: string; lang_code?: string; lang?: string; sense?: string }>;
}

/** Từ loại của CEFR-J -> từ loại của Wiktionary */
const POS_MAP: Record<string, string[]> = {
  noun: ["noun", "name"],
  verb: ["verb"],
  "be-verb": ["verb"],
  "do-verb": ["verb"],
  "have-verb": ["verb"],
  "modal auxiliary": ["verb"],
  adjective: ["adj"],
  adverb: ["adv"],
  preposition: ["prep"],
  pronoun: ["pron"],
  determiner: ["det", "article"],
  conjunction: ["conj"],
  number: ["num"],
  interjection: ["intj"],
  "infinitive-to": ["particle", "prep"],
};

function readWiktionary(word: string): WiktEntry[] {
  const file = wiktionaryCacheFile(word);
  if (!fs.existsSync(file)) return [];
  return fs
    .readFileSync(file, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as WiktEntry)
    .filter((entry) => entry.word === word);
}

/** Phiên âm dễ đọc cho người học: bỏ dấu tách âm tiết và ký hiệu hẹp của Wiktionary */
function cleanIpa(ipa: string): string {
  const core = ipa
    .trim()
    .replace(/^[/[]|[/\]]$/g, "")
    .replace(/[.‿ˑ]/g, "")
    .replace(/̯|͡|̃|̥|̚|˞|̩|̍|̆/g, "")
    // Ký hiệu quen thuộc của từ điển Anh (Oxford, Cambridge): /e/ thay cho /ɛ/
    .replace(/ɛ/g, "e")
    .replace(/ɹ/g, "r")
    .replace(/ɫ/g, "l")
    .replace(/ɾ/g, "t")
    .replace(/\s+/g, " ")
    .trim();
  return `/${core}/`;
}

const UK_TAGS = ["Received-Pronunciation", "UK", "British"];
const REGIONAL_TAGS = ["Northern-England", "Scotland", "Scottish", "Irish", "Ireland", "Southern", "Welsh", "Australia", "New-Zealand", "India"];

function pickIpa(entries: WiktEntry[], posList: string[]): string | null {
  const wanted = new Set(posList.flatMap((p) => POS_MAP[p] ?? []));
  const ordered = [...entries.filter((e) => wanted.has(e.pos)), ...entries.filter((e) => !wanted.has(e.pos))];
  const sounds = ordered.flatMap((e) => e.sounds ?? []).filter((s) => s.ipa && s.ipa.startsWith("/"));
  const score = (tags: string[] = []) => {
    if (tags.some((t) => REGIONAL_TAGS.includes(t))) return 3;
    if (tags.some((t) => UK_TAGS.includes(t))) return 0;
    if (tags.length === 0) return 1;
    return 2; // General-American...
  };
  const best = [...sounds].sort((a, b) => score(a.tags) - score(b.tags))[0];
  return best?.ipa ? cleanIpa(best.ipa) : null;
}

/** Chữ Việt hợp lệ: không có chữ Hán/Nôm, không có ký tự lạ */
const VIETNAMESE_TEXT = /^[\p{Script=Latin}\s\-'(),.…/]+$/u;

/** Dấu thanh kiểu cũ (hoá, thuỷ) -> kiểu mới (hóa, thủy) khi vần oa/oe/uy đứng cuối âm tiết */
const MODERN_TONE: Record<string, string> = {
  oà: "òa", oá: "óa", oả: "ỏa", oã: "õa", oạ: "ọa",
  oè: "òe", oé: "óe", oẻ: "ỏe", oẽ: "õe", oẹ: "ọe",
  uỳ: "ùy", uý: "úy", uỷ: "ủy", uỹ: "ũy", uỵ: "ụy",
};
const OLD_TONE = new RegExp(`(${Object.keys(MODERN_TONE).join("|")})(?!\\p{L})`, "gu");

/**
 * Chuẩn hóa chữ Việt lấy từ nguồn: dấu thanh kiểu mới, bỏ chữ "or" lọt từ Wiktionary ("anh or anh trai"),
 * bỏ dấu ngoặc lẻ ("tập)").
 */
export function normalizeVietnamese(text: string): string {
  let result = text.normalize("NFC").replace(OLD_TONE, (m) => MODERN_TONE[m]);
  result = result.replace(/\s+or\s+/g, ", ");
  if ((result.match(/\(/g) ?? []).length !== (result.match(/\)/g) ?? []).length) result = result.replace(/[()]/g, "");
  return result.replace(/\s+/g, " ").trim();
}

/**
 * Chuẩn hóa câu dịch: bỏ khoảng trắng trước dấu câu, viết hoa chữ đầu,
 * thêm dấu kết câu theo câu tiếng Anh nếu bản dịch bị thiếu.
 */
function tidySentence(vi: string, en: string): string {
  let result = vi
    .normalize("NFC")
    .replace(/­/g, "")
    .replace(/\s+([.,!?;:])/g, "$1")
    .replace(/([.!?])(?=\p{Lu})/gu, "$1 ")
    .replace(/\s+/g, " ")
    .trim();
  result = result.charAt(0).toLocaleUpperCase("vi") + result.slice(1);
  const enEnd = en.trim().match(/[.!?]$/)?.[0];
  if (enEnd && !/[.!?…"”)]$/.test(result)) result += enEnd;
  return result;
}

/**
 * Nghĩa tiếng Việt: lấy các bản dịch của nghĩa đầu tiên có tiếng Việt, theo từng từ loại
 * (tối đa 2 từ loại, mỗi từ loại tối đa 3 cách dịch), vd "book": "sách; đặt (chỗ)".
 */
function pickMeaning(entries: WiktEntry[], posList: string[]): string | null {
  const parts: string[] = [];
  const used = new Set<string>();
  const posOrder = [...new Set(posList.flatMap((p) => POS_MAP[p] ?? []))];
  for (const pos of posOrder) {
    const translations = entries
      .filter((e) => e.pos === pos)
      .flatMap((e) => e.translations ?? [])
      .filter((t) => (t.lang_code ?? t.code) === "vi" || t.lang === "Vietnamese")
      .filter((t) => t.word && VIETNAMESE_TEXT.test(t.word));
    if (translations.length === 0) continue;
    const firstSense = translations[0].sense;
    const words = [
      ...new Set(
        translations
          .filter((t) => t.sense === firstSense)
          .flatMap((t) => normalizeVietnamese(t.word!.trim().toLowerCase()).split(/\s*,\s*/)),
      ),
    ]
      .filter((w) => w && !used.has(w))
      .slice(0, 3);
    if (words.length === 0) continue;
    words.forEach((w) => used.add(w));
    parts.push(words.join(", "));
    if (parts.length === 2) break;
  }
  return parts.length ? parts.join("; ") : null;
}

// ---------------------------------------------------------------------------
// Tatoeba: câu ví dụ ngắn có chứa từ, kèm bản dịch tiếng Việt
// ---------------------------------------------------------------------------

/** Không lấy câu ví dụ có nội dung không hợp cho lớp học */
const BLOCKED = new Set([
  "kill", "killed", "kills", "killing", "die", "died", "dies", "dead", "death", "gun", "guns", "shoot", "shot",
  "murder", "murdered", "suicide", "drunk", "sex", "sexy", "naked", "fuck", "fucking", "shit", "damn", "hell",
  "bitch", "bastard", "idiot", "stupid", "blood", "bomb", "drug", "drugs", "rape", "weapon", "war", "hang",
  "hanged", "corpse", "prison", "jail", "divorce", "hate", "ugly", "fat", "beat", "slap",
]);

/** Bản dịch văn nói/địa phương (vẫn dùng được nếu không còn câu nào khác) */
// \b của JS không hiểu chữ có dấu tiếng Việt nên dùng (?<!\p{L}) / (?!\p{L}) để khớp trọn từ
const INFORMAL_VI = /(?<!\p{L})(tui|tao|mày|mầy|hổng|hông|nè|nha|bả|ổng)(?!\p{L})/iu;

/** Câu ví dụ đã tách từ. `vi` = null: câu tiếng Anh không có bản dịch trên Tatoeba */
interface IndexedSentence {
  id: string;
  en: string;
  vi: string | null;
  tokens: string[];
  joined: string;
  /** Tỉ lệ từ trong câu thuộc bộ A1–A2 (0–1): càng cao câu càng dễ với người mới học */
  coverage: number;
}

/** Quá khứ bất quy tắc và dạng rút gọn hay gặp trong câu đơn giản (coi như từ đã biết) */
const EXTRA_KNOWN = [
  "was", "were", "been", "went", "gone", "ate", "saw", "seen", "bought", "had", "took", "taken", "did", "made",
  "got", "came", "gave", "said", "told", "knew", "thought", "found", "felt", "heard", "met", "ran", "sat", "wrote",
  "written", "read", "left", "kept", "slept", "spent", "taught", "brought", "built", "broke", "chose", "drove", "drank",
  "fell", "flew", "forgot", "grew", "hid", "hurt", "lost", "paid", "put", "sang", "sold", "sent", "shut", "spoke",
  "stood", "swam", "threw", "understood", "woke", "wore", "won", "i'm", "it's", "don't", "doesn't", "didn't", "can't",
  "isn't", "aren't", "wasn't", "weren't", "won't", "i'll", "you're", "he's", "she's", "we're", "they're", "that's",
  "there's", "what's", "let's", "i've", "i'd", "tom", "mary", "john",
];

function buildKnownWords(headwords: string[]): Set<string> {
  const known = new Set(EXTRA_KNOWN);
  for (const headword of headwords) {
    for (const w of wordsOf(headword)) {
      known.add(w);
      for (const suffix of ["s", "es", "ed", "d", "ing", "er", "est", "ly"]) known.add(w + suffix);
      if (w.endsWith("e")) known.add(`${w.slice(0, -1)}ing`);
      if (w.endsWith("y")) {
        known.add(`${w.slice(0, -1)}ies`);
        known.add(`${w.slice(0, -1)}ied`);
      }
    }
  }
  return known;
}

function indexSentence(id: string, en: string, vi: string | null, known: Set<string>): IndexedSentence {
  const tokens = wordsOf(en);
  const knownCount = tokens.filter((t) => known.has(t) || /^\d+$/.test(t)).length;
  return { id, en, vi, tokens, joined: ` ${tokens.join(" ")} `, coverage: tokens.length ? knownCount / tokens.length : 0 };
}

function indexPairs(pairs: SentencePair[], known: Set<string>): IndexedSentence[] {
  return pairs
    .filter((p) => p.vi.length <= 120 && !/["“”]/.test(p.en))
    .map((p) => indexSentence(p.id, p.en, p.vi, known))
    .filter((p) => p.tokens.length >= 3 && p.tokens.length <= 10);
}

/**
 * Chọn câu ví dụ có chứa đúng từ (hoặc cụm từ). Ưu tiên: câu dễ (nhiều từ A1–A2), dài 5–8 từ,
 * chưa dùng cho từ khác, bản dịch không dùng văn nói địa phương; hòa thì lấy câu cũ hơn
 * (id nhỏ, thường đã được nhiều người kiểm tra).
 */
function pickExample(
  word: string,
  sentences: IndexedSentence[],
  used: Set<string>,
  minCoverage = 0,
): IndexedSentence | null {
  const target = wordsOf(word);
  if (target.length === 0 || word.includes(".") || word.startsWith("'")) return null;
  const needle = ` ${target.join(" ")} `;
  const own = new Set(target);
  const candidates = sentences.filter(
    (s) =>
      s.coverage >= minCoverage && s.joined.includes(needle) && !s.tokens.some((t) => BLOCKED.has(t) && !own.has(t)),
  );
  const score = (s: IndexedSentence) =>
    Math.abs(s.tokens.length - 6) +
    (1 - s.coverage) * 8 +
    (used.has(s.id) ? 10 : 0) +
    (s.vi && INFORMAL_VI.test(s.vi) ? 5 : 0);
  candidates.sort((a, b) => score(a) - score(b) || Number(a.id) - Number(b.id));
  return candidates[0] ?? null;
}

/**
 * Câu tiếng Anh (không có bản dịch) cho các từ Tatoeba chưa có cặp Anh–Việt:
 * chỉ giữ câu 4–9 từ có chứa từ cần tìm, để không phải giữ cả 2 triệu câu trong bộ nhớ.
 */
function englishOnlyCandidates(wanted: string[], known: Set<string>): IndexedSentence[] {
  const firstTokens = new Set(wanted.map((w) => wordsOf(w)[0]).filter(Boolean));
  const result: IndexedSentence[] = [];
  for (const { id, en } of readEnglishSentences()) {
    if (/["“”]/.test(en)) continue;
    const tokens = wordsOf(en);
    if (tokens.length < 4 || tokens.length > 9 || !tokens.some((t) => firstTokens.has(t))) continue;
    result.push(indexSentence(id, en, null, known));
  }
  return result;
}

// ---------------------------------------------------------------------------

export interface BankWord {
  word: string;
  level: Level;
  /** Từ loại theo CEFR-J (nhiều từ loại: từ loại cấp thấp nhất trước) */
  pos: string[];
  unit: string;
  phonetic: string | null;
  meaning: string | null;
  example: string | null;
  exampleVi: string | null;
  /** Nguồn câu ví dụ, vd "tatoeba:1277" */
  exampleSource: string | null;
}

type Overrides = Record<string, Partial<Pick<BankWord, "phonetic" | "meaning" | "example" | "exampleVi" | "unit">>>;

function main() {
  const entries = readCefrJ();
  // Các file chỉnh sửa được áp dụng theo thứ tự tên file; file sau ghi đè file trước
  const overrides: Overrides = {};
  if (fs.existsSync(OVERRIDES_DIR)) {
    for (const name of fs.readdirSync(OVERRIDES_DIR).filter((n) => n.endsWith(".json")).sort()) {
      const part = JSON.parse(fs.readFileSync(path.join(OVERRIDES_DIR, name), "utf8")) as Overrides;
      for (const [word, fix] of Object.entries(part)) overrides[word] = { ...overrides[word], ...fix };
    }
  }
  const unknown = Object.keys(overrides).filter((word) => !entries.some((e) => e.headword === word));
  if (unknown.length) throw new Error(`overrides có từ không nằm trong danh sách: ${unknown.join(", ")}`);

  // Gộp các dòng cùng 1 từ (khác từ loại); cấp độ = cấp thấp nhất
  const merged = new Map<string, { level: Level; pos: string[]; topics: string[] }>();
  for (const e of entries) {
    const current = merged.get(e.headword);
    if (!current) merged.set(e.headword, { level: e.level, pos: [e.pos], topics: [...e.topics] });
    else {
      if (e.level < current.level) current.level = e.level;
      if (!current.pos.includes(e.pos)) current.pos.push(e.pos);
      current.topics.push(...e.topics);
    }
  }

  const known = buildKnownWords([...merged.keys()]);
  const pairs = indexPairs(readTatoebaPairs(), known);

  // Lượt 1: câu có bản dịch tiếng Việt. Lượt 2: từ còn thiếu thì lấy câu tiếng Anh thật dễ (≥ 85% từ đã biết)
  const usedSentences = new Set<string>();
  const examples = new Map<string, IndexedSentence>();
  for (const word of merged.keys()) {
    const example = pickExample(word, pairs, usedSentences);
    if (example) {
      examples.set(word, example);
      usedSentences.add(example.id);
    }
  }
  const stillMissing = [...merged.keys()].filter((w) => !examples.has(w));
  const englishOnly = englishOnlyCandidates(stillMissing, known);
  for (const word of stillMissing) {
    const example = pickExample(word, englishOnly, usedSentences, 0.85);
    if (example) {
      examples.set(word, example);
      usedSentences.add(example.id);
    }
  }

  const words: BankWord[] = [];
  for (const [word, info] of merged) {
    const wikt = readWiktionary(word);
    const example = examples.get(word);
    const base: BankWord = {
      word,
      level: info.level,
      pos: info.pos,
      unit: unitOf(info.pos, info.topics),
      phonetic: pickIpa(wikt, info.pos),
      meaning: pickMeaning(wikt, info.pos),
      example: example?.en ?? null,
      exampleVi: example?.vi ? normalizeVietnamese(example.vi) : null,
      exampleSource: example ? `tatoeba:${example.id}` : null,
    };
    const fix = overrides[word];
    if (fix) {
      Object.assign(base, fix);
      // Giữ nguồn Tatoeba nếu chỉ bổ sung bản dịch cho đúng câu đã chọn; câu thay mới là câu tự viết
      if (fix.example && fix.example !== example?.en) base.exampleSource = "authored";
    }
    if (base.example && base.exampleVi) base.exampleVi = tidySentence(base.exampleVi, base.example);
    words.push(base);
  }

  const unitIndex = new Map(UNITS.map((u, i) => [u.key, i]));
  words.sort(
    (a, b) =>
      a.level.localeCompare(b.level) ||
      unitIndex.get(a.unit)! - unitIndex.get(b.unit)! ||
      a.word.localeCompare(b.word, "en", { sensitivity: "base" }),
  );

  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(OUT_FILE, `${JSON.stringify(words, null, 1)}\n`);

  fs.writeFileSync(
    path.join(__dirname, ".cache", "review.txt"),
    words.map((w) => [w.level, w.unit, w.word, w.pos.join("/"), w.meaning ?? "-"].join("|")).join("\n"),
  );

  const missing = (key: keyof BankWord) => words.filter((w) => !w[key]).map((w) => w.word);
  console.log(`Đã ghi ${words.length} từ vào ${path.relative(process.cwd(), OUT_FILE)}`);
  for (const level of ["A1", "A2"] as const) {
    const byUnit = UNITS.map((u) => `${u.key}=${words.filter((w) => w.level === level && w.unit === u.key).length}`);
    console.log(`  ${level}: ${words.filter((w) => w.level === level).length} từ | ${byUnit.join(" ")}`);
  }
  console.log(`Ví dụ có bản dịch tiếng Việt: ${words.filter((w) => w.exampleVi).length}, chỉ có tiếng Anh: ${words.filter((w) => w.example && !w.exampleVi).length}`);
  console.log(`Nguồn ví dụ: Tatoeba ${words.filter((w) => w.exampleSource?.startsWith("tatoeba:")).length}, tự viết ${words.filter((w) => w.exampleSource === "authored").length}`);
  for (const key of ["phonetic", "meaning", "example"] as const) {
    const list = missing(key);
    console.log(`Thiếu ${key}: ${list.length}${list.length ? ` — ${list.slice(0, 40).join(", ")}${list.length > 40 ? ", …" : ""}` : ""}`);
  }
}

main();
