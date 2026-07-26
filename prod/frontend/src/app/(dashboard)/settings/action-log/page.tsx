"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ClipboardList,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { useActionLogs, useAllUsers } from "@/hooks";
import type { ActionLog } from "@/api/action-log";

function formatDateTime(value?: string): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function matchesSearch(
  item: ActionLog,
  query: string,
  userName: string
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const haystack = [
    item.id,
    item.userId,
    userName,
    item.dateTime,
    formatDateTime(item.dateTime),
    item.ip ?? "",
    item.api,
    item.note ?? "",
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(q);
}

export default function ActionLogPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [search, setSearch] = useState("");

  const { data, isLoading, error, isFetching, refetch } = useActionLogs(
    currentPage,
    pageSize
  );
  const { data: users = [] } = useAllUsers();

  const usersById = useMemo(() => {
    const map = new Map<string, string>();
    for (const user of users) {
      const name = [user.lastName, user.firstName, user.patronymic]
        .filter(Boolean)
        .join(" ");
      map.set(user.id, name || user.email || user.id);
    }
    return map;
  }, [users]);

  const pageItems = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.max(1, data?.totalPages ?? 1);

  const items = useMemo(() => {
    if (!search.trim()) return pageItems;
    return pageItems.filter((item) =>
      matchesSearch(item, search, usersById.get(item.userId) || "")
    );
  }, [pageItems, search, usersById]);

  const isFiltering = search.trim().length > 0;
  const startItem = pageItems.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = (currentPage - 1) * pageSize + pageItems.length;

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.min(Math.max(1, page), totalPages));
  };

  const handlePageSizeChange = (value: number) => {
    setPageSize(value);
    setCurrentPage(1);
  };

  const getVisiblePages = () => {
    const delta = 2;
    const range: number[] = [];
    const rangeWithDots: (number | string)[] = [];

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

  return (
    <div className="space-y-6 w-full">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Button variant="ghost" size="sm" asChild className="-ml-2">
            <Link href="/settings">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад к настройкам
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Журнал событий системы
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              История API-запросов пользователей
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
          Обновить
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            События
          </CardTitle>
          <CardDescription>
            Записи отсортированы от новых к старым
            {totalCount > 0 ? ` · всего ${totalCount}` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Быстрый поиск по загруженным данным..."
              className="pl-9 pr-9"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Очистить поиск"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {isLoading && (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          )}

          {error && (
            <div className="text-center py-8 text-red-600">
              Ошибка загрузки журнала:{" "}
              {error instanceof Error ? error.message : "Неизвестная ошибка"}
            </div>
          )}

          {!isLoading && !error && pageItems.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Записи журнала отсутствуют</p>
            </div>
          )}

          {!isLoading && !error && pageItems.length > 0 && items.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Ничего не найдено по запросу «{search.trim()}»</p>
              <p className="text-sm mt-1">Поиск выполняется по текущей странице</p>
            </div>
          )}

          {!isLoading && !error && items.length > 0 && (
            <>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap">Дата и время</TableHead>
                      <TableHead className="whitespace-nowrap">Пользователь</TableHead>
                      <TableHead className="whitespace-nowrap">IP</TableHead>
                      <TableHead>API</TableHead>
                      <TableHead>Примечание</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="whitespace-nowrap align-top">
                          {formatDateTime(item.dateTime)}
                        </TableCell>
                        <TableCell className="align-top min-w-[160px]">
                          <div className="font-medium">
                            {usersById.get(item.userId) || "—"}
                          </div>
                          <div className="text-xs text-muted-foreground break-all">
                            {item.userId}
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap align-top font-mono text-sm">
                          {item.ip || "—"}
                        </TableCell>
                        <TableCell className="align-top min-w-[220px]">
                          <code className="text-xs break-all">{item.api}</code>
                        </TableCell>
                        <TableCell className="align-top max-w-md">
                          <div className="text-sm break-words whitespace-pre-wrap">
                            {item.note || "—"}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {(totalPages > 1 || totalCount > pageSize) && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {isFiltering
                        ? `Найдено ${items.length} из ${pageItems.length} на странице`
                        : `Показано ${startItem}–${endItem} из ${totalCount} записей`}
                    </p>
                    <select
                      value={pageSize}
                      onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                      className="text-sm border rounded px-2 py-1 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                    >
                      <option value={10}>10 на странице</option>
                      <option value={25}>25 на странице</option>
                      <option value={50}>50 на странице</option>
                      <option value={100}>100 на странице</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(1)}
                      disabled={currentPage === 1 || isFetching}
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1 || isFetching}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    {getVisiblePages().map((pageNum, index) => (
                      <Button
                        key={index}
                        variant={pageNum === currentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() =>
                          typeof pageNum === "number" && handlePageChange(pageNum)
                        }
                        disabled={typeof pageNum !== "number" || isFetching}
                        className="min-w-[40px]"
                      >
                        {pageNum}
                      </Button>
                    ))}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages || isFetching}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(totalPages)}
                      disabled={currentPage === totalPages || isFetching}
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
