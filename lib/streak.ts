/**
 * Chuỗi ngày học liên tiếp (streak), tính theo ngày lịch giờ Việt Nam (UTC+7):
 * học lúc 23h và 1h sáng hôm sau là 2 ngày khác nhau.
 */
const TIME_ZONE = "Asia/Ho_Chi_Minh";
const DAY_MS = 24 * 60 * 60 * 1000;

const dayFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Số thứ tự của ngày (theo giờ Việt Nam) để so sánh "hôm nay / hôm qua" */
function dayNumber(date: Date): number {
  const [year, month, day] = dayFormatter.format(date).split("-").map(Number);
  return Math.floor(Date.UTC(year, month - 1, day) / DAY_MS);
}

/** Số ngày lịch giữa 2 thời điểm (b - a) */
function daysBetween(a: Date, b: Date): number {
  return dayNumber(b) - dayNumber(a);
}

/**
 * Streak để hiển thị: nếu đã bỏ lỡ trọn 1 ngày (lần học cuối trước hôm qua) thì chuỗi đã đứt -> 0.
 * DB chỉ được cập nhật khi user học bài tiếp theo, nên phải tính lại lúc đọc.
 */
export function getDisplayStreak(streak: number, lastActiveAt: Date | null, now = new Date()): number {
  if (!lastActiveAt) return 0;
  return daysBetween(lastActiveAt, now) <= 1 ? streak : 0;
}

/** Streak mới sau khi user học xong 1 bài vào thời điểm `now` */
export function getNextStreak(streak: number, lastActiveAt: Date | null, now = new Date()): number {
  if (!lastActiveAt) return 1;
  const gap = daysBetween(lastActiveAt, now);
  if (gap <= 0) return Math.max(streak, 1); // Đã học hôm nay rồi
  if (gap === 1) return streak + 1; // Học tiếp ngày liền sau
  return 1; // Đứt chuỗi, bắt đầu lại
}
