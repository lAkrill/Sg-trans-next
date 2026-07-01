"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import type { RailwayCisternRepairsFilterListDTO } from "@/types/cisterns";
import {
  isPlanningColumnVisible,
  countPlanningVisibleLeafColumns,
  type PlanningColumnKey,
} from "@/lib/repairs/planning-columns";

function formatPlanningServiceEndDate(
  buildDate: string | undefined,
  serviceLifeYears: number | undefined
): string {
  if (
    buildDate == null ||
    buildDate === "" ||
    serviceLifeYears == null ||
    Number.isNaN(serviceLifeYears)
  ) {
    return "—";
  }
  const start = new Date(buildDate);
  if (Number.isNaN(start.getTime())) return "—";
  const end = new Date(start);
  end.setFullYear(end.getFullYear() + serviceLifeYears);
  return end.toLocaleDateString("ru-RU");
}

function formatRuDate(value: string | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("ru-RU");
}

interface PlanningRepairsTableProps {
  rows: RailwayCisternRepairsFilterListDTO[];
  visibleColumns: string[];
  isLoading: boolean;
}

export function PlanningRepairsTable({
  rows,
  visibleColumns,
  isLoading,
}: PlanningRepairsTableProps) {
  const vis = (key: PlanningColumnKey) => isPlanningColumnVisible(visibleColumns, key);
  const colSpan = countPlanningVisibleLeafColumns(visibleColumns);

  return (
    <Table className="w-full text-xs">
      <TableHeader>
        <TableRow>
          {vis("number") && (
            <TableHead rowSpan={2} className="whitespace-nowrap w-0 align-middle text-center">
              Вагон
            </TableHead>
          )}
          {vis("registrationNumber") && (
            <TableHead rowSpan={2} className="whitespace-nowrap w-0 align-middle text-center">
              Рег. №
            </TableHead>
          )}
          {vis("serviceLifeYears") && (
            <TableHead rowSpan={2} className="whitespace-nowrap w-0 align-middle text-center">
              Срок <br />
              эксплуатации
            </TableHead>
          )}
          {vis("buildDate") && (
            <TableHead rowSpan={2} className="whitespace-nowrap w-0 align-middle text-center">
              Дата постройки
            </TableHead>
          )}
          {vis("wagonModelName") && (
            <TableHead rowSpan={2} className="whitespace-normal py-2 min-w-0 align-middle text-center">
              Модель
            </TableHead>
          )}
          {vis("majorRepair") && (
            <TableHead colSpan={2} className="whitespace-normal align-middle text-center">
              Капитальный ремонт
            </TableHead>
          )}
          {vis("depotRepair") && (
            <TableHead colSpan={2} className="whitespace-normal align-middle text-center">
              Деповской ремонт
            </TableHead>
          )}
          {vis("periodicTest") && (
            <TableHead colSpan={2} className="whitespace-normal align-middle text-center">
              ГИ (периодическое
              <br />
              испытание)
            </TableHead>
          )}
          {vis("intermediateTest") && (
            <TableHead colSpan={2} className="whitespace-normal align-middle text-center">
              ИГ (промежуточное
              <br />
              испытание)
            </TableHead>
          )}
          {vis("pprRepair") && (
            <TableHead colSpan={2} className="whitespace-normal align-middle text-center">
              Профремонт
              <br />
              (ППР)
            </TableHead>
          )}
          {vis("milage") && (
            <TableHead className="whitespace-normal align-middle text-center">Пробег</TableHead>
          )}
          {vis("periodPaintRepair") && (
            <TableHead className="whitespace-normal align-middle text-center">Покраска</TableHead>
          )}
          {vis("commissioningEndDate") && (
            <TableHead rowSpan={2} className="whitespace-nowrap w-0 align-middle text-center">
              Дата окончания <br /> эксплуатации
            </TableHead>
          )}
          {vis("reRegistration") && (
            <TableHead colSpan={2} className="whitespace-normal align-middle text-center">
              Перерегистрация
            </TableHead>
          )}
          {vis("periodDetachRepair") && (
            <TableHead rowSpan={2} className="whitespace-normal align-middle text-center">
              Текущий отцепочный
              <br />
              ремонт
            </TableHead>
          )}
        </TableRow>
        <TableRow>
          {vis("majorRepair") && (
            <>
              <TableHead className="whitespace-nowrap w-0 align-middle text-center">последний</TableHead>
              <TableHead className="whitespace-nowrap w-0 align-middle text-center">следующий</TableHead>
            </>
          )}
          {vis("depotRepair") && (
            <>
              <TableHead className="whitespace-nowrap w-0 align-middle text-center">последний</TableHead>
              <TableHead className="whitespace-nowrap w-0 align-middle text-center">следующий</TableHead>
            </>
          )}
          {vis("periodicTest") && (
            <>
              <TableHead className="whitespace-nowrap w-0 align-middle text-center">последний</TableHead>
              <TableHead className="whitespace-nowrap w-0 align-middle text-center">следующий</TableHead>
            </>
          )}
          {vis("intermediateTest") && (
            <>
              <TableHead className="whitespace-nowrap w-0 align-middle text-center">последний</TableHead>
              <TableHead className="whitespace-nowrap w-0 align-middle text-center">следующий</TableHead>
            </>
          )}
          {vis("pprRepair") && (
            <>
              <TableHead className="whitespace-nowrap w-0 align-middle text-center">последний</TableHead>
              <TableHead className="whitespace-nowrap w-0 align-middle text-center">следующий</TableHead>
            </>
          )}
          {vis("milage") && (
            <TableHead className="whitespace-normal align-middle text-center">остаточный</TableHead>
          )}
          {vis("periodPaintRepair") && (
            <TableHead className="whitespace-normal align-middle text-center">последняя</TableHead>
          )}
          {vis("reRegistration") && (
            <>
              <TableHead className="whitespace-nowrap w-0 align-middle text-center">последняя</TableHead>
              <TableHead className="whitespace-nowrap w-0 align-middle text-center">следующая</TableHead>
            </>
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          <TableRow>
            <TableCell colSpan={Math.max(colSpan, 1)} className="text-center text-muted-foreground py-8">
              <div className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Загрузка данных...</span>
              </div>
            </TableCell>
          </TableRow>
        ) : rows.length ? (
          rows.map((row) => (
            <TableRow key={row.id} className="even:bg-muted/30">
              {vis("number") && <TableCell className="whitespace-nowrap">{row.number}</TableCell>}
              {vis("registrationNumber") && (
                <TableCell className="whitespace-nowrap">{row.registrationNumber ?? "—"}</TableCell>
              )}
              {vis("serviceLifeYears") && (
                <TableCell className="whitespace-nowrap">{row.serviceLifeYears ?? "—"}</TableCell>
              )}
              {vis("buildDate") && (
                <TableCell className="whitespace-nowrap">
                  {row.buildDate ? new Date(row.buildDate).toLocaleDateString("ru-RU") : "—"}
                </TableCell>
              )}
              {vis("wagonModelName") && (
                <TableCell className="whitespace-normal break-words min-w-0">
                  {row.wagonModelName ?? "—"}
                </TableCell>
              )}
              {vis("majorRepair") && (
                <>
                  <TableCell className="whitespace-nowrap">{formatRuDate(row.periodMajorRepair)}</TableCell>
                  <TableCell className="whitespace-nowrap">{formatRuDate(row.planPeriodMajorRepair)}</TableCell>
                </>
              )}
              {vis("depotRepair") && (
                <>
                  <TableCell className="whitespace-nowrap">{formatRuDate(row.periodDepotRepair)}</TableCell>
                  <TableCell className="whitespace-nowrap">{formatRuDate(row.planPeriodDepotRepair)}</TableCell>
                </>
              )}
              {vis("periodicTest") && (
                <>
                  <TableCell className="whitespace-nowrap">{formatRuDate(row.periodPeriodicTest)}</TableCell>
                  <TableCell className="whitespace-nowrap">{formatRuDate(row.planPeriodPeriodicTest)}</TableCell>
                </>
              )}
              {vis("intermediateTest") && (
                <>
                  <TableCell className="whitespace-nowrap">{formatRuDate(row.periodIntermediateTest)}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatRuDate(row.planPeriodIntermediateTest)}
                  </TableCell>
                </>
              )}
              {vis("pprRepair") && (
                <>
                  <TableCell className="whitespace-nowrap">{formatRuDate(row.periodPPRRepair)}</TableCell>
                  <TableCell className="whitespace-nowrap">{formatRuDate(row.planPeriodPPRRepair)}</TableCell>
                </>
              )}
              {vis("milage") && (
                <TableCell className="whitespace-nowrap text-center">
                  {row.milageRemain != null ? row.milageRemain : "—"}
                </TableCell>
              )}
              {vis("periodPaintRepair") && (
                <TableCell className="whitespace-nowrap text-center">
                  {formatRuDate(row.periodPaintRepair)}
                </TableCell>
              )}
              {vis("commissioningEndDate") && (
                <TableCell className="whitespace-nowrap text-center">
                  {formatPlanningServiceEndDate(row.buildDate, row.serviceLifeYears)}
                </TableCell>
              )}
              {vis("reRegistration") && (
                <>
                  <TableCell className="whitespace-nowrap">{formatRuDate(row.reRegistrationDate)}</TableCell>
                  <TableCell className="whitespace-nowrap">{formatRuDate(row.reRegistrationNextDate)}</TableCell>
                </>
              )}
              {vis("periodDetachRepair") && (
                <TableCell className="whitespace-nowrap text-center">
                  {formatRuDate(row.periodDetachRepair)}
                </TableCell>
              )}
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={Math.max(colSpan, 1)} className="text-center text-muted-foreground py-8">
              {colSpan === 0 ? "Выберите хотя бы один столбец для отображения" : "Нет данных"}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
