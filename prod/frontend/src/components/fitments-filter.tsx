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
  useAllUsers,
  useCisternIdAndNumbers,
  useDepots,
  useFitmentModelOptions,
  useFitmentTypeOptions,
} from '@/hooks';
import type { FitmentFilterCriteria } from '@/types/directories';

const LOCATION_CODE_OPTIONS = [
  { value: '0', label: 'Не установлена' },
  { value: '1', label: 'Депо' },
  { value: '2', label: 'Вагон' },
] as const;

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
  { value: 'code', label: 'Местоположение' },
  { value: 'locationFitment', label: 'Вагон/Депо' },
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
  locationCisternIds: [],
  locationDepoIds: [],
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
  const [serialNumbersDraft, setSerialNumbersDraft] = useState(
    propFilters?.serialNumbers?.join(', ') || ''
  );
  const [passportNumbersDraft, setPassportNumbersDraft] = useState(
    propFilters?.passportNumbers?.join(', ') || ''
  );
  const { data: fitmentTypeOptions = [], isLoading: isFitmentTypesLoading } = useFitmentTypeOptions();
  const { data: fitmentModelOptions = [], isLoading: isFitmentModelsLoading } = useFitmentModelOptions();
  const { data: depots = [], isLoading: isDepotsLoading } = useDepots();
  const { data: users = [], isLoading: isUsersLoading } = useAllUsers();
  const { data: cisternIdAndNumbers = [], isLoading: isCisternsLoading } = useCisternIdAndNumbers();

  const userOptions = users.map((user) => ({
    value: user.id,
    label: `${[user.lastName, user.firstName].filter(Boolean).join(' ')} (${user.email})`,
  }));

  const manufacturerDepotOptions = depots.map((depot) => ({
    value: depot.id,
    label: depot.shortName || depot.name || '—',
  }));

  const locationDepotOptions = depots.map((depot) => ({
    value: depot.id,
    label: `${depot.shortName || depot.name || '—'} (${depot.code || '—'})`,
  }));

  const cisternOptions = cisternIdAndNumbers.map((cistern) => ({
    value: cistern.id,
    label: cistern.number,
  }));

  const getFiltersWithDrafts = (): FitmentFilterCriteria => ({
    ...localFilters,
    serialNumbers: parseList(serialNumbersDraft),
    passportNumbers: parseList(passportNumbersDraft),
  });

  const handleApplyFilters = () => {
    const nextFilters = getFiltersWithDrafts();
    setLocalFilters(nextFilters);
    onFiltersChange(nextFilters);
  };

  const handleClearFilters = () => {
    setLocalFilters(initialFilters);
    setSerialNumbersDraft('');
    setPassportNumbersDraft('');
    onFiltersChange(initialFilters);
  };

  const updateFilter = (key: keyof FitmentFilterCriteria, value: unknown) => {
    setLocalFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const selectedFitmentTypeIds = localFilters.fitmentTypeIds || [];
  const selectedModelIds = localFilters.modelIds || [];
  const selectedDepotIds = localFilters.depotIds || [];
  const selectedCreatorIds = localFilters.creatorIds || [];
  const selectedLocationCisternIds = localFilters.locationCisternIds || [];
  const selectedLocationDepoIds = localFilters.locationDepoIds || [];

  const handleFitmentTypeSelect = (fitmentTypeId: string) => {
    if (!fitmentTypeId || selectedFitmentTypeIds.includes(fitmentTypeId)) return;
    updateFilter('fitmentTypeIds', [...selectedFitmentTypeIds, fitmentTypeId]);
  };

  const handleFitmentTypeRemove = (fitmentTypeId: string) => {
    updateFilter(
      'fitmentTypeIds',
      selectedFitmentTypeIds.filter((id) => id !== fitmentTypeId)
    );
  };

  const handleModelSelect = (modelId: string) => {
    if (!modelId || selectedModelIds.includes(modelId)) return;
    updateFilter('modelIds', [...selectedModelIds, modelId]);
  };

  const handleModelRemove = (modelId: string) => {
    updateFilter(
      'modelIds',
      selectedModelIds.filter((id) => id !== modelId)
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

  const handleCreatorSelect = (creatorId: string) => {
    if (!creatorId || selectedCreatorIds.includes(creatorId)) return;
    updateFilter('creatorIds', [...selectedCreatorIds, creatorId]);
  };

  const handleCreatorRemove = (creatorId: string) => {
    updateFilter(
      'creatorIds',
      selectedCreatorIds.filter((id) => id !== creatorId)
    );
  };

  const handleLocationCisternSelect = (cisternId: string) => {
    if (!cisternId || selectedLocationCisternIds.includes(cisternId)) return;
    updateFilter('locationCisternIds', [...selectedLocationCisternIds, cisternId]);
  };

  const handleLocationCisternRemove = (cisternId: string) => {
    updateFilter(
      'locationCisternIds',
      selectedLocationCisternIds.filter((id) => id !== cisternId)
    );
  };

  const handleLocationDepoSelect = (depotId: string) => {
    if (!depotId || selectedLocationDepoIds.includes(depotId)) return;
    updateFilter('locationDepoIds', [...selectedLocationDepoIds, depotId]);
  };

  const handleLocationDepoRemove = (depotId: string) => {
    updateFilter(
      'locationDepoIds',
      selectedLocationDepoIds.filter((id) => id !== depotId)
    );
  };

  const availableFitmentTypeOptions = fitmentTypeOptions.filter(
    (option) => !selectedFitmentTypeIds.includes(option.value)
  );

  const availableFitmentModelOptions = fitmentModelOptions.filter(
    (option) => !selectedModelIds.includes(option.value)
  );

  const availableManufacturerDepotOptions = manufacturerDepotOptions.filter(
    (option) => !selectedDepotIds.includes(option.value)
  );

  const availableUserOptions = userOptions.filter(
    (option) => !selectedCreatorIds.includes(option.value)
  );

  const availableCisternOptions = cisternOptions.filter(
    (option) => !selectedLocationCisternIds.includes(option.value)
  );

  const availableLocationDepotOptions = locationDepotOptions.filter(
    (option) => !selectedLocationDepoIds.includes(option.value)
  );

  const getActiveFiltersCount = () => {
    return Object.entries(getFiltersWithDrafts()).filter(([, value]) => {
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
      <SheetContent className="right-[10px] w-[calc(100vw-2rem)] sm:!w-[33.333vw] sm:!max-w-[33.333vw] flex h-full flex-col pl-4 pr-4">
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
                    <div className="space-y-2">
                      <Label htmlFor="fitmentTypeIds">Тип арматуры</Label>
                      <SearchableSelect
                        value=""
                        onChange={handleFitmentTypeSelect}
                        options={availableFitmentTypeOptions}
                        placeholder="Выберите тип арматуры"
                        searchPlaceholder="Введите название или код"
                        isLoading={isFitmentTypesLoading}
                      />
                      {selectedFitmentTypeIds.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {selectedFitmentTypeIds.map((fitmentTypeId) => {
                            const option = fitmentTypeOptions.find(
                              (item) => item.value === fitmentTypeId
                            );
                            return (
                              <Badge
                                key={fitmentTypeId}
                                variant="secondary"
                                className="gap-1 pr-1"
                              >
                                {option?.label || fitmentTypeId}
                                <button
                                  type="button"
                                  className="rounded-sm p-0.5 hover:bg-muted"
                                  onClick={() => handleFitmentTypeRemove(fitmentTypeId)}
                                  aria-label="Удалить тип"
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
                      <Label htmlFor="modelIds">Модель арматуры</Label>
                      <SearchableSelect
                        value=""
                        onChange={handleModelSelect}
                        options={availableFitmentModelOptions}
                        placeholder="Выберите модель арматуры"
                        searchPlaceholder="Введите название модели"
                        isLoading={isFitmentModelsLoading}
                      />
                      {selectedModelIds.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {selectedModelIds.map((modelId) => {
                            const option = fitmentModelOptions.find(
                              (item) => item.value === modelId
                            );
                            return (
                              <Badge
                                key={modelId}
                                variant="secondary"
                                className="gap-1 pr-1"
                              >
                                {option?.label || modelId}
                                <button
                                  type="button"
                                  className="rounded-sm p-0.5 hover:bg-muted"
                                  onClick={() => handleModelRemove(modelId)}
                                  aria-label="Удалить модель"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="serialNumbers">Номера</Label>
                        <Input
                          id="serialNumbers"
                          placeholder="Введите номера через запятую"
                          value={serialNumbersDraft}
                          onChange={(e) => setSerialNumbersDraft(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="passportNumbers">Паспорта</Label>
                        <Input
                          id="passportNumbers"
                          placeholder="Введите паспорта через запятую"
                          value={passportNumbersDraft}
                          onChange={(e) => setPassportNumbersDraft(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="depotIds">Производитель</Label>
                      <SearchableSelect
                        value=""
                        onChange={handleDepotSelect}
                        options={availableManufacturerDepotOptions}
                        placeholder="Выберите производителя"
                        searchPlaceholder="Введите название депо"
                        isLoading={isDepotsLoading}
                      />
                      {selectedDepotIds.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {selectedDepotIds.map((depotId) => {
                            const option = manufacturerDepotOptions.find(
                              (item) => item.value === depotId
                            );
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
                                  aria-label="Удалить производителя"
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
                      <Label htmlFor="creatorIds">Пользователь</Label>
                      <SearchableSelect
                        value=""
                        onChange={handleCreatorSelect}
                        options={availableUserOptions}
                        placeholder="Выберите пользователя"
                        searchPlaceholder="Введите ФИО или email"
                        isLoading={isUsersLoading}
                      />
                      {selectedCreatorIds.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {selectedCreatorIds.map((creatorId) => {
                            const option = userOptions.find(
                              (item) => item.value === creatorId
                            );
                            return (
                              <Badge
                                key={creatorId}
                                variant="secondary"
                                className="gap-1 pr-1"
                              >
                                {option?.label || creatorId}
                                <button
                                  type="button"
                                  className="rounded-sm p-0.5 hover:bg-muted"
                                  onClick={() => handleCreatorRemove(creatorId)}
                                  aria-label="Удалить пользователя"
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
                      <Label htmlFor="locationCisternIds">Номера вагонов</Label>
                      <SearchableSelect
                        value=""
                        onChange={handleLocationCisternSelect}
                        options={availableCisternOptions}
                        placeholder="Выберите номер вагона"
                        searchPlaceholder="Введите номер вагона"
                        isLoading={isCisternsLoading}
                      />
                      {selectedLocationCisternIds.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {selectedLocationCisternIds.map((cisternId) => {
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
                                  onClick={() => handleLocationCisternRemove(cisternId)}
                                  aria-label="Удалить номер вагона"
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
                      <Label htmlFor="locationDepoIds">Депо</Label>
                      <SearchableSelect
                        value=""
                        onChange={handleLocationDepoSelect}
                        options={availableLocationDepotOptions}
                        placeholder="Выберите депо"
                        searchPlaceholder="Введите краткое наименование или код"
                        isLoading={isDepotsLoading}
                      />
                      {selectedLocationDepoIds.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {selectedLocationDepoIds.map((depotId) => {
                            const option = locationDepotOptions.find(
                              (item) => item.value === depotId
                            );
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
                                  onClick={() => handleLocationDepoRemove(depotId)}
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
