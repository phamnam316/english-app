/**
 * Tra từ trong phụ đề với bộ từ vựng của app (bảng Vocabulary) và lập danh sách từ vựng của 1 clip. Chỉ dùng ở server.
 */
import { prisma } from "@/lib/prisma";
import { wordKey } from "@/lib/word-rating";
import { getWordRatings } from "@/lib/words";
import type { SubtitleCue } from "@/lib/videos/subtitles";
import { tokenizeWords } from "@/lib/videos/subtitles";
import type { WordRating } from "@/types/api";
import type { ClipWord, WordLookupEntry } from "@/types/video";

const isConsonant = (char: string | undefined) => !!char && /[bcdfghjklmnpqrstvwxz]/.test(char);

/**
 * Các dạng gốc có thể có của 1 từ trong câu thoại, ưu tiên theo thứ tự:
 * "bears" -> bear, "tried" -> try, "making" -> make, "stopped" -> stop, "Grizz's" -> grizz.
 * Không cần đúng ngữ pháp tuyệt đối: dạng sai đơn giản là không khớp từ nào trong bảng Vocabulary.
 */
export function wordCandidates(word: string): string[] {
  const lower = word.toLowerCase().replace(/[’`]/g, "'");
  const base = lower.replace(/'s$/, "");
  const candidates = [lower, base];
  const stems = (suffix: string) => (base.endsWith(suffix) ? base.slice(0, -suffix.length) : null);

  const ies = stems("ies");
  if (ies) candidates.push(`${ies}y`);
  const es = stems("es");
  if (es) candidates.push(es);
  const s = stems("s");
  if (s && !base.endsWith("ss")) candidates.push(s);

  const ied = stems("ied");
  if (ied) candidates.push(`${ied}y`);
  // So sánh hơn / nhất: happier -> happy, biggest -> big, nicer -> nice
  for (const suffix of ["ier", "iest"]) {
    const stem = stems(suffix);
    if (stem) candidates.push(`${stem}y`);
  }
  for (const suffix of ["ed", "ing", "er", "est"]) {
    const stem = stems(suffix);
    if (!stem || stem.length < 2) continue;
    candidates.push(stem, `${stem}e`);
    // Phụ âm cuối gấp đôi: stopped -> stop, running -> run
    if (stem.at(-1) === stem.at(-2) && isConsonant(stem.at(-1))) candidates.push(stem.slice(0, -1));
  }

  return [...new Set(candidates.filter((c) => c.length > 0))];
}

/**
 * Từ chức năng và từ quá cơ bản: không đưa vào danh sách từ vựng của clip
 * (vẫn tra được khi người học bấm vào).
 */
const CLIP_STOPWORDS = new Set(
  (
    "a an the i you he she it we they me him her us them my your his its our their mine yours this that these those " +
    "is am are was were be been being do does did done have has had to of in on at for with and or but so not no yes " +
    "oh ok okay hey uh um huh hmm ah wow what who whom where when why how there here just too very can will would could " +
    "should shall may might must let gonna wanna gotta all some any up down out off if then than as by from about into " +
    "over now also well yeah yep nope hi bye mr mrs ms s t d ll re ve m"
  ).split(" "),
);

/** Tên nhân vật: "Ice Bear" không phải 2 từ "ice" + "bear" cần học */
const CHARACTER_NAMES = /\b(ice bear|grizzly|grizz|panda|chloe|charlie|nom nom|yuri|brenda|ranger tabes|tabes|lucy)\b/gi;

type VocabRow = WordLookupEntry & { cefr: string | null };

/** Tra 1 lượt nhiều dạng từ: trả về Map dạng từ (chữ thường) -> mục từ vựng. Chỉ lấy từ của khóa đã publish */
async function findVocabulary(forms: string[]): Promise<Map<string, VocabRow>> {
  const unique = [...new Set(forms)];
  if (unique.length === 0) return new Map();

  const rows = await prisma.vocabulary.findMany({
    where: {
      word: { in: unique, mode: "insensitive" },
      lesson: { unit: { course: { isPublished: true } } },
    },
    select: { word: true, phonetic: true, meaning: true, exampleSentence: true, exampleTranslation: true, cefr: true },
  });

  const byForm = new Map<string, VocabRow>();
  for (const row of rows) {
    const key = row.word.toLowerCase();
    const current = byForm.get(key);
    // Cùng 1 từ ở nhiều bài: ưu tiên dòng có câu ví dụ
    if (!current || (!current.exampleSentence && row.exampleSentence)) byForm.set(key, row);
  }
  return byForm;
}

function bestEntry(word: string, byForm: Map<string, VocabRow>): VocabRow | null {
  for (const candidate of wordCandidates(word)) {
    const entry = byForm.get(candidate);
    if (entry) return entry;
  }
  return null;
}

/** Nghĩa của 1 từ (người học bấm / rê chuột vào từ trong phụ đề) kèm mức nhớ người học đã chọn */
export async function lookupWord(
  userId: string,
  word: string,
): Promise<{ entry: WordLookupEntry | null; rating: WordRating | null }> {
  const byForm = await findVocabulary(wordCandidates(word));
  const found = bestEntry(word, byForm);
  if (!found) return { entry: null, rating: null };
  const { cefr: _cefr, ...entry } = found;
  const ratings = await getWordRatings(userId, [entry.word]);
  return { entry, rating: ratings.get(wordKey(entry.word)) ?? null };
}

/**
 * Danh sách từ vựng của clip: các từ trong phụ đề đã căn có trong bộ từ vựng của app (bỏ từ chức năng),
 * xếp theo lần xuất hiện đầu tiên, kèm câu thoại chứa từ đó để phát lại.
 */
export async function getClipVocabulary(userId: string, cues: SubtitleCue[]): Promise<ClipWord[]> {
  const occurrences: Array<{ word: string; cue: SubtitleCue }> = [];
  for (const cue of cues) {
    for (const token of tokenizeWords(cue.en.replace(CHARACTER_NAMES, " "))) {
      const lower = token.word?.toLowerCase().replace(/[’`]/g, "'");
      if (!lower || lower.length < 2 || /\d/.test(lower) || CLIP_STOPWORDS.has(lower.replace(/'.*$/, ""))) continue;
      occurrences.push({ word: lower, cue });
    }
  }
  if (occurrences.length === 0) return [];

  const byForm = await findVocabulary(occurrences.flatMap((o) => wordCandidates(o.word)));
  const words = new Map<string, ClipWord>();
  for (const { word, cue } of occurrences) {
    const entry = bestEntry(word, byForm);
    if (!entry || CLIP_STOPWORDS.has(entry.word.toLowerCase())) continue;
    const key = wordKey(entry.word);
    const existing = words.get(key);
    if (existing) {
      existing.count += 1;
      continue;
    }
    words.set(key, {
      word: entry.word,
      phonetic: entry.phonetic,
      meaning: entry.meaning,
      cefr: entry.cefr,
      count: 1,
      cueStart: cue.start,
      sentence: cue.en,
      sentenceVi: cue.vi,
      rating: null,
    });
  }

  const list = [...words.values()];
  const ratings = await getWordRatings(userId, list.map((w) => w.word));
  for (const item of list) item.rating = ratings.get(wordKey(item.word)) ?? null;
  return list;
}
