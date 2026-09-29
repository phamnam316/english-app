"use client";

import { useEffect } from "react";

import { ErrorState } from "@/components/error-state";

/**
 * Error boundary cho nhóm trang (dashboard): bắt lỗi khi render (lỗi code, dữ liệu bất thường...)
 * để cả ứng dụng không bị trắng trang. Lỗi gọi API đã được xử lý riêng ở từng trang.
 */
export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <ErrorState
        title="Trang này gặp sự cố"
        description="Đã có lỗi khi hiển thị trang. Hãy thử tải lại, nếu vẫn lỗi thì quay về trang chủ."
        onRetry={reset}
        retryLabel="Tải lại trang"
        backHref="/dashboard"
      />
    </main>
  );
}
