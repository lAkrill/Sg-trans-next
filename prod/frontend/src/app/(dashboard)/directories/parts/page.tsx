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
  Input, 
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
  Search,
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
  const [pageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
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

  // Проверяем, являются ли элементы объектами PartDTO
  const isPartDTO = (item: unknown): item is PartDTO => {
    return typeof item === 'object' && item !== null && 'partType' in item;
  };

  const filteredParts = currentItems.filter((part) => {
    if (!isPartDTO(part)) return false;
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      part.serialNumber?.toLowerCase().includes(search) ||
      part.partType.name.toLowerCase().includes(search) ||
      part.stampNumber.value.toLowerCase().includes(search) ||
      part.currentLocation?.number.toLowerCase().includes(search) ||
      part.depot?.name.toLowerCase().includes(search)
    );
  }) as PartDTO[];

  const handleFilterApply = async (filters: PartFilterCriteria) => {
    try {
      const filterRequest: PartFilterSortDTO = {
        filters,
        page: 1,
        pageSize: 50
      };
      await filterMutation.mutateAsync(filterRequest);
      setCurrentFilters(filters);
      setIsFiltered(true);
      setPageNumber(1);
    } catch (error) {
      console.error('Ошибка при применении фильтров:', error);
    }
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
      <div className="flex justify-between items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 z-10" />
          <Input
            placeholder="Поиск по заводскому номеру, типу, клейму..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2">
          {!isFiltered && (
            <Select value={typeFilter} onValueChange={setTypeFilter}>
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
            filteredCount={filteredParts.length}
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
                ? `Отфильтровано: ${filteredParts.length}`
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
                    : searchTerm
                    ? `Детали по запросу "${searchTerm}" не найдены`
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
              {currentData && currentData.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 px-2">
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    Показано {((pageNumber - 1) * pageSize) + 1}-{Math.min(pageNumber * pageSize, currentData.totalCount)} из {currentData.totalCount} записей
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPageNumber(1)}
                      disabled={pageNumber === 1}
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPageNumber(pageNumber - 1)}
                      disabled={pageNumber === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm min-w-[120px] text-center">
                      Страница {pageNumber} из {currentData.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPageNumber(pageNumber + 1)}
                      disabled={pageNumber === currentData.totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPageNumber(currentData.totalPages)}
                      disabled={pageNumber === currentData.totalPages}
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
