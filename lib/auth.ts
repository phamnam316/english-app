import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import bcrypt from "bcryptjs";
import type { Role } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { loginSchema } from "@/lib/validations";
import { getDisplayStreak } from "@/lib/streak";

/** Số vòng băm bcrypt. 12 là mức cân bằng giữa an toàn và tốc độ hiện nay */
export const BCRYPT_SALT_ROUNDS = 12;

/**
 * Chu kỳ đồng bộ role/xp/streak từ DB vào JWT.
 * JWT được lưu trong cookie nên không tự cập nhật khi DB thay đổi (ví dụ vừa được
 * cộng XP). Mỗi khi session được đọc, nếu dữ liệu trong token cũ hơn 60 giây thì
 * nạp lại từ DB: tốn tối đa 1 truy vấn theo khóa chính mỗi phút cho mỗi user.
 */
const TOKEN_SYNC_INTERVAL_MS = 60_000;

/**
 * Hash giả dùng khi email không tồn tại. Nhờ vẫn chạy bcrypt.compare, thời gian
 * phản hồi của "sai email" và "sai mật khẩu" như nhau -> kẻ tấn công không dò
 * được email nào đã đăng ký dựa vào tốc độ phản hồi.
 * Là hằng số (bcrypt cost 12 của 1 chuỗi bất kỳ) thay vì tính lúc khởi động: hashSync mất ~0,25 giây
 * và chạy lại ở mỗi lần serverless function khởi động lạnh.
 */
const DUMMY_PASSWORD_HASH = "$2b$12$hr3lTnYdE/uDic25F.AbTu87hvT4ZUpGxrpt9H/iauzlsevfpt54m";

const googleProvider =
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? [
        GoogleProvider({
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
      ]
    : [];

export const authOptions: NextAuthOptions = {
  // Adapter lưu User/Account vào PostgreSQL khi đăng nhập bằng Google lần đầu
  adapter: PrismaAdapter(prisma),

  // Credentials Provider chỉ hoạt động với chiến lược JWT (không dùng bảng Session)
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 ngày
  },

  pages: {
    signIn: "/login",
  },

  providers: [
    ...googleProvider,
    CredentialsProvider({
      id: "credentials",
      name: "Email và mật khẩu",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mật khẩu", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { email },
          select: { id: true, name: true, email: true, image: true, passwordHash: true },
        });

        // Luôn chạy bcrypt.compare, kể cả khi không có user (xem DUMMY_PASSWORD_HASH)
        const isPasswordValid = await bcrypt.compare(
          password,
          user?.passwordHash ?? DUMMY_PASSWORD_HASH,
        );

        // user.passwordHash = null: tài khoản tạo bằng Google, chưa đặt mật khẩu
        if (!user?.passwordHash || !isPasswordValid) return null;

        return { id: user.id, name: user.name, email: user.email, image: user.image };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, trigger }) {
      // Lúc đăng nhập: `user` có giá trị. Các lần sau: id nằm trong token.sub
      const userId = user?.id ?? token.sub;
      if (!userId) return token;

      const isStale =
        !token.syncedAt || Date.now() - token.syncedAt > TOKEN_SYNC_INTERVAL_MS;

      // Nạp lại từ DB khi: vừa đăng nhập, client gọi update({}) từ useSession, hoặc token đã cũ
      if (user || trigger === "update" || isStale) {
        const dbUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { role: true, xp: true, streak: true, lastActiveAt: true },
        });

        if (dbUser) {
          token.sub = userId;
          token.role = dbUser.role;
          token.xp = dbUser.xp;
          token.streak = getDisplayStreak(dbUser.streak, dbUser.lastActiveAt);
          token.syncedAt = Date.now();
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.role = token.role ?? "USER";
        session.user.xp = token.xp ?? 0;
        session.user.streak = token.streak ?? 0;
      }
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};

/** Lấy session ở Server Component / Route Handler */
export function getAuthSession() {
  return getServerSession(authOptions);
}

export interface SessionUser {
  id: string;
  role: Role;
}

/**
 * Dùng trong Route Handler cần đăng nhập: trả về { id, role }, hoặc ném ApiError 401.
 * Không dùng xp/streak trong session để tính toán: các giá trị đó luôn đọc lại từ DB.
 */
export async function requireSessionUser(): Promise<SessionUser> {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  if (!user?.id) {
    throw new ApiError(401, "UNAUTHORIZED", "Bạn cần đăng nhập để thực hiện thao tác này.");
  }
  return { id: user.id, role: user.role };
}
