/**
 * Tải các nguồn dữ liệu mở về scripts/vocab/.cache (không đưa lên git):
 *   npx tsx scripts/vocab/fetch-sources.ts
 *
 * - CEFR-J Wordlist 1.5 ........ https://github.com/openlanguageprofiles/olp-en-cefrj (CC BY-SA 4.0)
 * - Tatoeba (câu Anh–Việt) ..... https://downloads.tatoeba.org/exports/per_language/ (CC BY 2.0 FR)
 * - Wiktionary qua kaikki.org .. https://kaikki.org/dictionary/English/ (CC BY-SA 4.0): phiên âm + nghĩa tiếng Việt
 *
 * File đã có thì bỏ qua, nên chạy lại nhiều lần không tải lại.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import { CACHE_DIR, WIKTIONARY_DIR, readCefrJ, wiktionaryCacheFile } from "./sources";

const USER_AGENT = "english-app-vocab-builder/1.0 (educational, one-time download)";
const CONCURRENCY = 4;

async function download(url: string, file: string): Promise<boolean> {
  if (fs.existsSync(file)) return true;
  const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!response.ok) return false;
  fs.writeFileSync(file, Buffer.from(await response.arrayBuffer()));
  return true;
}

async function downloadBz2(url: string, name: string) {
  const target = path.join(CACHE_DIR, name);
  if (fs.existsSync(target)) return;
  const archive = `${target}.bz2`;
  if (!(await download(url, archive))) throw new Error(`Không tải được ${url}`);
  execFileSync("bzip2", ["-dkf", archive]);
}

/** Đường dẫn file JSONL của 1 từ trên kaikki.org: /h/ho/house.jsonl */
function kaikkiUrl(word: string): string {
  const first = word.slice(0, 1);
  const firstTwo = word.slice(0, 2);
  return `https://kaikki.org/dictionary/English/meaning/${encodeURIComponent(first)}/${encodeURIComponent(firstTwo)}/${encodeURIComponent(word)}.jsonl`;
}


async function fetchWiktionary(words: string[]) {
  fs.mkdirSync(WIKTIONARY_DIR, { recursive: true });
  const queue = [...words];
  let done = 0;
  const missing: string[] = [];

  const worker = async () => {
    for (let word = queue.shift(); word !== undefined; word = queue.shift()) {
      const file = wiktionaryCacheFile(word);
      // Thử đúng chữ như trong danh sách, rồi chữ thường, rồi viết hoa chữ đầu
      const variants = [...new Set([word, word.toLowerCase(), word.charAt(0).toUpperCase() + word.slice(1)])];
      let ok = fs.existsSync(file);
      for (const variant of variants) {
        if (ok) break;
        const response = await fetch(kaikkiUrl(variant), { headers: { "User-Agent": USER_AGENT } });
        if (response.ok) {
          fs.writeFileSync(file, await response.text());
          ok = true;
        }
      }
      if (!ok) missing.push(word);
      done++;
      if (done % 200 === 0) console.log(`  Wiktionary: ${done}/${words.length}`);
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  console.log(`Wiktionary: xong ${words.length - missing.length}/${words.length} từ`);
  if (missing.length) console.log(`  Không có trên kaikki.org: ${missing.join(", ")}`);
}

async function main() {
  fs.mkdirSync(CACHE_DIR, { recursive: true });

  if (
    !(await download(
      "https://raw.githubusercontent.com/openlanguageprofiles/olp-en-cefrj/master/cefrj-vocabulary-profile-1.5.csv",
      path.join(CACHE_DIR, "cefrj.csv"),
    ))
  ) {
    throw new Error("Không tải được CEFR-J Wordlist");
  }

  const base = "https://downloads.tatoeba.org/exports/per_language";
  await downloadBz2(`${base}/vie/vie-eng_links.tsv.bz2`, "vie-eng_links.tsv");
  await downloadBz2(`${base}/vie/vie_sentences.tsv.bz2`, "vie_sentences.tsv");
  await downloadBz2(`${base}/eng/eng_sentences.tsv.bz2`, "eng_sentences.tsv");
  console.log("Tatoeba: xong");

  const words = [...new Set(readCefrJ().map((e) => e.headword))];
  await fetchWiktionary(words);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
