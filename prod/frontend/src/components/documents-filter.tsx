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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import { Filter, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

/** Подсветка активного (заполненного) фильтра */
const ACTIVE_FILTER_CONTROL =
  "border-green-500 bg-green-50 text-green-900 hover:bg-green-50 focus-visible:ring-green-500/40";
const ACTIVE_FILTER_BADGE =
  "border-green-500 bg-green-100 text-green-800 hover:bg-green-100";

export type DocumentSortField =
  | "number"
  | "type"
  | "date"
  | "author"
  | "price"
  | "note"
  | "file";

export type DocumentSortDirection = "asc" | "desc";

export const DOCUMENT_TYPE_CISTERN_COMPLECTATION = 1;

export const DOCUMENT_TYPE_OPTIONS = [
  { value: 1, label: "Комплектация вагона-цистерны" },
  { value: 2, label: "Привязка арматуры" },
  { value: 3, label: "АКТ приемки-передачи металлолома" },
  { value: 4, label: "АКТ приемки металлолома" },
  { value: 5, label: "АКТ приемки-передачи запосных частей" },
] as const;

export type DocumentTypeValue = (typeof DOCUMENT_TYPE_OPTIONS)[number]["value"];

export const getDocumentTypeLabel = (type: number | null | undefined): string => {
  if (type == null) return "—";
  return DOCUMENT_TYPE_OPTIONS.find((option) => option.value === type)?.label ?? String(type);
};

export interface DocumentFilterCriteria {
  number?: string;
  type?: string;
  author?: string;
  note?: string;
  file?: string;
  dateFrom?: string;
  dateTo?: string;
  priceFrom?: string;
  priceTo?: string;
}

export interface DocumentSortConfig {
  field: DocumentSortField | "";
  direction: DocumentSortDirection;
}

export const DOCUMENT_COLUMN_OPTIONS = [
  { value: "number", label: "Номер" },
  { value: "type", label: "Тип" },
  { value: "date", label: "Дата" },
  { value: "author", label: "Автор" },
  { value: "price", label: "Цена" },
  { value: "note", label: "Примечание" },
  { value: "file", label: "Файл" },
] as const;

export const DEFAULT_DOCUMENT_VISIBLE_COLUMNS = DOCUMENT_COLUMN_OPTIONS.filter(
  (option) => option.value !== "price" && option.value !== "note"
).map((option) => option.value);

export const EMPTY_DOCUMENT_FILTERS: DocumentFilterCriteria = {
  number: "",
  type: "",
  author: "",
  note: "",
  file: "",
  dateFrom: "",
  dateTo: "",
  priceFrom: "",
  priceTo: "",
};

export const DEFAULT_DOCUMENT_SORT: DocumentSortConfig = {
  field: "date",
  direction: "desc",
};

export const isDefaultDocumentSort = (sort: DocumentSortConfig) =>
  sort.field === DEFAULT_DOCUMENT_SORT.field &&
  sort.direction === DEFAULT_DOCUMENT_SORT.direction;

interface DocumentsFilterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: DocumentFilterCriteria;
  sort: DocumentSortConfig;
  visibleColumns: string[];
  onApply: (payload: {
    filters: DocumentFilterCriteria;
    sort: DocumentSortConfig;
  }) => void;
  onVisibleColumnsChange: (columns: string[]) => void;
  filteredCount?: number;
  totalCount?: number;
}

const countActiveFilters = (filters: DocumentFilterCriteria) =>
  Object.values(filters).filter((value) => value !== undefined && value !== null && value !== "")
    .length;

