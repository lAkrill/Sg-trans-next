"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Button,
  Badge,
  Input,
  Label,
  Separator,
  ScrollArea,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  SearchableSelect,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import { Filter, RotateCcw, X } from "lucide-react";
import {
  useCisternIdAndNumbers,
  useDepotOptions,
  useEmployeeOptions,
  useFitmentTypeOptions,
} from "@/hooks";
import { cn } from "@/lib/utils";

/** Подсветка активного (заполненного) фильтра */
const ACTIVE_FILTER_CONTROL =
  "border-green-500 bg-green-50 text-green-900 hover:bg-green-50 focus-visible:ring-green-500/40";
const ACTIVE_FILTER_BADGE =
  "border-green-500 bg-green-100 text-green-800 hover:bg-green-100";

export type FitmentEquipmentSortField =
  | "date"
  | "operation"
  | "cistern"
  | "fitment"
  | "fitmentType"
  | "jobUser"
  | "testUser"
  | "acceptUser"
  | "installUser"
  | "approvUser"
  | "depot"
  | "document";

export type FitmentEquipmentSortDirection = "asc" | "desc";

export interface FitmentEquipmentFilterCriteria {
  dateFrom?: string;
  dateTo?: string;
  operations?: number[];
  railwayCisternsIds?: string[];
  serialNumber?: string;
  passportNumber?: string;
  fitmentTypeIds?: string[];
  jobUserIds?: string[];
  testUserIds?: string[];
  acceptUserIds?: string[];
  installUserIds?: string[];
  approvUserIds?: string[];
  depoIds?: string[];
  documentNumber?: string;
}

export interface FitmentEquipmentSortConfig {
  field: FitmentEquipmentSortField | "";
  direction: FitmentEquipmentSortDirection;
}

export const FITMENT_EQUIPMENT_COLUMN_OPTIONS = [
  { value: "date", label: "Дата привязки" },
  { value: "operation", label: "Операция" },
  { value: "cistern", label: "Номер вагона-цистерны" },
  { value: "fitment", label: "Арматура" },
  { value: "fitmentType", label: "Тип арматуры" },
  { value: "jobUser", label: "Работу произвёл" },
  { value: "testUser", label: "Испытание провёл" },
  { value: "acceptUser", label: "Работу принял" },
  { value: "installUser", label: "Установил" },
  { value: "approvUser", label: "Утвердил" },
  { value: "depot", label: "Место работы" },
  { value: "document", label: "Документ" },
] as const;

export const DEFAULT_FITMENT_EQUIPMENT_VISIBLE_COLUMNS = [
  "date",
  "operation",
  "cistern",
  "fitment",
  "fitmentType",
  "jobUser",
  "testUser",
  "depot",
  "document",
];

export const EMPTY_FITMENT_EQUIPMENT_FILTERS: FitmentEquipmentFilterCriteria = {
  dateFrom: "",
  dateTo: "",
  operations: [],
  railwayCisternsIds: [],
  serialNumber: "",
  passportNumber: "",
  fitmentTypeIds: [],
  jobUserIds: [],
  testUserIds: [],
  acceptUserIds: [],
  installUserIds: [],
  approvUserIds: [],
  depoIds: [],
  documentNumber: "",
};

export const DEFAULT_FITMENT_EQUIPMENT_SORT: FitmentEquipmentSortConfig = {
  field: "date",
  direction: "desc",
};

const OPERATION_OPTIONS = [
  { value: "1", label: "Снятие" },
  { value: "2", label: "Установка" },
  { value: "3", label: "ТО" },
] as const;

const countActiveFilters = (filters: FitmentEquipmentFilterCriteria) =>
  Object.values(filters).filter((value) => {
    if (Array.isArray(value)) return value.length > 0;
    return value !== undefined && value !== null && value !== "";
  }).length;

interface MultiSelectFilterProps {
  label: string;
  values: string[];
  options: { value: string; label: string }[];
  placeholder: string;
  searchPlaceholder: string;
  isLoading?: boolean;
  onAdd: (value: string) => void;
  onRemove: (value: string) => void;
}

