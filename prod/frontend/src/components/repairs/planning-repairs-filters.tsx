"use client";

import { useState, useEffect, useCallback } from "react";
import { Filter, X } from "lucide-react";
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
} from "@/components/ui";
import type { RailwayCisternRepairsFilterRequestDTO } from "@/types/cisterns";
import { cn } from "@/lib/utils";

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
}

export function PlanningRepairsFilters({
  appliedFilters,
  onApply,
  activeFiltersCount,
}: PlanningRepairsFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState<RailwayCisternRepairsFilterRequestDTO>({});
  const [numbersText, setNumbersText] = useState("");
  const [wagonModelsText, setWagonModelsText] = useState("");

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
    onApply({});
    setIsOpen(false);
  }, [onApply]);

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

        <div className="flex flex-col flex-1 min-h-0 overflow-y-auto pt-4 gap-4 pr-1">
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
        </div>
      </SheetContent>
    </Sheet>
  );
}
