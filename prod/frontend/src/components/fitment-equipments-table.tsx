"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";
import Image from "next/image";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  Settings,
} from "lucide-react";
import { useAllFitmentEquipments, useFitmentTypes } from "@/hooks";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/formatDate";
import type { FitmentEquipmentDTO, FitmentEquipmentUserDTO } from "@/types/directories";
import {
  DEFAULT_FITMENT_EQUIPMENT_SORT,
  DEFAULT_FITMENT_EQUIPMENT_VISIBLE_COLUMNS,
  EMPTY_FITMENT_EQUIPMENT_FILTERS,
  FITMENT_EQUIPMENT_COLUMN_OPTIONS,
  FitmentEquipmentsFilter,
  type FitmentEquipmentFilterCriteria,
  type FitmentEquipmentSortConfig,
  type FitmentEquipmentSortField,
} from "@/components/fitment-equipments-filter";

const getOperationLabel = (operation: number) => {
  switch (operation) {
    case 1:
      return { text: "Снятие", variant: "destructive" as const };
    case 2:
      return { text: "Установка", variant: "default" as const };
    case 3:
      return { text: "ТО", variant: "secondary" as const };
    default:
      return { text: "Не указана", variant: "secondary" as const };
  }
};

const formatUserName = (user?: FitmentEquipmentUserDTO | null) => {
  if (!user) return "—";
  const name = [user.lastName, user.firstName].filter(Boolean).join(" ").trim();
  return name || "—";
};

const formatFitment = (item: FitmentEquipmentDTO) => {
  if (!item.fitment) return "—";
  const serial = item.fitment.serialNumber || "—";
  const passport = item.fitment.passportNumber || "—";
  return `(${serial}; ${passport})`;
};

const formatDepot = (item: FitmentEquipmentDTO) => {
  if (!item.depot) return "—";
  const shortName = item.depot.shortName || "—";
  const code = item.depot.code || "—";
  return `${shortName} (${code})`;
};

const formatDocument = (item: FitmentEquipmentDTO) => {
  if (!item.document) return "—";
  const number = item.document.number || "—";
  const author = item.document.author || "—";
  const date = formatDate(item.document.date, "ru-RU", "—");
  return `${number} (${author}; ${date})`;
};

const includesText = (value: string | null | undefined, query: string | undefined) => {
  if (!query?.trim()) return true;
  return (value ?? "").toLowerCase().includes(query.trim().toLowerCase());
};

const hasActiveFilters = (filters: FitmentEquipmentFilterCriteria) =>
  Object.values(filters).some((value) => {
    if (Array.isArray(value)) return value.length > 0;
    return value !== undefined && value !== null && value !== "";
  });

const getSortValue = (
  item: FitmentEquipmentDTO,
  field: FitmentEquipmentSortField
): string | number => {
  switch (field) {
    case "date":
      return item.date ?? "";
    case "operation":
      return item.operation;
    case "cistern":
      return item.railwayCistern?.number ?? "";
    case "fitment":
      return formatFitment(item);
    case "fitmentType":
      return item.fitment?.fitmentTypeName ?? "";
    case "jobUser":
      return formatUserName(item.jobUser);
    case "testUser":
      return formatUserName(item.testUser);
    case "acceptUser":
      return formatUserName(item.acceptUser);
    case "installUser":
      return formatUserName(item.installUser);
    case "approvUser":
      return formatUserName(item.approvUser);
    case "depot":
      return formatDepot(item);
    case "document":
      return item.document?.number ?? "";
    default:
      return "";
  }
};

const getRowValues = (item: FitmentEquipmentDTO): Record<string, string> => ({
  date: formatDate(item.date, "ru-RU", "—"),
  operation: getOperationLabel(item.operation).text,
  cistern: item.railwayCistern?.number || "—",
  fitment: formatFitment(item),
  fitmentType: item.fitment?.fitmentTypeName || "—",
  jobUser: formatUserName(item.jobUser),
  testUser: formatUserName(item.testUser),
  acceptUser: formatUserName(item.acceptUser),
  installUser: formatUserName(item.installUser),
  approvUser: formatUserName(item.approvUser),
  depot: formatDepot(item),
  document: formatDocument(item),
});

interface FitmentEquipmentsTableProps {
  /** Если задано — показывать только записи с указанными operation */
  operations?: number[];
  title?: string;
  exportFileName?: string;
  toolbarActions?: ReactNode;
}

