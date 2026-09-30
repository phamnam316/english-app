import type { PracticeModeMeta } from "@/lib/practice";
import type { PracticeResultResponse, PracticeWord } from "@/types/api";

/** Props chung của các trò chơi trong trang Luyện tập */
export interface PracticeGameProps {
  meta: PracticeModeMeta;
  /** Từ vựng của các bài đã mở khóa (ít nhất PRACTICE_MIN_WORDS từ) */
  words: PracticeWord[];
  bestScore: number | null;
  /** Bấm "Chơi lại": vào chơi luôn, không hiện lại màn giới thiệu */
  skipIntro: boolean;
  onReplay: () => void;
  onSubmitted: (result: PracticeResultResponse) => void;
}

export type GamePhase = "intro" | "playing" | "done";
