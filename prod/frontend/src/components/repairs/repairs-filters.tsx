"use client";

import { useState, useCallback } from "react";
import { X, Filter, ChevronsUpDown } from "lucide-react";
import {
  Button,
  Input,
  Label,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
  Popover,
  PopoverContent,
  PopoverTrigger,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  Checkbox,
} from "@/components/ui";
import { useDepots, useRepairTypes } from "@/hooks";
import type {
  RepairsInFilterCriteria,
  RepairsOutFilterCriteria,
  RepairsSortCriteria,
} from "@/types/repairs";
import { cn } from "@/lib/utils";

/** Подсветка активного (заполненного) фильтра */
const ACTIVE_FILTER_CONTROL =
  "border-green-500 bg-green-50 text-green-900 hover:bg-green-50 focus-visible:ring-green-500/40";
const ACTIVE_FILTER_BADGE =
  "border-green-500 bg-green-100 text-green-800 hover:bg-green-100";

const years = Array.from({ length: 50 }, (_, i) => new Date().getFullYear() - i);
const months = [
  { value: "01", label: "Январь" },
  { value: "02", label: "Февраль" },
  { value: "03", label: "Март" },
  { value: "04", label: "Апрель" },
  { value: "05", label: "Май" },
  { value: "06", label: "Июнь" },
  { value: "07", label: "Июль" },
  { value: "08", label: "Август" },
  { value: "09", label: "Сентябрь" },
  { value: "10", label: "Октябрь" },
  { value: "11", label: "Ноябрь" },
  { value: "12", label: "Декабрь" },
];

interface MultiSelectProps {
  placeholder: string;
  options: { id: string; name: string }[];
  value: string[];
  onChange: (value: string[]) => void;
  onClear: () => void;
}

export interface DateRangeInputProps {
  label: string;
  value: { from?: string; to?: string };
  onChange: (value: { from?: string; to?: string }) => void;
  onClear?: () => void;
}

const MultiSelect: React.FC<MultiSelectProps> = ({
  placeholder,
  options,
  value,
  onChange,
  onClear,
}) => {
  const [open, setOpen] = useState(false);
  const hasValue = value.length > 0;

  const handleSelect = (optionId: string) => {
    const newValue = value.includes(optionId)
      ? value.filter((id) => id !== optionId)
      : [...value, optionId];
    onChange(newValue.length > 0 ? newValue : []);
  };

  const handlePopoverWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const group = document.getElementById("repairs-multiselect-command-group");
    if (group && group.contains(e.target as Node)) {
      group.scrollTop += e.deltaY;
      e.preventDefault();
    }
  };

  return (
    <div className="max-w-full overflow-x-hidden">
      <div className="flex gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className={cn(
                "h-8 w-full justify-between text-left font-normal",
                !hasValue && "text-muted-foreground",
                hasValue && ACTIVE_FILTER_CONTROL
              )}
            >
              {hasValue ? `Выбрано: ${value.length}` : placeholder}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-full p-0"
            align="start"
            onWheel={handlePopoverWheel}
          >
            <Command>
              <CommandInput placeholder="Поиск..." />
              <CommandEmpty>Ничего не найдено.</CommandEmpty>
              <CommandGroup
                id="repairs-multiselect-command-group"
                className="max-h-64 overflow-auto"
                style={{ pointerEvents: "auto" }}
              >
                {options.map((option) => (
                  <CommandItem
                    key={option.id}
                    onSelect={() => handleSelect(option.id)}
                  >
                    <div className="flex items-center space-x-2 w-full">
                      <Checkbox
                        checked={value.includes(option.id)}
                        onChange={() => handleSelect(option.id)}
                      />
                      <span className="flex-1 truncate" title={option.name}>
                        {option.name}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
        {hasValue && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClear}
            className={cn("h-8 w-8 p-0 flex-shrink-0", ACTIVE_FILTER_CONTROL)}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      {hasValue && (
        <div className="flex flex-wrap gap-1 mt-2">
          {value.map((id) => {
            const option = options.find((o) => o.id === id);
            return option ? (
              <Badge key={id} variant="outline" className={cn("text-xs", ACTIVE_FILTER_BADGE)}>
                {option.name}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSelect(id)}
                  className="h-auto w-auto p-0 ml-1 hover:bg-transparent text-green-800"
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ) : null;
          })}
        </div>
      )}
    </div>
  );
};