function MultiSelectFilter({
  label,
  values,
  options,
  placeholder,
  searchPlaceholder,
  isLoading,
  onAdd,
  onRemove,
}: MultiSelectFilterProps) {
  const selected = new Set(values);
  const available = options.filter((option) => !selected.has(option.value));
  const hasValue = values.length > 0;

  return (
    <div className="space-y-2">
      <Label className={cn(hasValue && "text-green-800")}>{label}</Label>
      <SearchableSelect
        value=""
        onChange={onAdd}
        options={available}
        placeholder={placeholder}
        searchPlaceholder={searchPlaceholder}
        isLoading={isLoading}
        className={cn(hasValue && ACTIVE_FILTER_CONTROL)}
      />
      {hasValue && (
        <div className="flex flex-wrap gap-2 pt-1">
          {values.map((value) => {
            const option = options.find((item) => item.value === value);
            return (
              <Badge
                key={value}
                variant="outline"
                className={cn("gap-1 pr-1 text-xs", ACTIVE_FILTER_BADGE)}
              >
                {option?.label || value}
                <button
                  type="button"
                  className="rounded-sm p-0.5 text-green-800 hover:bg-transparent"
                  onClick={() => onRemove(value)}
                  aria-label={`Удалить ${label}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface FitmentEquipmentsFilterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: FitmentEquipmentFilterCriteria;
  sort: FitmentEquipmentSortConfig;
  visibleColumns: string[];
  allowedOperations?: number[];
  onApply: (payload: {
    filters: FitmentEquipmentFilterCriteria;
    sort: FitmentEquipmentSortConfig;
  }) => void;
  onVisibleColumnsChange: (columns: string[]) => void;
  filteredCount?: number;
  totalCount?: number;
}

export function FitmentEquipmentsFilter({
  open,
  onOpenChange,
  filters: propFilters,
  sort: propSort,
  visibleColumns,
  allowedOperations,
  onApply,
  onVisibleColumnsChange,
  filteredCount,
  totalCount,
}: FitmentEquipmentsFilterProps) {
  const [localFilters, setLocalFilters] =
    useState<FitmentEquipmentFilterCriteria>(propFilters);
  const [localSort, setLocalSort] = useState<FitmentEquipmentSortConfig>(propSort);

  const { data: fitmentTypeOptions = [], isLoading: isFitmentTypesLoading } =
    useFitmentTypeOptions();
  const { data: employeeOptions = [], isLoading: isEmployeesLoading } = useEmployeeOptions();
  const { data: depotOptions = [], isLoading: isDepotsLoading } = useDepotOptions();
  const { data: cisternIdAndNumbers = [], isLoading: isCisternsLoading } =
    useCisternIdAndNumbers();

  const cisternOptions = cisternIdAndNumbers.map((cistern) => ({
    value: cistern.id,
    label: cistern.number,
  }));

  const showOperationFilter = (allowedOperations?.length ?? 0) !== 1;
  const operationOptions = OPERATION_OPTIONS.filter((option) =>
    !allowedOperations?.length ? true : allowedOperations.includes(Number(option.value))
  );

  const updateFilter = <K extends keyof FitmentEquipmentFilterCriteria>(
    key: K,
    value: FitmentEquipmentFilterCriteria[K]
  ) => {
    setLocalFilters((prev) => ({ ...prev, [key]: value }));
  };

  const addToList = (key: keyof FitmentEquipmentFilterCriteria, value: string) => {
    if (!value) return;
    const current = (localFilters[key] as string[] | undefined) ?? [];
    if (current.includes(value)) return;
    updateFilter(key, [...current, value] as FitmentEquipmentFilterCriteria[typeof key]);
  };

  const removeFromList = (key: keyof FitmentEquipmentFilterCriteria, value: string) => {
    const current = (localFilters[key] as string[] | undefined) ?? [];
    updateFilter(
      key,
      current.filter((item) => item !== value) as FitmentEquipmentFilterCriteria[typeof key]
    );
  };

  const handleApply = () => {
    onApply({ filters: localFilters, sort: localSort });
  };

  const handleClear = () => {
    setLocalFilters(EMPTY_FITMENT_EQUIPMENT_FILTERS);
    setLocalSort(DEFAULT_FITMENT_EQUIPMENT_SORT);
    onApply({
      filters: EMPTY_FITMENT_EQUIPMENT_FILTERS,
      sort: DEFAULT_FITMENT_EQUIPMENT_SORT,
    });
  };

  const hasCustomSort =
    localSort.field !== DEFAULT_FITMENT_EQUIPMENT_SORT.field ||
    localSort.direction !== DEFAULT_FITMENT_EQUIPMENT_SORT.direction;
  const activeFiltersCount =
    countActiveFilters(localFilters) + (hasCustomSort ? 1 : 0);

  return (
    <Sheet
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) {
          setLocalFilters(propFilters);
          setLocalSort(propSort);
        }
        onOpenChange(nextOpen);
      }}
    >
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(activeFiltersCount > 0 && ACTIVE_FILTER_CONTROL)}
        >
          <Filter className="h-4 w-4 mr-2" />
          Фильтры
          {activeFiltersCount > 0 && (
            <Badge variant="outline" className={cn("ml-2", ACTIVE_FILTER_BADGE)}>
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="right-[10px] w-[calc(100vw-2rem)] sm:!w-[33.333vw] sm:!max-w-[33.333vw] flex h-full flex-col pl-4 pr-4">
        <SheetHeader>
          <SheetTitle>Фильтры записей</SheetTitle>
          <SheetDescription>
            Настройте фильтры, сортировку и видимость столбцов
          </SheetDescription>
          {filteredCount !== undefined && totalCount !== undefined && (
            <div className="mt-2 text-sm text-muted-foreground">
              Найдено: {filteredCount} из {totalCount} записей
            </div>
          )}
        </SheetHeader>

        <Separator className="my-4" />
        <div className="flex space-x-2">
          <Button onClick={handleApply} className="flex-1">
            Применить
          </Button>
          <Button variant="outline" onClick={handleClear}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Сбросить
          </Button>
        </div>

        <Tabs defaultValue="filters" className="flex-1 min-h-0 flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="filters">Фильтры</TabsTrigger>
            <TabsTrigger value="sort">Сортировка</TabsTrigger>
            <TabsTrigger value="columns">Столбцы</TabsTrigger>
          </TabsList>

          <TabsContent value="filters" className="flex-1 min-h-0">
            <ScrollArea className="h-full">
              <div className="space-y-4 pr-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Дата привязки</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <Label
                          htmlFor="fitment-eq-date-from"
                          className={cn(localFilters.dateFrom && "text-green-800")}
                        >
                          От
                        </Label>
                        <Input
                          id="fitment-eq-date-from"
                          type="date"
                          value={localFilters.dateFrom || ""}
                          onChange={(e) => updateFilter("dateFrom", e.target.value)}
                          className={cn(localFilters.dateFrom && ACTIVE_FILTER_CONTROL)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="fitment-eq-date-to"
                          className={cn(localFilters.dateTo && "text-green-800")}
                        >
                          До
                        </Label>
                        <Input
                          id="fitment-eq-date-to"
                          type="date"
                          value={localFilters.dateTo || ""}
                          onChange={(e) => updateFilter("dateTo", e.target.value)}
                          className={cn(localFilters.dateTo && ACTIVE_FILTER_CONTROL)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Основная информация</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {showOperationFilter && (
                      <MultiSelectFilter
                        label="Операция"
                        values={(localFilters.operations ?? []).map(String)}
                        options={operationOptions.map((option) => ({
                          value: option.value,
                          label: option.label,
                        }))}
                        placeholder="Выберите операцию"
                        searchPlaceholder="Снятие или установка"
                        onAdd={(value) => {
                          const operation = Number(value);
                          if (!Number.isFinite(operation)) return;
                          const current = localFilters.operations ?? [];
                          if (current.includes(operation)) return;
                          updateFilter("operations", [...current, operation]);
                        }}
                        onRemove={(value) => {
                          const operation = Number(value);
                          updateFilter(
                            "operations",
                            (localFilters.operations ?? []).filter((item) => item !== operation)
                          );
                        }}
                      />
                    )}

                    <MultiSelectFilter
                      label="Номер вагона-цистерны"
                      values={localFilters.railwayCisternsIds ?? []}
                      options={cisternOptions}
                      placeholder="Выберите вагон"
                      searchPlaceholder="Введите номер вагона"
                      isLoading={isCisternsLoading}
                      onAdd={(value) => addToList("railwayCisternsIds", value)}
                      onRemove={(value) => removeFromList("railwayCisternsIds", value)}
                    />

                    <MultiSelectFilter
                      label="Тип арматуры"
                      values={localFilters.fitmentTypeIds ?? []}
                      options={fitmentTypeOptions}
                      placeholder="Выберите тип арматуры"
                      searchPlaceholder="Введите название или код"
                      isLoading={isFitmentTypesLoading}
                      onAdd={(value) => addToList("fitmentTypeIds", value)}
                      onRemove={(value) => removeFromList("fitmentTypeIds", value)}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="fitment-eq-serial"
                          className={cn(localFilters.serialNumber && "text-green-800")}
                        >
                          Номер арматуры
                        </Label>
                        <Input
                          id="fitment-eq-serial"
                          placeholder="Поиск по номеру"
                          value={localFilters.serialNumber || ""}
                          onChange={(e) => updateFilter("serialNumber", e.target.value)}
                          className={cn(localFilters.serialNumber && ACTIVE_FILTER_CONTROL)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="fitment-eq-passport"
                          className={cn(localFilters.passportNumber && "text-green-800")}
                        >
                          Паспорт
                        </Label>
                        <Input
                          id="fitment-eq-passport"
                          placeholder="Поиск по паспорту"
                          value={localFilters.passportNumber || ""}
                          onChange={(e) => updateFilter("passportNumber", e.target.value)}
                          className={cn(localFilters.passportNumber && ACTIVE_FILTER_CONTROL)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="fitment-eq-document"
                        className={cn(localFilters.documentNumber && "text-green-800")}
                      >
                        Документ
                      </Label>
                      <Input
                        id="fitment-eq-document"
                        placeholder="Поиск по номеру документа"
                        value={localFilters.documentNumber || ""}
                        onChange={(e) => updateFilter("documentNumber", e.target.value)}
                        className={cn(localFilters.documentNumber && ACTIVE_FILTER_CONTROL)}
                      />
                    </div>

                    <MultiSelectFilter
                      label="Место работы"
                      values={localFilters.depoIds ?? []}
                      options={depotOptions}
                      placeholder="Выберите депо"
                      searchPlaceholder="Введите название или код"
                      isLoading={isDepotsLoading}
                      onAdd={(value) => addToList("depoIds", value)}
                      onRemove={(value) => removeFromList("depoIds", value)}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Сотрудники</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <MultiSelectFilter
                      label="Работу произвёл"
                      values={localFilters.jobUserIds ?? []}
                      options={employeeOptions}
                      placeholder="Выберите сотрудника"
                      searchPlaceholder="Введите ФИО"
                      isLoading={isEmployeesLoading}
                      onAdd={(value) => addToList("jobUserIds", value)}
                      onRemove={(value) => removeFromList("jobUserIds", value)}
                    />
                    <MultiSelectFilter
                      label="Испытание провёл"
                      values={localFilters.testUserIds ?? []}
                      options={employeeOptions}
                      placeholder="Выберите сотрудника"
                      searchPlaceholder="Введите ФИО"
                      isLoading={isEmployeesLoading}
                      onAdd={(value) => addToList("testUserIds", value)}
                      onRemove={(value) => removeFromList("testUserIds", value)}
                    />
                    <MultiSelectFilter
                      label="Работу принял"
                      values={localFilters.acceptUserIds ?? []}
                      options={employeeOptions}
                      placeholder="Выберите сотрудника"
                      searchPlaceholder="Введите ФИО"
                      isLoading={isEmployeesLoading}
                      onAdd={(value) => addToList("acceptUserIds", value)}
                      onRemove={(value) => removeFromList("acceptUserIds", value)}
                    />
                    <MultiSelectFilter
                      label="Установил"
                      values={localFilters.installUserIds ?? []}
                      options={employeeOptions}
                      placeholder="Выберите сотрудника"
                      searchPlaceholder="Введите ФИО"
                      isLoading={isEmployeesLoading}
                      onAdd={(value) => addToList("installUserIds", value)}
                      onRemove={(value) => removeFromList("installUserIds", value)}
                    />
                    <MultiSelectFilter
                      label="Утвердил"
                      values={localFilters.approvUserIds ?? []}
                      options={employeeOptions}
                      placeholder="Выберите сотрудника"
                      searchPlaceholder="Введите ФИО"
                      isLoading={isEmployeesLoading}
                      onAdd={(value) => addToList("approvUserIds", value)}
                      onRemove={(value) => removeFromList("approvUserIds", value)}
                    />
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="sort" className="flex-1">
            <div className="space-y-4 pr-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Сортировка</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Поле</Label>
                    <Select
                      value={localSort.field || "none"}
                      onValueChange={(value) =>
                        setLocalSort((prev) => ({
                          ...prev,
                          field:
                            value === "none" ? "" : (value as FitmentEquipmentSortField),
                        }))
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Без сортировки" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Без сортировки</SelectItem>
                        {FITMENT_EQUIPMENT_COLUMN_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Направление</Label>
                    <Select
                      value={localSort.direction}
                      onValueChange={(value) =>
                        setLocalSort((prev) => ({
                          ...prev,
                          direction: value as FitmentEquipmentSortDirection,
                        }))
                      }
                      disabled={!localSort.field}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="asc">По возрастанию</SelectItem>
                        <SelectItem value="desc">По убыванию</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="columns" className="flex-1">
            <div className="space-y-4 pr-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Видимые столбцы</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-2">
                  {FITMENT_EQUIPMENT_COLUMN_OPTIONS.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`fitment-eq-column-${option.value}`}
                        checked={visibleColumns.includes(option.value)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            onVisibleColumnsChange([...visibleColumns, option.value]);
                          } else if (visibleColumns.length > 1) {
                            onVisibleColumnsChange(
                              visibleColumns.filter((column) => column !== option.value)
                            );
                          }
                        }}
                      />
                      <Label
                        htmlFor={`fitment-eq-column-${option.value}`}
                        className="text-sm font-normal"
                      >
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
