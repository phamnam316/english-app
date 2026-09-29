import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { BCRYPT_SALT_ROUNDS } from "@/lib/auth";
import { ApiError, handleApiError, parseJsonBody } from "@/lib/api-error";
import { registerSchema } from "@/lib/validations";
import type { RegisterResponse } from "@/types/api";

const emailTakenError = () => new ApiError(409, "EMAIL_TAKEN", "Email này đã được đăng ký.");

/**
 * POST /api/auth/register
 * Body: { name?: string, email: string, password: string }
 *
 * 201 - { user }
 * 400 - Body sai (details theo từng trường)
 * 409 - Email đã tồn tại
 */
export async function POST(request: Request) {
  try {
    const body = await parseJsonBody(request);
    const { name, email, password } = registerSchema.parse(body);

    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) throw emailTakenError();

    const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    const user = await prisma.user
      .create({
        data: { name, email, passwordHash },
        select: { id: true, name: true, email: true, role: true, xp: true, streak: true, createdAt: true },
      })
      .catch((error: unknown) => {
        // 2 request đăng ký cùng email gửi đồng thời: request sau vấp ràng buộc unique
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") throw emailTakenError();
        throw error;
      });

    return NextResponse.json<RegisterResponse>(
      { user: { ...user, createdAt: user.createdAt.toISOString() } },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error, "POST /api/auth/register");
  }
}