export function DocumentsFilter({
  open,
  onOpenChange,
  filters: propFilters,
  sort: propSort,
  visibleColumns,
  onApply,
  onVisibleColumnsChange,
  filteredCount,
  totalCount,
}: DocumentsFilterProps) {
  const [localFilters, setLocalFilters] = useState<DocumentFilterCriteria>(propFilters);
  const [localSort, setLocalSort] = useState<DocumentSortConfig>(propSort);

  const updateFilter = <K extends keyof DocumentFilterCriteria>(
    key: K,
    value: DocumentFilterCriteria[K]
  ) => {
    setLocalFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleApply = () => {
    onApply({ filters: localFilters, sort: localSort });
  };

  const handleClear = () => {
    setLocalFilters(EMPTY_DOCUMENT_FILTERS);
    setLocalSort(DEFAULT_DOCUMENT_SORT);
    onApply({ filters: EMPTY_DOCUMENT_FILTERS, sort: DEFAULT_DOCUMENT_SORT });
  };

  const hasCustomSort = !isDefaultDocumentSort(localSort);
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
      <SheetContent className="right-[10px] w-[calc(100vw-2rem)] sm:!w-[33.333vw] sm:!max-w-[33.333vw] flex h-full flex-col">
        <SheetHeader>
          <SheetTitle>Фильтры документов</SheetTitle>
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
                    <CardTitle className="text-base">Основная информация</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="filter-number"
                        className={cn(localFilters.number && "text-green-800")}
                      >
                        Номер
                      </Label>
                      <Input
                        id="filter-number"
                        placeholder="Поиск по номеру"
                        value={localFilters.number || ""}
                        onChange={(e) => updateFilter("number", e.target.value)}
                        className={cn(localFilters.number && ACTIVE_FILTER_CONTROL)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="filter-type"
                        className={cn(localFilters.type && "text-green-800")}
                      >
                        Тип
                      </Label>
                      <Select
                        value={localFilters.type || "all"}
                        onValueChange={(value) =>
                          updateFilter("type", value === "all" ? "" : value)
                        }
                      >
                        <SelectTrigger
                          id="filter-type"
                          className={cn("w-full", localFilters.type && ACTIVE_FILTER_CONTROL)}
                        >
                          <SelectValue placeholder="Все типы" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Все типы</SelectItem>
                          {DOCUMENT_TYPE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={String(option.value)}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="filter-author"
                        className={cn(localFilters.author && "text-green-800")}
                      >
                        Автор
                      </Label>
                      <Input
                        id="filter-author"
                        placeholder="Поиск по автору"
                        value={localFilters.author || ""}
                        onChange={(e) => updateFilter("author", e.target.value)}
                        className={cn(localFilters.author && ACTIVE_FILTER_CONTROL)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="filter-note"
                        className={cn(localFilters.note && "text-green-800")}
                      >
                        Примечание
                      </Label>
                      <Input
                        id="filter-note"
                        placeholder="Поиск по примечанию"
                        value={localFilters.note || ""}
                        onChange={(e) => updateFilter("note", e.target.value)}
                        className={cn(localFilters.note && ACTIVE_FILTER_CONTROL)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="filter-file"
                        className={cn(localFilters.file && "text-green-800")}
                      >
                        Файл
                      </Label>
                      <Input
                        id="filter-file"
                        placeholder="Поиск по файлу"
                        value={localFilters.file || ""}
                        onChange={(e) => updateFilter("file", e.target.value)}
                        className={cn(localFilters.file && ACTIVE_FILTER_CONTROL)}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Дата</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <Label
                          htmlFor="filter-date-from"
                          className={cn(localFilters.dateFrom && "text-green-800")}
                        >
                          От
                        </Label>
                        <Input
                          id="filter-date-from"
                          type="date"
                          value={localFilters.dateFrom || ""}
                          onChange={(e) => updateFilter("dateFrom", e.target.value)}
                          className={cn(localFilters.dateFrom && ACTIVE_FILTER_CONTROL)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="filter-date-to"
                          className={cn(localFilters.dateTo && "text-green-800")}
                        >
                          До
                        </Label>
                        <Input
                          id="filter-date-to"
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
                    <CardTitle className="text-base">Цена</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <Label
                          htmlFor="filter-price-from"
                          className={cn(localFilters.priceFrom && "text-green-800")}
                        >
                          От
                        </Label>
                        <Input
                          id="filter-price-from"
                          type="number"
                          step="0.01"
                          placeholder="От"
                          value={localFilters.priceFrom || ""}
                          onChange={(e) => updateFilter("priceFrom", e.target.value)}
                          className={cn(localFilters.priceFrom && ACTIVE_FILTER_CONTROL)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="filter-price-to"
                          className={cn(localFilters.priceTo && "text-green-800")}
                        >
                          До
                        </Label>
                        <Input
                          id="filter-price-to"
                          type="number"
                          step="0.01"
                          placeholder="До"
                          value={localFilters.priceTo || ""}
                          onChange={(e) => updateFilter("priceTo", e.target.value)}
                          className={cn(localFilters.priceTo && ACTIVE_FILTER_CONTROL)}
                        />
                      </div>
                    </div>
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
                          field: value === "none" ? "" : (value as DocumentSortField),
                        }))
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Без сортировки" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Без сортировки</SelectItem>
                        {DOCUMENT_COLUMN_OPTIONS.map((option) => (
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
                          direction: value as DocumentSortDirection,
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
                  {DOCUMENT_COLUMN_OPTIONS.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`column-${option.value}`}
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
                      <Label htmlFor={`column-${option.value}`} className="text-sm font-normal">
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
