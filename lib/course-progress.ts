/**
 * Trạng thái bài học trên giao diện (hoàn thành / đang học / khóa) và "bài học tiếp theo".
 * Hàm thuần, không gọi API: dùng chung cho Dashboard và trang chi tiết khóa học.
 */
import type { CourseSummary, LessonSummary, UnitSummary } from "@/types/api";

export type LessonState = "completed" | "current" | "locked";

export interface LessonWithState extends LessonSummary {
  state: LessonState;
}

export interface UnitWithStates extends Omit<UnitSummary, "lessons"> {
  lessons: LessonWithState[];
}

/**
 * Mở khóa tuần tự trong 1 khóa học, xuyên suốt các chương:
 * - Bài đầu tiên luôn mở.
 * - Bài tiếp theo mở khi bài liền trước đã COMPLETED.
 * - Bài đã có tiến độ (IN_PROGRESS) luôn mở, kể cả khi dữ liệu cũ không theo thứ tự.
 */
export function withLessonStates(course: CourseSummary): UnitWithStates[] {
  let previousCompleted = true;

  return course.units.map((unit) => ({
    ...unit,
    lessons: unit.lessons.map((lesson) => {
      let state: LessonState = "locked";
      if (lesson.status === "COMPLETED") state = "completed";
      else if (previousCompleted || lesson.status === "IN_PROGRESS") state = "current";

      previousCompleted = lesson.status === "COMPLETED";
      return { ...lesson, state };
    }),
  }));
}

export interface NextLessonInfo {
  lesson: LessonWithState;
  unit: UnitWithStates;
}

/** Bài nên học tiếp: bài chưa hoàn thành đầu tiên đã được mở khóa. null = đã học xong cả khóa */
export function getNextLesson(course: CourseSummary): NextLessonInfo | null {
  for (const unit of withLessonStates(course)) {
    const lesson = unit.lessons.find((l) => l.state === "current");
    if (lesson) return { lesson, unit };
  }
  return null;
}

export type CourseStatus = "empty" | "not-started" | "in-progress" | "completed";

export function getCourseStatus(course: CourseSummary): CourseStatus {
  if (course.totalLessons === 0) return "empty";
  if (course.completedLessons >= course.totalLessons) return "completed";

  const hasActivity = course.units.some((u) => u.lessons.some((l) => l.status !== "NOT_STARTED"));
  return hasActivity ? "in-progress" : "not-started";
}

/**
 * Khóa học nên hiện ở khung "Học tiếp" trên Dashboard:
 * ưu tiên khóa đang học dở, sau đó đến khóa chưa bắt đầu.
 */
export function pickContinueCourse(courses: CourseSummary[]): CourseSummary | null {
  return (
    courses.find((c) => getCourseStatus(c) === "in-progress") ??
    courses.find((c) => getCourseStatus(c) === "not-started") ??
    null
  );
}
