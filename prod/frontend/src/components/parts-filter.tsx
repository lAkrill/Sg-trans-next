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
  SearchableSelect,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import { Filter, RotateCcw, X } from 'lucide-react';
import {
  useCisternIdAndNumbers,
  useDepots,
  usePartStatusOptions,
  usePartTypeOptions,
} from '@/hooks';
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
};

type ListDraftKey =
  | 'stampNumbers'
  | 'serialNumbers'
  | 'models';

type ListDrafts = Record<ListDraftKey, string>;

const initialListDrafts: ListDrafts = {
  stampNumbers: '',
  serialNumbers: '',
  models: '',
};

const parseList = (value: string) => value.split(',').map((item) => item.trim()).filter(Boolean);

const getYearFromFilterValue = (value?: string) => {
  if (!value) return '';
  const yearMatch = value.match(/^(\d{4})/);
  return yearMatch ? yearMatch[1] : '';
};

const filtersToListDrafts = (filters: PartFilterCriteria): ListDrafts => ({
  stampNumbers: filters.stampNumbers?.join(', ') || '',
  serialNumbers: filters.serialNumbers?.join(', ') || '',
  models: filters.models?.join(', ') || '',
});

const applyListDrafts = (filters: PartFilterCriteria, drafts: ListDrafts): PartFilterCriteria => ({
  ...filters,
  stampNumbers: parseList(drafts.stampNumbers),
  serialNumbers: parseList(drafts.serialNumbers),
  models: parseList(drafts.models),
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
  const { data: partStatusOptions = [], isLoading: isPartStatusesLoading } = usePartStatusOptions();
  const { data: depots = [], isLoading: isDepotsLoading } = useDepots();
  const { data: cisternIdAndNumbers = [], isLoading: isCisternsLoading } = useCisternIdAndNumbers();
  const [localFilters, setLocalFilters] = useState<PartFilterCriteria>(propFilters || initialFilters);
  const [listDrafts, setListDrafts] = useState<ListDrafts>(
    filtersToListDrafts(propFilters || initialFilters)
  );

  const depotOptions = depots.map((depot) => ({
    value: depot.id,
    label: `${depot.shortName || depot.name || '—'} (${depot.code || '—'})`,
  }));

  const cisternOptions = cisternIdAndNumbers.map((cistern) => ({
    value: cistern.id,
    label: cistern.number,
  }));

  const selectedDepotIds = localFilters.depotIds || [];
  const selectedCurrentLocationIds = localFilters.currentLocationIds || [];

  const availableDepotOptions = depotOptions.filter(
    (option) => !selectedDepotIds.includes(option.value)
  );

  const availableCisternOptions = cisternOptions.filter(
    (option) => !selectedCurrentLocationIds.includes(option.value)
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

  const toggleStatusId = (statusId: string, checked: boolean) => {
    const current = localFilters.statusIds || [];
    updateFilter(
      'statusIds',
      checked ? [...current, statusId] : current.filter((id) => id !== statusId)
    );
  };

  const handleDepotSelect = (depotId: string) => {
    if (!depotId || selectedDepotIds.includes(depotId)) return;
    updateFilter('depotIds', [...selectedDepotIds, depotId]);
  };

  const handleDepotRemove = (depotId: string) => {
    updateFilter(
      'depotIds',
      selectedDepotIds.filter((id) => id !== depotId)
    );
  };

  const handleCurrentLocationSelect = (cisternId: string) => {
    if (!cisternId || selectedCurrentLocationIds.includes(cisternId)) return;
    updateFilter('currentLocationIds', [...selectedCurrentLocationIds, cisternId]);
  };

  const handleCurrentLocationRemove = (cisternId: string) => {
    updateFilter(
      'currentLocationIds',
      selectedCurrentLocationIds.filter((id) => id !== cisternId)
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
                      <Label>Статусы</Label>
                      {isPartStatusesLoading ? (
                        <p className="text-sm text-muted-foreground">Загрузка статусов...</p>
                      ) : partStatusOptions.length ? (
                        <div className="grid grid-cols-1 gap-2 rounded-md border p-3 sm:grid-cols-2">
                          {partStatusOptions.map((option) => (
                            <div key={option.value} className="flex items-center space-x-2">
                              <Checkbox
                                id={`part-status-${option.value}`}
                                checked={localFilters.statusIds?.includes(option.value) ?? false}
                                onCheckedChange={(checked) =>
                                  toggleStatusId(option.value, checked === true)
                                }
                              />
                              <Label
                                htmlFor={`part-status-${option.value}`}
                                className="text-sm font-normal"
                              >
                                {option.label}
                              </Label>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Статусы не найдены</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="depotIds">Депо</Label>
                      <SearchableSelect
                        value=""
                        onChange={handleDepotSelect}
                        options={availableDepotOptions}
                        placeholder="Выберите депо"
                        searchPlaceholder="Введите наименование или код"
                        isLoading={isDepotsLoading}
                      />
                      {selectedDepotIds.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {selectedDepotIds.map((depotId) => {
                            const option = depotOptions.find((item) => item.value === depotId);
                            return (
                              <Badge
                                key={depotId}
                                variant="secondary"
                                className="gap-1 pr-1"
                              >
                                {option?.label || depotId}
                                <button
                                  type="button"
                                  className="rounded-sm p-0.5 hover:bg-muted"
                                  onClick={() => handleDepotRemove(depotId)}
                                  aria-label="Удалить депо"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="currentLocationIds">Вагоны</Label>
                      <SearchableSelect
                        value=""
                        onChange={handleCurrentLocationSelect}
                        options={availableCisternOptions}
                        placeholder="Выберите номер вагона"
                        searchPlaceholder="Введите номер вагона"
                        isLoading={isCisternsLoading}
                      />
                      {selectedCurrentLocationIds.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {selectedCurrentLocationIds.map((cisternId) => {
                            const option = cisternOptions.find(
                              (item) => item.value === cisternId
                            );
                            return (
                              <Badge
                                key={cisternId}
                                variant="secondary"
                                className="gap-1 pr-1"
                              >
                                {option?.label || cisternId}
                                <button
                                  type="button"
                                  className="rounded-sm p-0.5 hover:bg-muted"
                                  onClick={() => handleCurrentLocationRemove(cisternId)}
                                  aria-label="Удалить вагон"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            );
                          })}
                        </div>
                      )}
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
                          type="number"
                          placeholder="От"
                          min={1900}
                          max={new Date().getFullYear()}
                          value={getYearFromFilterValue(localFilters.manufactureYear?.from)}
                          onChange={(e) => {
                            const year = e.target.value ? Number(e.target.value) : undefined;
                            updateFilter('manufactureYear', {
                              ...localFilters.manufactureYear,
                              from: year != null && !Number.isNaN(year) ? `${year}-01-01` : undefined,
                            });
                          }}
                        />
                        <Input
                          type="number"
                          placeholder="До"
                          min={1900}
                          max={new Date().getFullYear()}
                          value={getYearFromFilterValue(localFilters.manufactureYear?.to)}
                          onChange={(e) => {
                            const year = e.target.value ? Number(e.target.value) : undefined;
                            updateFilter('manufactureYear', {
                              ...localFilters.manufactureYear,
                              to: year != null && !Number.isNaN(year) ? `${year}-12-31` : undefined,
                            });
                          }}
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
