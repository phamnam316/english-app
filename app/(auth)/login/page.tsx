"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getProviders, signIn } from "next-auth/react";
import { LoaderCircle } from "lucide-react";

import { AuthShell } from "@/components/auth/auth-shell";
import { FormField, GoogleIcon } from "@/components/auth/form-field";
import { Button } from "@/components/ui/button";
import { AUTH_ERROR_MESSAGES, safeCallbackUrl } from "@/lib/user-display";
import { loginSchema } from "@/lib/validations";

export default function LoginPage() {
  // useSearchParams cần nằm trong Suspense
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const searchParams = useSearchParams();
  const errorCode = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(
    errorCode ? (AUTH_ERROR_MESSAGES[errorCode] ?? AUTH_ERROR_MESSAGES.default) : null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasGoogle, setHasGoogle] = useState(false);

  useEffect(() => {
    getProviders()
      .then((providers) => setHasGoogle(Boolean(providers?.google)))
      .catch(() => setHasGoogle(false));
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setFormError("Nhập email hợp lệ và mật khẩu của bạn.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await signIn("credentials", {
        email: parsed.data.email,
        password,
        redirect: false,
      });
      if (!result || result.error) {
        setFormError(AUTH_ERROR_MESSAGES.CredentialsSignin);
        setIsSubmitting(false);
        return;
      }
      // Tải lại hẳn trang để server đọc session mới
      window.location.assign(safeCallbackUrl(searchParams.get("callbackUrl")));
    } catch {
      setFormError("Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.");
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell title="Chào mừng trở lại!" subtitle="Đăng nhập để học tiếp và giữ chuỗi ngày học của bạn.">
      <div className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <FormField
            id="email"
            label="Email"
            type="email"
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <FormField
            id="password"
            label="Mật khẩu"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {formError && (
            <p role="alert" className="rounded-xl bg-danger-soft px-3 py-2 text-sm font-medium text-destructive">
              {formError}
            </p>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <LoaderCircle className="animate-spin" />}
            Đăng nhập
          </Button>
        </form>

        {hasGoogle && (
          <>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              hoặc
              <span className="h-px flex-1 bg-border" />
            </div>
            <Button
              variant="outline"
              size="lg"
              className="w-full"
              onClick={() => void signIn("google", { callbackUrl: safeCallbackUrl(searchParams.get("callbackUrl")) })}
            >
              <GoogleIcon />
              Tiếp tục với Google
            </Button>
          </>
        )}

        <p className="text-center text-sm text-muted-foreground">
          Chưa có tài khoản?{" "}
          <Link href="/register" className="font-semibold text-primary hover:underline">
            Đăng ký
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
