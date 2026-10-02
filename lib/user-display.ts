interface DisplayUser {
  name?: string | null;
  email?: string | null;
}

/**
 * Tên để chào: người Việt gọi bằng tên (từ cuối cùng), vd "Nguyễn Văn Nam" -> "Nam";
 * tên chỉ có 1–2 từ thì giữ nguyên ("Minh Anh", "User A").
 * Chưa có tên thì dùng phần trước @ của email.
 */
export function getGreetingName(user: DisplayUser | undefined): string {
  const name = user?.name?.trim();
  if (name) {
    const words = name.split(/\s+/);
    return words.length <= 2 ? name : (words.at(-1) ?? name);
  }
  const emailName = user?.email?.split("@")[0];
  return emailName || "bạn";
}

/**
 * Chữ viết tắt trong avatar khi user chưa có ảnh: chữ đầu của 2 từ cuối trong tên
 * ("Trần Minh Anh" -> "MA"), chưa có tên thì chữ đầu của email.
 */
export function getAvatarInitial(user: DisplayUser | undefined): string {
  const words = user?.name?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (words.length >= 2) return words.slice(-2).map((w) => w.charAt(0).toUpperCase()).join("");
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
