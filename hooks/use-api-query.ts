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
  /**
   * Khóa lưu tạm kết quả trong bộ nhớ của tab. Có khóa: quay lại trang đã xem sẽ hiện ngay dữ liệu cũ
   * (không hiện khung chờ), đồng thời vẫn tải lại ngầm để cập nhật.
   */
  cacheKey?: string;
}

/** Kết quả đã tải theo cacheKey; mất khi tải lại trang (đăng xuất / đăng nhập luôn tải lại trang) */
const queryCache = new Map<string, unknown>();

/**
 * Xóa dữ liệu lưu tạm sau khi có thay đổi (nộp bài, chơi xong, đánh giá từ) để lần mở sau không thấy số cũ.
 * Truyền tiền tố khóa, vd invalidateApiCache("courses", "practice").
 */
export function invalidateApiCache(...prefixes: string[]): void {
  for (const key of [...queryCache.keys()]) {
    if (prefixes.length === 0 || prefixes.some((prefix) => key.startsWith(prefix))) queryCache.delete(key);
  }
}

/**
 * Gọi API khi component mount hoặc khi `deps` thay đổi.
 * - Tự hủy request cũ khi rời trang / đổi tham số (không cập nhật state sau khi unmount).
 * - Lỗi được chuẩn hóa thành ApiClientError và hiện toast.
 */
export function useApiQuery<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  deps: DependencyList,
  { toastOnError = true, cacheKey }: ApiQueryOptions = {},
): ApiQueryResult<T> {
  const [data, setData] = useState<T | undefined>(() => (cacheKey ? (queryCache.get(cacheKey) as T | undefined) : undefined));
  const [error, setError] = useState<ApiClientError>();
  const [isLoading, setIsLoading] = useState(() => !(cacheKey && queryCache.has(cacheKey)));
  const [reloadToken, setReloadToken] = useState(0);

  // Luôn dùng fetcher mới nhất mà không phải đưa nó vào deps (tránh gọi API lặp vô hạn)
  const fetcherRef = useRef(fetcher);
  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  useEffect(() => {
    const controller = new AbortController();
    const cached = cacheKey ? (queryCache.get(cacheKey) as T | undefined) : undefined;
    if (cached !== undefined) {
      // Có dữ liệu cũ: hiện ngay, tải lại ngầm
      setData(cached);
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }
    setError(undefined);

    fetcherRef
      .current(controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        if (cacheKey) queryCache.set(cacheKey, result);
        setData(result);
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted || isAbortError(err)) return;
        const apiError = toApiClientError(err);
        // Đang hiện dữ liệu cũ thì giữ nguyên, chỉ báo lỗi bằng toast
        if (cached === undefined) setError(apiError);
        setIsLoading(false);
        if (toastOnError) toast.error(apiError.message);
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, reloadToken, cacheKey]);

  const refetch = useCallback(() => setReloadToken((token) => token + 1), []);

  return { data, error, isLoading, refetch };
}
