import { NextResponse } from "next/server";

import { requireSessionUser } from "@/lib/auth";
import { handleApiError } from "@/lib/api-error";
import { getVideoSummaries } from "@/lib/videos/data";
import type { VideoListResponse } from "@/types/video";

/**
 * GET /api/videos
 * Danh sách clip của trang Xem phim, kèm số câu phụ đề đã căn thời gian của từng clip.
 */
export async function GET() {
  try {
    const user = await requireSessionUser();
    const clips = await getVideoSummaries();
    return NextResponse.json<VideoListResponse>({ clips, canEdit: user.role === "ADMIN" });
  } catch (error) {
    return handleApiError(error, "GET /api/videos");
  }
}
