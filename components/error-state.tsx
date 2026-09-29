import Link from "next/link";
import { LogIn, RefreshCcw, TriangleAlert, WifiOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ApiClientError } from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  title: string;
  /** Mặc định lấy message của lỗi API */
  description?: string;
  error?: ApiClientError;
  onRetry?: () => void;
  retryLabel?: string;
  backHref?: string;
  backLabel?: string;
  className?: string;
}

/**
 * Khối báo lỗi dùng chung: nói rõ chuyện gì xảy ra và cho user một việc để làm tiếp
 * (thử lại, đăng nhập lại hoặc quay về trang trước).
 */
export function ErrorState({
  title,
  description,
  error,
  onRetry,
  retryLabel = "Thử lại",
  backHref,
  backLabel = "Về trang chủ",
  className,
}: ErrorStateProps) {
  const isOffline = error?.status === 0;
  const isUnauthorized = error?.status === 401;
  const Icon = isOffline ? WifiOff : TriangleAlert;

  return (
    <div
      role="alert"
      className={cn(
        "mx-auto flex w-full max-w-md flex-col items-center gap-4 rounded-3xl border border-border/70 bg-card px-6 py-10 text-center shadow-soft",
        className,
      )}
    >
      <span className="grid size-14 place-items-center rounded-2xl bg-danger-soft text-destructive">
        <Icon className="size-7" />
      </span>
      <div className="space-y-1.5">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">{description ?? error?.message}</p>
      </div>
      <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-center">
        {backHref && (
          <Button asChild variant="outline">
            <Link href={backHref}>{backLabel}</Link>
          </Button>
        )}
        {isUnauthorized ? (
          <Button asChild>
            <Link href="/login">
              <LogIn />
              Đăng nhập lại
            </Link>
          </Button>
        ) : (
          onRetry && (
            <Button onClick={onRetry}>
              <RefreshCcw />
              {retryLabel}
            </Button>
          )
        )}
      </div>
    </div>
  );
}
