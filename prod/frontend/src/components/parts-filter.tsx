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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import { Filter, RotateCcw } from 'lucide-react';
import { usePartTypeOptions } from '@/hooks';
import type { PartFilterCriteria } from '@/types/directories';

const LOCATION_CODE_OPTIONS = [
  { value: '0', label: 'Не установлено' },
  { value: '2', label: 'Вагон' },
  { value: '1', label: 'Депо' },
] as const;

interface PartsFilterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFiltersChange: (filters: PartFilterCriteria) => void;
  onVisibleColumnsChange: (columns: string[]) => void;
  filters: PartFilterCriteria;
  visibleColumns?: string[];
  isLoading: boolean;
  filteredCount?: number;
  totalCount?: number;
  children?: React.ReactNode;
}

export const PART_COLUMN_OPTIONS = [
  { value: 'partType', label: 'Тип детали' },
  { value: 'stampNumber', label: 'Клеймо' },
  { value: 'serialNumber', label: 'Заводской номер' },
  { value: 'manufactureYear', label: 'Год производства' },
  { value: 'location', label: 'Местоположение' },
  { value: 'wagonDepot', label: 'Вагон/Депо' },
  { value: 'serviceLife', label: 'Срок службы' },
  { value: 'extendedDate', label: 'Дата окончания эксплуатации' },
  { value: 'extendedUntil', label: 'Дата продления эксплуатации' },
  { value: 'status', label: 'Статус' },
  { value: 'notes', label: 'Примечания' },
  { value: 'model', label: 'Модель' },
] as const;

export const DEFAULT_PART_VISIBLE_COLUMNS = PART_COLUMN_OPTIONS.map((option) => option.value);

const initialFilters: PartFilterCriteria = {
  partTypeIds: [],
  depotIds: [],
  stampNumbers: [],
  serialNumbers: [],
  currentLocationIds: [],
  statusIds: [],
  models: [],
  documentNumbers: [],
  documentTypes: [],
};

type ListDraftKey =
  | 'stampNumbers'
  | 'serialNumbers'
  | 'models'
  | 'statusIds'
  | 'depotIds'
  | 'currentLocationIds'
  | 'documentNumbers'
  | 'documentTypes';

type ListDrafts = Record<ListDraftKey, string>;

const initialListDrafts: ListDrafts = {
  stampNumbers: '',
  serialNumbers: '',
  models: '',
  statusIds: '',
  depotIds: '',
  currentLocationIds: '',
  documentNumbers: '',
  documentTypes: '',
};

const parseList = (value: string) => value.split(',').map((item) => item.trim()).filter(Boolean);

const parseNumberList = (value: string) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map(Number)
    .filter((item) => !Number.isNaN(item));

const filtersToListDrafts = (filters: PartFilterCriteria): ListDrafts => ({
  stampNumbers: filters.stampNumbers?.join(', ') || '',
  serialNumbers: filters.serialNumbers?.join(', ') || '',
  models: filters.models?.join(', ') || '',
  statusIds: filters.statusIds?.join(', ') || '',
  depotIds: filters.depotIds?.join(', ') || '',
  currentLocationIds: filters.currentLocationIds?.join(', ') || '',
  documentNumbers: filters.documentNumbers?.join(', ') || '',
  documentTypes: filters.documentTypes?.join(', ') || '',
});

const applyListDrafts = (filters: PartFilterCriteria, drafts: ListDrafts): PartFilterCriteria => ({
  ...filters,
  stampNumbers: parseList(drafts.stampNumbers),
  serialNumbers: parseList(drafts.serialNumbers),
  models: parseList(drafts.models),
  statusIds: parseList(drafts.statusIds),
  depotIds: parseList(drafts.depotIds),
  currentLocationIds: parseList(drafts.currentLocationIds),
  documentNumbers: parseList(drafts.documentNumbers),
  documentTypes: parseNumberList(drafts.documentTypes),
});

