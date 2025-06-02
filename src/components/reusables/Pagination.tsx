"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
  className?: string;
}

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  className = "",
}: PaginationProps) {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, "...");
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push("...", totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-4 ${className}`}
    >
      {/* Items per page selector */}
      <div className="flex items-center gap-2 text-sm text-gray-300">
        <span>Show</span>
        <Select
          value={itemsPerPage.toString()}
          onValueChange={(value) => onItemsPerPageChange(Number(value))}
        >
          <SelectTrigger className="w-20 bg-[#1A1A1A] border-gray-600 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#2A2A2A] border-gray-600">
            {PAGE_SIZE_OPTIONS.map((size) => (
              <SelectItem
                key={size}
                value={size.toString()}
                className="text-white hover:bg-[#1A1A1A]"
              >
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span>per page</span>
      </div>

      {/* Page info */}
      <div className="text-sm text-gray-300">
        Showing {startItem}-{endItem} of {totalItems} items
      </div>

      {/* Page navigation */}
      <div className="flex items-center gap-1">
        {/* First page */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="text-gray-300 hover:text-white hover:bg-[#2A2A2A] disabled:opacity-50"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>

        {/* Previous page */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="text-gray-300 hover:text-white hover:bg-[#2A2A2A] disabled:opacity-50"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Page numbers */}
        {getVisiblePages().map((page, index) => (
          <div key={index}>
            {page === "..." ? (
              <span className="px-3 py-1 text-gray-500">...</span>
            ) : (
              <Button
                variant={currentPage === page ? "default" : "ghost"}
                size="sm"
                onClick={() => onPageChange(page as number)}
                className={
                  currentPage === page
                    ? "bg-orange-500 text-white hover:bg-orange-600"
                    : "text-gray-300 hover:text-white hover:bg-[#2A2A2A]"
                }
              >
                {page}
              </Button>
            )}
          </div>
        ))}

        {/* Next page */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="text-gray-300 hover:text-white hover:bg-[#2A2A2A] disabled:opacity-50"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        {/* Last page */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="text-gray-300 hover:text-white hover:bg-[#2A2A2A] disabled:opacity-50"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
