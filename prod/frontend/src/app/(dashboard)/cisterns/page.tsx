"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
  Button, 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow, 
  Skeleton,
  AutocompleteInput
} from "@/components/ui";
import {
  Plus,
  Search,
  Train,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import {
  useCisterns,
  useDeleteCistern,
  useSearchCisterns,
  useCisternNumbers,
  useCisternFilterWithPagination,
  useDebounce,
} from "@/hooks";
import { cisternsApi } from "@/api/cisterns";
import { CisternFilters } from "@/components/cisterns/cistern-filters";
import type {
  CisternsFilter,
  RailwayCisternDetailDTO,
  RailwayCisternListDTO,
  FilterCriteria,
  SortCriteria,
  RailwayCisternFilterSortDTO,
} from "@/types/cisterns";

// Type for display in table - can be either detailed or list DTO
type DisplayCistern = RailwayCisternDetailDTO | RailwayCisternListDTO;

// Helper function to safely get display values
const getDisplayValue = (cistern: DisplayCistern, field: string): string => {
  // Convert field name to camelCase property name
  const toCamelCase = (str: string) => {
    return str
      .split(".")
      .map((part, index) => (index === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)))
      .join("");
  };

  const propertyName = toCamelCase(field);

  // Try to get value from the object directly (for dynamic objects from filter API)
  if (cistern && typeof cistern === "object" && propertyName in cistern) {
    const value = (cistern as unknown as Record<string, unknown>)[propertyName];
    if (value == null) return "";

    // Format dates
    if (field.includes("date") && typeof value === "string") {
      return new Date(value).toLocaleDateString("ru-RU");
    }

    return String(value);
  }

  const detailCistern = cistern as RailwayCisternDetailDTO;
  switch (field) {
    case "number":
      return detailCistern.number;
    case "manufacturer.name":
      return detailCistern.manufacturer?.name || "";
    case "builddate":
      return new Date(detailCistern.buildDate).toLocaleDateString("ru-RU");
    case "type.name":
      return detailCistern.type?.name || "";
    case "model.name":
      return detailCistern.model?.name || "";
    case "owner.name":
      return detailCistern.owner?.name || "";
    case "railwaycisternstatus.name":
      return detailCistern.railwayCisternStatus?.name || "";
    case "affiliation.value":
      return detailCistern.affiliation?.value || "";
    case "axlecount":
      return detailCistern.axleCount?.toString() || "";
    case "volume":
      return detailCistern.volume?.toString() || "";
    case "fillingvolume":
      return detailCistern.fillingVolume?.toString() || "";
    case "loadcapacity":
      return detailCistern.loadCapacity?.toString() || "";
    case "tareweight":
      return detailCistern.tareWeight?.toString() || "";
    case "substance":
      return detailCistern.substance || "";
    case "serialnumber":
      return detailCistern.serialNumber || "";
    case "registrationnumber":
      return detailCistern.registrationNumber || "";
    case "dangerclass":
      return detailCistern.dangerClass?.toString() || "";
    case "servicelifeyears":
      return detailCistern.serviceLifeYears?.toString() || "";
    case "length":
      return detailCistern.length?.toString() || "";
    case "commissioningdate":
      return detailCistern.commissioningDate
        ? new Date(detailCistern.commissioningDate).toLocaleDateString("ru-RU")
        : "";
    case "registrationdate":
      return detailCistern.registrationDate ? new Date(detailCistern.registrationDate).toLocaleDateString("ru-RU") : "";
    case "createdat":
      return detailCistern.createdAt ? new Date(detailCistern.createdAt).toLocaleDateString("ru-RU") : "";
    case "updatedat":
      return detailCistern.updatedAt ? new Date(detailCistern.updatedAt).toLocaleDateString("ru-RU") : "";
    default:
      return "";
  }
};

