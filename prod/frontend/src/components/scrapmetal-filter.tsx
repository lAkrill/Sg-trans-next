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

export type ScrapmetalSortField =
  | "partId"
  | "weight"
  | "date"
  | "code"
  | "note"
  | "documentId"
  | "updatedAt";

export type ScrapmetalSortDirection = "asc" | "desc";

export interface ScrapmetalFilterCriteria {
  partId?: string;
  note?: string;
  documentId?: string;
  codeFrom?: string;
  codeTo?: string;
  weightFrom?: string;
  weightTo?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface ScrapmetalSortConfig {
  field: ScrapmetalSortField | "";
  direction: ScrapmetalSortDirection;
}

export const SCRAPMETAL_COLUMN_OPTIONS = [
  { value: "partId", label: "Деталь" },
  { value: "weight", label: "Вес" },
  { value: "date", label: "Дата" },
  { value: "code", label: "Код" },
  { value: "note", label: "Примечание" },
  { value: "documentId", label: "Документ" },
  { value: "updatedAt", label: "Дата обновления" },
] as const;

export const DEFAULT_SCRAPMETAL_VISIBLE_COLUMNS = SCRAPMETAL_COLUMN_OPTIONS.map(
  (option) => option.value
);

export const EMPTY_SCRAPMETAL_FILTERS: ScrapmetalFilterCriteria = {
  partId: "",
  note: "",
  documentId: "",
  codeFrom: "",
  codeTo: "",
  weightFrom: "",
  weightTo: "",
  dateFrom: "",
  dateTo: "",
};

export const DEFAULT_SCRAPMETAL_SORT: ScrapmetalSortConfig = {
  field: "",
  direction: "asc",
};

interface ScrapmetalFilterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: ScrapmetalFilterCriteria;
  sort: ScrapmetalSortConfig;
  visibleColumns: string[];
  onApply: (payload: {
    filters: ScrapmetalFilterCriteria;
    sort: ScrapmetalSortConfig;
  }) => void;
  onVisibleColumnsChange: (columns: string[]) => void;
  filteredCount?: number;
  totalCount?: number;
}

const countActiveFilters = (filters: ScrapmetalFilterCriteria) =>
  Object.values(filters).filter((value) => value !== undefined && value !== null && value !== "")
    .length;

export function ScrapmetalFilter({
  open,
  onOpenChange,
  filters: propFilters,
  sort: propSort,
  visibleColumns,
  onApply,
  onVisibleColumnsChange,
  filteredCount,
  totalCount,
}: ScrapmetalFilterProps) {
  const [localFilters, setLocalFilters] = useState<ScrapmetalFilterCriteria>(propFilters);
  const [localSort, setLocalSort] = useState<ScrapmetalSortConfig>(propSort);

  const updateFilter = <K extends keyof ScrapmetalFilterCriteria>(
    key: K,
    value: ScrapmetalFilterCriteria[K]
  ) => {
    setLocalFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleApply = () => {
    onApply({ filters: localFilters, sort: localSort });
  };

  const handleClear = () => {
    setLocalFilters(EMPTY_SCRAPMETAL_FILTERS);
    setLocalSort(DEFAULT_SCRAPMETAL_SORT);
    onApply({
      filters: EMPTY_SCRAPMETAL_FILTERS,
      sort: DEFAULT_SCRAPMETAL_SORT,
    });
  };

  const activeFiltersCount = countActiveFilters(localFilters) + (localSort.field ? 1 : 0);

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
          <SheetTitle>Фильтры металлолома</SheetTitle>
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
                      <Label htmlFor="filter-part">Деталь</Label>
                      <Input
                        id="filter-part"
                        placeholder="Поиск по детали"
                        value={localFilters.partId || ""}
                        onChange={(e) => updateFilter("partId", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="filter-document">Документ</Label>
                      <Input
                        id="filter-document"
                        placeholder="Поиск по документу"
                        value={localFilters.documentId || ""}
                        onChange={(e) => updateFilter("documentId", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="filter-note">Примечание</Label>
                      <Input
                        id="filter-note"
                        placeholder="Поиск по примечанию"
                        value={localFilters.note || ""}
                        onChange={(e) => updateFilter("note", e.target.value)}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Вес</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <Label htmlFor="filter-weight-from">От</Label>
                        <Input
                          id="filter-weight-from"
                          type="number"
                          step="any"
                          value={localFilters.weightFrom || ""}
                          onChange={(e) => updateFilter("weightFrom", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="filter-weight-to">До</Label>
                        <Input
                          id="filter-weight-to"
                          type="number"
                          step="any"
                          value={localFilters.weightTo || ""}
                          onChange={(e) => updateFilter("weightTo", e.target.value)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Код</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <Label htmlFor="filter-code-from">От</Label>
                        <Input
                          id="filter-code-from"
                          type="number"
                          value={localFilters.codeFrom || ""}
                          onChange={(e) => updateFilter("codeFrom", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="filter-code-to">До</Label>
                        <Input
                          id="filter-code-to"
                          type="number"
                          value={localFilters.codeTo || ""}
                          onChange={(e) => updateFilter("codeTo", e.target.value)}
                        />
                      </div>
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
                          field: value === "none" ? "" : (value as ScrapmetalSortField),
                        }))
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Без сортировки" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Без сортировки</SelectItem>
                        {SCRAPMETAL_COLUMN_OPTIONS.map((option) => (
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
                          direction: value as ScrapmetalSortDirection,
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
                  {SCRAPMETAL_COLUMN_OPTIONS.map((option) => (
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
