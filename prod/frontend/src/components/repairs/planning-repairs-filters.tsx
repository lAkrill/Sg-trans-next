"use client";

import { useState, useEffect, useCallback } from "react";
import { Filter, X, Minus, Plus } from "lucide-react";
import {
  Button,
  Input,
  Label,
  Textarea,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Badge,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import type { RailwayCisternRepairsFilterRequestDTO } from "@/types/cisterns";
import {
  DEFAULT_PLANNING_VISIBLE_COLUMNS,
  PLANNING_COLUMN_OPTIONS,
} from "@/lib/repairs/planning-columns";
import { cn } from "@/lib/utils";

type QuickRepairTypeId =
  | "all"
  | "majorRepair"
  | "depotRepair"
  | "periodicTest"
  | "intermediateTest"
  | "pprRepair";

const QUICK_REPAIR_TYPE_OPTIONS: {
  value: QuickRepairTypeId;
  label: string;
  planField?: keyof RailwayCisternRepairsFilterRequestDTO;
}[] = [
  { value: "all", label: "По всем видам ремонтов" },
  {
    value: "majorRepair",
    label: "Капитальный ремонт",
    planField: "planPeriodMajorRepair",
  },
  {
    value: "depotRepair",
    label: "Деповской ремонт",
    planField: "planPeriodDepotRepair",
  },
  {
    value: "periodicTest",
    label: "Периодическое испытание (ГИ)",
    planField: "planPeriodPeriodicTest",
  },
  {
    value: "intermediateTest",
    label: "Промежуточное испытание (ИГ)",
    planField: "planPeriodIntermediateTest",
  },
  {
    value: "pprRepair",
    label: "Профремонт (ППР)",
    planField: "planPeriodPPRRepair",
  },
];

const QUICK_REPAIR_PLAN_FIELDS = QUICK_REPAIR_TYPE_OPTIONS.flatMap((option) =>
  option.planField ? [option.planField] : []
);

const DEFAULT_QUICK_REPAIR_TYPE: QuickRepairTypeId = "all";
const DEFAULT_QUICK_MONTHS = 3;
const MIN_QUICK_MONTHS = 1;
const MAX_QUICK_MONTHS = 120;

function formatYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function buildPlanDateRangeFromToday(months: number): { from: string; to: string } {
  const from = new Date();
  from.setHours(0, 0, 0, 0);
  const to = new Date(from);
  to.setMonth(to.getMonth() + months);
  return { from: formatYmd(from), to: formatYmd(to) };
}

function formatQuickMonthLabel(months: number): string {
  const mod10 = months % 10;
  const mod100 = months % 100;
  if (mod10 === 1 && mod100 !== 11) return `${months} месяц`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${months} месяца`;
  return `${months} месяцев`;
}

const parseCommaList = (s: string): string[] =>
  s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

/** Номера вагонов: с новой строки и/или через запятую */
function parseWagonNumbersList(s: string): string[] {
  return s
    .split(/[\n\r,]+/)
    .map((x) => x.trim())
    .filter(Boolean);
}

function ymdForInput(iso?: string): string {
  if (!iso) return "";
  return iso.split("T")[0] ?? "";
}

function DateBoundControl({
  value,
  onChange,
}: {
  value?: string;
  onChange: (next: string | undefined) => void;
}) {
  return (
    <Input
      type="date"
      className="h-8 w-[9.75rem] shrink-0 font-mono text-xs px-2"
      value={ymdForInput(value)}
      onChange={(e) => {
        const v = e.target.value;
        if (!v) onChange(undefined);
        else onChange(v);
      }}
    />
  );
}

function PlanningDateRangeRow({
  label,
  value,
  onChange,
  onClear,
}: {
  label: string;
  value: { from?: string; to?: string };
  onChange: (v: { from?: string; to?: string } | undefined) => void;
  onClear?: () => void;
}) {
  const hasValue = !!(value.from || value.to);

  const setFrom = (from: string | undefined) => {
    const next = { ...value, from };
    if (!next.from && !next.to) onChange(undefined);
    else onChange(next);
  };

  const setTo = (to: string | undefined) => {
    const next = { ...value, to };
    if (!next.from && !next.to) onChange(undefined);
    else onChange(next);
  };

  return (
    <div className="flex flex-col gap-1.5 min-w-0">
      <div className="flex items-center justify-between gap-2 min-w-0">
        <Label className="text-sm font-medium leading-snug min-w-0">{label}</Label>
        {hasValue && onClear ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={onClear}
            aria-label="Очистить период"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        ) : null}
      </div>
      <div
        className={cn(
          "flex flex-wrap items-center gap-x-2 gap-y-1.5 min-w-0",
          "text-xs text-muted-foreground"
        )}
      >
        <span className="shrink-0 w-5">От</span>
        <DateBoundControl value={value.from} onChange={setFrom} />
        <span className="shrink-0 w-5 ml-0 sm:ml-1">До</span>
        <DateBoundControl value={value.to} onChange={setTo} />
      </div>
    </div>
  );
}

function normalizeRequest(
  f: RailwayCisternRepairsFilterRequestDTO
): RailwayCisternRepairsFilterRequestDTO {
  const out: RailwayCisternRepairsFilterRequestDTO = {};
  if (f.numbers?.length) out.numbers = f.numbers;
  if (f.wagonModelsNames?.length) out.wagonModelsNames = f.wagonModelsNames;
  const rangeKeys: (keyof RailwayCisternRepairsFilterRequestDTO)[] = [
    "buildDate",
    "commissioningDate",
    "commissioningEndDate",
    "periodMajorRepair",
    "periodPeriodicTest",
    "periodIntermediateTest",
    "periodDepotRepair",
    "periodPPRRepair",
    "periodPaintRepair",
    "planPeriodMajorRepair",
    "planPeriodPeriodicTest",
    "planPeriodIntermediateTest",
    "planPeriodDepotRepair",
    "planPeriodPPRRepair",
    "periodDetachRepair",
  ];
  for (const key of rangeKeys) {
    const r = f[key];
    if (
      r &&
      typeof r === "object" &&
      !Array.isArray(r) &&
      ("from" in r || "to" in r)
    ) {
      const dr = r as { from?: string; to?: string };
      if (dr.from || dr.to) {
        (out as Record<string, unknown>)[key] = { from: dr.from, to: dr.to };
      }
    }
  }
  return out;
}

export function countPlanningRepairsFilters(f: RailwayCisternRepairsFilterRequestDTO): number {
  return Object.keys(normalizeRequest(f)).length;
}

interface PlanningRepairsFiltersProps {
  appliedFilters: RailwayCisternRepairsFilterRequestDTO;
  onApply: (filters: RailwayCisternRepairsFilterRequestDTO) => void;
  activeFiltersCount: number;
  visibleColumns: string[];
  onVisibleColumnsChange: (columns: string[]) => void;
}

export function PlanningRepairsFilters({
  appliedFilters,
  onApply,
  activeFiltersCount,
  visibleColumns,
  onVisibleColumnsChange,
}: PlanningRepairsFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState<RailwayCisternRepairsFilterRequestDTO>({});
  const [numbersText, setNumbersText] = useState("");
  const [wagonModelsText, setWagonModelsText] = useState("");
  const [quickRepairType, setQuickRepairType] = useState<QuickRepairTypeId>(
    DEFAULT_QUICK_REPAIR_TYPE
  );
  const [quickMonths, setQuickMonths] = useState(DEFAULT_QUICK_MONTHS);

  const quickRepairOption =
    QUICK_REPAIR_TYPE_OPTIONS.find((o) => o.value === quickRepairType) ??
    QUICK_REPAIR_TYPE_OPTIONS[0];

  useEffect(() => {
    if (!isOpen) return;
    const next =
      appliedFilters && Object.keys(appliedFilters).length > 0
        ? (JSON.parse(JSON.stringify(appliedFilters)) as RailwayCisternRepairsFilterRequestDTO)
        : {};
    setDraft(next);
    setNumbersText(next.numbers?.join("\n") ?? "");
    setWagonModelsText(next.wagonModelsNames?.join(", ") ?? "");
  }, [isOpen, appliedFilters]);

  const updateDraft = useCallback(
    <K extends keyof RailwayCisternRepairsFilterRequestDTO>(
      key: K,
      value: RailwayCisternRepairsFilterRequestDTO[K]
    ) => {
      setDraft((d) => ({ ...d, [key]: value }));
    },
    []
  );

  const handleClear = useCallback(() => {
    setDraft({});
    setNumbersText("");
    setWagonModelsText("");
    setQuickRepairType(DEFAULT_QUICK_REPAIR_TYPE);
    setQuickMonths(DEFAULT_QUICK_MONTHS);
    onApply({});
    onVisibleColumnsChange(DEFAULT_PLANNING_VISIBLE_COLUMNS);
  }, [onApply, onVisibleColumnsChange]);

  const handleApply = useCallback(() => {
    const listNums = parseWagonNumbersList(numbersText);
    const listModels = parseCommaList(wagonModelsText);
    const merged: RailwayCisternRepairsFilterRequestDTO = {
      ...draft,
      numbers: listNums.length ? listNums : undefined,
      wagonModelsNames: listModels.length ? listModels : undefined,
    };
    onApply(normalizeRequest(merged));
    setIsOpen(false);
  }, [draft, numbersText, wagonModelsText, onApply]);

  const handleQuickMonths = useCallback(
    (months: number) => {
      const range = buildPlanDateRangeFromToday(months);
      if (quickRepairType === "all") {
        setDraft((d) => {
          const next = { ...d };
          for (const field of QUICK_REPAIR_PLAN_FIELDS) {
            (next as Record<string, { from: string; to: string }>)[field] = range;
          }
          return next;
        });
        return;
      }
      if (quickRepairOption.planField) {
        updateDraft(quickRepairOption.planField, range);
      }
    },
    [quickRepairType, quickRepairOption.planField, updateDraft]
  );

  const quickPlanPreviewRange =
    quickRepairType === "all"
      ? (() => {
          const firstRange = draft[QUICK_REPAIR_PLAN_FIELDS[0]] as
            | { from?: string; to?: string }
            | undefined;
          if (!firstRange?.from && !firstRange?.to) return null;
          const allSame = QUICK_REPAIR_PLAN_FIELDS.every((field) => {
            const range = draft[field] as { from?: string; to?: string } | undefined;
            return range?.from === firstRange.from && range?.to === firstRange.to;
          });
          return allSame ? firstRange : null;
        })()
      : ((draft[quickRepairOption.planField!] as { from?: string; to?: string } | undefined) ??
        null);

  const clampQuickMonths = (value: number) =>
    Math.min(MAX_QUICK_MONTHS, Math.max(MIN_QUICK_MONTHS, value));

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="relative">
          <Filter className="h-4 w-4 mr-2" />
          Фильтры
          {activeFiltersCount > 0 && (
            <Badge className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="min-w-[500px] px-5 flex flex-col overflow-hidden gap-0 py-4">
        <SheetHeader className="flex-shrink-0">
          <SheetTitle className="flex items-center justify-between gap-2">
            <span>Фильтры планирования</span>
            <Button variant="outline" size="sm" onClick={handleClear}>
              Очистить
            </Button>
          </SheetTitle>
        </SheetHeader>

        <Tabs defaultValue="quick" className="flex flex-col flex-1 min-h-0 pt-4">
          <TabsList className="grid w-full grid-cols-3 flex-shrink-0 h-auto p-1">
            <TabsTrigger value="quick" className="text-xs px-2 py-2 h-auto min-h-9 whitespace-normal leading-tight">
              Быстрый выбор
            </TabsTrigger>
            <TabsTrigger value="filters" className="text-xs px-2 py-2 h-auto min-h-9">
              Фильтры
            </TabsTrigger>
            <TabsTrigger value="columns" className="text-xs px-2 py-2 h-auto min-h-9">
              Столбцы
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="quick"
            className="flex flex-col flex-1 min-h-0 overflow-y-auto mt-4 gap-4 pr-1 data-[state=inactive]:hidden"
          >
            <div className="flex flex-col gap-2">
              <Label>Номера вагонов (с новой строки или через запятую)</Label>
              <Textarea
                placeholder={"По одному номеру в строке, например:\n12345678\n87654321\n\nили в одну строку: 12345678, 87654321"}
                value={numbersText}
                onChange={(e) => setNumbersText(e.target.value)}
                rows={5}
                className="min-h-[5.5rem] resize-y text-sm font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Можно вводить номера столбиком (Enter) или списком через запятую — можно смешивать.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Тип ремонта</Label>
              <Select
                value={quickRepairType}
                onValueChange={(value) => setQuickRepairType(value as QuickRepairTypeId)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Выберите тип ремонта" />
                </SelectTrigger>
                <SelectContent>
                  {QUICK_REPAIR_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Следующий ремонт — период от сегодня</Label>
              <p className="text-xs text-muted-foreground">
                {quickRepairType === "all"
                  ? "Заполняет фильтры «план (следующий)» для всех видов ремонтов от текущей даты до выбранного срока."
                  : `Заполняет фильтр «${quickRepairOption.label} — план (следующий)» от текущей даты до выбранного срока.`}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    onClick={() => setQuickMonths((m) => clampQuickMonths(m - 1))}
                    disabled={quickMonths <= MIN_QUICK_MONTHS}
                    aria-label="Уменьшить количество месяцев"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    type="number"
                    min={MIN_QUICK_MONTHS}
                    max={MAX_QUICK_MONTHS}
                    value={quickMonths}
                    onChange={(e) => {
                      const parsed = Number.parseInt(e.target.value, 10);
                      if (!Number.isNaN(parsed)) setQuickMonths(clampQuickMonths(parsed));
                    }}
                    className="h-9 w-14 text-center px-1 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    aria-label="Количество месяцев"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    onClick={() => setQuickMonths((m) => clampQuickMonths(m + 1))}
                    disabled={quickMonths >= MAX_QUICK_MONTHS}
                    aria-label="Увеличить количество месяцев"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <Button type="button" onClick={() => handleQuickMonths(quickMonths)}>
                  Задать на {formatQuickMonthLabel(quickMonths)}
                </Button>
              </div>
              {quickPlanPreviewRange?.from || quickPlanPreviewRange?.to ? (
                <p className="text-xs text-muted-foreground font-mono">
                  {quickRepairType === "all" ? "Все виды: " : null}
                  От {ymdForInput(quickPlanPreviewRange.from) || "—"} до{" "}
                  {ymdForInput(quickPlanPreviewRange.to) || "—"}
                </p>
              ) : null}
            </div>

            <Button className="w-full shrink-0 mt-2" onClick={handleApply}>
              Применить
            </Button>
          </TabsContent>

          <TabsContent
            value="filters"
            className="flex flex-col flex-1 min-h-0 overflow-y-auto mt-4 gap-4 pr-1 data-[state=inactive]:hidden"
          >
          <div className="flex flex-col gap-2">
            <Label>Модели вагонов (названия через запятую)</Label>
            <Input
              placeholder="Например: 15-1547, 15-1566"
              value={wagonModelsText}
              onChange={(e) => setWagonModelsText(e.target.value)}
              className="h-8"
            />
          </div>

          <PlanningDateRangeRow
            label="Дата постройки"
            value={draft.buildDate ?? {}}
            onChange={(v) => updateDraft("buildDate", v)}
            onClear={() => updateDraft("buildDate", undefined)}
          />
          <PlanningDateRangeRow
            label="Дата ввода в эксплуатацию"
            value={draft.commissioningDate ?? {}}
            onChange={(v) => updateDraft("commissioningDate", v)}
            onClear={() => updateDraft("commissioningDate", undefined)}
          />
          <PlanningDateRangeRow
            label="Дата окончания эксплуатации"
            value={draft.commissioningEndDate ?? {}}
            onChange={(v) => updateDraft("commissioningEndDate", v)}
            onClear={() => updateDraft("commissioningEndDate", undefined)}
          />

          <PlanningDateRangeRow
            label="Капитальный ремонт — последний (период)"
            value={draft.periodMajorRepair ?? {}}
            onChange={(v) => updateDraft("periodMajorRepair", v)}
            onClear={() => updateDraft("periodMajorRepair", undefined)}
          />
          <PlanningDateRangeRow
            label="Периодическое испытание (ГИ) — последний"
            value={draft.periodPeriodicTest ?? {}}
            onChange={(v) => updateDraft("periodPeriodicTest", v)}
            onClear={() => updateDraft("periodPeriodicTest", undefined)}
          />
          <PlanningDateRangeRow
            label="Промежуточное испытание (ИГ) — последний"
            value={draft.periodIntermediateTest ?? {}}
            onChange={(v) => updateDraft("periodIntermediateTest", v)}
            onClear={() => updateDraft("periodIntermediateTest", undefined)}
          />
          <PlanningDateRangeRow
            label="Деповской ремонт — последний"
            value={draft.periodDepotRepair ?? {}}
            onChange={(v) => updateDraft("periodDepotRepair", v)}
            onClear={() => updateDraft("periodDepotRepair", undefined)}
          />
          <PlanningDateRangeRow
            label="Профремонт (ППР) — последний"
            value={draft.periodPPRRepair ?? {}}
            onChange={(v) => updateDraft("periodPPRRepair", v)}
            onClear={() => updateDraft("periodPPRRepair", undefined)}
          />
          <PlanningDateRangeRow
            label="Покраска — последняя"
            value={draft.periodPaintRepair ?? {}}
            onChange={(v) => updateDraft("periodPaintRepair", v)}
            onClear={() => updateDraft("periodPaintRepair", undefined)}
          />

          <PlanningDateRangeRow
            label="Капитальный ремонт — план (следующий)"
            value={draft.planPeriodMajorRepair ?? {}}
            onChange={(v) => updateDraft("planPeriodMajorRepair", v)}
            onClear={() => updateDraft("planPeriodMajorRepair", undefined)}
          />
          <PlanningDateRangeRow
            label="ГИ — план (следующий)"
            value={draft.planPeriodPeriodicTest ?? {}}
            onChange={(v) => updateDraft("planPeriodPeriodicTest", v)}
            onClear={() => updateDraft("planPeriodPeriodicTest", undefined)}
          />
          <PlanningDateRangeRow
            label="ИГ — план (следующий)"
            value={draft.planPeriodIntermediateTest ?? {}}
            onChange={(v) => updateDraft("planPeriodIntermediateTest", v)}
            onClear={() => updateDraft("planPeriodIntermediateTest", undefined)}
          />
          <PlanningDateRangeRow
            label="Деповской ремонт — план (следующий)"
            value={draft.planPeriodDepotRepair ?? {}}
            onChange={(v) => updateDraft("planPeriodDepotRepair", v)}
            onClear={() => updateDraft("planPeriodDepotRepair", undefined)}
          />
          <PlanningDateRangeRow
            label="ППР — план (следующий)"
            value={draft.planPeriodPPRRepair ?? {}}
            onChange={(v) => updateDraft("planPeriodPPRRepair", v)}
            onClear={() => updateDraft("planPeriodPPRRepair", undefined)}
          />

          <Button className="w-full shrink-0 mt-2" onClick={handleApply}>
            Применить
          </Button>
          </TabsContent>

          <TabsContent value="columns" className="flex-1 overflow-y-auto mt-4 pr-1 data-[state=inactive]:hidden">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Видимые столбцы</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-2">
                {PLANNING_COLUMN_OPTIONS.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`planning-column-${option.value}`}
                      checked={visibleColumns.includes(option.value)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          onVisibleColumnsChange([...visibleColumns, option.value]);
                        } else if (visibleColumns.length > 1) {
                          onVisibleColumnsChange(                
                              visibleColumns.filter((col) => col !== option.value)
                            
                          );
                        }
                      }}
                    />
                    <Label htmlFor={`planning-column-${option.value}`} className="text-sm font-normal">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
