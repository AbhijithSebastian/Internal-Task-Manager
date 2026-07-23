import { useState, useCallback } from "react";
import { getPageNumbers } from "@/utils/pagination";

interface UsePaginationOptions {
  initialPage?: number;
  totalItems?: number;
  perPage?: number;
}

export function usePagination({ initialPage = 1, totalItems = 0, perPage = 20 }: UsePaginationOptions = {}) {
  const [page, setPage] = useState(initialPage);
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
  const pageNumbers = getPageNumbers(page, totalPages);

  const goToPage = useCallback((p: number) => {
    setPage(Math.max(1, Math.min(p, totalPages)));
  }, [totalPages]);

  const nextPage = useCallback(() => goToPage(page + 1), [page, goToPage]);
  const prevPage = useCallback(() => goToPage(page - 1), [page, goToPage]);

  return {
    page,
    setPage: goToPage,
    nextPage,
    prevPage,
    totalPages,
    pageNumbers,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}
