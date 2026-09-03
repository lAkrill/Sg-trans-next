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
import { cn } from '@/lib/utils';

/** Подсветка активного (заполненного) фильтра */
const ACTIVE_FILTER_CONTROL =
  'border-green-500 bg-green-50 text-green-900 hover:bg-green-50 focus-visible:ring-green-500/40';
const ACTIVE_FILTER_BADGE =
  'border-green-500 bg-green-100 text-green-800 hover:bg-green-100';

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

export const FITMENT_COLUMN_OPTIONS = [
  { value: 'fitmentType', label: 'Тип' },
  { value: 'model', label: 'Модель' },
  { value: 'serialNumber', label: 'Номер' },
  { value: 'passportNumber', label: 'Паспорт' },
  { value: 'buildDate', label: 'Дата постройки' },
  { value: 'lastRepairDate', label: 'Дата последнего ТО' },
  { value: 'periodRep', label: 'Период ремонта' },
  { value: 'serviceLifeYears', label: 'Срок службы' },
  { value: 'extendedDate', label: 'Дата окончания эксплуатации' },
  { value: 'code', label: 'Местоположение' },
  { value: 'locationFitment', label: 'Вагон/Депо' },
  { value: 'manufacturer', label: 'Производитель' },
  { value: 'updatedAt', label: 'Дата обновления' },
  { value: 'createdId', label: 'Пользователь' },
] as const;