const days = Array.from({ length: 31 }, (_, i) =>
  String(i + 1).padStart(2, "0")
);

export const DateRangeInput: React.FC<DateRangeInputProps> = ({
  label,
  value,
  onChange,
  onClear,
}) => {
  const hasValue = value.from || value.to;

  const parseDate = (dateStr?: string) => {
    if (!dateStr) return { year: "", month: "", day: "" };
    const datePart = dateStr.split("T")[0] ?? "";
    const [year, month, day] = datePart.split("-");
    return {
      year: year || "",
      month: month || "",
      day: day || "",
    };
  };

  const from = parseDate(value.from);
  const to = parseDate(value.to);

  const getLastDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 0).getDate();
  };

  const handleChange = (
    type: "from" | "to",
    part: "year" | "month" | "day",
    val: string
  ) => {
    const current = type === "from" ? from : to;
    let y = current.year || String(new Date().getFullYear());
    let m = current.month || "01";
    let d = current.day || "01";

    if (part === "year") y = val;
    else if (part === "month") m = val;
    else d = val;

    if (!y || !m || !d) {
      onChange({ ...value, [type]: undefined });
      return;
    }

    const yearNum = Number(y);
    const monthNum = Number(m);
    let dayNum = Number(d);
    const maxDay = getLastDayOfMonth(yearNum, monthNum);
    dayNum = Math.min(Math.max(1, dayNum), maxDay);
    const dayStr = String(dayNum).padStart(2, "0");

    const dateStr = `${y}-${m}-${dayStr}`;
    const iso =
      type === "to"
        ? `${dateStr}T23:59:59.999Z`
        : `${dateStr}T00:00:00.000Z`;

    onChange({ ...value, [type]: iso });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label className={cn("text-sm font-medium", hasValue && "text-green-800")}>
          {label}
        </Label>
        {hasValue && onClear && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClear}
            className={cn("h-6 w-6 p-0", ACTIVE_FILTER_CONTROL)}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
      <div className="flex gap-4 flex-wrap">
        <div className="flex gap-2 items-center">
          <span className="text-xs">От:</span>
          <Select
            value={from.year}
            onValueChange={(val) => handleChange("from", "year", val)}
          >
            <SelectTrigger className={cn("h-8 w-20 text-xs", from.year && ACTIVE_FILTER_CONTROL)}>
              <SelectValue placeholder="Год" />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={from.month}
            onValueChange={(val) => handleChange("from", "month", val)}
          >
            <SelectTrigger className={cn("h-8 w-20 text-xs", from.month && ACTIVE_FILTER_CONTROL)}>
              <SelectValue placeholder="Мес." />
            </SelectTrigger>
            <SelectContent>
              {months.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={from.day}
            onValueChange={(val) => handleChange("from", "day", val)}
          >
            <SelectTrigger className={cn("h-8 w-16 text-xs", from.day && ACTIVE_FILTER_CONTROL)}>
              <SelectValue placeholder="День" />
            </SelectTrigger>
            <SelectContent>
              {days.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2 items-center">
          <span className="text-xs">До:</span>
          <Select
            value={to.year}
            onValueChange={(val) => handleChange("to", "year", val)}
          >
            <SelectTrigger className={cn("h-8 w-20 text-xs", to.year && ACTIVE_FILTER_CONTROL)}>
              <SelectValue placeholder="Год" />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={to.month}
            onValueChange={(val) => handleChange("to", "month", val)}
          >
            <SelectTrigger className={cn("h-8 w-20 text-xs", to.month && ACTIVE_FILTER_CONTROL)}>
              <SelectValue placeholder="Мес." />
            </SelectTrigger>
            <SelectContent>
              {months.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={to.day}
            onValueChange={(val) => handleChange("to", "day", val)}
          >
            <SelectTrigger className={cn("h-8 w-16 text-xs", to.day && ACTIVE_FILTER_CONTROL)}>
              <SelectValue placeholder="День" />
            </SelectTrigger>
            <SelectContent>
              {days.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

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

export type RepairsFilterTableType = "in" | "out";

interface RepairsFiltersProps {
  filterTableType: RepairsFilterTableType;
  onFilterTableTypeChange: (t: RepairsFilterTableType) => void;
  filtersIn: RepairsInFilterCriteria;
  filtersOut: RepairsOutFilterCriteria;
  onFiltersInChange: (f: RepairsInFilterCriteria) => void;
  onFiltersOutChange: (f: RepairsOutFilterCriteria) => void;
  sortFields: RepairsSortCriteria[];
  onSortFieldsChange: (s: RepairsSortCriteria[]) => void;
  onClearFilters: () => void;
  activeFiltersCount: number;
  /** Только строки без сопоставления (как розовая подсветка в таблицах «в ремонт» / «выпуск»). */
  onlyUnmatchedRepairs: boolean;
  onOnlyUnmatchedRepairsChange: (value: boolean) => void;
  /** Нельзя совместить с серверной фильтрацией текущей вкладки. */
  onlyUnmatchedRepairsDisabled?: boolean;
}

const REPAIRS_IN_SORT_OPTIONS = [
  { value: "cisternNumber", label: "№ Вагона" },
  { value: "dateIn", label: "Дата приёма" },
  { value: "vu23", label: "ВУ23" },
  { value: "roadName", label: "Дорога" },
  { value: "stationName", label: "Станция" },
  { value: "depotName", label: "Депо" },
  { value: "adminRoadCode", label: "Код дороги" },
];

const REPAIRS_OUT_SORT_OPTIONS = [
  { value: "cisternNumber", label: "№ Вагона" },
  { value: "dateIn", label: "Дата начала ремонта" },
  { value: "dateOut", label: "Дата выпуска" },
  { value: "vu36", label: "ВУ36" },
  { value: "roadName", label: "Дорога" },
  { value: "depotName", label: "Депо" },
];

export function RepairsFilters({
  filterTableType,
  onFilterTableTypeChange,
  filtersIn,
  filtersOut,
  onFiltersInChange,
  onFiltersOutChange,
  sortFields,
  onSortFieldsChange,
  onClearFilters,
  activeFiltersCount,
  onlyUnmatchedRepairs,
  onOnlyUnmatchedRepairsChange,
  onlyUnmatchedRepairsDisabled = false,
}: RepairsFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [numbersText, setNumbersText] = useState("");
  const [roadNamesText, setRoadNamesText] = useState("");
  const [vu23Text, setVu23Text] = useState("");
  const [stationNamesText, setStationNamesText] = useState("");
  const [vu36Text, setVu36Text] = useState("");

  const { data: depots = [] } = useDepots();
  const { data: repairTypes = [] } = useRepairTypes();

  const sortOptions =
    filterTableType === "in" ? REPAIRS_IN_SORT_OPTIONS : REPAIRS_OUT_SORT_OPTIONS;

  const syncListTexts = useCallback(
    (tableType: RepairsFilterTableType) => {
      const nums =
        tableType === "in" ? filtersIn.cisternNumbers : filtersOut.cisternNumbers;
      const roads =
        tableType === "in" ? filtersIn.roadNames : filtersOut.roadNames;
      setNumbersText(nums?.join("\n") ?? "");
      setRoadNamesText(roads?.join(", ") ?? "");
      setVu23Text(filtersIn.vu23?.join(", ") ?? "");
      setStationNamesText(filtersIn.stationNames?.join(", ") ?? "");
      setVu36Text(filtersOut.vu36?.join(", ") ?? "");
    },
    [
      filtersIn.cisternNumbers,
      filtersIn.roadNames,
      filtersIn.vu23,
      filtersIn.stationNames,
      filtersOut.cisternNumbers,
      filtersOut.roadNames,
      filtersOut.vu36,
    ]
  );

  const handleOpenChange = useCallback(
    (open: boolean) => {
      setIsOpen(open);
      if (open) syncListTexts(filterTableType);
    },
    [filterTableType, syncListTexts]
  );

  const handleFilterTableTypeChange = useCallback(
    (t: RepairsFilterTableType) => {
      onFilterTableTypeChange(t);
      if (isOpen) syncListTexts(t);
    },
    [isOpen, onFilterTableTypeChange, syncListTexts]
  );

  const updateFilterIn = useCallback(
    <K extends keyof RepairsInFilterCriteria>(
      key: K,
      value: RepairsInFilterCriteria[K]
    ) => {
      onFiltersInChange({ ...filtersIn, [key]: value });
    },
    [filtersIn, onFiltersInChange]
  );

  const updateFilterOut = useCallback(
    <K extends keyof RepairsOutFilterCriteria>(
      key: K,
      value: RepairsOutFilterCriteria[K]
    ) => {
      onFiltersOutChange({ ...filtersOut, [key]: value });
    },
    [filtersOut, onFiltersOutChange]
  );

  const handleNumbersChange = useCallback(
    (text: string) => {
      setNumbersText(text);
      const list = parseWagonNumbersList(text);
      if (filterTableType === "in") {
        updateFilterIn("cisternNumbers", list.length ? list : undefined);
      } else {
        updateFilterOut("cisternNumbers", list.length ? list : undefined);
      }
    },
    [filterTableType, updateFilterIn, updateFilterOut]
  );

  const handleRoadNamesChange = useCallback(
    (text: string) => {
      setRoadNamesText(text);
      const list = parseCommaList(text);
      if (filterTableType === "in") {
        updateFilterIn("roadNames", list.length ? list : undefined);
      } else {
        updateFilterOut("roadNames", list.length ? list : undefined);
      }
    },
    [filterTableType, updateFilterIn, updateFilterOut]
  );

  const handleClear = useCallback(() => {
    setNumbersText("");
    setRoadNamesText("");
    setVu23Text("");
    setStationNamesText("");
    setVu36Text("");
    onClearFilters();
  }, [onClearFilters]);

  const addSortField = useCallback(() => {
    const defaultField =
      filterTableType === "in" ? "dateIn" : "dateOut";
    onSortFieldsChange([
      ...sortFields,
      { fieldName: defaultField, descending: true },
    ]);
  }, [filterTableType, sortFields, onSortFieldsChange]);

  const updateSortField = useCallback(
    (index: number, field: Partial<RepairsSortCriteria>) => {
      const updated = [...sortFields];
      updated[index] = { ...updated[index], ...field };
      onSortFieldsChange(updated);
    },
    [sortFields, onSortFieldsChange]
  );

  const removeSortField = useCallback(
    (index: number) => {
      onSortFieldsChange(sortFields.filter((_, i) => i !== index));
    },
    [sortFields, onSortFieldsChange]
  );

  const hasNumbers =
    filterTableType === "in"
      ? !!(filtersIn.cisternNumbers && filtersIn.cisternNumbers.length)
      : !!(filtersOut.cisternNumbers && filtersOut.cisternNumbers.length);
  const hasTypeRepairIds =
    filterTableType === "in"
      ? !!(filtersIn.typeRepairIds && filtersIn.typeRepairIds.length)
      : !!(filtersOut.typeRepairIds && filtersOut.typeRepairIds.length);
  const hasDepotIds =
    filterTableType === "in"
      ? !!(filtersIn.depotIds && filtersIn.depotIds.length)
      : !!(filtersOut.depotIds && filtersOut.depotIds.length);
  const hasRoadNames =
    filterTableType === "in"
      ? !!(filtersIn.roadNames && filtersIn.roadNames.length)
      : !!(filtersOut.roadNames && filtersOut.roadNames.length);
  const hasVu23 = !!(filtersIn.vu23 && filtersIn.vu23.length);
  const hasStationNames = !!(filtersIn.stationNames && filtersIn.stationNames.length);
  const hasVu36 = !!(filtersOut.vu36 && filtersOut.vu36.length);

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className={cn("relative", activeFiltersCount > 0 && ACTIVE_FILTER_CONTROL)}
        >
          <Filter className="h-4 w-4 mr-2" />
          Фильтры
          {activeFiltersCount > 0 && (
            <Badge
              className={cn(
                "ml-2 h-5 w-5 rounded-full p-0 text-xs",
                "bg-green-600 text-white hover:bg-green-600"
              )}
            >
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="min-w-[500px] px-5 flex flex-col overflow-hidden gap-0 py-4">
        <SheetHeader className="flex-shrink-0">
          <SheetTitle className="flex items-center justify-between">
            <span>Фильтры ремонтов</span>
            <Button variant="outline" size="sm" onClick={handleClear}>
              Очистить
            </Button>
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col flex-1 min-h-0 overflow-hidden pt-4">
          <Tabs defaultValue="filters" className="flex flex-col flex-1 min-h-0">
            <div className="sticky top-0 z-10 bg-background flex flex-col flex-shrink-0 pb-[5px]">
              <Card className="gap-0 mb-[10px]">
                <CardHeader className="py-2">
                  <CardTitle className="text-base">Таблица для фильтрации</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <Select
                    value={filterTableType}
                    onValueChange={(v) =>
                      handleFilterTableTypeChange(v as RepairsFilterTableType)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in">Перечисленные в ремонт</SelectItem>
                      <SelectItem value="out">Выпуск из ремонта</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
              <Card className="gap-0 mb-[10px]">
                <CardHeader className="py-2">
                  <CardTitle className="text-base">Сопоставление</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div
                    className={cn(
                      "flex items-start gap-3 rounded-md border px-3 py-3",
                      onlyUnmatchedRepairs
                        ? "border-green-500 bg-green-50"
                        : "border-border/60 bg-muted/30"
                    )}
                  >
                    <Checkbox
                      id="repairs-only-unmatched"
                      checked={onlyUnmatchedRepairs}
                      disabled={onlyUnmatchedRepairsDisabled}
                      onCheckedChange={(v) =>
                        onOnlyUnmatchedRepairsChange(v === true)
                      }
                      className="mt-0.5"
                    />
                    <div className="grid gap-1 leading-snug">
                      <Label
                        htmlFor="repairs-only-unmatched"
                        className={cn(
                          "font-medium cursor-pointer",
                          onlyUnmatchedRepairs && "text-green-800",
                          onlyUnmatchedRepairsDisabled && "cursor-not-allowed opacity-60"
                        )}
                      >
                        Только без пары в сопоставлении
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Записи, которые в таблицах подсвечиваются розовым (нет связанной
                        записи в «Сопоставленные данные»).
                      </p>
                      {onlyUnmatchedRepairsDisabled && (
                        <p className="text-xs text-amber-600 dark:text-amber-500">
                          Отключите серверные фильтры и сортировку на текущей вкладке, чтобы
                          использовать этот режим.
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
              <TabsList className="grid w-full grid-cols-2 mt-[10px]">
                <TabsTrigger value="filters">Фильтры</TabsTrigger>
                <TabsTrigger value="sorting">Сортировка</TabsTrigger>
              </TabsList>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto mt-[5px]">
              <TabsContent value="filters" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Основные параметры</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <Label className={cn(hasNumbers && "text-green-800")}>
                      Номера вагонов (с новой строки или через запятую)
                    </Label>
                    <Textarea
                      placeholder={
                        "По одному номеру в строке, например:\n12345678\n87654321\n\nили в одну строку: 12345678, 87654321"
                      }
                      value={numbersText}
                      onChange={(e) => handleNumbersChange(e.target.value)}
                      rows={5}
                      className={cn(
                        "min-h-[5.5rem] resize-y text-sm font-mono",
                        hasNumbers && ACTIVE_FILTER_CONTROL
                      )}
                    />
                    <p className="text-xs text-muted-foreground">
                      Можно вводить номера столбиком (Enter) или списком через запятую — можно
                      смешивать.
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label className={cn(hasTypeRepairIds && "text-green-800")}>
                      Тип ремонта
                    </Label>
                    <MultiSelect
                      placeholder="Выберите типы ремонта"
                      options={repairTypes.map((r) => ({ id: r.id, name: r.name }))}
                      value={
                        (filterTableType === "in"
                          ? filtersIn.typeRepairIds
                          : filtersOut.typeRepairIds
                        ) ?? []
                      }
                      onChange={(value) => {
                        if (filterTableType === "in") {
                          updateFilterIn(
                            "typeRepairIds",
                            value.length ? value : undefined
                          );
                        } else {
                          updateFilterOut(
                            "typeRepairIds",
                            value.length ? value : undefined
                          );
                        }
                      }}
                      onClear={() => {
                        if (filterTableType === "in") {
                          updateFilterIn("typeRepairIds", undefined);
                        } else {
                          updateFilterOut("typeRepairIds", undefined);
                        }
                      }}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label className={cn(hasDepotIds && "text-green-800")}>Депо</Label>
                    <MultiSelect
                      placeholder="Выберите депо"
                      options={depots.map((d) => ({ id: d.id, name: d.shortName ?? d.name }))}
                      value={
                        (filterTableType === "in"
                          ? filtersIn.depotIds
                          : filtersOut.depotIds
                        ) ?? []
                      }
                      onChange={(value) => {
                        if (filterTableType === "in") {
                          updateFilterIn(
                            "depotIds",
                            value.length ? value : undefined
                          );
                        } else {
                          updateFilterOut(
                            "depotIds",
                            value.length ? value : undefined
                          );
                        }
                      }}
                      onClear={() => {
                        if (filterTableType === "in") {
                          updateFilterIn("depotIds", undefined);
                        } else {
                          updateFilterOut("depotIds", undefined);
                        }
                      }}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label className={cn(hasRoadNames && "text-green-800")}>
                      Дороги (названия через запятую)
                    </Label>
                    <Input
                      placeholder="Например: ОЖД, СЖД"
                      value={roadNamesText}
                      onChange={(e) => handleRoadNamesChange(e.target.value)}
                      className={cn("h-8", hasRoadNames && ACTIVE_FILTER_CONTROL)}
                    />
                  </div>

                  {filterTableType === "in" && (
                    <>
                      <div className="flex flex-col gap-2">
                        <Label className={cn(hasVu23 && "text-green-800")}>
                          ВУ23 (через запятую)
                        </Label>
                        <Input
                          placeholder="Коды ВУ23"
                          value={vu23Text}
                          onChange={(e) => {
                            const text = e.target.value;
                            setVu23Text(text);
                            const list = parseCommaList(text);
                            updateFilterIn(
                              "vu23",
                              list.length ? list : undefined
                            );
                          }}
                          className={cn("h-8", hasVu23 && ACTIVE_FILTER_CONTROL)}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label className={cn(hasStationNames && "text-green-800")}>
                          Станции (названия через запятую)
                        </Label>
                        <Input
                          placeholder="Названия станций"
                          value={stationNamesText}
                          onChange={(e) => {
                            const text = e.target.value;
                            setStationNamesText(text);
                            const list = parseCommaList(text);
                            updateFilterIn(
                              "stationNames",
                              list.length ? list : undefined
                            );
                          }}
                          className={cn("h-8", hasStationNames && ACTIVE_FILTER_CONTROL)}
                        />
                      </div>
                      <DateRangeInput
                        label="Дата приёма"
                        value={filtersIn.dateIn ?? {}}
                        onChange={(v) => updateFilterIn("dateIn", v)}
                        onClear={() => updateFilterIn("dateIn", undefined)}
                      />
                    </>
                  )}

                  {filterTableType === "out" && (
                    <>
                      <div className="flex flex-col gap-2">
                        <Label className={cn(hasVu36 && "text-green-800")}>
                          ВУ36 (через запятую)
                        </Label>
                        <Input
                          placeholder="Коды ВУ36"
                          value={vu36Text}
                          onChange={(e) => {
                            const text = e.target.value;
                            setVu36Text(text);
                            const list = parseCommaList(text);
                            updateFilterOut(
                              "vu36",
                              list.length ? list : undefined
                            );
                          }}
                          className={cn("h-8", hasVu36 && ACTIVE_FILTER_CONTROL)}
                        />
                      </div>
                      <DateRangeInput
                        label="Дата начала ремонта"
                        value={filtersOut.dateIn ?? {}}
                        onChange={(v) => updateFilterOut("dateIn", v)}
                        onClear={() => updateFilterOut("dateIn", undefined)}
                      />
                      <DateRangeInput
                        label="Дата выпуска"
                        value={filtersOut.dateOut ?? {}}
                        onChange={(v) => updateFilterOut("dateOut", v)}
                        onClear={() => updateFilterOut("dateOut", undefined)}
                      />
                    </>
                  )}
                </CardContent>
              </Card>
              </TabsContent>
              <TabsContent value="sorting" className="mt-0">
              <Card>
                <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-base">Поля сортировки</CardTitle>
                  <Button size="sm" onClick={addSortField}>
                    Добавить поле
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  {sortFields.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      Поля сортировки не выбраны
                    </p>
                  ) : (
                    sortFields.map((sortField, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-[1fr_auto_auto] gap-2 items-center"
                      >
                        <Select
                          value={sortField.fieldName}
                          onValueChange={(value) =>
                            updateSortField(index, { fieldName: value })
                          }
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue className="truncate" />
                          </SelectTrigger>
                          <SelectContent>
                            {sortOptions.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select
                          value={sortField.descending ? "desc" : "asc"}
                          onValueChange={(value) =>
                            updateSortField(index, {
                              descending: value === "desc",
                            })
                          }
                        >
                          <SelectTrigger className="h-8 w-fit">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="asc">↑ По возр.</SelectItem>
                            <SelectItem value="desc">↓ По убыв.</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeSortField(index)}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
