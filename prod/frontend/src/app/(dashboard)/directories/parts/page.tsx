"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  Skeleton 
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
} from "lucide-react";
import { useParts, useDeletePart, useFilterParts } from "@/hooks";
import { usePartTypeOptions } from "@/hooks";
import { PartsFilter } from "@/components/parts-filter";
import type { PartDTO, PartFilterSortDTO, PartFilterCriteria } from "@/types/directories";

export default function PartsPage() {
  const router = useRouter();
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [isFiltered, setIsFiltered] = useState(false);
  
  // Состояние для фильтров
  const [filterOpen, setFilterOpen] = useState(false);
  const [currentFilters, setCurrentFilters] = useState<PartFilterCriteria>({
    partTypeIds: [],
    depotIds: [],
    stampNumbers: [],
    serialNumbers: [],
    locations: [],
    statusIds: [],
    wheelTypes: [],
    models: [],
    manufacturerCodes: []
  });
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    'partType', 'stampNumber', 'serialNumber', 'manufactureYear', 
    'currentLocation', 'status', 'depot', 'notes'
  ]);

  // Обычная загрузка деталей (без фильтров)
  const { data: partsData, isLoading, error } = useParts(
    pageNumber, 
    pageSize, 
    typeFilter && typeFilter !== "all" ? typeFilter : undefined
  );

  // Мутация для фильтрации
  const filterMutation = useFilterParts();
  
  const { data: partTypes } = usePartTypeOptions();
  const deleteMutation = useDeletePart();

  // Выбираем источник данных в зависимости от того, используются ли фильтры
  const currentData = isFiltered && filterMutation.data ? filterMutation.data : partsData;
  const currentItems = currentData?.items || [];
  const isCurrentLoading = isFiltered ? filterMutation.isPending : isLoading;
  const currentPage = currentData?.pageNumber || pageNumber;
  const totalPages = currentData?.totalPages || 1;
  const totalCount = currentData?.totalCount || 0;

  // Проверяем, являются ли элементы объектами PartDTO
  const isPartDTO = (item: unknown): item is PartDTO => {
    return typeof item === 'object' && item !== null && 'partType' in item;
  };

  const filteredParts = currentItems.filter((part) => {
    if (!isPartDTO(part)) return false;
    return true;
  }) as PartDTO[];

  const hasActiveFilters = (filters: PartFilterCriteria) => {
    return Object.values(filters).some((value) => {
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      if (typeof value === "object" && value !== null) {
        return Object.values(value).some((nestedValue) => nestedValue !== undefined && nestedValue !== null && nestedValue !== "");
      }
      return value !== undefined && value !== null && value !== "";
    });
  };

  const handleFilterApply = async (filters: PartFilterCriteria, page = 1, size = pageSize) => {
    try {
      if (!hasActiveFilters(filters)) {
        setCurrentFilters(filters);
        setIsFiltered(false);
        setPageNumber(1);
        return;
      }

      const filterRequest: PartFilterSortDTO = {
        filters,
        page,
        pageSize: size
      };
      await filterMutation.mutateAsync(filterRequest);
      setCurrentFilters(filters);
      setIsFiltered(true);
      setPageNumber(page);
    } catch (error) {
      console.error('Ошибка при применении фильтров:', error);
    }
  };

  const handlePageChange = (page: number) => {
    if (isFiltered) {
      void handleFilterApply(currentFilters, page, pageSize);
    } else {
      setPageNumber(page);
    }
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    if (isFiltered) {
      void handleFilterApply(currentFilters, 1, newPageSize);
    } else {
      setPageNumber(1);
    }
  };

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
    router.push(`/directories/parts/${partId}/edit`);
  };

  const handleViewHistory = (partId: string) => {
    router.push(`/directories/parts/${partId}/history`);
  };

  const getPartTypeDisplay = (part: PartDTO) => {
    return part.partType.name;
  };

  const formatYear = (yearData?: string | { year: number; month: number; day: number }) => {
    if (!yearData) return "—";
    if (typeof yearData === 'string') {
      // Если строка в формате даты (например "2019-01-01"), извлекаем год
      const yearMatch = yearData.match(/^(\d{4})/);
      return yearMatch ? yearMatch[1] : yearData;
    }
    // DateOnly format from backend
    return yearData.year.toString();
  };

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
      {/* Header */}
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

      {/* Controls */}
      <div className="flex justify-end items-center gap-4">
        <div className="flex gap-2">
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
            filteredCount={currentData?.totalCount}
            totalCount={currentData?.totalCount}
          />
          <Link href="/directories/parts/create">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Добавить деталь
            </Button>
          </Link>
        </div>
      </div>

      {/* Content */}
      <Card>
        <CardHeader>
          <div className="flex gap-2 items-center">
            <CardTitle>
              {isFiltered ? "Результаты фильтрации" : "Список деталей"}
            </CardTitle>
            <CardDescription>
              {isFiltered
                ? `Отфильтровано: ${currentData?.totalCount || 0}`
                : `Всего записей: ${currentData?.totalCount || 0}`}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="-mt-4">

          {/* Таблица */}
          {isCurrentLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !filteredParts.length ? (
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
                    <TableHead>Тип детали</TableHead>
                    <TableHead>Клеймо</TableHead>
                    <TableHead>Заводской номер</TableHead>
                    <TableHead>Год производства</TableHead>
                    <TableHead>Местоположение</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Примечания</TableHead>
                    <TableHead>Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredParts.map((part) => (
                    <TableRow key={part.id}>
                      <TableCell className="font-medium">
                        {getPartTypeDisplay(part)}
                      </TableCell>
                      <TableCell>{part.stampNumber.value}</TableCell>
                      <TableCell>{part.serialNumber || "—"}</TableCell>
                      <TableCell>{formatYear(part.manufactureYear)}</TableCell>
                      <TableCell>
                        {part.currentLocation 
                          ? `Вагон ${part.currentLocation.number}` 
                          : part.depot?.shortName || part.depot?.name || "—"
                        }
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" style={{ borderColor: part.status.color }}>
                          {part.status.name}
                        </Badge>
                      </TableCell>
                      <TableCell>{part.notes || "—"}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
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

              {/* Пагинация */}
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
