"use client";

import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button, Skeleton } from "@/components/ui";
import { ArrowLeft, History, Settings } from "lucide-react";
import { useFitment } from "@/hooks";
import { FitmentHistoryTab } from "@/components/fitment";

export default function FitmentHistoryPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const fitmentId = params.id as string;
  const returnPage = searchParams.get("returnPage");
  const returnPageSize = searchParams.get("returnPageSize");
  const fitmentsListParams = new URLSearchParams();

  if (returnPage) fitmentsListParams.set("page", returnPage);
  if (returnPageSize) fitmentsListParams.set("pageSize", returnPageSize);

  const fitmentsListHref = fitmentsListParams.size
    ? `/directories/fitments?${fitmentsListParams.toString()}`
    : "/directories/fitments";

  const { data: fitment, isLoading, error } = useFitment(fitmentId);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-12 w-full" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !fitment) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Link href={fitmentsListHref}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад к списку
            </Button>
          </Link>
        </div>
        <div className="text-center py-8 text-red-600">
          {error
            ? `Ошибка загрузки арматуры: ${
                error instanceof Error ? error.message : "Неизвестная ошибка"
              }`
            : "Арматура не найдена"}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href={fitmentsListHref}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад к списку
          </Button>
        </Link>
      </div>

      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <History className="h-8 w-8" />
          Журнал изменений арматуры
        </h1>
        <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
          <Settings className="h-4 w-4" />
          {[fitment.fitmentType?.name, fitment.serialNumber].filter(Boolean).join(" · ") ||
            fitment.id}
        </p>
      </div>

      <FitmentHistoryTab fitmentId={fitmentId} />
    </div>
  );
}
