"use client";

import { useState } from "react";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui";
import { api } from "@/lib/api";
import type { PartDTO, ScrapmetalDTO } from "@/types/directories";

const PLAN_CODE = 0;
const FACT_CODE = 1;

const MONTH_NAMES = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
] as const;

const QUARTER_ROMAN = ["I", "II", "III", "IV"] as const;

const formatWeight = (value: number) => {
  if (!Number.isFinite(value) || value === 0) return "—";
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
};

const parseItemDate = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getPartTypeLabel = (item: ScrapmetalDTO, partsById: Map<string, PartDTO>) => {
  if (!item.partId) return "Без детали";
  const part = partsById.get(item.partId);
  return part?.partType?.name?.trim() || "Неизвестный тип";
};

export type ScrapmetalReportColumn = {
  key: string;
  label: string;
};

export type ScrapmetalReportRow = {
  key: string;
  label: string;
  values: Record<string, number>;
};

export type ScrapmetalPeriodReportData = {
  mode: "quarter" | "year";
  year: number;
  quarter: number | null;
  columns: ScrapmetalReportColumn[];
  rows: ScrapmetalReportRow[];
  totals: Record<string, number>;
};

const emptyValues = (columns: ScrapmetalReportColumn[]) =>
  Object.fromEntries(columns.map((column) => [column.key, 0])) as Record<string, number>;

const addWeight = (
  target: Record<string, number>,
  key: string,
  weight: number
) => {
  target[key] = (target[key] ?? 0) + weight;
};

export function buildScrapmetalPeriodReport(params: {
  items: ScrapmetalDTO[];
  parts: PartDTO[];
  year: number;
  quarter: number | "all";
}): ScrapmetalPeriodReportData {
  const { items, parts, year } = params;
  const partsById = new Map(parts.map((part) => [part.id, part]));
  const yearItems = items.filter((item) => {
    const date = parseItemDate(item.date);
    return date?.getFullYear() === year;
  });

  if (params.quarter === "all") {
    const columns: ScrapmetalReportColumn[] = [
      ...QUARTER_ROMAN.flatMap((roman, index) => {
        const q = index + 1;
        return [
          { key: `q${q}_plan`, label: `${roman} кв. · план` },
          { key: `q${q}_fact`, label: `${roman} кв. · факт` },
        ];
      }),
      { key: "year_total", label: "Итого за год" },
    ];

    const rowsMap = new Map<string, ScrapmetalReportRow>();

    for (const item of yearItems) {
      const label = getPartTypeLabel(item, partsById);
      const key = label;
      if (!rowsMap.has(key)) {
        rowsMap.set(key, { key, label, values: emptyValues(columns) });
      }

      const row = rowsMap.get(key)!;
      const date = parseItemDate(item.date)!;
      const quarter = Math.floor(date.getMonth() / 3) + 1;
      const weight = Number(item.weight) || 0;
      const isPlan = Number(item.code) === PLAN_CODE;
      const isFact = Number(item.code) === FACT_CODE;

      if (isPlan) addWeight(row.values, `q${quarter}_plan`, weight);
      if (isFact) addWeight(row.values, `q${quarter}_fact`, weight);
      addWeight(row.values, "year_total", weight);
    }

    const rows = Array.from(rowsMap.values()).sort((a, b) =>
      a.label.localeCompare(b.label, "ru")
    );
    const totals = emptyValues(columns);
    for (const row of rows) {
      for (const column of columns) {
        addWeight(totals, column.key, row.values[column.key] ?? 0);
      }
    }

    return { mode: "year", year, quarter: null, columns, rows, totals };
  }

  const quarter = params.quarter;
  const quarterRoman = QUARTER_ROMAN[quarter - 1];
  const monthIndexes = [0, 1, 2].map((offset) => (quarter - 1) * 3 + offset);
  const columns: ScrapmetalReportColumn[] = [
    ...monthIndexes.flatMap((monthIndex, order) => {
      const monthLabel = MONTH_NAMES[monthIndex];
      return [
        {
          key: `m${order + 1}_plan`,
          label: `${monthLabel} · ${quarterRoman} кв. · план`,
        },
        {
          key: `m${order + 1}_fact`,
          label: `${monthLabel} · ${quarterRoman} кв. · факт`,
        },
      ];
    }),
    { key: "quarter_total", label: "Итого за квартал" },
    { key: "year_total", label: "Итого за год" },
  ];

  const rowsMap = new Map<string, ScrapmetalReportRow>();
  const ensureRow = (label: string) => {
    if (!rowsMap.has(label)) {
      rowsMap.set(label, { key: label, label, values: emptyValues(columns) });
    }
    return rowsMap.get(label)!;
  };

  for (const item of yearItems) {
    const label = getPartTypeLabel(item, partsById);
    const row = ensureRow(label);
    const date = parseItemDate(item.date)!;
    const month = date.getMonth();
    const itemQuarter = Math.floor(month / 3) + 1;
    const weight = Number(item.weight) || 0;
    const isPlan = Number(item.code) === PLAN_CODE;
    const isFact = Number(item.code) === FACT_CODE;

    addWeight(row.values, "year_total", weight);

    if (itemQuarter !== quarter) continue;

    const monthOrder = monthIndexes.indexOf(month);
    if (monthOrder === -1) continue;

    if (isPlan) addWeight(row.values, `m${monthOrder + 1}_plan`, weight);
    if (isFact) addWeight(row.values, `m${monthOrder + 1}_fact`, weight);
    addWeight(row.values, "quarter_total", weight);
  }

  const rows = Array.from(rowsMap.values()).sort((a, b) =>
    a.label.localeCompare(b.label, "ru")
  );
  const totals = emptyValues(columns);
  for (const row of rows) {
    for (const column of columns) {
      addWeight(totals, column.key, row.values[column.key] ?? 0);
    }
  }

  return { mode: "quarter", year, quarter, columns, rows, totals };
}

