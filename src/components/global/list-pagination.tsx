"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

// SOT:list-pagination
// WHAT: Page navigation — pushes ?page= via SPA navigation.
// WHY:  50-per-page paging shared by both list pages.
// HOW:  Links carry real hrefs; clicks intercepted for router.push.
// WHERE: Below /leads and /pipeline grids.

function pageNumbers(page: number, totalPages: number): Array<number | "…"> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const window = [page - 1, page, page + 1].filter((n) => n > 1 && n < totalPages);
  const set = new Set<number | "…">([1, ...window, totalPages]);
  const sorted = [...set].filter((n): n is number => n !== "…").sort((a, b) => a - b);
  const out: Array<number | "…"> = [];
  let prev = 0;
  for (const n of sorted) {
    if (n - prev > 1) out.push("…");
    out.push(n);
    prev = n;
  }
  return out;
}

export function ListPagination({ page, totalPages }: { page: number; totalPages: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  if (totalPages <= 1) return null;

  function hrefFor(target: number): string {
    const next = new URLSearchParams(params.toString());
    next.set("page", String(target));
    return `${pathname}?${next.toString()}`;
  }

  function go(e: React.MouseEvent, target: number) {
    e.preventDefault();
    if (target !== page) router.push(hrefFor(target));
  }

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href={hrefFor(Math.max(1, page - 1))}
            onClick={(e) => go(e, Math.max(1, page - 1))}
            aria-disabled={page === 1}
            className={page === 1 ? "pointer-events-none opacity-50" : undefined}
          />
        </PaginationItem>
        {pageNumbers(page, totalPages).map((n, i) =>
          n === "…" ? (
            <PaginationItem key={`gap-${i}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={n}>
              <PaginationLink href={hrefFor(n)} isActive={n === page} onClick={(e) => go(e, n)}>
                {n}
              </PaginationLink>
            </PaginationItem>
          ),
        )}
        <PaginationItem>
          <PaginationNext
            href={hrefFor(Math.min(totalPages, page + 1))}
            onClick={(e) => go(e, Math.min(totalPages, page + 1))}
            aria-disabled={page === totalPages}
            className={page === totalPages ? "pointer-events-none opacity-50" : undefined}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
