interface DisplayUser {
  name?: string | null;
  email?: string | null;
}

/**
 * Tên để chào: người Việt gọi bằng tên (từ cuối cùng), vd "Nguyễn Văn Nam" -> "Nam".
 * Chưa có tên thì dùng phần trước @ của email.
 */
export function getGreetingName(user: DisplayUser | undefined): string {
  const name = user?.name?.trim();
  if (name) return name.split(/\s+/).at(-1) ?? name;
  const emailName = user?.email?.split("@")[0];
  return emailName || "bạn";
}

/** Chữ cái hiển thị trong avatar khi user chưa có ảnh */
export function getAvatarInitial(user: DisplayUser | undefined): string {
  return getGreetingName(user).charAt(0).toUpperCase() || "?";
}

/** Đường dẫn quay lại sau đăng nhập: chỉ chấp nhận đường dẫn nội bộ (chống open redirect) */
export function safeCallbackUrl(value: string | null, fallback = "/dashboard"): string {
  if (!value || typeof window === "undefined") return fallback;
  try {
    const url = new URL(value, window.location.origin);
    if (url.origin !== window.location.origin) return fallback;
    const path = `${url.pathname}${url.search}${url.hash}`;
    return path.startsWith("/login") || path.startsWith("/register") ? fallback : path;
  } catch {
    return fallback;
  }
}

/** Thông báo cho mã lỗi NextAuth trả về qua ?error= */
export const AUTH_ERROR_MESSAGES: Record<string, string> = {
  CredentialsSignin: "Email hoặc mật khẩu không đúng.",
  OAuthAccountNotLinked: "Email này đã được đăng ký bằng mật khẩu. Hãy đăng nhập bằng email và mật khẩu.",
  SessionRequired: "Vui lòng đăng nhập để tiếp tục.",
  default: "Đăng nhập không thành công. Vui lòng thử lại.",
};
