"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  Input,
  Button,
} from "@/components/ui";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useSearchDepots } from "@/hooks";

interface DepotSearchSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  /** Label to show when selected depot is not present in current search results */
  selectedLabel?: string;
}

export function DepotSearchSelect({
  value,
  onValueChange,
  placeholder = "Выберите депо",
  disabled = false,
  selectedLabel,
}: DepotSearchSelectProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const { data: searchResults, isLoading } = useSearchDepots(searchTerm);

  // Pagination logic
  const paginatedResults = useMemo(() => {
    if (!searchResults) return [];
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return searchResults.slice(startIndex, endIndex);
  }, [searchResults, currentPage]);

  const totalPages = useMemo(() => {
    if (!searchResults) return 0;
    return Math.ceil(searchResults.length / pageSize);
  }, [searchResults]);

  // Reset page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Find selected depot name
  const selectedDepot = searchResults?.find((d) => d.id === value);
  const displayLabel =
    selectedDepot?.shortName || selectedLabel || (value ? "…" : placeholder);
  const resultsWithSelected = useMemo(() => {
    if (!value || !selectedLabel) return paginatedResults;
    if (paginatedResults.some((depot) => depot.id === value)) return paginatedResults;
    if (searchResults?.some((depot) => depot.id === value)) return paginatedResults;

    return [
      { id: value, shortName: selectedLabel, name: selectedLabel },
      ...paginatedResults,
    ];
  }, [paginatedResults, searchResults, selectedLabel, value]);

  return (
    <Select value={value || undefined} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger>
        {/* Render label explicitly: SelectValue stays empty when SelectItem is not mounted */}
        <span className={value || selectedLabel ? "truncate" : "truncate text-muted-foreground"}>
          {displayLabel}
        </span>
      </SelectTrigger>
      <SelectContent>
        {/* Search input */}
        <div className="flex items-center gap-2 p-2 border-b sticky top-0 bg-white dark:bg-gray-950 z-10">
          <Search className="h-4 w-4 text-gray-400" />
          <Input
            placeholder="Поиск по названию..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-8 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            onKeyUp={(e) => e.stopPropagation()}
          />
        </div>

        {/* Results */}
        <div className="max-h-[300px] overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-gray-500">
              Загрузка...
            </div>
          ) : resultsWithSelected.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">
              {searchTerm ? "Депо не найдено" : "Нет доступных депо"}
            </div>
          ) : (
            resultsWithSelected.map((depot) => (
              <SelectItem key={depot.id} value={depot.id}>
                {depot.shortName}
              </SelectItem>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center gap-2 p-2 border-t sticky bottom-0 bg-white dark:bg-gray-950">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentPage((prev) => Math.max(1, prev - 1));
              }}
              disabled={currentPage === 1}
              className="h-7 px-2"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentPage((prev) => Math.min(totalPages, prev + 1));
              }}
              disabled={currentPage === totalPages}
              className="h-7 px-2"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </SelectContent>
    </Select>
  );
}
