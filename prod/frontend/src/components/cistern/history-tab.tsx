"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, Skeleton } from '@/components/ui';
import { History, Clock, User } from 'lucide-react';
import { useCisternHistoryActions } from '@/hooks/history-actions.hook';

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

export function HistoryTab({ cisternId }: HistoryTabProps) {
  const { data: history = [], isLoading, error } = useCisternHistoryActions(cisternId);

  const sortedHistory = [...history].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

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
              {sortedHistory.map((item) => (
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
                    <div className="mt-2 text-sm whitespace-pre-wrap break-words">
                      {item.note || "—"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
