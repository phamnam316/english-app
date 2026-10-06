/**
 * So câu nói (kết quả nhận dạng giọng nói của trình duyệt) với từ cần đọc.
 *
 * Máy nhận dạng không biết người học "định" nói từ nào nên hay trả về cách viết khác của cùng một âm:
 * từ đồng âm ("hour" -> "our", "sea" -> "C"), chữ số ("hundred" -> "100", "first" -> "1st"),
 * cách viết khác ("OK" -> "okay", "e-mail" -> "email"). Các trường hợp đó vẫn tính là đọc đúng.
 */

const ONES = [
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
  "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen",
];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

function numberToWords(n: number): string {
  if (n < 20) return ONES[n];
  if (n < 100) {
    const ones = n % 10;
    return ones ? `${TENS[Math.floor(n / 10)]} ${ONES[ones]}` : TENS[Math.floor(n / 10)];
  }
  const scales: Array<[number, string]> = [
    [1_000_000_000, "billion"],
    [1_000_000, "million"],
    [1_000, "thousand"],
    [100, "hundred"],
  ];
  for (const [size, name] of scales) {
    if (n >= size) {
      const rest = n % size;
      return `${numberToWords(Math.floor(n / size))} ${name}${rest ? ` ${numberToWords(rest)}` : ""}`;
    }
  }
  return String(n);
}

const IRREGULAR_ORDINALS: Record<string, string> = {
  one: "first",
  two: "second",
  three: "third",
  five: "fifth",
  eight: "eighth",
  nine: "ninth",
  twelve: "twelfth",
};

/** 1 -> "first", 21 -> "twenty first", 30 -> "thirtieth" */
function ordinalToWords(n: number): string {
  const words = numberToWords(n).split(" ");
  const last = words.pop()!;
  const ordinal = IRREGULAR_ORDINALS[last] ?? (last.endsWith("y") ? `${last.slice(0, -1)}ieth` : `${last}th`);
  return [...words, ordinal].join(" ");
}

/** Từ đồng âm hay gặp ở trình độ A1–A2 (kể cả tên chữ cái mà máy nhận dạng hay trả về: "C", "I", "U"…) */
const HOMOPHONE_GROUPS = [
  ["to", "too", "two"],
  ["for", "four", "fore"],
  ["one", "won"],
  ["eight", "ate"],
  ["see", "sea", "c"],
  ["be", "bee", "b"],
  ["i", "eye", "aye"],
  ["you", "u", "ewe"],
  ["why", "y"],
  ["are", "r"],
  ["oh", "o", "owe"],
  ["tea", "tee", "t"],
  ["pea", "pee", "p"],
  ["queue", "q", "cue"],
  ["by", "buy", "bye"],
  ["know", "no"],
  ["knew", "new"],
  ["night", "knight"],
  ["right", "write", "rite"],
  ["hear", "here"],
  ["hour", "our"],
  ["meet", "meat"],
  ["week", "weak"],
  ["wait", "weight"],
  ["whole", "hole"],
  ["peace", "piece"],
  ["mail", "male"],
  ["sale", "sail"],
  ["tail", "tale"],
  ["blue", "blew"],
  ["son", "sun"],
  ["flower", "flour"],
  ["pair", "pear", "pare"],
  ["road", "rode", "rowed"],
  ["dear", "deer"],
  ["wear", "where", "ware"],
  ["there", "their", "they're"],
  ["your", "you're"],
  ["its", "it's"],
  ["wood", "would"],
  ["weather", "whether"],
  ["which", "witch"],
  ["whose", "who's"],
  ["cent", "sent", "scent"],
  ["sell", "cell"],
  ["plain", "plane"],
  ["rain", "reign", "rein"],
  ["break", "brake"],
  ["steal", "steel"],
  ["stair", "stare"],
  ["way", "weigh"],
  ["board", "bored"],
  ["check", "cheque"],
  ["fair", "fare"],
  ["flu", "flew"],
  ["great", "grate"],
  ["guest", "guessed"],
  ["hair", "hare"],
  ["heal", "heel"],
  ["hi", "high"],
  ["made", "maid"],
  ["morning", "mourning"],
  ["passed", "past"],
  ["poor", "pour", "pore"],
  ["role", "roll"],
  ["seen", "scene"],
  ["seem", "seam"],
  ["site", "sight", "cite"],
  ["some", "sum"],
  ["sweet", "suite"],
  ["waist", "waste"],
  ["aunt", "ant"],
  ["bear", "bare"],
  ["cereal", "serial"],
  ["course", "coarse"],
  ["die", "dye"],
  ["due", "dew"],
  ["flea", "flee"],
  ["heard", "herd"],
  ["in", "inn"],
  ["jeans", "genes"],
  ["key", "quay"],
  ["none", "nun"],
  ["or", "oar", "ore"],
  ["principal", "principle"],
  ["raise", "rays"],
  ["ring", "wring"],
  ["steak", "stake"],
  ["story", "storey"],
  ["through", "threw"],
  ["whale", "wail"],
  ["wine", "whine"],
  ["warn", "worn"],
  ["ad", "add"],
  ["ball", "bawl"],
  ["bread", "bred"],
  ["hall", "haul"],
  ["miner", "minor"],
  ["pale", "pail"],
  ["pray", "prey"],
  ["soul", "sole"],
  ["throne", "thrown"],
  ["yolk", "yoke"],
  ["missed", "mist"],
];