export function PartsFilter({
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
}: PartsFilterProps) {
  const { data: partTypeOptions = [], isLoading: isPartTypesLoading } = usePartTypeOptions();
  const [localFilters, setLocalFilters] = useState<PartFilterCriteria>(propFilters || initialFilters);
  const [listDrafts, setListDrafts] = useState<ListDrafts>(
    filtersToListDrafts(propFilters || initialFilters)
  );

  const handleApplyFilters = () => {
    onFiltersChange(applyListDrafts(localFilters, listDrafts));
  };

  const handleClearFilters = () => {
    setLocalFilters(initialFilters);
    setListDrafts(initialListDrafts);
    onFiltersChange(initialFilters);
  };

  const updateFilter = (key: keyof PartFilterCriteria, value: unknown) => {
    setLocalFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const updateListDraft = (key: ListDraftKey, value: string) => {
    setListDrafts((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const togglePartTypeId = (partTypeId: string, checked: boolean) => {
    const current = localFilters.partTypeIds || [];
    updateFilter(
      'partTypeIds',
      checked ? [...current, partTypeId] : current.filter((id) => id !== partTypeId)
    );
  };

  const getActiveFiltersCount = () => {
    const filters = applyListDrafts(localFilters, listDrafts);
    return Object.entries(filters).filter(([, value]) => {
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
          <SheetTitle>Фильтры деталей</SheetTitle>
          <SheetDescription>
            Настройте фильтры для поиска нужных деталей
          </SheetDescription>
          {filteredCount !== undefined && totalCount !== undefined && (
            <div className="mt-2 text-sm text-muted-foreground">
              Найдено: {filteredCount} из {totalCount} записей
            </div>
          )}
        </SheetHeader>

        <Separator className="my-4" />
        <div className="flex space-x-2">
          <Button
            onClick={handleApplyFilters}
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? 'Применение...' : 'Применить фильтры'}
          </Button>
          <Button
            variant="outline"
            onClick={handleClearFilters}
            disabled={isLoading}
          >
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
                        <Label htmlFor="stampNumbers">Клейма</Label>
                        <Input
                          id="stampNumbers"
                          placeholder="Введите номер клейма"
                          value={listDrafts.stampNumbers}
                          onChange={(e) => updateListDraft('stampNumbers', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="serialNumbers">Заводские номера</Label>
                        <Input
                          id="serialNumbers"
                          placeholder="Введите заводской номер"
                          value={listDrafts.serialNumbers}
                          onChange={(e) => updateListDraft('serialNumbers', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="locationCode">Местоположение</Label>
                        <Select
                          value={
                            localFilters.code?.from != null &&
                            localFilters.code?.to != null &&
                            localFilters.code.from === localFilters.code.to
                              ? String(localFilters.code.from)
                              : 'all'
                          }
                          onValueChange={(value) => {
                            if (value === 'all') {
                              updateFilter('code', undefined);
                              return;
                            }

                            const code = Number(value);
                            updateFilter('code', { from: code, to: code });
                          }}
                        >
                          <SelectTrigger id="locationCode" className="w-full">
                            <SelectValue placeholder="Все местоположения" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Все местоположения</SelectItem>
                            {LOCATION_CODE_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="models">Модели</Label>
                        <Input
                          id="models"
                          placeholder="Введите модель"
                          value={listDrafts.models}
                          onChange={(e) => updateListDraft('models', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Типы деталей</Label>
                      {isPartTypesLoading ? (
                        <p className="text-sm text-muted-foreground">Загрузка типов...</p>
                      ) : partTypeOptions.length ? (
                        <div className="grid grid-cols-1 gap-2 rounded-md border p-3 sm:grid-cols-2">
                          {partTypeOptions.map((option) => (
                            <div key={option.value} className="flex items-center space-x-2">
                              <Checkbox
                                id={`part-type-${option.value}`}
                                checked={localFilters.partTypeIds?.includes(option.value) ?? false}
                                onCheckedChange={(checked) =>
                                  togglePartTypeId(option.value, checked === true)
                                }
                              />
                              <Label
                                htmlFor={`part-type-${option.value}`}
                                className="text-sm font-normal"
                              >
                                {option.label}
                              </Label>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Типы деталей не найдены</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="statusIds">ID статусов</Label>
                      <Input
                        id="statusIds"
                        placeholder="Введите ID статусов"
                        value={listDrafts.statusIds}
                        onChange={(e) => updateListDraft('statusIds', e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="depotIds">ID депо</Label>
                        <Input
                          id="depotIds"
                          placeholder="Введите ID депо"
                          value={listDrafts.depotIds}
                          onChange={(e) => updateListDraft('depotIds', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="currentLocationIds">ID вагонов</Label>
                        <Input
                          id="currentLocationIds"
                          placeholder="Введите ID вагонов"
                          value={listDrafts.currentLocationIds}
                          onChange={(e) => updateListDraft('currentLocationIds', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="documentNumbers">Номера документов</Label>
                        <Input
                          id="documentNumbers"
                          placeholder="Введите номера документов"
                          value={listDrafts.documentNumbers}
                          onChange={(e) => updateListDraft('documentNumbers', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="documentTypes">Типы документов</Label>
                        <Input
                          id="documentTypes"
                          placeholder="Введите типы документов"
                          value={listDrafts.documentTypes}
                          onChange={(e) => updateListDraft('documentTypes', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="documentId">ID документа</Label>
                      <Input
                        id="documentId"
                        placeholder="Введите ID документа"
                        value={localFilters.documentId || ''}
                        onChange={(e) => updateFilter('documentId', e.target.value || undefined)}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Даты</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Год производства</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="date"
                          value={localFilters.manufactureYear?.from || ''}
                          onChange={(e) => updateFilter('manufactureYear', {
                            ...localFilters.manufactureYear,
                            from: e.target.value || undefined,
                          })}
                        />
                        <Input
                          type="date"
                          value={localFilters.manufactureYear?.to || ''}
                          onChange={(e) => updateFilter('manufactureYear', {
                            ...localFilters.manufactureYear,
                            to: e.target.value || undefined,
                          })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Продлено до</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="date"
                          value={localFilters.extendedUntil?.from || ''}
                          onChange={(e) => updateFilter('extendedUntil', {
                            ...localFilters.extendedUntil,
                            from: e.target.value || undefined,
                          })}
                        />
                        <Input
                          type="date"
                          value={localFilters.extendedUntil?.to || ''}
                          onChange={(e) => updateFilter('extendedUntil', {
                            ...localFilters.extendedUntil,
                            to: e.target.value || undefined,
                          })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Дата документа</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="date"
                          value={localFilters.documentDate?.from || ''}
                          onChange={(e) => updateFilter('documentDate', {
                            ...localFilters.documentDate,
                            from: e.target.value || undefined,
                          })}
                        />
                        <Input
                          type="date"
                          value={localFilters.documentDate?.to || ''}
                          onChange={(e) => updateFilter('documentDate', {
                            ...localFilters.documentDate,
                            to: e.target.value || undefined,
                          })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Дата создания</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="datetime-local"
                          value={localFilters.createdAt?.from || ''}
                          onChange={(e) => updateFilter('createdAt', {
                            ...localFilters.createdAt,
                            from: e.target.value || undefined,
                          })}
                        />
                        <Input
                          type="datetime-local"
                          value={localFilters.createdAt?.to || ''}
                          onChange={(e) => updateFilter('createdAt', {
                            ...localFilters.createdAt,
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
                      <Label>Срок службы (лет)</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="number"
                          placeholder="От"
                          value={localFilters.serviceLifeYears?.from ?? ''}
                          onChange={(e) => updateFilter('serviceLifeYears', {
                            ...localFilters.serviceLifeYears,
                            from: e.target.value ? Number(e.target.value) : undefined,
                          })}
                        />
                        <Input
                          type="number"
                          placeholder="До"
                          value={localFilters.serviceLifeYears?.to ?? ''}
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
                  {PART_COLUMN_OPTIONS.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`column-${option.value}`}
                        checked={visibleColumns?.includes(option.value) ?? false}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            onVisibleColumnsChange([...(visibleColumns || []), option.value]);
                          } else if ((visibleColumns || []).length > 1) {
                            onVisibleColumnsChange((visibleColumns || []).filter((col) => col !== option.value));
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
