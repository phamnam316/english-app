import { NextResponse } from "next/server";

import { getAuthSession } from "@/lib/auth";
import { handleApiError } from "@/lib/api-error";
import { getCourseSummaries } from "@/lib/courses";
import type { CourseListResponse } from "@/types/api";

/**
 * GET /api/courses
 * Danh sách khóa học đã publish (ADMIN thấy cả bản nháp), kèm chương, bài và tiến độ của user.
 * Không bắt buộc đăng nhập: khách xem được danh sách, mọi bài là NOT_STARTED.
 */
export async function GET() {
  try {
    const session = await getAuthSession();
    const userId = session?.user?.id;

    const courses = await getCourseSummaries({ userId, isAdmin: session?.user?.role === "ADMIN" });

    return NextResponse.json<CourseListResponse>({ isAuthenticated: Boolean(userId), courses });
  } catch (error) {
    return handleApiError(error, "GET /api/courses");
  }
}
