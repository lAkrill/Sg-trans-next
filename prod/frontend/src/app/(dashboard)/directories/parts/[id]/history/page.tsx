"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Skeleton, Badge } from "@/components/ui";
import { ArrowLeft, History, FileText, Wrench, Building2, Calendar, Truck } from "lucide-react";
import { usePartById, usePartInstallationHistory } from "@/hooks";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

export default function PartHistoryPage() {
  const params = useParams();
  const partId = params.id as string;

  const { data: part, isLoading: isLoadingPart } = usePartById(partId);
  const { data: equipments = [], isLoading: isLoadingHistory, error } = usePartInstallationHistory(partId);

  const formatDate = (dateString?: string | { year: number; month: number; day: number }) => {
    if (!dateString) return "—";
    try {
      if (typeof dateString === "string") {
        return format(new Date(dateString), "dd MMMM yyyy", { locale: ru });
      } else {
        // DateOnly format from backend
        return format(new Date(dateString.year, dateString.month - 1, dateString.day), "dd MMMM yyyy", { locale: ru });
      }
    } catch {
      return String(dateString);
    }
  };

  const formatYear = (yearData?: string | { year: number; month: number; day: number }) => {
    if (!yearData) return "—";
    if (typeof yearData === "string") {
      // Если строка в формате даты (например "2019-01-01"), извлекаем год
      const yearMatch = yearData.match(/^(\d{4})/);
      return yearMatch ? yearMatch[1] : yearData;
    }
    // DateOnly format from backend
    return yearData.year.toString();
  };

  const getOperationName = (operation: number) => {
    switch (operation) {
      case 1:
        return "Установка";
      case 2:
        return "Снятие";
      case 3:
        return "Ремонт";
      case 4:
        return "Замена";
      default:
        return `Операция ${operation}`;
    }
  };

  const getOperationColor = (operation: number) => {
    switch (operation) {
      case 1:
        return "bg-green-100 text-green-800 border-green-300";
      case 2:
        return "bg-red-100 text-red-800 border-red-300";
      case 3:
        return "bg-blue-100 text-blue-800 border-blue-300";
      case 4:
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  if (isLoadingPart || isLoadingHistory) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-12 w-full" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !part) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Ошибка</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Произошла ошибка при загрузке истории комплектации</p>
          <Link href="/directories/parts">
            <Button className="mt-4" variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад к списку деталей
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  // Сортируем по дате документа (новые сверху)
  const sortedEquipments = [...equipments].sort((a, b) => {
    const dateA = a.documetnDate ? new Date(a.documetnDate) : new Date(0);
    const dateB = b.documetnDate ? new Date(b.documetnDate) : new Date(0);
    return dateB.getTime() - dateA.getTime();
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/directories/parts">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад к списку
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <History className="h-8 w-8" />
              История комплектации детали
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {part.partType.name}
              {part.serialNumber && ` • Заводской номер: ${part.serialNumber}`}
              {` • Клеймо: ${part.stampNumber.value}`}
            </p>
          </div>
        </div>
      </div>

      {/* Основная информация о детали */}
      <Card>
        <CardHeader>
          <CardTitle>Информация о детали</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Тип:</span>
              <p className="font-medium">{part.partType.name}</p>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Статус:</span>
              <p className="font-medium" style={{ color: part.status.color }}>
                {part.status.name}
              </p>
            </div>
            {part.serialNumber && (
              <div>
                <span className="text-gray-600 dark:text-gray-400">Заводской номер:</span>
                <p className="font-medium">{part.serialNumber}</p>
              </div>
            )}
            {part.manufactureYear && (
              <div>
                <span className="text-gray-600 dark:text-gray-400">Год производства:</span>
                <p className="font-medium">{formatYear(part.manufactureYear)}</p>
              </div>
            )}
            {part.currentLocation && (
              <div>
                <span className="text-gray-600 dark:text-gray-400">Текущее местоположение:</span>
                <p className="font-medium">Вагон {part.currentLocation.number}</p>
              </div>
            )}
            {!part.currentLocation && part.depot && (
              <div>
                <span className="text-gray-600 dark:text-gray-400">Депо:</span>
                <p className="font-medium">{part.depot.shortName || part.depot.name}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* История комплектации */}
      <Card>
        <CardHeader>
          <CardTitle>
            История операций с деталью
            {sortedEquipments.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-500">({sortedEquipments.length})</span>
            )}
          </CardTitle>
          <CardDescription>Полная история установок, ремонтов и других операций с деталью</CardDescription>
        </CardHeader>
        <CardContent>
          {sortedEquipments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">История комплектации отсутствует</div>
          ) : (
            <div className="space-y-4">
              {sortedEquipments.map((equipment, index) => (
                <div
                  key={equipment.id}
                  className="relative p-4 border rounded-lg transition-colors"
                >
                  {/* Timeline indicator */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gray-300 dark:bg-gray-700 rounded-l-lg" />

                  <div className="pl-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                          <History className="w-4 h-4 text-gray-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">Запись #{sortedEquipments.length - index}</p>
                            <Badge className={getOperationColor(equipment.operation)}>
                              {getOperationName(equipment.operation)}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500">
                            {formatDate(equipment.documetnDate)}
                            {equipment.jobDate && ` • Работа: ${equipment.jobDate}`}
                          </p>
                        </div>
                      </div>

                      {/* Документ в правой части заголовка */}
                      {equipment.document && (
                        <div>
                          <div className="flex items-center gap-2 text-sm">
                            <FileText className="h-4 w-4 text-blue-600" />
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                Документ {equipment.document.number}
                              </p>
                              <div className="flex gap-2 text-xs text-gray-500">
                                {equipment.document.date && <span>{formatDate(equipment.document.date)}</span>}
                                {equipment.document.author && <span>• {equipment.document.author}</span>}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                      {/* Вагон */}
                      {equipment.railwayCistern && (
                        <div className="flex items-start gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded">
                          <Truck className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="text-gray-600 dark:text-gray-400 text-xs">Вагон:</span>
                            <p className="font-medium">{equipment.railwayCistern.number}</p>
                            {equipment.railwayCistern.model && (
                              <p className="text-xs text-gray-500">Модель: {equipment.railwayCistern.model}</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Тип комплектации */}
                      {equipment.equipmentType && (
                        <div className="flex items-start gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded">
                          <Wrench className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="text-gray-600 dark:text-gray-400 text-xs">Тип комплектации:</span>
                            <p className="font-medium">{equipment.equipmentType.name}</p>
                            <p className="text-xs text-gray-500">Код: {equipment.equipmentType.code}</p>
                          </div>
                        </div>
                      )}

                      {/* Депо работ */}
                      {equipment.jobDepot && (
                        <div className="flex items-start gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded">
                          <Building2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="text-gray-600 dark:text-gray-400 text-xs">Депо работ:</span>
                            <p className="font-medium">{equipment.jobDepot.shortName || equipment.jobDepot.name}</p>
                          </div>
                        </div>
                      )}

                      {/* Тип ремонта */}
                      {equipment.repairType && (
                        <div className="flex items-start gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded">
                          <Wrench className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="text-gray-600 dark:text-gray-400 text-xs">Тип ремонта:</span>
                            <p className="font-medium">{equipment.repairType.name}</p>
                            {equipment.repairType.description && (
                              <p className="text-xs text-gray-500">{equipment.repairType.description}</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Толщина колес (если есть) */}
                      {equipment.thicknessLeft != 0 && equipment.thicknessRight != 0 && (
                        <div className="flex items-start gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded">
                          <Calendar className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="text-gray-600 dark:text-gray-400 text-xs">Толщина колес (мм):</span>
                            <p className="font-medium">
                              Левое: {equipment.thicknessLeft} мм
                              <br />
                              Правое: {equipment.thicknessRight} мм
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Тип тележки */}
                      {equipment.truckType != 0 && (
                        <div className="flex items-start gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded">
                          <Truck className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="text-gray-600 dark:text-gray-400 text-xs">Тип тележки:</span>
                            <p className="font-medium">{equipment.truckType}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Примечания */}
                    {equipment.notes && (
                      <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                        <p className="text-xs font-medium text-blue-900 dark:text-blue-100 mb-1">Примечания</p>
                        <p className="text-sm text-blue-700 dark:text-blue-300">{equipment.notes}</p>
                      </div>
                    )}
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
