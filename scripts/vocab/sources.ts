/**
 * Đọc các nguồn dữ liệu mở đã tải về scripts/vocab/.cache (xem scripts/vocab/README.md):
 * - CEFR-J Wordlist 1.5 (CC BY-SA 4.0): từ, từ loại, cấp độ A1/A2, chủ đề
 * - Wiktionary qua kaikki.org (CC BY-SA 4.0): phiên âm IPA, nghĩa tiếng Việt (đọc trong build-vocab.ts)
 * - Tatoeba (CC BY 2.0 FR): câu ví dụ tiếng Anh kèm bản dịch tiếng Việt
 */
import fs from "node:fs";
import path from "node:path";

export const CACHE_DIR = path.join(__dirname, ".cache");
export const WIKTIONARY_DIR = path.join(CACHE_DIR, "wiktionary");

/** Tên file cache (an toàn trên Windows) cho dữ liệu Wiktionary của 1 từ */
export function wiktionaryCacheFile(word: string): string {
  const safe = encodeURIComponent(word).replace(/[*.]/g, (c) => `%${c.charCodeAt(0).toString(16)}`);
  // Windows không phân biệt hoa/thường trong tên file: "May" (tháng 5) và "may" (có thể) cần 2 file khác nhau
  const caseMark = /[A-Z]/.test(word) ? "~uc" : "";
  return path.join(WIKTIONARY_DIR, `${safe}${caseMark}.jsonl`);
}

export type Level = "A1" | "A2";

export interface CefrEntry {
  /** Từ gốc đã làm sạch (vd "a.m./A.M./am/AM" -> "a.m.") */
  headword: string;
  pos: string;
  level: Level;
  topics: string[];
}

/** Tách 1 dòng CSV có trường trong dấu nháy kép */
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (quoted) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (char === '"') quoted = false;
      else current += char;
    } else if (char === '"') quoted = true;
    else if (char === ",") {
      fields.push(current);
      current = "";
    } else current += char;
  }
  fields.push(current);
  return fields.map((f) => f.trim());
}

/** Các dòng A1/A2 của CEFR-J (mỗi dòng 1 cặp từ + từ loại) */
export function readCefrJ(): CefrEntry[] {
  const lines = fs.readFileSync(path.join(CACHE_DIR, "cefrj.csv"), "utf8").trim().split(/\r?\n/);
  const entries: CefrEntry[] = [];
  for (const line of lines.slice(1)) {
    const [rawHeadword, pos, level, core1, core2, threshold] = parseCsvLine(line);
    if (level !== "A1" && level !== "A2") continue;
    const headword = rawHeadword.split("/")[0].trim();
    const topics = [core1, core2, threshold].filter(Boolean).map((t) => t.replace(/\s+/g, " "));
    entries.push({ headword, pos, level, topics });
  }
  return entries;
}

export interface SentencePair {
  id: string;
  en: string;
  vi: string;
}

/** Cặp câu Anh–Việt của Tatoeba (1 câu tiếng Anh lấy 1 bản dịch tiếng Việt đầu tiên) */
export function readTatoebaPairs(): SentencePair[] {
  const readSentences = (file: string, wanted?: Set<string>) => {
    const map = new Map<string, string>();
    for (const line of fs.readFileSync(path.join(CACHE_DIR, file), "utf8").split(/\r?\n/)) {
      const tab1 = line.indexOf("\t");
      const tab2 = line.indexOf("\t", tab1 + 1);
      if (tab1 < 0 || tab2 < 0) continue;
      const id = line.slice(0, tab1);
      if (wanted && !wanted.has(id)) continue;
      map.set(id, line.slice(tab2 + 1).trim());
    }
    return map;
  };

  const links = fs
    .readFileSync(path.join(CACHE_DIR, "vie-eng_links.tsv"), "utf8")
    .split(/\r?\n/)
    .map((line) => line.split("\t"))
    .filter((parts) => parts.length === 2);
  const vi = readSentences("vie_sentences.tsv");
  const en = readSentences("eng_sentences.tsv", new Set(links.map(([, enId]) => enId)));

  const pairs = new Map<string, SentencePair>();
  for (const [viId, enId] of links) {
    const enText = en.get(enId);
    const viText = vi.get(viId);
    if (!enText || !viText || pairs.has(enId)) continue;
    pairs.set(enId, { id: enId, en: enText, vi: viText });
  }
  return [...pairs.values()];
}

/** Tách câu tiếng Anh thành các từ thường (giữ dấu nháy trong don't, o'clock) */
export function wordsOf(sentence: string): string[] {
  return sentence
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .split(/[^a-z0-9']+/)
    .map((w) => w.replace(/^'+|'+$/g, ""))
    .filter(Boolean);
}

/** Toàn bộ câu tiếng Anh của Tatoeba (khoảng 2 triệu câu), đọc lần lượt */
export function* readEnglishSentences(): Generator<{ id: string; en: string }> {
  const text = fs.readFileSync(path.join(CACHE_DIR, "eng_sentences.tsv"), "utf8");
  let start = 0;
  while (start < text.length) {
    let end = text.indexOf("\n", start);
    if (end < 0) end = text.length;
    const line = text.slice(start, end);
    start = end + 1;
    const tab1 = line.indexOf("\t");
    const tab2 = line.indexOf("\t", tab1 + 1);
    if (tab1 < 0 || tab2 < 0) continue;
    yield { id: line.slice(0, tab1), en: line.slice(tab2 + 1).trim() };
  }
}
