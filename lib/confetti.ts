import type confettiLib from "canvas-confetti";

let confettiInstance: typeof confettiLib | null = null;

/** Pháo giấy ăn mừng khi hoàn thành bài học. Tôn trọng cài đặt "giảm chuyển động" của hệ điều hành */
export async function fireConfetti(): Promise<void> {
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  // Nạp thư viện khi cần, không làm nặng bundle ban đầu của trang học
  const { default: confetti } = await import("canvas-confetti");
  confettiInstance = confetti;
  // Màu của giao diện: xanh rêu, đất nung, vàng cát
  const colors = ["#52664b", "#9db592", "#b96243", "#e3b26b", "#3e6a45"];

  confetti({ particleCount: 120, spread: 80, startVelocity: 45, origin: { y: 0.55 }, colors, zIndex: 60 });
  window.setTimeout(() => {
    confetti({ particleCount: 60, angle: 60, spread: 65, origin: { x: 0, y: 0.7 }, colors, zIndex: 60 });
    confetti({ particleCount: 60, angle: 120, spread: 65, origin: { x: 1, y: 0.7 }, colors, zIndex: 60 });
  }, 250);
}

/** Dọn pháo giấy khi rời màn hình hoàn thành, để không rơi tiếp sang trang khác */
export function stopConfetti(): void {
  confettiInstance?.reset();
}
