'use client';

import { useState } from 'react';
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
} from '@/components/ui';
import { Filter, RotateCcw } from 'lucide-react';
import type { FitmentFilterCriteria } from '@/types/directories';

interface FitmentsFilterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFiltersChange: (filters: FitmentFilterCriteria) => void;
  onVisibleColumnsChange: (columns: string[]) => void;
  filters: FitmentFilterCriteria;
  visibleColumns?: string[];
  isLoading: boolean;
  filteredCount?: number;
  totalCount?: number;
  children?: React.ReactNode;
}

const sortFieldOptions = [
  { value: 'fitmentType', label: 'Тип' },
  { value: 'model', label: 'Модель' },
  { value: 'serialNumber', label: 'Номер' },
  { value: 'passportNumber', label: 'Паспорт' },
  { value: 'buildDate', label: 'Дата постройки' },
  { value: 'lastRepairDate', label: 'Дата последнего ТО' },
  { value: 'periodRep', label: 'Период ремонта' },
  { value: 'serviceLifeYears', label: 'Срок службы' },
  { value: 'manufacturer', label: 'Производитель' },
  { value: 'updatedAt', label: 'Дата обновления' },
  { value: 'createdId', label: 'Пользователь' },
];

const initialFilters: FitmentFilterCriteria = {
  fitmentTypeIds: [],
  serialNumbers: [],
  passportNumbers: [],
  modelIds: [],
  depotIds: [],
  creatorIds: [],
};

const parseList = (value: string) => value.split(',').map((item) => item.trim()).filter(Boolean);

