"use client";

import { useCallback, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Badge,
  Skeleton,
} from "@/components/ui";
import {
  Plus,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Settings,
  History,
  Loader2,
} from "lucide-react";
import { useParts, useDeletePart, useFilterAllParts } from "@/hooks";
import { usePartTypeOptions } from "@/hooks";
import { DEFAULT_PART_VISIBLE_COLUMNS, PART_COLUMN_OPTIONS, PartsFilter } from "@/components/parts-filter";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/formatDate";
import type {
  PartDTO,
  PartFilterSortWithoutPaginationDTO,
  PartFilterCriteria,
} from "@/types/directories";

export default function PartsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPageNumber = Number(searchParams.get("page")) || 1;
  const initialPageSize = Number(searchParams.get("pageSize")) || 10;
  const initialTypeFilter = searchParams.get("type") || "all";
  const [pageNumber, setPageNumber] = useState(initialPageNumber);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [typeFilter, setTypeFilter] = useState<string>(initialTypeFilter);
  const [isFiltered, setIsFiltered] = useState(false);

  const [filterOpen, setFilterOpen] = useState(false);
  const [currentFilters, setCurrentFilters] = useState<PartFilterCriteria>({
    partTypeIds: [],
    depotIds: [],
    stampNumbers: [],
    serialNumbers: [],
    currentLocationIds: [],
    statusIds: [],
    models: [],
    documentNumbers: [],
    documentTypes: [],
  });
  const [visibleColumns, setVisibleColumns] = useState<string[]>([...DEFAULT_PART_VISIBLE_COLUMNS]);
  const [exportingType, setExportingType] = useState<"pdf" | "doc" | "xls" | null>(null);

  const { data: partsData, isLoading, error } = useParts(
    pageNumber,
    pageSize,
    typeFilter && typeFilter !== "all" ? typeFilter : undefined
  );

  const filterMutation = useFilterAllParts();

  const { data: partTypes } = usePartTypeOptions();
  const deleteMutation = useDeletePart();

  const isPartDTO = (item: unknown): item is PartDTO => {
    return typeof item === "object" && item !== null && "partType" in item;
  };

  const unfilteredParts = (partsData?.items || []).filter(isPartDTO);
  const filteredAllParts =
    isFiltered && filterMutation.data
      ? filterMutation.data.filter(isPartDTO)
      : null;

  const allParts = filteredAllParts ?? unfilteredParts;
  const isCurrentLoading = isFiltered ? filterMutation.isPending : isLoading;

  const totalCount = isFiltered
    ? allParts.length
    : partsData?.totalCount || 0;
  const allCount = isFiltered
    ? (partsData?.totalCount || allParts.length)
    : totalCount;
  const totalPages = isFiltered
    ? Math.ceil(totalCount / pageSize) || 1
    : partsData?.totalPages || 1;
  const currentPage = isFiltered
    ? Math.min(pageNumber, totalPages)
    : partsData?.pageNumber || pageNumber;

  const displayParts = isFiltered
    ? allParts.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : allParts;

  const isColumnVisible = (column: string) => visibleColumns.includes(column);

  const hasActiveFilters = (filters: PartFilterCriteria) => {
    return Object.values(filters).some((value) => {
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      if (typeof value === "object" && value !== null) {
        return Object.values(value).some(
          (nestedValue) => nestedValue !== undefined && nestedValue !== null && nestedValue !== ""
        );
      }
      return value !== undefined && value !== null && value !== "";
    });
  };

  const normalizeFiltersForRequest = (filters: PartFilterCriteria): PartFilterCriteria => ({
    ...filters,
    createdAt: filters.createdAt
      ? {
          from: filters.createdAt.from ? new Date(filters.createdAt.from).toISOString() : undefined,
          to: filters.createdAt.to ? new Date(filters.createdAt.to).toISOString() : undefined,
        }
      : undefined,
    updatedAt: filters.updatedAt
      ? {
          from: filters.updatedAt.from ? new Date(filters.updatedAt.from).toISOString() : undefined,
          to: filters.updatedAt.to ? new Date(filters.updatedAt.to).toISOString() : undefined,
        }
      : undefined,
  });

  const handleFilterApply = async (filters: PartFilterCriteria) => {
    try {
      if (!hasActiveFilters(filters)) {
        setCurrentFilters(filters);
        setIsFiltered(false);
        setPageNumber(1);
        return;
      }

      const filterRequest: PartFilterSortWithoutPaginationDTO = {
        filters: normalizeFiltersForRequest(filters),
        sortFields: [],
      };
      await filterMutation.mutateAsync(filterRequest);
      setCurrentFilters(filters);
      setIsFiltered(true);
      setPageNumber(1);
    } catch (err) {
      console.error("Ошибка при применении фильтров:", err);
    }
  };

  const handlePageChange = (page: number) => {
    setPageNumber(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPageNumber(1);
  };

  const getVisiblePages = () => {
    const delta = 1;
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

  const Pagination = () => {
    if (totalPages <= 1) return null;

    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalCount);

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

  const handleDelete = async (id: string) => {
    if (window.confirm("Вы уверены, что хотите удалить эту деталь?")) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const handleEdit = (partId: string) => {
    const params = new URLSearchParams({
      returnPage: String(currentPage),
      returnPageSize: String(pageSize),
    });

    if (!isFiltered && typeFilter !== "all") {
      params.set("returnType", typeFilter);
    }

    router.push(`/directories/parts/${partId}/edit?${params.toString()}`);
  };

  const handleViewHistory = (partId: string) => {
    const params = new URLSearchParams({
      returnPage: String(currentPage),
      returnPageSize: String(pageSize),
    });

    if (!isFiltered && typeFilter !== "all") {
      params.set("returnType", typeFilter);
    }

    router.push(`/directories/parts/${partId}/history?${params.toString()}`);
  };

  const getPartTypeDisplay = (part: PartDTO) => {
    return part.partType.name;
  };

  const getLocationDisplay = (code?: number | null) => {
    switch (code) {
      case 1:
        return "Вагон-цистерна";
      case 2:
        return "Депо";
      case 0:
      default:
        return "Не установлено";
    }
  };

  const getWagonDepotDisplay = (part: PartDTO) => {
    if (part.currentLocation?.number) {
      return part.currentLocation.number;
    }

    if (part.depot) {
      const depotName = part.depot.shortName || part.depot.name;
      return depotName ? `${part.depot.code} (${depotName})` : part.depot.code;
    }

    return "—";
  };

  const getServiceLifeYearsValue = (part: PartDTO): number | null => {
    const flatPart = part as PartDTO & { serviceLifeYears?: number | null };
    const value = flatPart.serviceLifeYears;

    if (value == null || value === 0 || Number.isNaN(value)) {
      return null;
    }

    return value;
  };

  const getDefaultServiceLifeYears = (partTypeCode?: number): number => {
    switch (partTypeCode) {
      case 1: // Колесная пара
        return 42;
      case 2: // Надрессорная балка
        return 35;
      case 3: // Боковая рама
        return 35;
      case 4: // Автосцепка
        return 30;
      case 10: // Поглощающий аппарат
        return 32;
      default:
        return 35;
    }
  };

  const getServiceLifeDisplay = (part: PartDTO) => {
    return getServiceLifeYearsValue(part) ?? "—";
  };

  const getManufactureDate = (
    yearData?: string | { year: number; month: number; day: number }
  ): Date | null => {
    if (!yearData) return null;

    if (typeof yearData === "string") {
      const parsed = new Date(yearData);
      if (!Number.isNaN(parsed.getTime())) return parsed;

      const yearMatch = yearData.match(/^(\d{4})/);
      if (!yearMatch) return null;
      return new Date(Number(yearMatch[1]), 0, 1);
    }

    return new Date(yearData.year, (yearData.month || 1) - 1, yearData.day || 1);
  };

  const getExtendedDateDisplay = (part: PartDTO): string => {
    const manufactureDate = getManufactureDate(part.manufactureYear);
    if (!manufactureDate || Number.isNaN(manufactureDate.getTime())) {
      return "—";
    }

    const serviceLifeYears =
      getServiceLifeYearsValue(part) ?? getDefaultServiceLifeYears(part.partType?.code);

    const endDate = new Date(manufactureDate);
    endDate.setFullYear(endDate.getFullYear() + serviceLifeYears);
    return String(endDate.getFullYear());
  };

  const getExtendedUntilDisplay = (part: PartDTO): string => {
    return formatDate(part.extendedUntil, "ru-RU", "—");
  };

  const formatYear = (yearData?: string | { year: number; month: number; day: number }) => {
    if (!yearData) return "—";
    if (typeof yearData === "string") {
      const yearMatch = yearData.match(/^(\d{4})/);
      return yearMatch ? yearMatch[1] : yearData;
    }
    return yearData.year.toString();
  };

  const handleExport = useCallback(
    async (type: "pdf" | "doc" | "xls") => {
      type ExportColumn = {
        key: string;
        label: string;
        type: "string" | "date" | "number";
      };

      const allColumns: ExportColumn[] = PART_COLUMN_OPTIONS.map((option) => ({
        key: option.value,
        label: option.label,
        type: "string",
      }));
      const columns = allColumns.filter((column) => visibleColumns.includes(column.key));

      const data = allParts.map((part) => {
        const row: Record<string, string> = {
          partType: getPartTypeDisplay(part),
          stampNumber: part.stampNumber?.value ?? "—",
          serialNumber: part.serialNumber || "—",
          manufactureYear: formatYear(part.manufactureYear),
          location: getLocationDisplay(part.code),
          wagonDepot: getWagonDepotDisplay(part),
          serviceLife: String(getServiceLifeDisplay(part)),
          extendedDate: getExtendedDateDisplay(part),
          extendedUntil: getExtendedUntilDisplay(part),
          status: part.status?.name ?? "—",
          notes: part.notes || "—",
          model: part.model || "—",
        };

        const filtered: Record<string, string> = {};
        for (const column of columns) {
          filtered[column.key] = row[column.key] ?? "—";
        }
        return filtered;
      });

      const extensionByType: Record<"pdf" | "doc" | "xls", string> = {
        pdf: "pdf",
        doc: "docx",
        xls: "xlsx",
      };
      const mimeByType: Record<"pdf" | "doc" | "xls", string> = {
        pdf: "application/pdf",
        doc: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        xls: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      };

      setExportingType(type);
      try {
        const response = await api.post(
          "/api/export/table",
          {
            type,
            columns,
            data,
            fileName:
              type === "pdf" ? "ExportPDF" : type === "doc" ? "ExportDOC" : "ExportXLS",
          },
          {
            responseType: "blob",
          }
        );

        const fileBaseName =
          type === "pdf" ? "ExportPDF" : type === "doc" ? "ExportDOC" : "ExportXLS";
        const url = window.URL.createObjectURL(
          new Blob([response.data], { type: mimeByType[type] })
        );
        const link = document.createElement("a");
        link.href = url;
        link.download = `${fileBaseName}.${extensionByType[type]}`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } catch (exportError) {
        console.error(`Export ${type.toUpperCase()} failed`, exportError);
      } finally {
        setExportingType(null);
      }
    },
    [allParts, visibleColumns]
  );

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Ошибка</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Произошла ошибка при загрузке деталей: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-3 max-lg:flex-col">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <Settings className="h-8 w-8" />
          Детали
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Справочник деталей железнодорожных цистерн
          {isFiltered && (
            <span className="ml-2 text-blue-600">
              (применены фильтры)
            </span>
          )}
        </p>
      </div>

      <div className="flex justify-end items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-md border bg-background p-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              title="Экспорт DOC"
              onClick={() => handleExport("doc")}
              disabled={!!exportingType || isCurrentLoading}
            >
              {exportingType === "doc" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Image src="/icon_word.svg" alt="Экспорт DOC" width={16} height={16} />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              title="Экспорт PDF"
              onClick={() => handleExport("pdf")}
              disabled={!!exportingType || isCurrentLoading}
            >
              {exportingType === "pdf" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Image src="/icon_pdf.png" alt="Экспорт PDF" width={16} height={16} />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              title="Экспорт XLS"
              onClick={() => handleExport("xls")}
              disabled={!!exportingType || isCurrentLoading}
            >
              {exportingType === "xls" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Image src="/icon_excel.svg" alt="Экспорт XLS" width={16} height={16} />
              )}
            </Button>
          </div>
          {!isFiltered && (
            <Select
              value={typeFilter}
              onValueChange={(value) => {
                setTypeFilter(value);
                setPageNumber(1);
              }}
            >
              <SelectTrigger className="w-fit">
                <SelectValue placeholder="Тип детали" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все типы</SelectItem>
                {partTypes?.map((type: { value: string; label: string }) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <PartsFilter
            open={filterOpen}
            onOpenChange={setFilterOpen}
            onFiltersChange={handleFilterApply}
            onVisibleColumnsChange={setVisibleColumns}
            filters={currentFilters}
            visibleColumns={visibleColumns}
            isLoading={isCurrentLoading}
            filteredCount={totalCount}
            totalCount={isFiltered ? allCount : totalCount}
          />
          <Link href="/directories/parts/create">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Добавить деталь
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex gap-2 items-center">
            <CardTitle>
              {isFiltered ? "Результаты фильтрации" : "Список деталей"}
            </CardTitle>
            <CardDescription>
              {isFiltered
                ? `Отфильтровано: ${totalCount}`
                : `Всего записей: ${totalCount}`}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="-mt-4">
          {isCurrentLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !allParts.length ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Settings className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  {isFiltered
                    ? "По заданным фильтрам детали не найдены"
                    : "Нет данных для отображения"}
                </p>
              </div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    {isColumnVisible("partType") && <TableHead>Тип детали</TableHead>}
                    {isColumnVisible("stampNumber") && <TableHead>Клеймо</TableHead>}
                    {isColumnVisible("serialNumber") && (
                      <TableHead>
                        Заводской <br />номер
                      </TableHead>
                    )}
                    {isColumnVisible("manufactureYear") && (
                      <TableHead>
                        Год <br />производства
                      </TableHead>
                    )}
                    {isColumnVisible("location") && <TableHead>Местоположение</TableHead>}
                    {isColumnVisible("wagonDepot") && <TableHead>Вагон/Депо</TableHead>}
                    {isColumnVisible("serviceLife") && (
                      <TableHead>
                        Срок <br />службы
                      </TableHead>
                    )}
                    {isColumnVisible("extendedDate") && (
                      <TableHead>
                        Дата окончания <br />эксплуатации
                      </TableHead>
                    )}
                    {isColumnVisible("extendedUntil") && (
                      <TableHead>
                        Дата продления <br />эксплуатации
                      </TableHead>
                    )}

                    {isColumnVisible("status") && <TableHead>Статус</TableHead>}
                    {isColumnVisible("notes") && <TableHead>Примечания</TableHead>}
                    {isColumnVisible("model") && <TableHead>Модель</TableHead>}
                    <TableHead className="w-[1%] whitespace-nowrap text-right">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayParts.map((part) => (
                    <TableRow key={part.id}>
                      {isColumnVisible("partType") && (
                        <TableCell className="font-medium">
                          {getPartTypeDisplay(part)}
                        </TableCell>
                      )}
                      {isColumnVisible("stampNumber") && (
                        <TableCell>{part.stampNumber?.value ?? "—"}</TableCell>
                      )}
                      {isColumnVisible("serialNumber") && (
                        <TableCell>{part.serialNumber || "—"}</TableCell>
                      )}
                      {isColumnVisible("manufactureYear") && (
                        <TableCell>{formatYear(part.manufactureYear)}</TableCell>
                      )}
                      {isColumnVisible("location") && (
                        <TableCell>{getLocationDisplay(part.code)}</TableCell>
                      )}
                      {isColumnVisible("wagonDepot") && (
                        <TableCell>{getWagonDepotDisplay(part)}</TableCell>
                      )}
                      {isColumnVisible("serviceLife") && (
                        <TableCell>{getServiceLifeDisplay(part)}</TableCell>
                      )}
                      {isColumnVisible("extendedDate") && (
                        <TableCell>{getExtendedDateDisplay(part)}</TableCell>
                      )}
                      {isColumnVisible("extendedUntil") && (
                        <TableCell>{getExtendedUntilDisplay(part)}</TableCell>
                      )}
                      {isColumnVisible("status") && (
                        <TableCell>
                          <Badge variant="outline" style={{ borderColor: part.status?.color }}>
                            {part.status?.name ?? "—"}
                          </Badge>
                        </TableCell>
                      )}
                      {isColumnVisible("notes") && (
                        <TableCell>{part.notes || "—"}</TableCell>
                      )}
                      {isColumnVisible("model") && (
                        <TableCell>{part.model || "—"}</TableCell>
                      )}
                      <TableCell className="w-[1%] whitespace-nowrap">
                        <div className="flex w-max justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewHistory(part.id)}
                            title="История установок"
                          >
                            <History className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(part.id)}
                            title="Редактировать"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(part.id)}
                            disabled={deleteMutation.isPending}
                            title="Удалить"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

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
