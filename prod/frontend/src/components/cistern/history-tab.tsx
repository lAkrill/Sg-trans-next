"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Skeleton } from '@/components/ui';
import { History, Clock, User, Search } from 'lucide-react';
import { useCisternHistoryActions } from '@/hooks/history-actions.hook';
import type { HistoryActionRailway } from '@/api/history-actions';

interface HistoryTabProps {
  cisternId: string;
}

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
  });
}

function matchesSearch(item: HistoryActionRailway, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const fullName = [item.lastName, item.firstName].filter(Boolean).join(" ");
  const searchable = [
    formatDateTime(item.date),
    item.date,
    item.email,
    item.firstName,
    item.lastName,
    fullName,
    item.note,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return searchable.includes(q);
}

export function HistoryTab({ cisternId }: HistoryTabProps) {
  const { data: history = [], isLoading, error } = useCisternHistoryActions(cisternId);
  const [searchQuery, setSearchQuery] = useState("");

  const sortedHistory = useMemo(
    () =>
      [...history].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      ),
    [history]
  );

  const filteredHistory = useMemo(
    () => sortedHistory.filter((item) => matchesSearch(item, searchQuery)),
    [sortedHistory, searchQuery]
  );

  const hasSearch = searchQuery.trim().length > 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Журнал изменений
          </CardTitle>
          <CardDescription>
            История всех изменений данных цистерны
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          )}

          {error && (
            <div className="text-center py-8 text-red-600">
              Ошибка загрузки истории:{" "}
              {error instanceof Error ? error.message : "Неизвестная ошибка"}
            </div>
          )}

          {!isLoading && !error && sortedHistory.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Записи истории изменений отсутствуют</p>
            </div>
          )}

          {!isLoading && !error && sortedHistory.length > 0 && (
            <div className="space-y-4">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Быстрый поиск по всем полям..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {hasSearch && (
                <p className="text-sm text-muted-foreground">
                  Найдено: {filteredHistory.length} из {sortedHistory.length}
                </p>
              )}

              {filteredHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>Ничего не найдено по запросу «{searchQuery.trim()}»</p>
                </div>
              ) : (
                filteredHistory.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-4 p-4 border rounded-lg"
                  >
                    <Clock className="h-5 w-5 text-gray-500 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-500">
                        {formatDateTime(item.date)}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 text-sm font-medium">
                        <User className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                        <span>
                          {[item.lastName, item.firstName].filter(Boolean).join(" ") ||
                            item.email ||
                            "—"}
                        </span>
                      </div>
                      <div className="mt-2 text-sm break-words">
                        {item.note
                          ? item.note
                              .split(";")
                              .map((line) => line.trim())
                              .filter(Boolean)
                              .map((line, index) => (
                                <div key={index}>{line}</div>
                              ))
                          : "—"}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
