"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";

import { AuthShell } from "@/components/auth/auth-shell";
import { FormField } from "@/components/auth/form-field";
import { Button } from "@/components/ui/button";
import { api, toApiClientError } from "@/lib/api-client";
import { registerSchema } from "@/lib/validations";

type Field = "name" | "email" | "password";
type FieldErrors = Partial<Record<Field, string>>;

const FIELDS: Field[] = ["name", "email", "password"];

function toFieldErrors(issues: Array<{ path?: PropertyKey[]; field?: string; message: string }>): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of issues) {
    const key = (issue.field ?? String(issue.path?.[0] ?? "")) as Field;
    if (FIELDS.includes(key) && !errors[key]) errors[key] = issue.message;
  }
  return errors;
}

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    // Kiểm tra ngay trên trình duyệt bằng đúng schema Zod mà server dùng
    const parsed = registerSchema.safeParse({ name: name.trim() || undefined, email, password });
    if (!parsed.success) {
      setFieldErrors(toFieldErrors(parsed.error.issues));
      return;
    }
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      await api.register(parsed.data);
    } catch (error) {
      const apiError = toApiClientError(error);
      if (apiError.status === 409) setFieldErrors({ email: apiError.message });
      else if (apiError.details.length > 0) setFieldErrors(toFieldErrors(apiError.details));
      else setFormError(apiError.message);
      setIsSubmitting(false);
      return;
    }

    // Đăng ký xong thì đăng nhập luôn
    const result = await signIn("credentials", { email: parsed.data.email, password, redirect: false });
    if (!result || result.error) {
      toast.success("Đã tạo tài khoản. Mời bạn đăng nhập.");
      router.push("/login");
      return;
    }
    window.location.assign("/dashboard");
  }

  return (
    <AuthShell title="Sẵn sàng học chưa?" subtitle="Tạo tài khoản miễn phí. Mỗi ngày một bài ngắn, tiến bộ rõ sau vài tuần.">
      <div className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <FormField
            id="name"
            label="Tên của bạn"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={fieldErrors.name}
          />
          <FormField
            id="email"
            label="Email"
            type="email"
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={fieldErrors.email}
            required
          />
          <FormField
            id="password"
            label="Mật khẩu"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={fieldErrors.password}
            hint="Ít nhất 6 ký tự."
            required
          />

          {formError && (
            <p role="alert" className="rounded-md bg-danger-soft px-3 py-2.5 text-sm font-medium text-destructive">
              {formError}
            </p>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <LoaderCircle className="animate-spin" />}
            Tạo tài khoản
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Đã có tài khoản?{" "}
          <Link href="/login" className="font-semibold text-moss-strong underline decoration-line-strong underline-offset-4 hover:decoration-moss">
            Đăng nhập
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
