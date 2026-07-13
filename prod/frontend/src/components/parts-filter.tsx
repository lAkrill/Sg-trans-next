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
  TabsTrigger
} from '@/components/ui';
import { Filter, RotateCcw } from 'lucide-react';
import { PartFilterCriteria } from '@/types/directories';

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

// Опции полей для сортировки и выбора столбцов
const sortFieldOptions = [
  { value: 'partType', label: 'Тип детали' },
  { value: 'depot', label: 'Депо' },
  { value: 'stampNumber', label: 'Номер клейма' },
  { value: 'serialNumber', label: 'Серийный номер' },
  { value: 'manufactureYear', label: 'Год изготовления' },
  { value: 'currentLocation', label: 'Текущее местоположение' },
  { value: 'status', label: 'Статус' },
  { value: 'notes', label: 'Примечания' },
  { value: 'createdAt', label: 'Дата создания' },
  { value: 'updatedAt', label: 'Дата обновления' }
];

const initialFilters: PartFilterCriteria = {
  partTypeIds: [],
  depotIds: [],
  stampNumbers: [],
  serialNumbers: [],
  locations: [],
  statusIds: [],
  wheelTypes: [],
  models: [],
  manufacturerCodes: []
};

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
  children
}: PartsFilterProps) {
  const [localFilters, setLocalFilters] = useState<PartFilterCriteria>(propFilters || initialFilters);

  const handleApplyFilters = () => {
    onFiltersChange(localFilters);
  };

  const handleClearFilters = () => {
    const emptyFilters = initialFilters;
    setLocalFilters(emptyFilters);
    onFiltersChange(emptyFilters);
  };

  const updateFilter = (key: keyof PartFilterCriteria, value: unknown) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const getActiveFiltersCount = () => {
    return Object.entries(localFilters).filter(([, value]) => {
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      if (typeof value === 'object' && value !== null) {
        return Object.values(value).some(v => v !== undefined && v !== null);
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

        {/* Кнопки действий */}
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
                {/* Базовые фильтры */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Основная информация</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="stampNumbers">Номера клейм</Label>
                        <Input
                          id="stampNumbers"
                          placeholder="Введите номер клейма"
                          value={localFilters.stampNumbers?.join(', ') || ''}
                          onChange={(e) => updateFilter('stampNumbers', e.target.value.split(',').map(s => s.trim()).filter(s => s))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="serialNumbers">Серийные номера</Label>
                        <Input
                          id="serialNumbers"
                          placeholder="Введите серийный номер"
                          value={localFilters.serialNumbers?.join(', ') || ''}
                          onChange={(e) => updateFilter('serialNumbers', e.target.value.split(',').map(s => s.trim()).filter(s => s))}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="locations">Местоположения</Label>
                        <Input
                          id="locations"
                          placeholder="Введите местоположение"
                          value={localFilters.locations?.join(', ') || ''}
                          onChange={(e) => updateFilter('locations', e.target.value.split(',').map(s => s.trim()).filter(s => s))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="wheelTypes">Типы колес</Label>
                        <Input
                          id="wheelTypes"
                          placeholder="Введите тип колеса"
                          value={localFilters.wheelTypes?.join(', ') || ''}
                          onChange={(e) => updateFilter('wheelTypes', e.target.value.split(',').map(s => s.trim()).filter(s => s))}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="models">Модели</Label>
                        <Input
                          id="models"
                          placeholder="Введите модель"
                          value={localFilters.models?.join(', ') || ''}
                          onChange={(e) => updateFilter('models', e.target.value.split(',').map(s => s.trim()).filter(s => s))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="manufacturerCodes">Коды производителя</Label>
                        <Input
                          id="manufacturerCodes"
                          placeholder="Введите код производителя"
                          value={localFilters.manufacturerCodes?.join(', ') || ''}
                          onChange={(e) => updateFilter('manufacturerCodes', e.target.value.split(',').map(s => s.trim()).filter(s => s))}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Числовые фильтры */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Диапазоны значений</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Толщина колес */}
                    <div className="space-y-2">
                      <Label>Толщина левого колеса (мм)</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="От"
                          value={localFilters.thicknessLeft?.from || ''}
                          onChange={(e) => updateFilter('thicknessLeft', { 
                            ...localFilters.thicknessLeft, 
                            from: e.target.value ? Number(e.target.value) : undefined 
                          })}
                        />
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="До"
                          value={localFilters.thicknessLeft?.to || ''}
                          onChange={(e) => updateFilter('thicknessLeft', { 
                            ...localFilters.thicknessLeft, 
                            to: e.target.value ? Number(e.target.value) : undefined 
                          })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Толщина правого колеса (мм)</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="От"
                          value={localFilters.thicknessRight?.from || ''}
                          onChange={(e) => updateFilter('thicknessRight', { 
                            ...localFilters.thicknessRight, 
                            from: e.target.value ? Number(e.target.value) : undefined 
                          })}
                        />
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="До"
                          value={localFilters.thicknessRight?.to || ''}
                          onChange={(e) => updateFilter('thicknessRight', { 
                            ...localFilters.thicknessRight, 
                            to: e.target.value ? Number(e.target.value) : undefined 
                          })}
                        />
                      </div>
                    </div>

                    {/* Срок службы */}
                    <div className="space-y-2">
                      <Label>Срок службы (лет)</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="number"
                          placeholder="От"
                          value={localFilters.serviceLifeYears?.from || ''}
                          onChange={(e) => updateFilter('serviceLifeYears', { 
                            ...localFilters.serviceLifeYears, 
                            from: e.target.value ? Number(e.target.value) : undefined 
                          })}
                        />
                        <Input
                          type="number"
                          placeholder="До"
                          value={localFilters.serviceLifeYears?.to || ''}
                          onChange={(e) => updateFilter('serviceLifeYears', { 
                            ...localFilters.serviceLifeYears, 
                            to: e.target.value ? Number(e.target.value) : undefined 
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
                            onVisibleColumnsChange((visibleColumns || []).filter((col: string) => col !== option.value));
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