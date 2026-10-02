import Link from "next/link";
import { CircleAlert, LogIn, RefreshCcw, WifiOff } from "lucide-react";

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
  const Icon = isOffline ? WifiOff : CircleAlert;

  return (
    <div role="alert" className={cn("w-full max-w-md rounded-lg border border-line bg-card p-6 sm:p-7", className)}>
      <p className="flex items-start gap-2.5 text-lg leading-snug font-semibold text-destructive">
        <Icon aria-hidden className="mt-1 size-[18px] shrink-0" />
        {title}
      </p>
      <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
        {description ?? error?.message ?? "Đã có lỗi xảy ra. Tiến độ học của bạn không bị mất."}
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        {isUnauthorized ? (
          <Button asChild variant="outline">
            <Link href="/login">
              <LogIn />
              Đăng nhập lại
            </Link>
          </Button>
        ) : (
          onRetry && (
            <Button variant="outline" onClick={onRetry}>
              <RefreshCcw />
              {retryLabel}
            </Button>
          )
        )}
        {backHref && (
          <Button asChild variant="ghost">
            <Link href={backHref}>{backLabel}</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