export const DEFAULT_FITMENT_VISIBLE_COLUMNS = [
  'fitmentType',
  'model',
  'serialNumber',
  'passportNumber',
  'buildDate',
  'lastRepairDate',
  'periodRep',
  'serviceLifeYears',
  'extendedDate',
  'code',
  'locationFitment',
  'updatedAt',
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

function FilterBadges({
  values,
  options,
  onRemove,
  ariaLabel,
}: {
  values: string[];
  options: { value: string; label: string }[];
  onRemove: (value: string) => void;
  ariaLabel: string;
}) {
  if (!values.length) return null;

  return (
    <div className="flex flex-wrap gap-2 pt-1">
      {values.map((id) => {
        const option = options.find((item) => item.value === id);
        return (
          <Badge
            key={id}
            variant="outline"
            className={cn('gap-1 pr-1 text-xs', ACTIVE_FILTER_BADGE)}
          >
            {option?.label || id}
            <button
              type="button"
              className="rounded-sm p-0.5 text-green-800 hover:bg-transparent"
              onClick={() => onRemove(id)}
              aria-label={ariaLabel}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        );
      })}
    </div>
  );
}

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
          <Button
            variant="outline"
            size="sm"
            className={cn(getActiveFiltersCount() > 0 && ACTIVE_FILTER_CONTROL)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Фильтры
            {getActiveFiltersCount() > 0 && (
              <Badge variant="outline" className={cn('ml-2', ACTIVE_FILTER_BADGE)}>
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
                      <Label
                        htmlFor="fitmentTypeIds"
                        className={cn(selectedFitmentTypeIds.length > 0 && 'text-green-800')}
                      >
                        Тип арматуры
                      </Label>
                      <SearchableSelect
                        value=""
                        onChange={handleFitmentTypeSelect}
                        options={availableFitmentTypeOptions}
                        placeholder="Выберите тип арматуры"
                        searchPlaceholder="Введите название или код"
                        isLoading={isFitmentTypesLoading}
                        className={cn(selectedFitmentTypeIds.length > 0 && ACTIVE_FILTER_CONTROL)}
                      />
                      <FilterBadges
                        values={selectedFitmentTypeIds}
                        options={fitmentTypeOptions}
                        onRemove={handleFitmentTypeRemove}
                        ariaLabel="Удалить тип"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="modelIds"
                        className={cn(selectedModelIds.length > 0 && 'text-green-800')}
                      >
                        Модель арматуры
                      </Label>
                      <SearchableSelect
                        value=""
                        onChange={handleModelSelect}
                        options={availableFitmentModelOptions}
                        placeholder="Выберите модель арматуры"
                        searchPlaceholder="Введите название модели"
                        isLoading={isFitmentModelsLoading}
                        className={cn(selectedModelIds.length > 0 && ACTIVE_FILTER_CONTROL)}
                      />
                      <FilterBadges
                        values={selectedModelIds}
                        options={fitmentModelOptions}
                        onRemove={handleModelRemove}
                        ariaLabel="Удалить модель"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="serialNumbers"
                          className={cn(serialNumbersDraft.trim() && 'text-green-800')}
                        >
                          Номера
                        </Label>
                        <Input
                          id="serialNumbers"
                          placeholder="Введите номера через запятую"
                          value={serialNumbersDraft}
                          onChange={(e) => setSerialNumbersDraft(e.target.value)}
                          className={cn(serialNumbersDraft.trim() && ACTIVE_FILTER_CONTROL)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="passportNumbers"
                          className={cn(passportNumbersDraft.trim() && 'text-green-800')}
                        >
                          Паспорта
                        </Label>
                        <Input
                          id="passportNumbers"
                          placeholder="Введите паспорта через запятую"
                          value={passportNumbersDraft}
                          onChange={(e) => setPassportNumbersDraft(e.target.value)}
                          className={cn(passportNumbersDraft.trim() && ACTIVE_FILTER_CONTROL)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="depotIds"
                        className={cn(selectedDepotIds.length > 0 && 'text-green-800')}
                      >
                        Производитель
                      </Label>
                      <SearchableSelect
                        value=""
                        onChange={handleDepotSelect}
                        options={availableManufacturerDepotOptions}
                        placeholder="Выберите производителя"
                        searchPlaceholder="Введите название депо"
                        isLoading={isDepotsLoading}
                        className={cn(selectedDepotIds.length > 0 && ACTIVE_FILTER_CONTROL)}
                      />
                      <FilterBadges
                        values={selectedDepotIds}
                        options={manufacturerDepotOptions}
                        onRemove={handleDepotRemove}
                        ariaLabel="Удалить производителя"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="creatorIds"
                        className={cn(selectedCreatorIds.length > 0 && 'text-green-800')}
                      >
                        Пользователь
                      </Label>
                      <SearchableSelect
                        value=""
                        onChange={handleCreatorSelect}
                        options={availableUserOptions}
                        placeholder="Выберите пользователя"
                        searchPlaceholder="Введите ФИО или email"
                        isLoading={isUsersLoading}
                        className={cn(selectedCreatorIds.length > 0 && ACTIVE_FILTER_CONTROL)}
                      />
                      <FilterBadges
                        values={selectedCreatorIds}
                        options={userOptions}
                        onRemove={handleCreatorRemove}
                        ariaLabel="Удалить пользователя"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="locationCode"
                        className={cn(localFilters.code?.from != null && 'text-green-800')}
                      >
                        Местоположение
                      </Label>
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
                        <SelectTrigger
                          id="locationCode"
                          className={cn(
                            'w-full',
                            localFilters.code?.from != null && ACTIVE_FILTER_CONTROL
                          )}
                        >
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
                      <Label
                        htmlFor="locationCisternIds"
                        className={cn(selectedLocationCisternIds.length > 0 && 'text-green-800')}
                      >
                        Номера вагонов
                      </Label>
                      <SearchableSelect
                        value=""
                        onChange={handleLocationCisternSelect}
                        options={availableCisternOptions}
                        placeholder="Выберите номер вагона"
                        searchPlaceholder="Введите номер вагона"
                        isLoading={isCisternsLoading}
                        className={cn(selectedLocationCisternIds.length > 0 && ACTIVE_FILTER_CONTROL)}
                      />
                      <FilterBadges
                        values={selectedLocationCisternIds}
                        options={cisternOptions}
                        onRemove={handleLocationCisternRemove}
                        ariaLabel="Удалить номер вагона"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="locationDepoIds"
                        className={cn(selectedLocationDepoIds.length > 0 && 'text-green-800')}
                      >
                        Депо
                      </Label>
                      <SearchableSelect
                        value=""
                        onChange={handleLocationDepoSelect}
                        options={availableLocationDepotOptions}
                        placeholder="Выберите депо"
                        searchPlaceholder="Введите краткое наименование или код"
                        isLoading={isDepotsLoading}
                        className={cn(selectedLocationDepoIds.length > 0 && ACTIVE_FILTER_CONTROL)}
                      />
                      <FilterBadges
                        values={selectedLocationDepoIds}
                        options={locationDepotOptions}
                        onRemove={handleLocationDepoRemove}
                        ariaLabel="Удалить депо"
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
                      <Label className={cn((localFilters.buildDate?.from || localFilters.buildDate?.to) && 'text-green-800')}>
                        Дата постройки
                      </Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="date"
                          value={localFilters.buildDate?.from || ''}
                          onChange={(e) => updateFilter('buildDate', {
                            ...localFilters.buildDate,
                            from: e.target.value || undefined,
                          })}
                          className={cn(localFilters.buildDate?.from && ACTIVE_FILTER_CONTROL)}
                        />
                        <Input
                          type="date"
                          value={localFilters.buildDate?.to || ''}
                          onChange={(e) => updateFilter('buildDate', {
                            ...localFilters.buildDate,
                            to: e.target.value || undefined,
                          })}
                          className={cn(localFilters.buildDate?.to && ACTIVE_FILTER_CONTROL)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className={cn((localFilters.lastRepairDate?.from || localFilters.lastRepairDate?.to) && 'text-green-800')}>
                        Дата последнего ТО
                      </Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="date"
                          value={localFilters.lastRepairDate?.from || ''}
                          onChange={(e) => updateFilter('lastRepairDate', {
                            ...localFilters.lastRepairDate,
                            from: e.target.value || undefined,
                          })}
                          className={cn(localFilters.lastRepairDate?.from && ACTIVE_FILTER_CONTROL)}
                        />
                        <Input
                          type="date"
                          value={localFilters.lastRepairDate?.to || ''}
                          onChange={(e) => updateFilter('lastRepairDate', {
                            ...localFilters.lastRepairDate,
                            to: e.target.value || undefined,
                          })}
                          className={cn(localFilters.lastRepairDate?.to && ACTIVE_FILTER_CONTROL)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className={cn((localFilters.updatedAt?.from || localFilters.updatedAt?.to) && 'text-green-800')}>
                        Дата обновления
                      </Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="datetime-local"
                          value={localFilters.updatedAt?.from || ''}
                          onChange={(e) => updateFilter('updatedAt', {
                            ...localFilters.updatedAt,
                            from: e.target.value || undefined,
                          })}
                          className={cn(localFilters.updatedAt?.from && ACTIVE_FILTER_CONTROL)}
                        />
                        <Input
                          type="datetime-local"
                          value={localFilters.updatedAt?.to || ''}
                          onChange={(e) => updateFilter('updatedAt', {
                            ...localFilters.updatedAt,
                            to: e.target.value || undefined,
                          })}
                          className={cn(localFilters.updatedAt?.to && ACTIVE_FILTER_CONTROL)}
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
                      <Label className={cn((localFilters.periodRep?.from != null || localFilters.periodRep?.to != null) && 'text-green-800')}>
                        Период ремонта
                      </Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="number"
                          placeholder="От"
                          value={localFilters.periodRep?.from || ''}
                          onChange={(e) => updateFilter('periodRep', {
                            ...localFilters.periodRep,
                            from: e.target.value ? Number(e.target.value) : undefined,
                          })}
                          className={cn(localFilters.periodRep?.from != null && ACTIVE_FILTER_CONTROL)}
                        />
                        <Input
                          type="number"
                          placeholder="До"
                          value={localFilters.periodRep?.to || ''}
                          onChange={(e) => updateFilter('periodRep', {
                            ...localFilters.periodRep,
                            to: e.target.value ? Number(e.target.value) : undefined,
                          })}
                          className={cn(localFilters.periodRep?.to != null && ACTIVE_FILTER_CONTROL)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className={cn((localFilters.serviceLifeYears?.from != null || localFilters.serviceLifeYears?.to != null) && 'text-green-800')}>
                        Срок службы (лет)
                      </Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="number"
                          placeholder="От"
                          value={localFilters.serviceLifeYears?.from || ''}
                          onChange={(e) => updateFilter('serviceLifeYears', {
                            ...localFilters.serviceLifeYears,
                            from: e.target.value ? Number(e.target.value) : undefined,
                          })}
                          className={cn(localFilters.serviceLifeYears?.from != null && ACTIVE_FILTER_CONTROL)}
                        />
                        <Input
                          type="number"
                          placeholder="До"
                          value={localFilters.serviceLifeYears?.to || ''}
                          onChange={(e) => updateFilter('serviceLifeYears', {
                            ...localFilters.serviceLifeYears,
                            to: e.target.value ? Number(e.target.value) : undefined,
                          })}
                          className={cn(localFilters.serviceLifeYears?.to != null && ACTIVE_FILTER_CONTROL)}
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
                  {FITMENT_COLUMN_OPTIONS.map((option) => (
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
