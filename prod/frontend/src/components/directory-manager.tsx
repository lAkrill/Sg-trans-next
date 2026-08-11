"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { v4 as uuidv4 } from "uuid";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
  Button, 
  Input, 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Label,
  Skeleton
} from "@/components/ui";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  LucideIcon,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Paperclip,
  X,
} from "lucide-react";
import { filesApi } from "@/api/files";

// Generic types for directory items
export interface BaseDirectoryItem {
  id: string;
  createdAt?: string;
  updatedAt?: string;
}

const DEFAULT_FILE_ACCEPT = ".png,.jpg,.jpeg,.pdf,image/png,image/jpeg,application/pdf";
const DEFAULT_FILE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".pdf"] as const;
const DEFAULT_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

// Configuration interface for directory fields
export interface DirectoryFieldConfig {
  key: string;
  label: string;
  type: "text" | "number" | "email" | "date" | "custom" | "file";
  required?: boolean;
  placeholder?: string;
  /** Accept attribute for file inputs */
  accept?: string;
  /** Hint text under the file upload control */
  fileHint?: string;
  /** Server directory for uploaded files */
  fileDirectory?: string;
  /** Max file size in bytes (default 10 MB) */
  maxFileSizeBytes?: number;
  customComponent?: React.ComponentType<{
    value: unknown;
    onChange: (value: unknown) => void;
    disabled?: boolean;
  }>;
}

// Configuration interface for directory management
export interface DirectoryConfig<T extends BaseDirectoryItem, CreateT, UpdateT> {
  title: string;
  description: string;
  icon: LucideIcon;
  fields: DirectoryFieldConfig[];
  hooks: {
    useGetAll: () => { data: T[] | undefined; isLoading: boolean; error: Error | null };
    useCreate: () => { mutateAsync: (data: CreateT) => Promise<T>; isPending: boolean };
    useUpdate: () => { mutateAsync: (params: { id: string; data: UpdateT }) => Promise<T>; isPending: boolean };
    useDelete: () => { mutateAsync: (id: string) => Promise<void>; isPending: boolean };
  };
  searchFields: (keyof T)[];
  tableColumns: {
    key: keyof T;
    label: string;
    render?: (value: unknown, item: T) => React.ReactNode;
  }[];
  createInitialData: () => CreateT;
  mapToFormData: (item: T) => CreateT;
}

interface DirectoryManagerProps<T extends BaseDirectoryItem, CreateT, UpdateT> {
  config: DirectoryConfig<T, CreateT, UpdateT>;
}

// Pagination component
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
}

// Table skeleton component
interface TableSkeletonProps {
  columnsCount: number;
  rowsCount?: number;
}

