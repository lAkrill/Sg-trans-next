"use client";

import { useState, useCallback } from "react";
import { X, Filter, Save, Trash2, Search, ChevronsUpDown } from "lucide-react";
import { 
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Badge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  Checkbox
} from "@/components/ui";
import {
  useManufacturers,
  useWagonTypes,
  useWagonModels,
  useOwners,
  useRegistrars,
  useAffiliations,
  useFilterTypes,
  useSavedFiltersByType,
  useCreateSavedFilter,
  useDeleteSavedFilter,
} from "@/hooks";
import type { FilterCriteria, SortCriteria, SavedFilter } from "@/types/cisterns";
import type { FilterTypeDTO } from "@/types/directories";
import { cn } from "@/lib/utils";

interface CisternFiltersProps {
  filters: FilterCriteria;
  sortFields: SortCriteria[];
  visibleColumns: string[];
  onFiltersChange: (filters: FilterCriteria) => void;
  onSortFieldsChange: (sortFields: SortCriteria[]) => void;
  onVisibleColumnsChange: (columns: string[]) => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
  activeFiltersCount: number;
}

interface NumberRangeInputProps {
  label: string;
  value: { from?: number; to?: number };
  onChange: (value: { from?: number; to?: number }) => void;
  onClear?: () => void;
}

interface MultiSelectProps {
  placeholder: string;
  options: { id: string; name: string }[];
  value: string[];
  onChange: (value: string[]) => void;
  onClear: () => void;
}

interface DateRangeInputProps {
  label: string;
  value: { from?: string; to?: string };
  onChange: (value: { from?: string; to?: string }) => void;
  onClear?: () => void;
}

