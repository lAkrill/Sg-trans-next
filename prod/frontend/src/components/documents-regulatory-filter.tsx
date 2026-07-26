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

export type DocumentsRegulatorySortField =
  | "name"
  | "number"
  | "date"
  | "file"
  | "url"
  | "updatedAt";

export type DocumentsRegulatorySortDirection = "asc" | "desc";

export interface DocumentsRegulatoryFilterCriteria {
  name?: string;
  number?: string;
  file?: string;
  url?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface DocumentsRegulatorySortConfig {
  field: DocumentsRegulatorySortField | "";
  direction: DocumentsRegulatorySortDirection;
}

export const DOCUMENTS_REGULATORY_COLUMN_OPTIONS = [
  { value: "name", label: "Название" },
  { value: "number", label: "Номер" },
  { value: "date", label: "Дата" },
  { value: "file", label: "Файл" },
  { value: "url", label: "URL" },
  { value: "updatedAt", label: "Дата обновления" },
] as const;

export const DEFAULT_DOCUMENTS_REGULATORY_VISIBLE_COLUMNS =
  DOCUMENTS_REGULATORY_COLUMN_OPTIONS.map((option) => option.value);

export const EMPTY_DOCUMENTS_REGULATORY_FILTERS: DocumentsRegulatoryFilterCriteria = {
  name: "",
  number: "",
  file: "",
  url: "",
  dateFrom: "",
  dateTo: "",
};

export const DEFAULT_DOCUMENTS_REGULATORY_SORT: DocumentsRegulatorySortConfig = {
  field: "",
  direction: "asc",
};

interface DocumentsRegulatoryFilterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: DocumentsRegulatoryFilterCriteria;
  sort: DocumentsRegulatorySortConfig;
  visibleColumns: string[];
  onApply: (payload: {
    filters: DocumentsRegulatoryFilterCriteria;
    sort: DocumentsRegulatorySortConfig;
  }) => void;
  onVisibleColumnsChange: (columns: string[]) => void;
  filteredCount?: number;
  totalCount?: number;
}

const countActiveFilters = (filters: DocumentsRegulatoryFilterCriteria) =>
  Object.values(filters).filter((value) => value !== undefined && value !== null && value !== "")
    .length;

export function DocumentsRegulatoryFilter({
  open,
  onOpenChange,
  filters: propFilters,
  sort: propSort,
  visibleColumns,
  onApply,
  onVisibleColumnsChange,
  filteredCount,
  totalCount,
}: DocumentsRegulatoryFilterProps) {
  const [localFilters, setLocalFilters] =
    useState<DocumentsRegulatoryFilterCriteria>(propFilters);
  const [localSort, setLocalSort] = useState<DocumentsRegulatorySortConfig>(propSort);

  const updateFilter = <K extends keyof DocumentsRegulatoryFilterCriteria>(
    key: K,
    value: DocumentsRegulatoryFilterCriteria[K]
  ) => {
    setLocalFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleApply = () => {
    onApply({ filters: localFilters, sort: localSort });
  };

  const handleClear = () => {
    setLocalFilters(EMPTY_DOCUMENTS_REGULATORY_FILTERS);
    setLocalSort(DEFAULT_DOCUMENTS_REGULATORY_SORT);
    onApply({
      filters: EMPTY_DOCUMENTS_REGULATORY_FILTERS,
      sort: DEFAULT_DOCUMENTS_REGULATORY_SORT,
    });
  };

  const activeFiltersCount =
    countActiveFilters(localFilters) + (localSort.field ? 1 : 0);

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
        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-2" />
          Фильтры
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="right-[10px] w-[calc(100vw-2rem)] sm:!w-[33.333vw] sm:!max-w-[33.333vw] flex h-full flex-col">
        <SheetHeader>
          <SheetTitle>Фильтры нормативных документов</SheetTitle>
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
                      <Label htmlFor="filter-name">Название</Label>
                      <Input
                        id="filter-name"
                        placeholder="Поиск по названию"
                        value={localFilters.name || ""}
                        onChange={(e) => updateFilter("name", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="filter-number">Номер</Label>
                      <Input
                        id="filter-number"
                        placeholder="Поиск по номеру"
                        value={localFilters.number || ""}
                        onChange={(e) => updateFilter("number", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="filter-file">Файл</Label>
                      <Input
                        id="filter-file"
                        placeholder="Поиск по файлу"
                        value={localFilters.file || ""}
                        onChange={(e) => updateFilter("file", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="filter-url">URL</Label>
                      <Input
                        id="filter-url"
                        placeholder="Поиск по URL"
                        value={localFilters.url || ""}
                        onChange={(e) => updateFilter("url", e.target.value)}
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
                        <Label htmlFor="filter-date-from">От</Label>
                        <Input
                          id="filter-date-from"
                          type="date"
                          value={localFilters.dateFrom || ""}
                          onChange={(e) => updateFilter("dateFrom", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="filter-date-to">До</Label>
                        <Input
                          id="filter-date-to"
                          type="date"
                          value={localFilters.dateTo || ""}
                          onChange={(e) => updateFilter("dateTo", e.target.value)}
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
                          field: value === "none" ? "" : (value as DocumentsRegulatorySortField),
                        }))
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Без сортировки" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Без сортировки</SelectItem>
                        {DOCUMENTS_REGULATORY_COLUMN_OPTIONS.map((option) => (
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
                          direction: value as DocumentsRegulatorySortDirection,
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
                  {DOCUMENTS_REGULATORY_COLUMN_OPTIONS.map((option) => (
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
