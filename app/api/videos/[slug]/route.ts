import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireSessionUser } from "@/lib/auth";
import { ApiError, handleApiError, parseJsonBody } from "@/lib/api-error";
import { findCatalogClip } from "@/lib/videos/catalog";
import { getVideoDetail, toSubtitleLines } from "@/lib/videos/data";
import { saveSubtitlesSchema } from "@/lib/videos/validations";
import type { SaveSubtitlesResponse, VideoDetailResponse } from "@/types/video";

interface RouteContext {
  params: Promise<{ slug: string }>;
}

async function requireClip(context: RouteContext) {
  const { slug } = await context.params;
  const clip = findCatalogClip(slug);
  if (!clip) throw new ApiError(404, "NOT_FOUND", "Không tìm thấy video.");
  return clip;
}

/**
 * GET /api/videos/:slug
 * Thông tin clip và toàn bộ câu thoại (người xem chỉ thấy câu đã căn thời gian; trang căn phụ đề cần cả câu chưa căn).
 */
export async function GET(_request: Request, context: RouteContext) {
  try {
    const user = await requireSessionUser();
    const clip = await requireClip(context);
    return NextResponse.json<VideoDetailResponse>({ clip: await getVideoDetail(clip), canEdit: user.role === "ADMIN" });
  } catch (error) {
    return handleApiError(error, "GET /api/videos/:slug");
  }
}

/**
 * PUT /api/videos/:slug
 * Body: { lines: SubtitleLine[] } -> lưu đè toàn bộ phụ đề của clip. Chỉ ADMIN.
 */
export async function PUT(request: Request, context: RouteContext) {
  try {
    const user = await requireSessionUser();
    if (user.role !== "ADMIN") {
      throw new ApiError(403, "FORBIDDEN", "Chỉ quản trị viên được sửa phụ đề.");
    }
    const clip = await requireClip(context);
    const { lines } = saveSubtitlesSchema.parse(await parseJsonBody(request));
    const data = { lines: lines as Prisma.InputJsonValue, updatedById: user.id };

    const saved = await prisma.videoSubtitle.upsert({
      where: { clipSlug: clip.slug },
      create: { clipSlug: clip.slug, ...data },
      update: data,
      select: { lines: true, updatedAt: true },
    });

    return NextResponse.json<SaveSubtitlesResponse>({
      lines: toSubtitleLines(saved.lines),
      updatedAt: saved.updatedAt.toISOString(),
    });
  } catch (error) {
    return handleApiError(error, "PUT /api/videos/:slug");
  }
}
