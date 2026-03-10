"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({
  totalPages,
  currentPage,
}: {
  totalPages: number;
  currentPage: number;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  const createPageUrl = (pageNumber: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };

  return (
    <div className="flex items-center justify-center gap-2 mt-16 pb-8">
      {currentPage > 1 ? (
        <Link
          href={createPageUrl(currentPage - 1)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white ring-1 ring-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all"
        >
          <ChevronLeft size={18} />
        </Link>
      ) : (
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 ring-1 ring-slate-100 text-slate-300 cursor-not-allowed">
          <ChevronLeft size={18} />
        </div>
      )}

      {[...Array(totalPages)].map((_, i) => {
        const page = i + 1;
        
        if (
          page === 1 ||
          page === totalPages ||
          (page >= currentPage - 1 && page <= currentPage + 1)
        ) {
          return (
            <Link
              key={page}
              href={createPageUrl(page)}
              className={`flex h-10 min-w-[40px] px-2 items-center justify-center rounded-full text-sm font-semibold transition-all ${
                currentPage === page
                  ? "bg-primary text-white shadow-sm ring-1 ring-primary"
                  : "bg-white ring-1 ring-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {page}
            </Link>
          );
        }

        if (page === currentPage - 2 || page === currentPage + 2) {
          return <span key={page} className="text-slate-400 px-1">...</span>;
        }

        return null;
      })}

      {currentPage < totalPages ? (
        <Link
          href={createPageUrl(currentPage + 1)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white ring-1 ring-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all"
        >
          <ChevronRight size={18} />
        </Link>
      ) : (
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 ring-1 ring-slate-100 text-slate-300 cursor-not-allowed">
          <ChevronRight size={18} />
        </div>
      )}
    </div>
  );
}
