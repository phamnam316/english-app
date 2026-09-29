/**
 * Chuẩn lỗi dùng chung cho mọi API: { error: { code, message, details } }.
 * File này được import cả ở client (lib/api-client.ts) nên chỉ dùng next/server trong hàm server.
 */
import { NextResponse } from "next/server";
import { ZodError } from "zod";

export interface ApiErrorDetail {
  /** Tên trường bị lỗi, vd "email" */
  field: string;
  message: string;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: ApiErrorDetail[];
  };
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details: ApiErrorDetail[] = [],
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function errorResponse(status: number, code: string, message: string, details: ApiErrorDetail[] = []) {
  return NextResponse.json<ApiErrorBody>(
    { error: { code, message, ...(details.length > 0 ? { details } : {}) } },
    { status },
  );
}

/** Đọc body JSON; body rỗng hoặc sai cú pháp -> 400 thay vì 500 */
export async function parseJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ApiError(400, "INVALID_JSON", "Dữ liệu gửi lên không phải JSON hợp lệ.");
  }
}

/** Chuyển mọi lỗi thành response JSON chuẩn. `context` chỉ dùng để ghi log */
export function handleApiError(error: unknown, context: string) {
  if (error instanceof ApiError) {
    return errorResponse(error.status, error.code, error.message, error.details);
  }

  if (error instanceof ZodError) {
    const details = error.issues.map((issue) => ({
      field: issue.path.map(String).join(".") || "body",
      message: issue.message,
    }));
    return errorResponse(400, "VALIDATION_ERROR", details[0]?.message ?? "Dữ liệu không hợp lệ.", details);
  }

  console.error(`[${context}]`, error);
  return errorResponse(500, "INTERNAL_ERROR", "Máy chủ đang gặp sự cố. Thử lại sau ít phút.");
}