export function FitmentsFilter({
  open,
  onOpenChange,
  onFiltersChange,
  onVisibleColumnsChange,
  filters: propFilters,
  visibleColumns,
  isLoading,
  filteredCount,
  totalCount,
  children,
}: FitmentsFilterProps) {
  const [localFilters, setLocalFilters] = useState<FitmentFilterCriteria>(propFilters || initialFilters);

  const handleApplyFilters = () => {
    onFiltersChange(localFilters);
  };

  const handleClearFilters = () => {
    setLocalFilters(initialFilters);
    onFiltersChange(initialFilters);
  };

  const updateFilter = (key: keyof FitmentFilterCriteria, value: unknown) => {
    setLocalFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const getActiveFiltersCount = () => {
    return Object.entries(localFilters).filter(([, value]) => {
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      if (typeof value === 'object' && value !== null) {
        return Object.values(value).some((nestedValue) => nestedValue !== undefined && nestedValue !== null && nestedValue !== '');
      }
      return value !== '' && value !== undefined && value !== null;
    }).length;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Фильтры
            {getActiveFiltersCount() > 0 && (
              <Badge variant="secondary" className="ml-2">
                {getActiveFiltersCount()}
              </Badge>
            )}
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="right-[10px] w-[calc(100vw-2rem)] sm:!w-[33.333vw] sm:!max-w-[33.333vw] flex h-full flex-col">
        <SheetHeader>
          <SheetTitle>Фильтры арматуры</SheetTitle>
          <SheetDescription>
            Настройте фильтры для поиска нужной арматуры
          </SheetDescription>
          {filteredCount !== undefined && totalCount !== undefined && (
            <div className="mt-2 text-sm text-muted-foreground">
              Найдено: {filteredCount} из {totalCount} записей
            </div>
          )}
        </SheetHeader>

        <Separator className="my-4" />
        <div className="flex space-x-2">
          <Button onClick={handleApplyFilters} disabled={isLoading} className="flex-1">
            {isLoading ? 'Применение...' : 'Применить фильтры'}
          </Button>
          <Button variant="outline" onClick={handleClearFilters} disabled={isLoading}>
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
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fitmentTypeIds">ID типов</Label>
                        <Input
                          id="fitmentTypeIds"
                          placeholder="Введите ID типов"
                          value={localFilters.fitmentTypeIds?.join(', ') || ''}
                          onChange={(e) => updateFilter('fitmentTypeIds', parseList(e.target.value))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="modelIds">ID моделей</Label>
                        <Input
                          id="modelIds"
                          placeholder="Введите ID моделей"
                          value={localFilters.modelIds?.join(', ') || ''}
                          onChange={(e) => updateFilter('modelIds', parseList(e.target.value))}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="serialNumbers">Номера</Label>
                        <Input
                          id="serialNumbers"
                          placeholder="Введите номера"
                          value={localFilters.serialNumbers?.join(', ') || ''}
                          onChange={(e) => updateFilter('serialNumbers', parseList(e.target.value))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="passportNumbers">Паспорта</Label>
                        <Input
                          id="passportNumbers"
                          placeholder="Введите паспорта"
                          value={localFilters.passportNumbers?.join(', ') || ''}
                          onChange={(e) => updateFilter('passportNumbers', parseList(e.target.value))}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="depotIds">ID депо</Label>
                        <Input
                          id="depotIds"
                          placeholder="Введите ID депо"
                          value={localFilters.depotIds?.join(', ') || ''}
                          onChange={(e) => updateFilter('depotIds', parseList(e.target.value))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="creatorIds">ID пользователей</Label>
                        <Input
                          id="creatorIds"
                          placeholder="Введите ID пользователей"
                          value={localFilters.creatorIds?.join(', ') || ''}
                          onChange={(e) => updateFilter('creatorIds', parseList(e.target.value))}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Даты</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Дата постройки</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="date"
                          value={localFilters.buildDate?.from || ''}
                          onChange={(e) => updateFilter('buildDate', {
                            ...localFilters.buildDate,
                            from: e.target.value || undefined,
                          })}
                        />
                        <Input
                          type="date"
                          value={localFilters.buildDate?.to || ''}
                          onChange={(e) => updateFilter('buildDate', {
                            ...localFilters.buildDate,
                            to: e.target.value || undefined,
                          })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Дата последнего ТО</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="date"
                          value={localFilters.lastRepairDate?.from || ''}
                          onChange={(e) => updateFilter('lastRepairDate', {
                            ...localFilters.lastRepairDate,
                            from: e.target.value || undefined,
                          })}
                        />
                        <Input
                          type="date"
                          value={localFilters.lastRepairDate?.to || ''}
                          onChange={(e) => updateFilter('lastRepairDate', {
                            ...localFilters.lastRepairDate,
                            to: e.target.value || undefined,
                          })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Дата обновления</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="datetime-local"
                          value={localFilters.updatedAt?.from || ''}
                          onChange={(e) => updateFilter('updatedAt', {
                            ...localFilters.updatedAt,
                            from: e.target.value || undefined,
                          })}
                        />
                        <Input
                          type="datetime-local"
                          value={localFilters.updatedAt?.to || ''}
                          onChange={(e) => updateFilter('updatedAt', {
                            ...localFilters.updatedAt,
                            to: e.target.value || undefined,
                          })}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Диапазоны значений</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Период ремонта</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="number"
                          placeholder="От"
                          value={localFilters.periodRep?.from || ''}
                          onChange={(e) => updateFilter('periodRep', {
                            ...localFilters.periodRep,
                            from: e.target.value ? Number(e.target.value) : undefined,
                          })}
                        />
                        <Input
                          type="number"
                          placeholder="До"
                          value={localFilters.periodRep?.to || ''}
                          onChange={(e) => updateFilter('periodRep', {
                            ...localFilters.periodRep,
                            to: e.target.value ? Number(e.target.value) : undefined,
                          })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Срок службы (лет)</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="number"
                          placeholder="От"
                          value={localFilters.serviceLifeYears?.from || ''}
                          onChange={(e) => updateFilter('serviceLifeYears', {
                            ...localFilters.serviceLifeYears,
                            from: e.target.value ? Number(e.target.value) : undefined,
                          })}
                        />
                        <Input
                          type="number"
                          placeholder="До"
                          value={localFilters.serviceLifeYears?.to || ''}
                          onChange={(e) => updateFilter('serviceLifeYears', {
                            ...localFilters.serviceLifeYears,
                            to: e.target.value ? Number(e.target.value) : undefined,
                          })}
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
                <CardContent>
                  <p className="text-sm text-gray-500">Функциональность сортировки будет добавлена позже</p>
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
                <CardContent className="grid grid-cols-2 space-y-2">
                  {sortFieldOptions.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`column-${option.value}`}
                        checked={visibleColumns?.includes(option.value) ?? false}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            onVisibleColumnsChange([...(visibleColumns || []), option.value]);
                          } else {
                            onVisibleColumnsChange((visibleColumns || []).filter((column) => column !== option.value));
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
