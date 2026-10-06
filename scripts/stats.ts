/**
 * Đo mức giữ chân người học từ dữ liệu sẵn có (không cần công cụ ngoài):
 *   npx tsx scripts/stats.ts            # database trong .env
 *   DATABASE_URL="postgres://..." npx tsx scripts/stats.ts   # database production (Neon)
 *
 * "Ngày có học" = ngày (giờ Việt Nam) có ít nhất 1 lần nộp bài, 1 lượt luyện tập hoặc 1 lần đánh giá mức nhớ.
 * - Quay lại ngày 1: có học vào đúng ngày hôm sau ngày đăng ký.
 * - Quay lại ngày 7: có học vào đúng ngày thứ 7 sau ngày đăng ký.
 * - Còn học sau 7 ngày: có học vào bất kỳ ngày nào từ ngày thứ 7 trở đi.
 * Chạy trước và sau mỗi thay đổi lớn để biết thay đổi đó có giữ chân người học tốt hơn không.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const DAY_MS = 24 * 60 * 60 * 1000;
const VIETNAM_OFFSET_MS = 7 * 60 * 60 * 1000;
const PASSING_SCORE = 70;

/** Số thứ tự ngày theo giờ Việt Nam */
const dayOf = (date: Date) => Math.floor((date.getTime() + VIETNAM_OFFSET_MS) / DAY_MS);
const dayLabel = (day: number) => new Date(day * DAY_MS).toISOString().slice(0, 10);
const percent = (part: number, total: number) => (total === 0 ? "–" : `${Math.round((part / total) * 100)}%`);
/** Thứ Hai của tuần chứa ngày `day` (ngày số 0 là thứ Năm) */
const weekOf = (day: number) => day - ((day + 3) % 7);

async function main() {
  const [users, activities, reviews] = await Promise.all([
    prisma.user.findMany({ select: { id: true, createdAt: true } }),
    prisma.activity.findMany({ select: { userId: true, type: true, score: true, createdAt: true } }),
    prisma.wordReview.findMany({ select: { userId: true, updatedAt: true } }),
  ]);

  const today = dayOf(new Date());
  const activeDays = new Map<string, Set<number>>();
  const markActive = (userId: string, date: Date) => {
    const days = activeDays.get(userId) ?? new Set<number>();
    days.add(dayOf(date));
    activeDays.set(userId, days);
  };
  for (const a of activities) markActive(a.userId, a.createdAt);
  for (const r of reviews) markActive(r.userId, r.updatedAt);

  const rows = users.map((user) => {
    const signup = dayOf(user.createdAt);
    const days = activeDays.get(user.id) ?? new Set<number>();
    return {
      signup,
      learned: days.size > 0,
      d1: days.has(signup + 1),
      d7: days.has(signup + 7),
      after7: [...days].some((d) => d >= signup + 7),
      firstWeekDays: [...days].filter((d) => d >= signup && d < signup + 7).length,
    };
  });

  const eligible1 = rows.filter((r) => r.signup + 1 <= today);
  const eligible7 = rows.filter((r) => r.signup + 7 <= today);
  console.log(`\nNgười dùng: ${rows.length} (đã học ít nhất 1 lần: ${rows.filter((r) => r.learned).length})`);
  console.log(`Quay lại ngày 1:      ${percent(eligible1.filter((r) => r.d1).length, eligible1.length)} (${eligible1.length} người đủ 1 ngày)`);
  console.log(`Quay lại ngày 7:      ${percent(eligible7.filter((r) => r.d7).length, eligible7.length)} (${eligible7.length} người đủ 7 ngày)`);
  console.log(`Còn học sau 7 ngày:   ${percent(eligible7.filter((r) => r.after7).length, eligible7.length)}`);
  const avgWeek = eligible7.length ? eligible7.reduce((s, r) => s + r.firstWeekDays, 0) / eligible7.length : 0;
  console.log(`Số ngày học trong tuần đầu (trung bình): ${avgWeek.toFixed(1)}`);

  // Theo tuần đăng ký
  const cohorts = new Map<number, typeof rows>();
  for (const r of rows) cohorts.set(weekOf(r.signup), [...(cohorts.get(weekOf(r.signup)) ?? []), r]);
  console.log("\nTheo tuần đăng ký   người  ngày 1  ngày 7");
  for (const [week, group] of [...cohorts].sort(([a], [b]) => a - b)) {
    const g1 = group.filter((r) => r.signup + 1 <= today);
    const g7 = group.filter((r) => r.signup + 7 <= today);
    console.log(
      `  ${dayLabel(week)}        ${String(group.length).padStart(5)}  ${percent(g1.filter((r) => r.d1).length, g1.length).padStart(6)}  ${percent(g7.filter((r) => r.d7).length, g7.length).padStart(6)}`,
    );
  }

  // 14 ngày gần nhất
  console.log("\nNgày         người học  bài đạt  lượt ôn");
  for (let day = today - 13; day <= today; day++) {
    const learners = [...activeDays.values()].filter((days) => days.has(day)).length;
    const dayActivities = activities.filter((a) => dayOf(a.createdAt) === day);
    // Bản ghi cũ (trước khi lưu điểm) chỉ được tạo ở lần đầu đạt bài nên vẫn tính là đạt
    const lessons = dayActivities.filter((a) => a.type === "LESSON" && (a.score === null || a.score >= PASSING_SCORE)).length;
    const practice = dayActivities.filter((a) => a.type === "PRACTICE").length;
    console.log(`  ${dayLabel(day)}  ${String(learners).padStart(9)}  ${String(lessons).padStart(7)}  ${String(practice).padStart(7)}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
