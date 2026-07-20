"use client";

import { useState } from "react";
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
  Skeleton 
} from "@/components/ui";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Plus,
  Settings,
} from "lucide-react";
import { useFitments } from "@/hooks/fitment.hook";
import { formatDate } from "@/lib/formatDate";

export default function FitmentsPage() {
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");

  // Обычная загрузка арматуры (без фильтров)
  const { data: fitmentsData, isLoading, error } = useFitments(
 
  );

  const fitments = fitmentsData || [];
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const filteredFitments = normalizedSearchQuery
    ? fitments.filter((fitment) =>
        [
          fitment.fitmentType.name,
          fitment.model.name,
          fitment.serialNumber,
          fitment.passportNumber,
          formatDate(fitment.buildDate, "ru-RU", "—"),
          formatDate(fitment.lastRepairDate, "ru-RU", "—"),
          fitment.periodRep,
          fitment.serviceLifeYears,
          fitment.manufacturer?.name,
          formatDate(fitment.updatedAt, "ru-RU", "—"),
          fitment.createdId,
        ]
          .filter((value) => value !== undefined && value !== null)
          .some((value) => String(value).toLowerCase().includes(normalizedSearchQuery))
      )
    : fitments;
  const totalCount = filteredFitments.length;
  const allCount = fitments.length;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;
  const currentPage = Math.min(pageNumber, totalPages);
  const paginatedFitments = filteredFitments.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handlePageChange = (page: number) => {
    setPageNumber(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPageNumber(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
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
      <div className="flex gap-3 max-lg:flex-col">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <Settings className="h-8 w-8" />
          Арматура
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Справочник арматуры
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-4 max-md:flex-col max-md:items-stretch">
        <div className="flex items-center gap-3">
          <Input
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Быстрый поиск по всем полям"
            className="max-w-3xl"
          />
          {searchQuery.trim() && (
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Найдено: {totalCount}
            </span>
          )}
        </div>
        <div className="flex gap-2">
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
              {"Список арматуры"}
            </CardTitle>
            <CardDescription>
              {`Всего записей: ${allCount}`}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="-mt-4">
          {/* Таблица */}
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !fitments.length ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Settings className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  {"Нет данных для отображения"}
                </p>
              </div>
            </div>
          ) : !filteredFitments.length ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Settings className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  {"По запросу ничего не найдено"}
                </p>
              </div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Тип</TableHead>
                    <TableHead>Модель</TableHead>
                    <TableHead>Номер</TableHead>
                    <TableHead>Паспорт</TableHead>
                    <TableHead>Дата <br />постройки</TableHead>
                    <TableHead>Дата <br />последнего ТО</TableHead>
                    <TableHead>Период <br />ремонта</TableHead>
                    <TableHead>Срок <br />службы</TableHead>
                    <TableHead>Производитель</TableHead>
                    <TableHead>Дата <br />обновления</TableHead>
                    <TableHead>Пользователь</TableHead>
                    <TableHead>Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedFitments.map((fitment) => (
                    <TableRow key={fitment.id}>
                      <TableCell className="font-medium">
                        {fitment.fitmentType.name}
                      </TableCell>
                      <TableCell>{fitment.model.name}</TableCell>
                      <TableCell>{fitment.serialNumber}</TableCell>
                      <TableCell>{fitment.passportNumber}</TableCell>
                      <TableCell>{formatDate(fitment.buildDate, "ru-RU", "—")}</TableCell>
                      <TableCell>{formatDate(fitment.lastRepairDate, "ru-RU", "—")}</TableCell>
                      <TableCell>{fitment.periodRep}</TableCell>
                      <TableCell>{fitment.serviceLifeYears}</TableCell>
                      <TableCell>{fitment.manufacturer?.name || "—"}</TableCell>
                      <TableCell>{formatDate(fitment.updatedAt, "ru-RU", "—")}</TableCell>
                      <TableCell>{fitment.createdId || "—"}</TableCell>
                      <TableCell>
                        —
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
