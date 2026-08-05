"use client";

import { useState } from "react";
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
  Settings,
} from "lucide-react";
import { useFitmentEquipments } from "@/hooks";
import { formatDate } from "@/lib/formatDate";
import type { FitmentEquipmentDTO, FitmentEquipmentUserDTO } from "@/types/directories";

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

interface FitmentEquipmentsTableProps {
  /** Если задано — показывать только записи с указанными operation */
  operations?: number[];
  title?: string;
}

export function FitmentEquipmentsTable({
  operations,
  title = "Список привязок арматуры",
}: FitmentEquipmentsTableProps) {
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data, isLoading, error } = useFitmentEquipments(pageNumber, pageSize, operations);

  const items = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = data?.totalPages || 1;
  const currentPage = Math.min(pageNumber, totalPages);

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
    if (totalPages <= 1 && totalCount <= pageSize) return null;

    const startItem = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
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
          <p>Произошла ошибка при загрузке привязок арматуры: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex gap-2 items-center">
          <CardTitle>{title}</CardTitle>
          <CardDescription>Всего записей: {totalCount}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="-mt-4">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : !items.length ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Settings className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Нет данных для отображения</p>
            </div>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Дата привязки</TableHead>
                  <TableHead>Операция</TableHead>
                  <TableHead>Номер вагона-цистерны</TableHead>
                  <TableHead>Арматура</TableHead>
                  <TableHead>Тип арматуры</TableHead>
                  <TableHead>Работу произвёл</TableHead>
                  <TableHead>Испытание провёл</TableHead>
                  <TableHead>Место работы</TableHead>
                  <TableHead>Документ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => {
                  const operation = getOperationLabel(item.operation);
                  return (
                    <TableRow key={item.id}>
                      <TableCell>{formatDate(item.date, "ru-RU", "—")}</TableCell>
                      <TableCell>
                        <Badge variant={operation.variant}>{operation.text}</Badge>
                      </TableCell>
                      <TableCell>{item.railwayCistern?.number || "—"}</TableCell>
                      <TableCell>{formatFitment(item)}</TableCell>
                      <TableCell>{item.fitment?.fitmentTypeName || "—"}</TableCell>
                      <TableCell>{formatUserName(item.jobUser)}</TableCell>
                      <TableCell>{formatUserName(item.testUser)}</TableCell>
                      <TableCell>{formatDepot(item)}</TableCell>
                      <TableCell>{formatDocument(item)}</TableCell>
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
  );
}
