"use client";

import { useState } from "react";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Edit,
  Plus,
  Settings,
  Trash2,
} from "lucide-react";
import { useDeleteFitment, useFilterAllFitments, useFitments } from "@/hooks";
import { FitmentsFilter } from "@/components/fitments-filter";
import { FitmentEquipmentsTable } from "@/components/fitment-equipments-table";
import { BindFitmentDialog } from "@/components/bind-fitment-dialog";
import { formatDate } from "@/lib/formatDate";
import type {
  FitmentDTO,
  FitmentFilterCriteria,
  FitmentFilterSortWithoutPaginationDTO,
} from "@/types/directories";

export default function FitmentsPage() {
  const router = useRouter();
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const deleteMutation = useDeleteFitment();
  const [isFiltered, setIsFiltered] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [bindFitmentOpen, setBindFitmentOpen] = useState(false);
  const [currentFilters, setCurrentFilters] = useState<FitmentFilterCriteria>({
    fitmentTypeIds: [],
    serialNumbers: [],
    passportNumbers: [],
    modelIds: [],
    depotIds: [],
    creatorIds: [],
    locationCisternIds: [],
    locationDepoIds: [],
  });
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    "fitmentType",
    "model",
    "serialNumber",
    "passportNumber",
    "buildDate",
    "lastRepairDate",
    "periodRep",
    "serviceLifeYears",
    "code",
    "locationFitment",
    "manufacturer",
    "updatedAt",
    "createdId",
  ]);

  const getLocationLabel = (code?: number) => {
    switch (code) {
      case 1:
        return "Депо";
      case 2:
        return "Вагон";
      default:
        return "Не установлен";
    }
  };

  const getLocationPlace = (fitment: FitmentDTO) => {
    if (fitment.code === 2) {
      return fitment.locationCistern?.number || "—";
    }
    if (fitment.code === 1) {
      const shortName = fitment.locationDepo?.shortName || "—";
      const depotCode = fitment.locationDepo?.code;
      return depotCode ? `${shortName} (${depotCode})` : shortName;
    }
    return "—";
  };

  // Обычная загрузка арматуры (без фильтров)
  const { data: fitmentsData, isLoading, error } = useFitments();
  const filterMutation = useFilterAllFitments();

  const fitments = fitmentsData || [];
  const currentFitments = isFiltered && filterMutation.data ? filterMutation.data : fitments;
  const isCurrentLoading = isFiltered ? filterMutation.isPending : isLoading;
  const totalCount = currentFitments.length;
  const allCount = fitments.length;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;
  const currentPage = Math.min(pageNumber, totalPages);
  const paginatedFitments = currentFitments.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const hasActiveFilters = (filters: FitmentFilterCriteria) => {
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

  const normalizeFiltersForRequest = (filters: FitmentFilterCriteria): FitmentFilterCriteria => ({
    ...filters,
    updatedAt: filters.updatedAt
      ? {
          from: filters.updatedAt.from ? new Date(filters.updatedAt.from).toISOString() : undefined,
          to: filters.updatedAt.to ? new Date(filters.updatedAt.to).toISOString() : undefined,
        }
      : undefined,
  });

  const handleFilterApply = async (filters: FitmentFilterCriteria) => {
    try {
      if (!hasActiveFilters(filters)) {
        setCurrentFilters(filters);
        setIsFiltered(false);
        setPageNumber(1);
        return;
      }

      const filterRequest: FitmentFilterSortWithoutPaginationDTO = {
        filters: normalizeFiltersForRequest(filters),
        sortFields: [],
      };
      await filterMutation.mutateAsync(filterRequest);
      setCurrentFilters(filters);
      setIsFiltered(true);
      setPageNumber(1);
    } catch (error) {
      console.error("Ошибка при применении фильтров арматуры:", error);
    }
  };

  const handlePageChange = (page: number) => {
    setPageNumber(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPageNumber(1);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Вы уверены, что хотите удалить эту арматуру?")) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const handleEdit = (fitmentId: string) => {
    const params = new URLSearchParams({
      returnPage: String(currentPage),
      returnPageSize: String(pageSize),
    });

    router.push(`/directories/fitments/${fitmentId}/edit?${params.toString()}`);
  };

  const isColumnVisible = (column: string) => visibleColumns.includes(column);

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

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Ошибка</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Произошла ошибка при загрузке арматуры: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <Settings className="h-8 w-8" />
          Арматура
        </h1>
      </div>

      <Tabs defaultValue="fitments" className="space-y-3">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="fitments">
            Арматура
            </TabsTrigger>
          <TabsTrigger value="bindings">Привязка арматуры</TabsTrigger>
        </TabsList>

        <TabsContent value="fitments" className="space-y-3">
          <div className="flex flex-col gap-1 ml-2">
             Справочник арматуры
             {isFiltered && ( <span className="ml-2 text-blue-600"> (применены фильтры)  </span> )}
          </div>
          {/* Controls */}
          <div className="flex justify-end items-center gap-4">
            <div className="flex gap-2">
              <FitmentsFilter
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
              <Link href="/directories/fitments/create">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Добавить арматуру
                </Button>
              </Link>
            </div>
          </div>

          {/* Content */}
          <Card>
            <CardHeader>
              <div className="flex gap-2 items-center">
                <CardTitle>
                  {isFiltered ? "Результаты фильтрации" : "Список арматуры"}
                </CardTitle>
                <CardDescription>
                  {isFiltered
                    ? `Отфильтровано: ${totalCount}`
                    : `Всего записей: ${allCount}`}
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
              ) : !currentFitments.length ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <Settings className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">
                      {isFiltered
                        ? "По заданным фильтрам арматура не найдена"
                        : "Нет данных для отображения"}
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {isColumnVisible("fitmentType") && <TableHead>Тип</TableHead>}
                        {isColumnVisible("model") && <TableHead>Модель</TableHead>}
                        {isColumnVisible("serialNumber") && <TableHead>Номер</TableHead>}
                        {isColumnVisible("passportNumber") && <TableHead>Паспорт</TableHead>}
                        {isColumnVisible("buildDate") && <TableHead>Дата <br />постройки</TableHead>}
                        {isColumnVisible("lastRepairDate") && <TableHead>Дата <br />последнего ТО</TableHead>}
                        {isColumnVisible("periodRep") && <TableHead>Период <br />ремонта</TableHead>}
                        {isColumnVisible("serviceLifeYears") && <TableHead>Срок <br />службы</TableHead>}
                        {isColumnVisible("code") && <TableHead>Местоположение</TableHead>}  
                        {isColumnVisible("locationFitment") && <TableHead>Вагон/Депо</TableHead>}
                        {isColumnVisible("manufacturer") && <TableHead>Производитель</TableHead>}
                        {isColumnVisible("updatedAt") && <TableHead>Дата <br />обновления</TableHead>}
                        {isColumnVisible("createdId") && <TableHead>Пользователь</TableHead>}
                        <TableHead className="w-[1%] whitespace-nowrap text-right">Действия</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedFitments.map((fitment) => (
                        <TableRow key={fitment.id}>
                          {isColumnVisible("fitmentType") && (
                            <TableCell className="font-medium">
                              {fitment.fitmentType.name}
                            </TableCell>
                          )}
                          {isColumnVisible("model") && <TableCell>{fitment.model.name}</TableCell>}
                          {isColumnVisible("serialNumber") && <TableCell>{fitment.serialNumber}</TableCell>}
                          {isColumnVisible("passportNumber") && <TableCell>{fitment.passportNumber}</TableCell>}
                          {isColumnVisible("buildDate") && <TableCell>{formatDate(fitment.buildDate, "ru-RU", "—")}</TableCell>}
                          {isColumnVisible("lastRepairDate") && <TableCell>{formatDate(fitment.lastRepairDate, "ru-RU", "—")}</TableCell>}
                          {isColumnVisible("periodRep") && <TableCell>{fitment.periodRep}</TableCell>}
                          {isColumnVisible("serviceLifeYears") && <TableCell>{fitment.serviceLifeYears}</TableCell>}
                          {isColumnVisible("code") && (
                            <TableCell>{getLocationLabel(fitment.code)}</TableCell>
                          )}
                          {isColumnVisible("locationFitment") && (
                            <TableCell>{getLocationPlace(fitment)}</TableCell>
                          )}
                          {isColumnVisible("manufacturer") && <TableCell>{fitment.depot?.shortName || "—"}</TableCell>}
                          {isColumnVisible("updatedAt") && <TableCell>{formatDate(fitment.updatedAt, "ru-RU", "—")}</TableCell>}
                          {isColumnVisible("createdId") && <TableCell>{fitment.createdId || "—"}</TableCell>}
                          <TableCell className="w-[1%] whitespace-nowrap">
                            <div className="flex w-max justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(fitment.id)}
                                title="Редактировать"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(fitment.id)}
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
        </TabsContent>

        <TabsContent value="bindings" className="space-y-3">
          <div className="flex flex-col gap-1 ml-2">
            Справочник привязок арматуры
          </div>

          <div className="flex justify-end items-center gap-4">
            <Button onClick={() => setBindFitmentOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Привязать арматуру
            </Button>
          </div>

          <FitmentEquipmentsTable />

          <BindFitmentDialog
            open={bindFitmentOpen}
            onOpenChange={setBindFitmentOpen}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