export function FitmentEquipmentsTable({
  operations,
  title = "Список привязок арматуры",
  exportFileName = "FitmentBindings",
  toolbarActions,
}: FitmentEquipmentsTableProps) {
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<FitmentEquipmentFilterCriteria>(
    EMPTY_FITMENT_EQUIPMENT_FILTERS
  );
  const [sort, setSort] = useState<FitmentEquipmentSortConfig>(DEFAULT_FITMENT_EQUIPMENT_SORT);
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    ...DEFAULT_FITMENT_EQUIPMENT_VISIBLE_COLUMNS,
  ]);
  const [exportingType, setExportingType] = useState<"pdf" | "doc" | "xls" | null>(null);

  const { data: allItems = [], isLoading, error } = useAllFitmentEquipments(operations);
  const { data: fitmentTypes = [] } = useFitmentTypes();

  const isFiltered = hasActiveFilters(filters);

  const filteredItems = useMemo(() => {
    const selectedTypeNames = new Set(
      fitmentTypes
        .filter((type) => (filters.fitmentTypeIds ?? []).includes(type.id))
        .map((type) => type.name)
    );

    const matches = allItems.filter((item) => {
      const itemDate = item.date?.slice(0, 10) ?? "";
      if (filters.dateFrom && itemDate < filters.dateFrom) return false;
      if (filters.dateTo && itemDate > filters.dateTo) return false;

      if (filters.operations?.length && !filters.operations.includes(item.operation)) {
        return false;
      }

      if (
        filters.railwayCisternsIds?.length &&
        (!item.railwayCisternsId || !filters.railwayCisternsIds.includes(item.railwayCisternsId))
      ) {
        return false;
      }

      if (!includesText(item.fitment?.serialNumber, filters.serialNumber)) return false;
      if (!includesText(item.fitment?.passportNumber, filters.passportNumber)) return false;
      if (!includesText(item.document?.number, filters.documentNumber)) return false;

      if (selectedTypeNames.size > 0) {
        const typeName = item.fitment?.fitmentTypeName;
        if (!typeName || !selectedTypeNames.has(typeName)) return false;
      }

      if (filters.jobUserIds?.length && !filters.jobUserIds.includes(item.jobUserId)) {
        return false;
      }
      if (filters.testUserIds?.length && !filters.testUserIds.includes(item.testUserId)) {
        return false;
      }
      if (
        filters.acceptUserIds?.length &&
        (!item.acceptUserId || !filters.acceptUserIds.includes(item.acceptUserId))
      ) {
        return false;
      }
      if (
        filters.installUserIds?.length &&
        (!item.installUserId || !filters.installUserIds.includes(item.installUserId))
      ) {
        return false;
      }
      if (
        filters.approvUserIds?.length &&
        (!item.approvUserId || !filters.approvUserIds.includes(item.approvUserId))
      ) {
        return false;
      }
      if (filters.depoIds?.length && (!item.depoId || !filters.depoIds.includes(item.depoId))) {
        return false;
      }

      return true;
    });

    if (!sort.field) return matches;

    const direction = sort.direction === "desc" ? -1 : 1;
    return [...matches].sort((left, right) => {
      const leftValue = getSortValue(left, sort.field as FitmentEquipmentSortField);
      const rightValue = getSortValue(right, sort.field as FitmentEquipmentSortField);

      if (typeof leftValue === "number" && typeof rightValue === "number") {
        return (leftValue - rightValue) * direction;
      }

      return (
        String(leftValue).localeCompare(String(rightValue), "ru", { numeric: true }) * direction
      );
    });
  }, [allItems, filters, fitmentTypes, sort]);

  const totalCount = filteredItems.length;
  const allCount = allItems.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize) || 1);
  const currentPage = Math.min(pageNumber, totalPages);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const isColumnVisible = (column: string) => visibleColumns.includes(column);

  const handlePageChange = (page: number) => {
    setPageNumber(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPageNumber(1);
  };

  const handleFilterApply = ({
    filters: nextFilters,
    sort: nextSort,
  }: {
    filters: FitmentEquipmentFilterCriteria;
    sort: FitmentEquipmentSortConfig;
  }) => {
    setFilters(nextFilters);
    setSort(nextSort);
    setPageNumber(1);
  };

  const handleExport = useCallback(
    async (type: "pdf" | "doc" | "xls") => {
      const columns = FITMENT_EQUIPMENT_COLUMN_OPTIONS.filter((column) =>
        visibleColumns.includes(column.value)
      ).map((column) => ({
        key: column.value,
        label: column.label,
        type: column.value === "date" ? ("date" as const) : ("string" as const),
      }));

      const data = filteredItems.map((item) => {
        const row = getRowValues(item);
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
        const fileBaseName =
          type === "pdf"
            ? `${exportFileName}PDF`
            : type === "doc"
              ? `${exportFileName}DOC`
              : `${exportFileName}XLS`;

        const response = await api.post(
          "/api/export/table",
          {
            type,
            columns,
            data,
            fileName: fileBaseName,
          },
          {
            responseType: "blob",
          }
        );

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
    [exportFileName, filteredItems, visibleColumns]
  );

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
    const startItem = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalCount);

    return (
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-2">
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
          >
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

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Ошибка</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Произошла ошибка при загрузке записей: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-md border bg-background p-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              title="Экспорт DOC"
              onClick={() => handleExport("doc")}
              disabled={!!exportingType || isLoading || totalCount === 0}
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
              disabled={!!exportingType || isLoading || totalCount === 0}
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
              disabled={!!exportingType || isLoading || totalCount === 0}
            >
              {exportingType === "xls" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Image src="/icon_excel.svg" alt="Экспорт XLS" width={16} height={16} />
              )}
            </Button>
          </div>
          <FitmentEquipmentsFilter
            open={filterOpen}
            onOpenChange={setFilterOpen}
            filters={filters}
            sort={sort}
            visibleColumns={visibleColumns}
            allowedOperations={operations}
            onApply={handleFilterApply}
            onVisibleColumnsChange={setVisibleColumns}
            filteredCount={totalCount}
            totalCount={allCount}
          />
          {toolbarActions}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex gap-2 items-center">
            <CardTitle>{isFiltered ? "Результаты фильтрации" : title}</CardTitle>
            <CardDescription>
              {isFiltered ? `Отфильтровано: ${totalCount}` : `Всего записей: ${allCount}`}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="-mt-4">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !filteredItems.length ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Settings className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  {isFiltered
                    ? "По заданным фильтрам записи не найдены"
                    : "Нет данных для отображения"}
                </p>
              </div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    {isColumnVisible("date") && <TableHead>Дата привязки</TableHead>}
                    {isColumnVisible("operation") && <TableHead>Операция</TableHead>}
                    {isColumnVisible("cistern") && <TableHead>Номер вагона-цистерны</TableHead>}
                    {isColumnVisible("fitment") && <TableHead>Арматура</TableHead>}
                    {isColumnVisible("fitmentType") && <TableHead>Тип арматуры</TableHead>}
                    {isColumnVisible("jobUser") && <TableHead>Работу произвёл</TableHead>}
                    {isColumnVisible("testUser") && <TableHead>Испытание провёл</TableHead>}
                    {isColumnVisible("acceptUser") && <TableHead>Работу принял</TableHead>}
                    {isColumnVisible("installUser") && <TableHead>Установил</TableHead>}
                    {isColumnVisible("approvUser") && <TableHead>Утвердил</TableHead>}
                    {isColumnVisible("depot") && <TableHead>Место работы</TableHead>}
                    {isColumnVisible("document") && <TableHead>Документ</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedItems.map((item) => {
                    const operation = getOperationLabel(item.operation);
                    return (
                      <TableRow key={item.id}>
                        {isColumnVisible("date") && (
                          <TableCell>{formatDate(item.date, "ru-RU", "—")}</TableCell>
                        )}
                        {isColumnVisible("operation") && (
                          <TableCell>
                            <Badge variant={operation.variant}>{operation.text}</Badge>
                          </TableCell>
                        )}
                        {isColumnVisible("cistern") && (
                          <TableCell>{item.railwayCistern?.number || "—"}</TableCell>
                        )}
                        {isColumnVisible("fitment") && (
                          <TableCell>{formatFitment(item)}</TableCell>
                        )}
                        {isColumnVisible("fitmentType") && (
                          <TableCell>{item.fitment?.fitmentTypeName || "—"}</TableCell>
                        )}
                        {isColumnVisible("jobUser") && (
                          <TableCell>{formatUserName(item.jobUser)}</TableCell>
                        )}
                        {isColumnVisible("testUser") && (
                          <TableCell>{formatUserName(item.testUser)}</TableCell>
                        )}
                        {isColumnVisible("acceptUser") && (
                          <TableCell>{formatUserName(item.acceptUser)}</TableCell>
                        )}
                        {isColumnVisible("installUser") && (
                          <TableCell>{formatUserName(item.installUser)}</TableCell>
                        )}
                        {isColumnVisible("approvUser") && (
                          <TableCell>{formatUserName(item.approvUser)}</TableCell>
                        )}
                        {isColumnVisible("depot") && <TableCell>{formatDepot(item)}</TableCell>}
                        {isColumnVisible("document") && (
                          <TableCell>{formatDocument(item)}</TableCell>
                        )}
                      </TableRow>
                    );
                  })}
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