const getPeriodLabel = (report: ScrapmetalPeriodReportData) =>
  report.mode === "year"
    ? `${report.year} год`
    : `${QUARTER_ROMAN[(report.quarter ?? 1) - 1]} квартал ${report.year}`;

interface ScrapmetalPeriodReportTableProps {
  report: ScrapmetalPeriodReportData;
}

export function ScrapmetalPeriodReportTable({ report }: ScrapmetalPeriodReportTableProps) {
  const [exportingType, setExportingType] = useState<"pdf" | "xls" | null>(null);
  const periodLabel = getPeriodLabel(report);

  const handleExport = async (type: "pdf" | "xls") => {
    if (exportingType) return;

    const columns = [
      { key: "partType", label: "Тип детали", type: "string" as const },
      ...report.columns.map((column) => ({
        key: column.key,
        label: column.label,
        type: "string" as const,
      })),
    ];

    const data = [
      ...report.rows.map((row) => {
        const exportRow: Record<string, string> = { partType: row.label };
        for (const column of report.columns) {
          exportRow[column.key] = formatWeight(row.values[column.key] ?? 0);
        }
        return exportRow;
      }),
      {
        partType: "Итого",
        ...Object.fromEntries(
          report.columns.map((column) => [column.key, formatWeight(report.totals[column.key] ?? 0)])
        ),
      },
    ];

    const extensionByType = { pdf: "pdf", xls: "xlsx" } as const;
    const mimeByType = {
      pdf: "application/pdf",
      xls: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    } as const;
    const fileBaseName = type === "pdf" ? "ScrapmetalPeriodReportPDF" : "ScrapmetalPeriodReportXLS";

    setExportingType(type);
    try {
      const response = await api.post(
        "/api/export/table",
        {
          type,
          columns,
          data,
          fileName: fileBaseName,
        },
        { responseType: "blob" }
      );

      const url = window.URL.createObjectURL(
        new Blob([response.data], { type: mimeByType[type] })
      );
      const link = window.document.createElement("a");
      link.href = url;
      link.download = `${fileBaseName}.${extensionByType[type]}`;
      window.document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (exportError) {
      console.error(`Export report ${type.toUpperCase()} failed`, exportError);
    } finally {
      setExportingType(null);
    }
  };

  return (
    <div className="mt-4 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm text-muted-foreground">Отчет: {periodLabel}</div>
        <div className="flex items-center gap-1 rounded-md border bg-background p-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            title="Экспорт PDF"
            onClick={() => handleExport("pdf")}
            disabled={!!exportingType || !report.rows.length}
          >
            {exportingType === "pdf" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Image src="/icon_pdf.png" alt="Экспорт PDF" width={16} height={16} />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            title="Экспорт Excel"
            onClick={() => handleExport("xls")}
            disabled={!!exportingType || !report.rows.length}
          >
            {exportingType === "xls" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Image src="/icon_excel.svg" alt="Экспорт Excel" width={16} height={16} />
            )}
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="sticky left-0 z-10 min-w-[180px] bg-background">
                Тип детали
              </TableHead>
              {report.columns.map((column) => (
                <TableHead key={column.key} className="min-w-[120px] whitespace-normal text-center">
                  {column.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {!report.rows.length ? (
              <TableRow>
                <TableCell
                  colSpan={report.columns.length + 1}
                  className="py-8 text-center text-muted-foreground"
                >
                  Нет записей металлолома за выбранный период
                </TableCell>
              </TableRow>
            ) : (
              <>
                {report.rows.map((row) => (
                  <TableRow key={row.key}>
                    <TableCell className="sticky left-0 z-10 bg-background font-medium">
                      {row.label}
                    </TableCell>
                    {report.columns.map((column) => (
                      <TableCell key={column.key} className="text-center tabular-nums">
                        {formatWeight(row.values[column.key] ?? 0)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
                <TableRow className="bg-muted/40 font-semibold">
                  <TableCell className="sticky left-0 z-10 bg-muted/40">Итого</TableCell>
                  {report.columns.map((column) => (
                    <TableCell key={column.key} className="text-center tabular-nums">
                      {formatWeight(report.totals[column.key] ?? 0)}
                    </TableCell>
                  ))}
                </TableRow>
              </>
            )}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-muted-foreground">
        План — записи типа «Передача», факт — записи типа «Факт». Значения — сумма веса.
      </p>
    </div>
  );
}
