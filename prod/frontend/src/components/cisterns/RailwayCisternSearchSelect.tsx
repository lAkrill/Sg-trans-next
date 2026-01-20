"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Input,
  Button,
} from "@/components/ui";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useSearchCisterns } from "@/hooks";

interface RailwayCisternSearchSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function RailwayCisternSearchSelect({
  value,
  onValueChange,
  placeholder = "Выберите вагон",
  disabled = false,
}: RailwayCisternSearchSelectProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const { data: searchResults, isLoading } = useSearchCisterns(searchTerm, searchTerm.length > 0);

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

  // Find selected cistern name
  const selectedCistern = searchResults?.find((c) => c.id === value);

  return (
    <Select value={value || ""} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder}>
          {selectedCistern ? `Вагон ${selectedCistern.number}` : placeholder}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {/* Search input */}
        <div className="flex items-center gap-2 p-2 border-b sticky top-0 bg-white dark:bg-gray-950 z-10">
          <Search className="h-4 w-4 text-gray-400" />
          <Input
            placeholder="Поиск по номеру..."
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
            <div className="p-2 text-sm text-gray-500">Загрузка...</div>
          ) : paginatedResults.length > 0 ? (
            paginatedResults.map((cistern) => (
              <SelectItem key={cistern.id} value={cistern.id}>
                Вагон {cistern.number}
              </SelectItem>
            ))
          ) : searchTerm ? (
            <div className="p-2 text-sm text-gray-500">Ничего не найдено</div>
          ) : (
            <div className="p-2 text-sm text-gray-500">Начните вводить номер вагона...</div>
          )}
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 p-2 border-t">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-gray-600">
              {currentPage} / {totalPages}
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </SelectContent>
    </Select>
  );
}
