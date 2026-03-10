"use client";

import { useState, useCallback } from "react";
import { X, Filter, ChevronsUpDown } from "lucide-react";
import {
  Button,
  Input,
  Label,
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

interface DateRangeInputProps {
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
              className={cn("h-8 w-full justify-between text-left font-normal", {
                "text-muted-foreground": !value.length,
              })}
            >
              {value.length > 0 ? `Выбрано: ${value.length}` : placeholder}
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
        {value.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClear}
            className="h-8 w-8 p-0 flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {value.map((id) => {
            const option = options.find((o) => o.id === id);
            return option ? (
              <Badge key={id} variant="secondary" className="text-xs">
                {option.name}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSelect(id)}
                  className="h-auto w-auto p-0 ml-1 hover:bg-transparent"
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

const DateRangeInput: React.FC<DateRangeInputProps> = ({
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
        <Label className="text-sm font-medium">{label}</Label>
        {hasValue && onClear && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClear}
            className="h-6 w-6 p-0"
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
            <SelectTrigger className="h-8 w-20 text-xs">
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
            <SelectTrigger className="h-8 w-20 text-xs">
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
            <SelectTrigger className="h-8 w-16 text-xs">
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
            <SelectTrigger className="h-8 w-20 text-xs">
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
            <SelectTrigger className="h-8 w-20 text-xs">
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
            <SelectTrigger className="h-8 w-16 text-xs">
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
}: RepairsFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const { data: depots = [] } = useDepots();
  const { data: repairTypes = [] } = useRepairTypes();

  const sortOptions =
    filterTableType === "in" ? REPAIRS_IN_SORT_OPTIONS : REPAIRS_OUT_SORT_OPTIONS;

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
          <SheetTitle className="flex items-center justify-between">
            <span>Фильтры ремонтов</span>
            <Button variant="outline" size="sm" onClick={onClearFilters}>
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
                    onValueChange={(v) => onFilterTableTypeChange(v as RepairsFilterTableType)}
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
                    <Label>№ Вагона (через запятую)</Label>
                    <Input
                      placeholder="Например: 12345678, 87654321"
                      value={
                        (filterTableType === "in"
                          ? filtersIn.cisternNumbers
                          : filtersOut.cisternNumbers
                        )?.join(", ") ?? ""
                      }
                      onChange={(e) => {
                        const list = parseCommaList(e.target.value);
                        if (filterTableType === "in") {
                          updateFilterIn(
                            "cisternNumbers",
                            list.length ? list : undefined
                          );
                        } else {
                          updateFilterOut(
                            "cisternNumbers",
                            list.length ? list : undefined
                          );
                        }
                      }}
                      className="h-8"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label>Тип ремонта</Label>
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
                    <Label>Депо</Label>
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
                    <Label>Дороги (названия через запятую)</Label>
                    <Input
                      placeholder="Например: ОЖД, СЖД"
                      value={
                        (filterTableType === "in"
                          ? filtersIn.roadNames
                          : filtersOut.roadNames
                        )?.join(", ") ?? ""
                      }
                      onChange={(e) => {
                        const list = parseCommaList(e.target.value);
                        if (filterTableType === "in") {
                          updateFilterIn(
                            "roadNames",
                            list.length ? list : undefined
                          );
                        } else {
                          updateFilterOut(
                            "roadNames",
                            list.length ? list : undefined
                          );
                        }
                      }}
                      className="h-8"
                    />
                  </div>

                  {filterTableType === "in" && (
                    <>
                      <div className="flex flex-col gap-2">
                        <Label>ВУ23 (через запятую)</Label>
                        <Input
                          placeholder="Коды ВУ23"
                          value={filtersIn.vu23?.join(", ") ?? ""}
                          onChange={(e) =>
                            updateFilterIn(
                              "vu23",
                              parseCommaList(e.target.value).length
                                ? parseCommaList(e.target.value)
                                : undefined
                            )
                          }
                          className="h-8"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label>Станции (названия через запятую)</Label>
                        <Input
                          placeholder="Названия станций"
                          value={filtersIn.stationNames?.join(", ") ?? ""}
                          onChange={(e) =>
                            updateFilterIn(
                              "stationNames",
                              parseCommaList(e.target.value).length
                                ? parseCommaList(e.target.value)
                                : undefined
                            )
                          }
                          className="h-8"
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
                        <Label>ВУ36 (через запятую)</Label>
                        <Input
                          placeholder="Коды ВУ36"
                          value={filtersOut.vu36?.join(", ") ?? ""}
                          onChange={(e) =>
                            updateFilterOut(
                              "vu36",
                              parseCommaList(e.target.value).length
                                ? parseCommaList(e.target.value)
                                : undefined
                            )
                          }
                          className="h-8"
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
