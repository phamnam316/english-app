"use client";

import { useMemo, useRef } from "react";

/**
 * Ghi đúng/sai từng từ trong 1 lượt chơi để cập nhật lịch ôn (gửi kèm kết quả lượt chơi).
 * 1 từ gặp nhiều lần trong lượt: chỉ cần sai 1 lần là tính sai.
 */
export function useReviewLog() {
  const log = useRef(new Map<string, boolean>());
  return useMemo(
    () => ({
      record: (word: string, correct: boolean) => {
        log.current.set(word, (log.current.get(word) ?? true) && correct);
      },
      entries: () => [...log.current].map(([word, correct]) => ({ word, correct })),
    }),
    [],
  );
}
