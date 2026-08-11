"use client";

import Link from "next/link";
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
import { ArrowLeft, Package } from "lucide-react";
import { useCistern, useLastPartEquipmentsByCistern } from "@/hooks";
import type { LastEquipmentDTO } from "@/types/directories";

interface PartEquipmentListControlProps {
  cisternId: string;
}

const formatYear = (value?: string | number | null): string => {
  if (value == null || value === "" || value === 0 || value === "0") return "—";
  const raw = String(value).trim();
  if (/^\d{4}$/.test(raw)) return raw;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "—";
  const year = date.getFullYear();
  return Number.isNaN(year) ? "—" : String(year);
};

const formatLocaleDate = (value?: string | null): string => {
  if (!value || value === "0") return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("ru-RU");
};

const getOperationBadge = (operation: number) => {
  switch (operation) {
    case 1:
      return { text: "Снятие", variant: "destructive" as const };
    case 2:
      return { text: "Установка", variant: "default" as const };
    default:
      return { text: "Неизвестно", variant: "secondary" as const };
  }
};

const getPartLabel = (equipment: LastEquipmentDTO) => {
  const part = equipment.lastEquipment.part;
  const stamp = part?.stampInfo?.value || "—";
  const serial = part?.serialNumber || "—";
  const year = formatYear(part?.manufactureYear);
  return `${stamp}; ${serial}; ${year}`;
};

export function PartEquipmentListControl({ cisternId }: PartEquipmentListControlProps) {
  const { data: cistern, isLoading: isLoadingCistern } = useCistern(cisternId);
  const {
    data: lastEquipments,
    isLoading: isLoadingLast,
    error,
  } = useLastPartEquipmentsByCistern(cisternId);

  const backHref = `/cisterns/${cisternId}?tab=components`;

  if (error) {
    return (
      <div className="space-y-6">
        <Link href={backHref}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Назад к листу комплектации
          </Button>
        </Link>
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Ошибка</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Не удалось загрузить последние детали комплектации</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Link href={backHref}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Назад
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-semibold">Управление комплектацией</h1>
              <p className="text-sm text-muted-foreground">
                {isLoadingCistern
                  ? "Загрузка вагона..."
                  : `Вагон № ${cistern?.number || "—"} · последние детали`}
              </p>
            </div>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Последние детали комплектации
          </CardTitle>
          <CardDescription>
            Актуальные детали по каждому типу оборудования, участвующие в комплектации вагона
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingLast ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          ) : !lastEquipments?.length ? (
            <div className="py-10 text-center text-muted-foreground">
              Нет данных о последних деталях комплектации
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Тип оборудования</TableHead>
                  <TableHead>Деталь (клеймо; зав. номер; год)</TableHead>
                  <TableHead>Операция</TableHead>
                  <TableHead>Дата работ</TableHead>
                  <TableHead>Депо работ</TableHead>
                  <TableHead>Вид ремонта</TableHead>
                  <TableHead>Документ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lastEquipments.map((equipment) => {
                  const operation = getOperationBadge(equipment.lastEquipment.operation);
                  const documentNumber = equipment.lastEquipment.document?.number || "—";
                  const documentDate = formatLocaleDate(equipment.lastEquipment.documentDate);

                  return (
                    <TableRow key={equipment.equipmentTypeId}>
                      <TableCell>
                        <div className="font-medium">{equipment.equipmentTypeName}</div>
                        <div className="text-xs text-muted-foreground">
                          Код: {equipment.lastEquipment.equipmentType?.code ?? "—"}
                        </div>
                      </TableCell>
                      <TableCell>{getPartLabel(equipment)}</TableCell>
                      <TableCell>
                        <Badge variant={operation.variant}>{operation.text}</Badge>
                      </TableCell>
                      <TableCell>{formatLocaleDate(equipment.lastEquipment.jobDate)}</TableCell>
                      <TableCell>
                        {equipment.lastEquipment.jobDepot?.shortName ||
                          equipment.lastEquipment.jobDepot?.name ||
                          "—"}
                      </TableCell>
                      <TableCell>{equipment.lastEquipment.repairType?.name || "—"}</TableCell>
                      <TableCell>
                        {documentNumber}
                        <br />
                        <span className="text-xs text-muted-foreground">{documentDate}</span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