/** Cách viết khác nhau của cùng một từ / viết tắt -> 1 dạng chung */
const ALIASES: Record<string, string> = {
  okay: "ok",
  mister: "mr",
  missus: "mrs",
  misses: "mrs",
  miz: "ms",
  television: "tv",
  "t v": "tv",
  mom: "mum",
  mommy: "mummy",
  grey: "gray",
  colour: "color",
  favourite: "favorite",
  centre: "center",
  theatre: "theater",
  metre: "meter",
  litre: "liter",
  kilometre: "kilometer",
  centimetre: "centimeter",
  programme: "program",
  organise: "organize",
  realise: "realize",
  apologise: "apologize",
  practise: "practice",
  travelling: "traveling",
  traveller: "traveler",
  cancelled: "canceled",
  jewellery: "jewelry",
  pyjamas: "pajamas",
  tyre: "tire",
  catalogue: "catalog",
};

const HOMOPHONE_CANON = new Map<string, string>();
for (const group of HOMOPHONE_GROUPS) for (const word of group) HOMOPHONE_CANON.set(word, group[0]);

/**
 * Chuẩn hóa câu để so sánh: chữ thường, bỏ dấu câu, đổi số / số thứ tự thành chữ
 * (máy nhận dạng hay trả "20" thay vì "twenty", "1st" thay vì "first").
 */
export function normalizeSpoken(text: string): string {
  return text
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/(\d),(?=\d{3}\b)/g, "$1")
    .replace(/(\d+)(st|nd|rd|th)\b/g, (_, digits: string) => ordinalToWords(Number(digits)))
    .replace(/\d+/g, (digits) => numberToWords(Number(digits)))
    .replace(/-/g, " ")
    .replace(/[^\p{L}\p{N}'\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Chuẩn hóa + đổi các cách viết khác về dạng chung ("okay" -> "ok", "colour" -> "color") */
function withAliases(text: string): string {
  let result = ` ${normalizeSpoken(text)} `;
  for (const [variant, base] of Object.entries(ALIASES)) result = result.split(` ${variant} `).join(` ${base} `);
  return result.trim();
}

/** Từ đồng âm về 1 đại diện: "our" và "hour" cùng thành "hour" */
const withHomophones = (text: string) =>
  text
    .split(" ")
    .map((word) => HOMOPHONE_CANON.get(word) ?? word)
    .join(" ");

/** Bỏ khoảng trắng và dấu nháy: "e mail" = "email", "t shirt" = "tshirt", "p m" = "pm" */
const compact = (text: string) => text.replace(/[\s']/g, "");

/**
 * Đúng nếu 1 trong các cách nhận dạng (máy trả về tối đa vài phương án) khớp với từ cần đọc,
 * hoặc có chứa trọn từ đó ("uh hello" vẫn tính "hello").
 */
export function isSpokenMatch(transcripts: string[], target: string): boolean {
  const goal = withAliases(target);
  if (!goal) return false;
  const goalSound = withHomophones(goal);
  return transcripts.some((transcript) => {
    const said = withAliases(transcript);
    if (!said) return false;
    const saidSound = withHomophones(said);
    return saidSound === goalSound || ` ${saidSound} `.includes(` ${goalSound} `) || compact(said) === compact(goal);
  });
}

/** Từ đọc riêng được (bỏ dạng rút gọn như 'm, 're không thể đọc một mình) và đủ ngắn để nhận dạng chính xác */
export function isSpeakableWord(word: string): boolean {
  return !word.startsWith("'") && word.length <= 24;
}