function TableSkeleton({ columnsCount, rowsCount = 10 }: TableSkeletonProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {Array.from({ length: columnsCount }).map((_, index) => (
            <TableHead key={index}>
              <Skeleton className="h-4 w-20" />
            </TableHead>
          ))}
          <TableHead>
            <Skeleton className="h-4 w-24" />
          </TableHead>
          <TableHead className="text-right">
            <Skeleton className="h-4 w-16 ml-auto" />
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: rowsCount }).map((_, rowIndex) => (
          <TableRow key={rowIndex}>
            {Array.from({ length: columnsCount }).map((_, colIndex) => (
              <TableCell key={colIndex} className={colIndex === 0 ? "font-medium" : ""}>
                <Skeleton className={`h-4 ${colIndex === 0 ? 'w-32' : 'w-24'}`} />
              </TableCell>
            ))}
            <TableCell>
              <Skeleton className="h-4 w-20" />
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-8 w-8 rounded" />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
}: PaginationProps) {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, "...");
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push("...", totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-2 max-lg:flex-col">
      <div className="flex items-center space-x-2">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          Показано {startItem}-{endItem} из {totalItems} записей
        </p>
        <select
          value={itemsPerPage}
          onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
          className="ml-2 text-sm border rounded px-2 py-1 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
        >
          <option value={5}>5 на странице</option>
          <option value={10}>10 на странице</option>
          <option value={25}>25 на странице</option>
          <option value={50}>50 на странице</option>
        </select>
      </div>

      <div className="flex items-center space-x-1">
        <Button variant="outline" size="sm" onClick={() => onPageChange(1)} disabled={currentPage === 1}>
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {getVisiblePages().map((page, index) => (
          <Button
            key={index}
            variant={page === currentPage ? "default" : "outline"}
            size="sm"
            onClick={() => typeof page === "number" && onPageChange(page)}
            disabled={typeof page !== "number"}
            className="min-w-[40px]"
          >
            {page}
          </Button>
        ))}

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function DirectoryManager<T extends BaseDirectoryItem, CreateT, UpdateT>({
  config,
}: DirectoryManagerProps<T, CreateT, UpdateT>) {
  const { data: items = [], isLoading, error } = config.hooks.useGetAll();
  const createMutation = config.hooks.useCreate();
  const updateMutation = config.hooks.useUpdate();
  const deleteMutation = config.hooks.useDelete();

  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<T | null>(null);
  const [formData, setFormData] = useState<CreateT>(config.createInitialData());
  const [pendingFiles, setPendingFiles] = useState<Record<string, File | null>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fileFields = config.fields.filter((field) => field.type === "file");
  const isSubmitting = createMutation.isPending || updateMutation.isPending || isUploading;

  const formatStoredFileName = (value: unknown) => {
    if (typeof value !== "string" || !value.trim()) return "";
    const normalized = value.replace(/\\/g, "/");
    const slashIndex = normalized.lastIndexOf("/");
    return slashIndex >= 0 ? normalized.slice(slashIndex + 1) : normalized;
  };

  const resetFileState = () => {
    setPendingFiles({});
    setFormError(null);
    setIsUploading(false);
  };

  const isAllowedFile = (file: File, accept?: string) => {
    const lowerName = file.name.toLowerCase();
    if (!accept) {
      return DEFAULT_FILE_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
    }

    const tokens = accept
      .split(",")
      .map((token) => token.trim().toLowerCase())
      .filter(Boolean);

    return tokens.some((token) => {
      if (token.startsWith(".")) {
        return lowerName.endsWith(token);
      }
      if (token.endsWith("/*")) {
        return file.type.startsWith(token.slice(0, -1));
      }
      return file.type === token;
    });
  };

  const handleFileFieldChange = (field: DirectoryFieldConfig, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";

    if (!file) return;

    const maxSize = field.maxFileSizeBytes ?? DEFAULT_MAX_FILE_SIZE_BYTES;
    if (!isAllowedFile(file, field.accept)) {
      setFormError(`Недопустимый формат файла для поля «${field.label}»`);
      return;
    }
    if (file.size > maxSize) {
      setFormError(`Размер файла «${field.label}» не должен превышать ${Math.round(maxSize / (1024 * 1024))} МБ`);
      return;
    }

    setFormError(null);
    setPendingFiles((prev) => ({ ...prev, [field.key]: file }));
  };

  const clearFileField = (fieldKey: string) => {
    setPendingFiles((prev) => ({ ...prev, [fieldKey]: null }));
    updateFormField(fieldKey, null);
    setFormError(null);
  };

  const uploadPendingFiles = async (data: CreateT): Promise<CreateT> => {
    if (fileFields.length === 0) return data;

    const nextData = { ...(data as Record<string, unknown>) };

    for (const field of fileFields) {
      const pending = pendingFiles[field.key];
      if (!pending) continue;

      const directory = field.fileDirectory || "Uploads";
      const extension = pending.name.includes(".")
        ? pending.name.slice(pending.name.lastIndexOf(".")).toLowerCase()
        : "";
      const uniqueFileName = `${uuidv4()}${extension}`;
      const uploaded = await filesApi.upload(pending, {
        directory,
        fileName: uniqueFileName,
      });
      nextData[field.key] = `${directory}/${uploaded.fileName}`;
    }

    return nextData as CreateT;
  };

  const isDateField = (fieldKey: string) => {
    const key = fieldKey.toLowerCase();
    return key.includes("date") || key.endsWith("at");
  };

  const getDateInputValue = (value: unknown) => {
    if (!value) return "";

    const date = value instanceof Date ? value : new Date(value as string | number);
    if (Number.isNaN(date.getTime())) return "";

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const formatTableCellValue = (value: unknown, columnKey: keyof T) => {
    if (value === undefined || value === null || value === "") {
      return "-";
    }

    const isDateColumn = isDateField(String(columnKey));

    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return value.toLocaleDateString("ru-RU");
    }

    if (isDateColumn && typeof value === "string") {
      const parsedDate = new Date(value);
      if (!Number.isNaN(parsedDate.getTime())) {
        return parsedDate.toLocaleDateString("ru-RU");
      }
    }

    if (isDateColumn && typeof value === "number") {
      const parsedDate = new Date(value);
      if (!Number.isNaN(parsedDate.getTime())) {
        return parsedDate.toLocaleDateString("ru-RU");
      }
    }

    if (typeof value === "boolean") {
      return value ? "Да" : "Нет";
    }

    return String(value);
  };

  const getSearchableText = (value: unknown, fieldKey: keyof T) => {
    if (value === undefined || value === null || value === "") {
      return "";
    }

    if (typeof value === "boolean") {
      return value ? "да" : "нет";
    }

    if (typeof value === "number") {
      return value.toString();
    }

    if (value instanceof Date || isDateField(String(fieldKey))) {
      return formatTableCellValue(value, fieldKey).toLowerCase();
    }

    return String(value).toLowerCase();
  };

  const matchesQuery = (value: unknown, fieldKey: keyof T, query: string) => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return true;
    return getSearchableText(value, fieldKey).includes(normalizedQuery);
  };

  const getFieldLabel = (fieldKey: keyof T) =>
    config.tableColumns.find((column) => column.key === fieldKey)?.label ??
    config.fields.find((field) => field.key === String(fieldKey))?.label ??
    String(fieldKey);

  const searchableFields =
    config.searchFields.length > 0
      ? config.searchFields
      : config.tableColumns.map((column) => column.key);

  const searchPlaceholder =
    searchableFields.length > 0
      ? `Поиск: ${searchableFields.map(getFieldLabel).join(", ")}`
      : "Поиск...";

  const hasActiveFilters = Boolean(searchTerm.trim());

  const filteredItems = items.filter((item) => {
    if (!searchTerm.trim()) return true;
    return searchableFields.some((field) => matchesQuery(item[field], field, searchTerm));
  });

  // Pagination calculations
  const totalItems = filteredItems.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = filteredItems.slice(startIndex, endIndex);

  // Reset pagination when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const clearAllFilters = () => {
    setSearchTerm("");
  };

  useEffect(() => {
    if (isCreateOpen) {
      setFormData(config.createInitialData());
      resetFileState();
    }
  }, [config, isCreateOpen]);

  const handleCreateDialogChange = (open: boolean) => {
    setIsCreateOpen(open);
    if (!open) {
      setFormData(config.createInitialData());
      resetFileState();
    }
  };

  const handleEditDialogChange = (open: boolean) => {
    setIsEditOpen(open);
    if (!open) {
      setEditingItem(null);
      setFormData(config.createInitialData());
      resetFileState();
    }
  };

  const handleCreate = async () => {
    if (!isFormValid() || isSubmitting) return;

    setFormError(null);
    setIsUploading(true);
    try {
      const payload = await uploadPendingFiles(formData);
      await createMutation.mutateAsync(payload);
      handleCreateDialogChange(false);
    } catch (error) {
      console.error("Error creating item:", error);
      setFormError("Не удалось сохранить запись. Проверьте файлы и попробуйте ещё раз.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleEdit = (item: T) => {
    setEditingItem(item);
    setFormData(config.mapToFormData(item));
    resetFileState();
    setIsEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingItem || !isFormValid() || isSubmitting) return;

    setFormError(null);
    setIsUploading(true);
    try {
      const payload = await uploadPendingFiles(formData);
      await updateMutation.mutateAsync({
        id: editingItem.id,
        data: payload as unknown as UpdateT,
      });
      handleEditDialogChange(false);
    } catch (error) {
      console.error("Error updating item:", error);
      setFormError("Не удалось сохранить запись. Проверьте файлы и попробуйте ещё раз.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Вы уверены, что хотите удалить эту запись?")) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (error) {
        console.error("Error deleting item:", error);
      }
    }
  };

  const updateFormField = (key: string, value: unknown) => {
    // Custom selects may emit several form fields at once (e.g. cisternId + cisternNum)
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      setFormData((prev) => ({ ...prev, ...(value as Record<string, unknown>) }));
      return;
    }
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const isFormValid = () => {
    return config.fields
      .filter((field) => field.required)
      .every((field) => {
        if (field.type === "file") {
          const pending = pendingFiles[field.key];
          const stored = (formData as Record<string, unknown>)[field.key];
          return Boolean(pending || (typeof stored === "string" && stored.trim()));
        }
        const value = (formData as Record<string, unknown>)[field.key];
        return value !== undefined && value !== null && value !== "";
      });
  };

  const renderField = (field: DirectoryFieldConfig, idPrefix: string) => {
    const fieldId = `${idPrefix}-${field.key}`;
    const fieldValue = (formData as Record<string, unknown>)[field.key];

    return (
      <div key={fieldId}>
        <Label htmlFor={fieldId}>
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        {field.type === "custom" && field.customComponent ? (
          <field.customComponent
            value={fieldValue || ""}
            onChange={(value) => updateFormField(field.key, value)}
            disabled={isSubmitting}
          />
        ) : field.type === "file" ? (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" asChild disabled={isSubmitting}>
                <label htmlFor={fieldId} className="cursor-pointer">
                  <Paperclip className="mr-2 h-4 w-4" />
                  {pendingFiles[field.key] || fieldValue ? "Заменить файл" : "Загрузить файл"}
                </label>
              </Button>
              <Input
                id={fieldId}
                type="file"
                accept={field.accept || DEFAULT_FILE_ACCEPT}
                className="hidden"
                onChange={(event) => handleFileFieldChange(field, event)}
                disabled={isSubmitting}
              />
              <span className="text-xs text-muted-foreground">
                {field.fileHint || "PNG, JPG, JPEG, PDF до 10 МБ"}
              </span>
            </div>
            {Boolean(pendingFiles[field.key] || fieldValue) && (
              <div className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm">
                <span className="truncate">
                  {pendingFiles[field.key]?.name || formatStoredFileName(fieldValue) || "Файл"}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => clearFileField(field.key)}
                  disabled={isSubmitting}
                  aria-label={`Удалить файл ${field.label}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        ) : (
          <Input
            id={fieldId}
            type={field.type === "date" || isDateField(field.key) ? "date" : field.type}
            step={field.type === "number" ? "0.01" : undefined}
            value={
              field.type === "date" || isDateField(field.key)
                ? getDateInputValue(fieldValue)
                : String(fieldValue ?? "")
            }
            onChange={(e) => {
              const value =
                field.type === "number" ? (e.target.value ? parseFloat(e.target.value) : 0) : e.target.value;
              updateFormField(field.key, value);
            }}
            placeholder={field.placeholder}
            disabled={isSubmitting}
          />
        )}
      </div>
    );
  };

  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <config.icon className="h-8 w-8" />
            {config.title}
          </h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              Ошибка загрузки данных: {error instanceof Error ? error.message : "Неизвестная ошибка"}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex gap-3 max-lg:flex-col max-lg:gap-0">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <config.icon className="h-8 w-8" />
          {config.title}
        </h1>
        {/* <p className="mt-2 text-gray-600 dark:text-gray-400">{config.description}</p> */}
      </div>

      {/* Controls */}
      <div className="flex justify-between items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-9"
          />
          {searchTerm && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0"
              onClick={() => setSearchTerm("")}
              aria-label="Очистить поиск"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button type="button" variant="outline" onClick={clearAllFilters}>
              <X className="h-4 w-4 mr-2" />
              Сбросить
            </Button>
          )}

          <Dialog open={isCreateOpen} onOpenChange={handleCreateDialogChange}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Добавить
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Добавить {config.title.toLowerCase()}</DialogTitle>
                <DialogDescription>Создайте новую запись в справочнике.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {config.fields.map((field) => renderField(field, "create"))}
                {formError && <p className="text-sm text-red-600">{formError}</p>}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => handleCreateDialogChange(false)} disabled={isSubmitting}>
                  Отмена
                </Button>
                <Button onClick={handleCreate} disabled={isSubmitting || !isFormValid()}>
                  {isUploading ? "Загрузка..." : createMutation.isPending ? "Создание..." : "Создать"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Content */}
      <Card>
        <CardHeader>
          <div className="flex gap-2 items-center">
            {/* <CardTitle>Справочник {config.title.toLowerCase()}</CardTitle> */}
            <CardDescription>
              {hasActiveFilters
                ? `Найдено: ${filteredItems.length} из ${items.length}`
                : `Всего записей: ${items.length}`}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableSkeleton columnsCount={config.tableColumns.length} rowsCount={10} />
          ) : filteredItems.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <config.icon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  {hasActiveFilters ? "Ничего не найдено" : "Нет данных для отображения"}
                </p>
              </div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    {config.tableColumns.map((column) => (
                      <TableHead key={String(column.key)} className="whitespace-normal break-words">
                        {column.label}
                      </TableHead>
                    ))}
                    <TableHead className="whitespace-normal break-words">Дата обновления</TableHead>
                    <TableHead className="text-right whitespace-normal break-words">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedItems.map((item) => (
                    <TableRow key={item.id}>
                      {config.tableColumns.map((column) => (
                        <TableCell
                          key={String(column.key)}
                          className={column.key === config.tableColumns[0].key ? "font-medium" : ""}
                        >
                          {column.render ? column.render(item[column.key], item) : formatTableCellValue(item[column.key], column.key)}
                        </TableCell>
                      ))}
                      <TableCell>
                        {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString("ru-RU") : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(item)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(item.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="mt-4">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                  onItemsPerPageChange={(newItemsPerPage) => {
                    setItemsPerPage(newItemsPerPage);
                    setCurrentPage(1); // Reset to first page when changing items per page
                  }}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={handleEditDialogChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Редактировать {config.title.toLowerCase()}</DialogTitle>
            <DialogDescription>Измените данные записи в справочнике.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {config.fields.map((field) => renderField(field, "edit"))}
            {formError && <p className="text-sm text-red-600">{formError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleEditDialogChange(false)} disabled={isSubmitting}>
              Отмена
            </Button>
            <Button onClick={handleUpdate} disabled={isSubmitting || !isFormValid()}>
              {isUploading ? "Загрузка..." : updateMutation.isPending ? "Сохранение..." : "Сохранить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