const MultiSelect: React.FC<MultiSelectProps> = ({ placeholder, options, value, onChange, onClear }) => {
  const [open, setOpen] = useState(false);

  const handleSelect = (optionId: string) => {
    const newValue = value.includes(optionId) ? value.filter((id) => id !== optionId) : [...value, optionId];
    onChange(newValue.length > 0 ? newValue : []);
  };

  // Wheel scroll fix: forward wheel events from PopoverContent to CommandGroup
  const commandGroupRef = useCallback(() => {
    // No-op, just for ref usage
  }, []);

  const handlePopoverWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const group = document.getElementById("multiselect-command-group");
    if (group && group.contains(e.target as Node)) {
      group.scrollTop += e.deltaY;
      e.preventDefault();
    }
  };

  return (
    <div className="max-w-full overflow-x-hidden">
      <div className="flex gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className={cn("h-8 w-full justify-between text-left font-normal", {
                "text-muted-foreground": !value.length,
              })}
            >
              {value.length > 0 ? `Выбрано: ${value.length}` : placeholder}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start" onWheel={handlePopoverWheel}>
            <Command>
              <CommandInput placeholder="Поиск..." />
              <CommandEmpty>Ничего не найдено.</CommandEmpty>
              <CommandGroup
                id="multiselect-command-group"
                ref={commandGroupRef}
                className="max-h-64 overflow-auto"
                style={{ pointerEvents: "auto" }}
              >
                {options.map((option) => (
                  <CommandItem key={option.id} onSelect={() => handleSelect(option.id)}>
                    <div className="flex items-center space-x-2 w-full">
                      <Checkbox checked={value.includes(option.id)} onChange={() => handleSelect(option.id)} />
                      <span className="flex-1 truncate" title={option.name}>
                        {option.name}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
        {value.length > 0 && (
          <Button variant="outline" size="sm" onClick={onClear} className="h-8 w-8 p-0 flex-shrink-0">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      {/* Показать выбранные элементы */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {value.map((id) => {
            const option = options.find((o) => o.id === id);
            return option ? (
              <Badge key={id} variant="secondary" className="text-xs">
                {option.name}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSelect(id)}
                  className="h-auto w-auto p-0 ml-1 hover:bg-transparent"
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ) : null;
          })}
        </div>
      )}
    </div>
  );
};

const NumberRangeInput: React.FC<NumberRangeInputProps> = ({ label, value, onChange, onClear }) => {
  const hasValue = value.from !== undefined || value.to !== undefined;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        {hasValue && onClear && (
          <Button variant="outline" size="sm" onClick={onClear} className="h-6 w-6 p-0">
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Input
          type="number"
          placeholder="От"
          step="0.01"
          value={value.from ?? ""}
          onChange={(e) => onChange({ ...value, from: e.target.value ? Number(e.target.value) : undefined })}
          className="h-8 text-sm"
        />
        <Input
          type="number"
          placeholder="До"
          step="0.01"
          value={value.to ?? ""}
          onChange={(e) => onChange({ ...value, to: e.target.value ? Number(e.target.value) : undefined })}
          className="h-8 text-sm"
        />
      </div>
    </div>
  );
};

const currentYear = new Date().getFullYear();
/** Годы для диапазонов дат: прошлые (постройка) и будущие (конец срока эксплуатации) */
const years = Array.from({ length: 101 }, (_, i) => currentYear + 50 - i);
const months = [
  { value: "01", label: "Январь" },
  { value: "02", label: "Февраль" },
  { value: "03", label: "Март" },
  { value: "04", label: "Апрель" },
  { value: "05", label: "Май" },
  { value: "06", label: "Июнь" },
  { value: "07", label: "Июль" },
  { value: "08", label: "Август" },
  { value: "09", label: "Сентябрь" },
  { value: "10", label: "Октябрь" },
  { value: "11", label: "Ноябрь" },
  { value: "12", label: "Декабрь" },
];

const DateRangeInput: React.FC<DateRangeInputProps> = ({ label, value, onChange, onClear }) => {
  const hasValue = value.from || value.to;

  // Парсинг года и месяца из строки yyyy-mm-dd
  const parseYearMonth = (dateStr?: string) => {
    if (!dateStr) return { year: "", month: "" };
    const [year, month] = dateStr.split("-");
    return { year: year || "", month: month || "" };
  };

  const from = parseYearMonth(value.from);
  const to = parseYearMonth(value.to);

  const handleChange = (type: "from" | "to", part: "year" | "month", val: string) => {
    let newDate = "";
    if (part === "year") {
      newDate = val && (type === "from" ? `${val}-${from.month || "01"}` : `${val}-${to.month || "01"}`);
    } else {
      newDate =
        type === "from"
          ? `${from.year || new Date().getFullYear()}-${val}`
          : `${to.year || new Date().getFullYear()}-${val}`;
    }
    // Формат yyyy-mm-01
    newDate = newDate ? `${newDate}-01` : "";
    onChange({ ...value, [type]: newDate });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label className="text-sm font-medium">{label}</Label>
        {hasValue && onClear && (
          <Button variant="outline" size="sm" onClick={onClear} className="h-6 w-6 p-0">
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
      <div className="flex gap-4">
        {/* FROM */}
        <div className="flex gap-2 items-center">
          <span className="text-xs">От:</span>
          <Select value={from.year} onValueChange={(val) => handleChange("from", "year", val)}>
            <SelectTrigger className="h-8 w-20 text-xs">
              <SelectValue placeholder="Год" />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={from.month} onValueChange={(val) => handleChange("from", "month", val)}>
            <SelectTrigger className="h-8 w-24 text-xs">
              <SelectValue placeholder="Месяц" />
            </SelectTrigger>
            <SelectContent>
              {months.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* TO */}
        <div className="flex gap-2 items-center">
          <span className="text-xs">До:</span>
          <Select value={to.year} onValueChange={(val) => handleChange("to", "year", val)}>
            <SelectTrigger className="h-8 w-20 text-xs">
              <SelectValue placeholder="Год" />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={to.month} onValueChange={(val) => handleChange("to", "month", val)}>
            <SelectTrigger className="h-8 w-24 text-xs">
              <SelectValue placeholder="Месяц" />
            </SelectTrigger>
            <SelectContent>
              {months.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export const CisternFilters: React.FC<CisternFiltersProps> = ({
  filters,
  sortFields,
  visibleColumns,
  onFiltersChange,
  onSortFieldsChange,
  onVisibleColumnsChange,
  onClearFilters,
  activeFiltersCount,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [filterName, setFilterName] = useState("");
  const [selectedSavedFilter, setSelectedSavedFilter] = useState<string>("");

  // API hooks
  const createSavedFilterMutation = useCreateSavedFilter();
  const deleteSavedFilterMutation = useDeleteSavedFilter();

  // Get filter types to find RailwayCisterns filter type ID
  const { data: filterTypes = [] } = useFilterTypes();

  const railwayCisternsFilterType = filterTypes.find((ft: FilterTypeDTO) => ft.name === "RailwayCisterns");
  const filterTypeId = railwayCisternsFilterType?.id;

  // Only fetch saved filters if we have a valid filter type ID
  const { data: savedFiltersByType = [] } = useSavedFiltersByType(filterTypeId || "");

  // Directory data for selects
  const { data: manufacturers = [] } = useManufacturers();
  const { data: types = [] } = useWagonTypes(); // Типы вагонов
  const { data: models = [] } = useWagonModels(); // Модели вагонов
  const { data: owners = [] } = useOwners();
  const { data: registrars = [] } = useRegistrars();
  const { data: affiliations = [] } = useAffiliations();

  const updateFilter = useCallback(
    <K extends keyof FilterCriteria>(key: K, value: FilterCriteria[K]) => {
      onFiltersChange({ ...filters, [key]: value });
    },
    [filters, onFiltersChange]
  );

  const addSortField = useCallback(() => {
    onSortFieldsChange([...sortFields, { fieldName: "number", descending: false }]);
  }, [sortFields, onSortFieldsChange]);

  const updateSortField = useCallback(
    (index: number, field: Partial<SortCriteria>) => {
      const updated = [...sortFields];
      updated[index] = { ...updated[index], ...field };
      onSortFieldsChange(updated);
    },
    [sortFields, onSortFieldsChange]
  );

  const removeSortField = useCallback(
    (index: number) => {
      onSortFieldsChange(sortFields.filter((_, i) => i !== index));
    },
    [sortFields, onSortFieldsChange]
  );

  const handleSaveFilter = async () => {
    if (!filterName.trim() || !filterTypeId) return;

    try {
      await createSavedFilterMutation.mutateAsync({
        name: filterName,
        filters: filters,
        sortFields: sortFields,
        filterTypeId: filterTypeId,
      });
      setFilterName("");
      setSaveDialogOpen(false);
    } catch (error) {
      console.error("Ошибка сохранения фильтра:", error);
    }
  };

  const handleLoadSavedFilter = (savedFilter: SavedFilter) => {
    if (savedFilter.filters) {
      onFiltersChange(savedFilter.filters);
    }
    if (savedFilter.sortFields) {
      onSortFieldsChange(savedFilter.sortFields);
    }
    setSelectedSavedFilter(savedFilter.id);
  };

  const handleDeleteSavedFilter = async (filterId: string) => {
    try {
      await deleteSavedFilterMutation.mutateAsync(filterId);
      if (selectedSavedFilter === filterId) {
        setSelectedSavedFilter("");
      }
    } catch (error) {
      console.error("Ошибка удаления фильтра:", error);
    }
  };

  const sortFieldOptions = [
    { value: "number", label: "Номер" },
    { value: "manufacturer.name", label: "Производитель" },
    { value: "builddate", label: "Дата постройки" },
    { value: "serviceenddate", label: "Конец срока эксплуатации" },
    { value: "extensionservicelifedate", label: "Продление срока эксплуатации" },
    { value: "tareweight", label: "Тара" },
    { value: "loadcapacity", label: "Грузоподъемность" },
    { value: "length", label: "Длина" },
    { value: "axlecount", label: "Количество осей" },
    { value: "volume", label: "Объем" },
    { value: "fillingvolume", label: "Заполняемый объем" },
    { value: "initialtareweight", label: "Начальный вес тары" },
    { value: "type.name", label: "Тип" },
    { value: "model.name", label: "Модель" },
    { value: "commissioningdate", label: "Дата ввода в эксплуатацию" },
    { value: "serialnumber", label: "Серийный номер" },
    { value: "registrationnumber", label: "Регистрационный номер" },
    { value: "registrationdate", label: "Дата регистрации" },
    { value: "registrar.name", label: "Регистратор" },
    { value: "notes", label: "Примечания" },
    { value: "owner.name", label: "Собственник" },
    { value: "railwaycisternstatus.name", label: "Статус" },
    { value: "techconditions", label: "Техническое состояние" },
    { value: "pripiska", label: "Приписка" },
    { value: "reregistrationdate", label: "Дата перерегистрации" },
    { value: "pressure", label: "Давление" },
    { value: "testpressure", label: "Испытательное давление" },
    { value: "rent", label: "Аренда" },
    { value: "affiliation.value", label: "Принадлежность" },
    { value: "servicelifeyears", label: "Срок службы (лет)" },
    { value: "periodmajorrepair", label: "Период капитального ремонта" },
    { value: "periodperiodictest", label: "Период периодического освидетельствования" },
    { value: "periodintermediatetest", label: "Период промежуточного освидетельствования" },
    { value: "perioddepotrepair", label: "Период депонентского ремонта" },
    { value: "dangerclass", label: "Класс опасности" },
    { value: "substance", label: "Вещество" },
    { value: "tareweight2", label: "Тара 2" },
    { value: "tareweight3", label: "Тара 3" },
    { value: "createdat", label: "Дата создания" },
    { value: "updatedat", label: "Дата обновления" },
  ];

  const sortableFieldOptions = sortFieldOptions.filter(
    (option) => option.value !== "serviceenddate"
  );

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="relative">
          <Filter className="h-4 w-4 mr-2" />
          Фильтры
          {activeFiltersCount > 0 && (
            <Badge className="ml-2 h-5 w-5 rounded-full p-0 text-xs">{activeFiltersCount}</Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="min-w-[600px] px-5 flex flex-col justify-between">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <span>Фильтры цистерн</span>
            <div className="flex gap-2">
              {filterTypeId && (
                <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Save className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Сохранить фильтр</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="filter-name">Название фильтра</Label>
                        <Input
                          id="filter-name"
                          value={filterName}
                          onChange={(e) => setFilterName(e.target.value)}
                          placeholder="Введите название"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
                          Отмена
                        </Button>
                        <Button
                          onClick={handleSaveFilter}
                          disabled={!filterName.trim() || !filterTypeId || createSavedFilterMutation.isPending}
                        >
                          Сохранить
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
              <Button variant="outline" size="sm" onClick={onClearFilters}>
                Очистить
              </Button>
            </div>
          </SheetTitle>
        </SheetHeader>

        <Tabs defaultValue="filters" className="w-full flex flex-col h-[90%] pb-4">
          <TabsList className={`grid w-full ${filterTypeId ? "grid-cols-5" : "grid-cols-4"} flex-shrink-0`}>
            <TabsTrigger value="filters" className="text-xs">Фильтры</TabsTrigger>
            <TabsTrigger value="sorting" className="text-xs">Сортировка</TabsTrigger>
            <TabsTrigger value="columns" className="text-xs">Столбцы</TabsTrigger>
            <TabsTrigger value="quick" className="text-xs">Быстрый фильтр</TabsTrigger>
            {filterTypeId && <TabsTrigger value="saved" className="text-xs">Сохраненные</TabsTrigger>}
          </TabsList>

          <TabsContent value="filters" className="flex-1 overflow-y-scroll">
            <div className="space-y-4">
              {/* Основные фильтры */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Основная информация</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* <div className="flex flex-col gap-2">
                    <Label htmlFor="number-prefix">Номер (префикс)</Label>
                    <div className="flex gap-2">
                      <Input
                        id="number-prefix"
                        value={filters.numberPrefix ?? ""}
                        onChange={(e) => updateFilter("numberPrefix", e.target.value || undefined)}
                        placeholder="Введите начало номера"
                        className="h-8"
                      />
                      {filters.numberPrefix && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateFilter("numberPrefix", undefined)}
                          className="h-8 w-8 p-0 flex-shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div> */}

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="manufacturer">Производитель</Label>
                    <MultiSelect
                      placeholder="Выберите производителей"
                      options={manufacturers.map((m) => ({ id: m.id, name: m.name }))}
                      value={filters.manufacturerIds || []}
                      onChange={(value) => updateFilter("manufacturerIds", value.length > 0 ? value : undefined)}
                      onClear={() => updateFilter("manufacturerIds", undefined)}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="type">Тип</Label>
                    <MultiSelect
                      placeholder="Выберите типы"
                      options={types.map((t) => ({ id: t.id, name: t.name }))}
                      value={filters.typeIds || []}
                      onChange={(value) => updateFilter("typeIds", value.length > 0 ? value : undefined)}
                      onClear={() => updateFilter("typeIds", undefined)}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="model">Модель</Label>
                    <MultiSelect
                      placeholder="Выберите модели"
                      options={models.map((m) => ({ id: m.id, name: m.name }))}
                      value={filters.modelIds || []}
                      onChange={(value) => updateFilter("modelIds", value.length > 0 ? value : undefined)}
                      onClear={() => updateFilter("modelIds", undefined)}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="owner">Собственник</Label>
                    <MultiSelect
                      placeholder="Выберите собственников"
                      options={owners.map((o) => ({ id: o.id, name: o.name }))}
                      value={filters.ownerIds || []}
                      onChange={(value) => updateFilter("ownerIds", value.length > 0 ? value : undefined)}
                      onClear={() => updateFilter("ownerIds", undefined)}
                    />
                  </div>

                  <DateRangeInput
                    label="Дата постройки"
                    value={filters.buildDate ?? {}}
                    onChange={(value) => updateFilter("buildDate", value)}
                    onClear={() => updateFilter("buildDate", undefined)}
                  />
                </CardContent>
              </Card>

              {/* Технические характеристики */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Технические характеристики</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <NumberRangeInput
                    label="Тара (т)"
                    value={filters.tareWeight ?? {}}
                    onChange={(value) => updateFilter("tareWeight", value)}
                    onClear={() => updateFilter("tareWeight", undefined)}
                  />

                  <NumberRangeInput
                    label="Грузоподъемность (т)"
                    value={filters.loadCapacity ?? {}}
                    onChange={(value) => updateFilter("loadCapacity", value)}
                    onClear={() => updateFilter("loadCapacity", undefined)}
                  />

                  <NumberRangeInput
                    label="Длина (мм)"
                    value={filters.length ?? {}}
                    onChange={(value) => updateFilter("length", value)}
                    onClear={() => updateFilter("length", undefined)}
                  />

                  <NumberRangeInput
                    label="Срок службы (лет)"
                    value={filters.serviceLifeYears ?? {}}
                    onChange={(value) => updateFilter("serviceLifeYears", value)}
                    onClear={() => updateFilter("serviceLifeYears", undefined)}
                  />

                  <DateRangeInput
                    label="Конец срока эксплуатации"
                    value={filters.serviceEndDate ?? {}}
                    onChange={(value) => updateFilter("serviceEndDate", value)}
                    onClear={() => updateFilter("serviceEndDate", undefined)}
                  />

                  <DateRangeInput
                    label="Продление срока эксплуатации"
                    value={filters.extensionServiceLifeDate ?? {}}
                    onChange={(value) => updateFilter("extensionServiceLifeDate", value)}
                    onClear={() => updateFilter("extensionServiceLifeDate", undefined)}
                  />

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="owner">Количество осей</Label>
                    <MultiSelect
                      placeholder="Выберите количество осей"
                      options={[4, 6, 8, 10].map((count) => ({
                        id: count.toString(),
                        name: count.toString(),
                      }))}
                      value={filters.axleCounts?.map((count) => count.toString()) ?? []}
                      onChange={(value) =>
                        updateFilter("axleCounts", value.length > 0 ? value.map((v) => parseInt(v, 10)) : undefined)
                      }
                      onClear={() => updateFilter("axleCounts", undefined)}
                    />
                  </div>

                  <NumberRangeInput
                    label="Объем (м³)"
                    value={filters.volume ?? {}}
                    onChange={(value) => updateFilter("volume", value)}
                    onClear={() => updateFilter("volume", undefined)}
                  />

                  <NumberRangeInput
                    label="Давление (МПа)"
                    value={filters.pressure ?? {}}
                    onChange={(value) => updateFilter("pressure", value)}
                    onClear={() => updateFilter("pressure", undefined)}
                  />
                </CardContent>
              </Card>

              {/* Регистрационные данные */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Регистрационные данные</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="registrar">Регистратор</Label>
                    <MultiSelect
                      placeholder="Выберите регистраторов"
                      options={registrars.map((r) => ({ id: r.id, name: r.name }))}
                      value={filters.registrarIds || []}
                      onChange={(value) => updateFilter("registrarIds", value.length > 0 ? value : undefined)}
                      onClear={() => updateFilter("registrarIds", undefined)}
                    />
                  </div>

                  <DateRangeInput
                    label="Дата регистрации"
                    value={filters.registrationDate ?? {}}
                    onChange={(value) => updateFilter("registrationDate", value)}
                    onClear={() => updateFilter("registrationDate", undefined)}
                  />

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="affiliation">Принадлежность</Label>
                    <MultiSelect
                      placeholder="Выберите принадлежность"
                      options={affiliations.map((a) => ({ id: a.id, name: a.value }))}
                      value={filters.affiliationIds || []}
                      onChange={(value) => updateFilter("affiliationIds", value.length > 0 ? value : undefined)}
                      onClear={() => updateFilter("affiliationIds", undefined)}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="sorting" className="flex-1">
            <div className="space-y-4 pr-4">
              <Card>
                <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-base">Поля сортировки</CardTitle>
                  <Button size="sm" onClick={addSortField}>
                    Добавить поле
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  {sortFields.length === 0 ? (
                    <p className="text-sm text-gray-500">Поля сортировки не выбраны</p>
                  ) : (
                    sortFields.map((sortField, index) => (
                      <div key={index} className="grid grid-cols-[1fr_auto_auto] gap-2 items-center">
                        <div className="max-w-full overflow-x-hidden">
                          <Select
                            value={sortField.fieldName}
                            onValueChange={(value) => updateSortField(index, { fieldName: value })}
                          >
                            <SelectTrigger className="h-8 max-w-full w-fit">
                              <SelectValue className="truncate" />
                            </SelectTrigger>
                            <SelectContent>
                              {sortableFieldOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  <div className="truncate" title={option.label}>
                                    {option.label}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <Select
                          value={sortField.descending ? "desc" : "asc"}
                          onValueChange={(value) => updateSortField(index, { descending: value === "desc" })}
                        >
                          <SelectTrigger className="h-8 w-fit">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="asc">↑ По возр.</SelectItem>
                            <SelectItem value="desc">↓ По убыв.</SelectItem>
                          </SelectContent>
                        </Select>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeSortField(index)}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
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
                        checked={visibleColumns.includes(option.value)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            onVisibleColumnsChange([...visibleColumns, option.value]);
                          } else {
                            onVisibleColumnsChange(visibleColumns.filter((col: string) => col !== option.value));
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

          <TabsContent value="quick" className="flex-1">
            <div className="space-y-4 pr-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Быстрый фильтр</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  <Button variant="outline" className="justify-start">
                    Не соответствует нормам РФ
                  </Button>
                  <Button variant="outline" className="justify-start">
                    Не годен под налив
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {filterTypeId && (
            <TabsContent value="saved" className="flex-1">
              <div className="space-y-4 pr-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Сохраненные фильтры</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {savedFiltersByType.length === 0 ? (
                      <p className="text-sm text-gray-500">Нет сохраненных фильтров</p>
                    ) : (
                      savedFiltersByType.map((savedFilter) => (
                        <div key={savedFilter.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1 min-w-0 mr-3">
                            <p className="font-medium text-sm truncate" title={savedFilter.name}>
                              {savedFilter.name}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(savedFilter.createdAt).toLocaleDateString("ru-RU")}
                            </p>
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleLoadSavedFilter(savedFilter)}
                              className="h-8"
                            >
                              <Search className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteSavedFilter(savedFilter.id)}
                              disabled={deleteSavedFilterMutation.isPending}
                              className="h-8"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};
