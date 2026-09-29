"use client";

import { useCallback, useEffect, useRef, useState, type DependencyList } from "react";
import { toast } from "sonner";

import { isAbortError, toApiClientError, type ApiClientError } from "@/lib/api-client";

export interface ApiQueryResult<T> {
  data: T | undefined;
  error: ApiClientError | undefined;
  isLoading: boolean;
  /** Gọi lại API (nút "Thử lại") */
  refetch: () => void;
}

interface ApiQueryOptions {
  /** Hiện toast khi lỗi (mặc định bật) */
  toastOnError?: boolean;
}

/**
 * Gọi API khi component mount hoặc khi `deps` thay đổi.
 * - Tự hủy request cũ khi rời trang / đổi tham số (không cập nhật state sau khi unmount).
 * - Lỗi được chuẩn hóa thành ApiClientError và hiện toast.
 */
export function useApiQuery<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  deps: DependencyList,
  { toastOnError = true }: ApiQueryOptions = {},
): ApiQueryResult<T> {
  const [data, setData] = useState<T>();
  const [error, setError] = useState<ApiClientError>();
  const [isLoading, setIsLoading] = useState(true);
  const [reloadToken, setReloadToken] = useState(0);

  // Luôn dùng fetcher mới nhất mà không phải đưa nó vào deps (tránh gọi API lặp vô hạn)
  const fetcherRef = useRef(fetcher);
  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setError(undefined);

    fetcherRef
      .current(controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        setData(result);
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted || isAbortError(err)) return;
        const apiError = toApiClientError(err);
        setError(apiError);
        setIsLoading(false);
        if (toastOnError) toast.error(apiError.message);
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, reloadToken]);

  const refetch = useCallback(() => setReloadToken((token) => token + 1), []);

  return { data, error, isLoading, refetch };
}