export default function CisternsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<CisternsFilter>({
    page: 1,
    pageSize: 10,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [isFilterMode, setIsFilterMode] = useState(false);
  // Client-side pagination for search results
  const [searchPage, setSearchPage] = useState(1);
  const [searchPageSize, setSearchPageSize] = useState(10);
  // Advanced filters state
  const [advancedFilters, setAdvancedFilters] = useState<FilterCriteria>({});
  const [sortFields, setSortFields] = useState<SortCriteria[]>([]);
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    "number",
    "manufacturer.name",
    "builddate",
    "type.name",
    "model.name",
    "owner.name",
    "registrationnumber",
    "railwaycisternstatus.name",
  ]);

  // Debounce search term for API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Build filter request for advanced filters
  const filterRequest: RailwayCisternFilterSortDTO = useMemo(
    () => ({
      filters: advancedFilters,
      sortFields: sortFields,
      selectedColumns: visibleColumns,
      page: filter.page,
      pageSize: filter.pageSize,
    }),
    [advancedFilters, sortFields, visibleColumns, filter.page, filter.pageSize]
  );

  const { data: cisternsData, isLoading, error } = useCisterns(isSearchMode || isFilterMode ? undefined : filter);
  const {
    data: searchResults,
    isLoading: isSearchLoading,
    error: searchError,
  } = useSearchCisterns(debouncedSearchTerm, isSearchMode);
  const {
    data: filterResults,
    isLoading: isFilterLoading,
    error: filterError,
  } = useCisternFilterWithPagination(filterRequest, isFilterMode && !isSearchMode);

  useEffect(() => {
    console.log(filterResults);
  }, [filterResults]);

  // Autocomplete for cistern numbers (only when typing)
  const { data: allCisternNumbers = [], isLoading: isLoadingNumbers } = useCisternNumbers();

  // Отсортированные и отфильтрованные предложения номеров
  const sortedNumberSuggestions = useMemo(() => {
    if (!searchTerm.trim()) {
      // Если нет поискового запроса, возвращаем первые 10 номеров отсортированные по алфавиту
      return allCisternNumbers
        .slice()
        .sort((a, b) => a.localeCompare(b, "ru", { numeric: true }))
        .slice(0, 10);
    }

    const searchLower = searchTerm.toLowerCase();

    // Фильтруем только номера, которые НАЧИНАЮТСЯ с введенного текста
    const filtered = allCisternNumbers.filter((number) => number.toLowerCase().startsWith(searchLower));

    // Сортируем по алфавиту (с учетом числовых значений)
    return filtered.sort((a, b) => a.localeCompare(b, "ru", { numeric: true })).slice(0, 15); // Ограничиваем количество предложений
  }, [allCisternNumbers, searchTerm]);

  const deleteMutation = useDeleteCistern();

  // Switch between search, filter and normal mode based on search term and filters
  useEffect(() => {
    const hasSearchTerm = debouncedSearchTerm.trim().length > 0;
    const hasFilters = Object.keys(advancedFilters).length > 0 || sortFields.length > 0;

    setIsSearchMode(hasSearchTerm);
    setIsFilterMode(hasFilters && !hasSearchTerm);

    // Reset pagination when switching modes
    if (hasSearchTerm) {
      setSearchPage(1);
    } else if (hasFilters) {
      setFilter((prev) => ({ ...prev, page: 1 }));
    }
  }, [debouncedSearchTerm, advancedFilters, sortFields]);

  // Client-side pagination for search results
  const paginatedSearchResults =
    isSearchMode && searchResults
      ? searchResults.slice((searchPage - 1) * searchPageSize, searchPage * searchPageSize)
      : [];

  const searchTotalPages = isSearchMode && searchResults ? Math.ceil(searchResults.length / searchPageSize) : 0;

  // Determine which data to display and loading state
  const displayData = isSearchMode
    ? paginatedSearchResults
    : isFilterMode
    ? filterResults?.railwayCisterns
    : cisternsData?.railwayCisterns;

  const displayLoading = isSearchMode ? isSearchLoading : isFilterMode ? isFilterLoading : isLoading;

  const displayError = isSearchMode ? searchError : isFilterMode ? filterError : error;

  const totalCount = isSearchMode
    ? searchResults?.length || 0
    : isFilterMode
    ? filterResults?.totalCount || 0
    : cisternsData?.totalCount || 0;

  const currentPage = isSearchMode
    ? searchPage
    : isFilterMode
    ? filterResults?.currentPage || 1
    : cisternsData?.currentPage || 1;

  const totalPages = isSearchMode
    ? searchTotalPages
    : isFilterMode
    ? filterResults?.totalPages || 1
    : cisternsData?.totalPages || 1;

  const pageSize = isSearchMode
    ? searchPageSize
    : isFilterMode
    ? filterResults?.pageSize || 10
    : cisternsData?.pageSize || 10;
  const handleSearch = useCallback((value: string) => {
    setSearchTerm(value);
    // Reset pagination when searching
    if (!value.trim()) {
      setFilter((prev) => ({ ...prev, page: 1 }));
    } else {
      setSearchPage(1);
    }
  }, []);

  // Функция для поиска цистерны по номеру и перехода к её паспорту
  const handleCisternSelect = useCallback(
    async (cisternNumber: string) => {
      try {
        // Сначала выполняем поиск, чтобы найти ID цистерны по номеру
        const searchResults = await cisternsApi.search(cisternNumber);
        const exactMatch = searchResults.find(
          (cistern: RailwayCisternDetailDTO) => cistern.number.toLowerCase() === cisternNumber.toLowerCase()
        );

        if (exactMatch) {
          // Переходим к паспорту цистерны
          router.push(`/cisterns/${exactMatch.id}`);
        } else {
          // Если точного совпадения нет, выполняем обычный поиск
          setSearchTerm(cisternNumber);
          setSearchPage(1);
        }
      } catch (error) {
        console.error("Error searching for cistern:", error);
        // В случае ошибки выполняем обычный поиск
        setSearchTerm(cisternNumber);
        setSearchPage(1);
      }
    },
    [router]
  );

  const handlePageChange = (page: number) => {
    if (isSearchMode) {
      setSearchPage(page);
    } else if (isFilterMode) {
      setFilter((prev) => ({ ...prev, page }));
    } else {
      setFilter((prev) => ({ ...prev, page }));
    }
  };

  const handlePageSizeChange = (newPageSize: number) => {
    if (isSearchMode) {
      setSearchPageSize(newPageSize);
      setSearchPage(1);
    } else if (isFilterMode) {
      setFilter((prev) => ({ ...prev, pageSize: newPageSize, page: 1 }));
    } else {
      setFilter((prev) => ({ ...prev, pageSize: newPageSize, page: 1 }));
    }
  };

  // Filter handlers
  const handleFiltersChange = useCallback((newFilters: FilterCriteria) => {
    setAdvancedFilters(newFilters);
  }, []);

  const handleSortFieldsChange = useCallback((newSortFields: SortCriteria[]) => {
    setSortFields(newSortFields);
  }, []);

  const handleVisibleColumnsChange = useCallback((newVisibleColumns: string[]) => {
    setVisibleColumns(newVisibleColumns);
  }, []);

  const handleApplyFilters = useCallback(() => {
    // Filters will be applied automatically via useEffect when advancedFilters or sortFields change
    setFilter((prev) => ({ ...prev, page: 1 }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setAdvancedFilters({});
    setSortFields([]);
    setVisibleColumns([
      "number",
      "manufacturer.name",
      "builddate",
      "type.name",
      "model.name",
      "owner.name",
      "registrationnumber",
      "railwaycisternstatus.name",
    ]);
    setFilter((prev) => ({ ...prev, page: 1 }));
  }, []);

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;

    // Count non-empty filter values
    Object.values(advancedFilters).forEach((value) => {
      if (value !== undefined && value !== null && value !== "") {
        if (Array.isArray(value) && value.length > 0) count++;
        else if (typeof value === "object" && value !== null) {
          // For range objects, check if any property is set
          const rangeValues = Object.values(value);
          if (rangeValues.some((v) => v !== undefined && v !== null && v !== "")) count++;
        } else if (!Array.isArray(value)) count++;
      }
    });

    // Add sort fields count
    count += sortFields.length;

    return count;
  }, [advancedFilters, sortFields]);

  const handleDelete = async (id: string) => {
    if (confirm("Вы уверены, что хотите удалить эту цистерну?")) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (error) {
        console.error("Error deleting cistern:", error);
      }
    }
  };

  // Pagination component
  const Pagination = () => {
    // Hide pagination if there's only one page or less
    if (totalPages <= 1) return null;

    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalCount);

    const getVisiblePages = () => {
      const delta = 1;
      const range = [];
      const rangeWithDots = [];

      for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
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

    return (
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center space-x-2">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Показано {startItem}-{endItem} из {totalCount} записей
          </p>
          <select
            value={pageSize}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            className="ml-2 text-sm border rounded px-2 py-1 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
          >
            <option value={5}>5 на странице</option>
            <option value={10}>10 на странице</option>
            <option value={25}>25 на странице</option>
            <option value={50}>50 на странице</option>
          </select>
        </div>

        <div className="flex items-center space-x-1">
          <Button variant="outline" size="sm" onClick={() => handlePageChange(1)} disabled={currentPage === 1}>
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {getVisiblePages().map((pageNum, index) => (
            <Button
              key={index}
              variant={pageNum === currentPage ? "default" : "outline"}
              size="sm"
              onClick={() => typeof pageNum === "number" && handlePageChange(pageNum)}
              disabled={typeof pageNum !== "number"}
              className="min-w-[40px]"
            >
              {pageNum}
            </Button>
          ))}

          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  // Table skeleton for loading state
  const TableSkeleton = () => (
    <Table>
      <TableHeader>
        <TableRow>
          {visibleColumns.map((_, index) => (
            <TableHead key={index}>
              <Skeleton className="h-4 w-20" />
            </TableHead>
          ))}
          <TableHead>
            <Skeleton className="h-4 w-20" />
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 10 }).map((_, rowIndex) => (
          <TableRow key={rowIndex}>
            {visibleColumns.map((column, colIndex) => (
              <TableCell key={`${rowIndex}-${column}`}>
                <Skeleton className={`h-4 ${colIndex === 0 ? "w-32" : "w-24"}`} />
              </TableCell>
            ))}
            <TableCell>
              <Skeleton className="h-4 w-24" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  if (displayError) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Train className="h-8 w-8" />
            Цистерны
          </h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              Ошибка загрузки данных: {displayError instanceof Error ? displayError.message : "Неизвестная ошибка"}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex gap-3 max-lg:flex-col">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <Train className="h-8 w-8" />
          Вагоны-цистерны
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Управление железнодорожными вагонами-цистернами</p>
      </div>

      {/* Controls */}
      <div className="flex justify-between items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 z-10" />
          <AutocompleteInput
            value={searchTerm}
            onChange={handleSearch}
            onSelect={handleCisternSelect}
            suggestions={sortedNumberSuggestions}
            placeholder="Поиск по номеру цистерны..."
            className="pl-10"
            isLoading={isLoadingNumbers}
          />
        </div>

        <div className="flex gap-2">
          <CisternFilters
            filters={advancedFilters}
            sortFields={sortFields}
            visibleColumns={visibleColumns}
            onFiltersChange={handleFiltersChange}
            onSortFieldsChange={handleSortFieldsChange}
            onVisibleColumnsChange={handleVisibleColumnsChange}
            onApplyFilters={handleApplyFilters}
            onClearFilters={handleClearFilters}
            activeFiltersCount={activeFiltersCount}
          />
          <Link href="/cisterns/create">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Добавить вагон-цистерну
            </Button>
          </Link>
        </div>
      </div>

      {/* Content */}
      <Card>
        <CardHeader>
          <div className="flex gap-2 items-center">
            <CardTitle>
              {isSearchMode
                ? `Результаты поиска: "${searchTerm}"`
                : isFilterMode
                ? "Результаты фильтрации"
                : "Список вагонов-цистерн"}
            </CardTitle>
            <CardDescription>
              {isSearchMode
                ? `Найдено: ${totalCount}`
                : isFilterMode
                ? `Отфильтровано: ${totalCount}`
                : `Всего записей: ${totalCount}`}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="-mt-4">
          {displayLoading ? (
            <TableSkeleton />
          ) : !displayData?.length ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Train className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  {isSearchMode
                    ? `Вагоны-цистерны с номером "${searchTerm}" не найдены`
                    : isFilterMode
                    ? "По заданным фильтрам вагоны-цистерны не найдены"
                    : "Нет данных для отображения"}
                </p>
              </div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    {visibleColumns.map((column) => (
                      <TableHead key={column}>
                        {column === "number"
                          ? "Номер"
                          : column === "manufacturer.name"
                          ? "Производитель"
                          : column === "builddate"
                          ? "Дата постройки"
                          : column === "type.name"
                          ? "Тип"
                          : column === "model.name"
                          ? "Модель"
                          : column === "owner.name"
                          ? "Собственник"
                          : column === "railwaycisternstatus.name"
                          ? "Статус"
                          : column === "affiliation.value"
                          ? "Принадлежность"
                          : column === "axlecount"
                          ? "Количество осей"
                          : column === "volume"
                          ? "Объем"
                          : column === "fillingvolume"
                          ? "Объем заполнения"
                          : column === "loadcapacity"
                          ? "Грузоподъемность"
                          : column === "tareweight"
                          ? "Тара"
                          : column === "substance"
                          ? "Вещество"
                          : column === "serialnumber"
                          ? "Серийный номер"
                          : column === "registrationnumber"
                          ? "Регистрационный номер"
                          : column === "dangerclass"
                          ? "Класс опасности"
                          : column === "servicelife"
                          ? "Срок службы"
                          : column === "length"
                          ? "Длина"
                          : column === "commissioningdate"
                          ? "Дата ввода в эксплуатацию"
                          : column === "registrationdate"
                          ? "Дата регистрации"
                          : column === "createdat"
                          ? "Дата создания"
                          : column === "updatedat"
                          ? "Дата обновления"
                          : column === "servicelifeyears"
                          ? "Срок службы (лет)"
                          : column === "notes"
                          ? "Заметки"
                          : column}
                      </TableHead>
                    ))}
                    <TableHead className="text-right">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayData.map((cistern, index) => (
                    <TableRow key={`${cistern.id}-${index}`}>
                      {visibleColumns.map((column) => (
                        <TableCell key={`${cistern.id}-${column}`} className={column === "number" ? "font-medium" : ""}>
                          {column === "number" ? (
                            <Link href={`/cisterns/${cistern.id}`} className="text-primary hover:underline">
                              {getDisplayValue(cistern, column)}
                            </Link>
                          ) : (
                            getDisplayValue(cistern, column)
                          )}
                        </TableCell>
                      ))}
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/cisterns/${cistern.id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/cisterns/${cistern.id}/edit`}>
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(cistern.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="mt-4">
                <Pagination />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
