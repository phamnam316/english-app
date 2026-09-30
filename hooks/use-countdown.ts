"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Đồng hồ đếm ngược, trả về số mili-giây còn lại. Bắt đầu khi `isRunning` chuyển sang true,
 * gọi `onEnd` 1 lần khi hết giờ. Muốn chơi lại thì tạo lại component (đổi `key`).
 */
export function useCountdown(totalSeconds: number, isRunning: boolean, onEnd: () => void): number {
  const [remainingMs, setRemainingMs] = useState(totalSeconds * 1000);
  const onEndRef = useRef(onEnd);
  useEffect(() => {
    onEndRef.current = onEnd;
  });

  useEffect(() => {
    if (!isRunning) return;
    // Tính theo mốc kết thúc (không cộng dồn từng nhịp) để không bị trôi giờ khi tab chạy chậm
    const endAt = Date.now() + totalSeconds * 1000;
    const timer = window.setInterval(() => {
      const left = Math.max(0, endAt - Date.now());
      setRemainingMs(left);
      if (left === 0) {
        window.clearInterval(timer);
        onEndRef.current();
      }
    }, 100);
    return () => window.clearInterval(timer);
  }, [isRunning, totalSeconds]);

  return remainingMs;
}
