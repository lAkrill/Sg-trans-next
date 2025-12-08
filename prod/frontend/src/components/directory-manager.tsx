"use client";

import { useEffect, useState } from "react";
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
} from "lucide-react";

// Generic types for directory items
export interface BaseDirectoryItem {
  id: string;
  createdAt?: string;
  updatedAt?: string;
}

// Configuration interface for directory fields
export interface DirectoryFieldConfig {
  key: string;
  label: string;
  type: "text" | "number" | "email" | "custom";
  required?: boolean;
  placeholder?: string;
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

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const filteredItems = items.filter((item) =>
    config.searchFields.some((field) => {
      const value = item[field];
      if (typeof value === "string") {
        return value.toLowerCase().includes(searchTerm.toLowerCase());
      }
      if (typeof value === "number") {
        return value.toString().includes(searchTerm);
      }
      return false;
    })
  );

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

  useEffect(() => {
    if (isCreateOpen) {
      setFormData(config.createInitialData());
    }
  }, [config, isCreateOpen]);

  const handleCreate = async () => {
    try {
      await createMutation.mutateAsync(formData);
      setIsCreateOpen(false);
      setFormData(config.createInitialData());
    } catch (error) {
      console.error("Error creating item:", error);
    }
  };

  const handleEdit = (item: T) => {
    setEditingItem(item);
    setFormData(config.mapToFormData(item));
    setIsEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingItem) return;
    try {
      await updateMutation.mutateAsync({
        id: editingItem.id,
        data: formData as unknown as UpdateT,
      });
      setIsEditOpen(false);
      setEditingItem(null);
      setFormData(config.createInitialData());
    } catch (error) {
      console.error("Error updating item:", error);
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
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const isFormValid = () => {
    return config.fields
      .filter((field) => field.required)
      .every((field) => {
        const value = (formData as Record<string, unknown>)[field.key];
        return value !== undefined && value !== null && value !== "";
      });
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
        <p className="mt-2 text-gray-600 dark:text-gray-400">{config.description}</p>
      </div>

      {/* Controls */}
      <div className="flex justify-between items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Поиск..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Добавить
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Добавить {config.title.toLowerCase()}</DialogTitle>
              <DialogDescription>Создайте новую запись в справочнике.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {config.fields.map((field) => (
                <div key={field.key}>
                  <Label htmlFor={field.key}>
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                  {field.type === "custom" && field.customComponent ? (
                    <field.customComponent
                      value={(formData as Record<string, unknown>)[field.key] || ""}
                      onChange={(value) => updateFormField(field.key, value)}
                    />
                  ) : (
                    <Input
                      id={field.key}
                      type={field.type}
                      value={String((formData as Record<string, unknown>)[field.key] || "")}
                      onChange={(e) => {
                        const value =
                          field.type === "number" ? (e.target.value ? parseInt(e.target.value) : 0) : e.target.value;
                        updateFormField(field.key, value);
                      }}
                      placeholder={field.placeholder}
                    />
                  )}
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Отмена
              </Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending || !isFormValid()}>
                {createMutation.isPending ? "Создание..." : "Создать"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Content */}
      <Card>
        <CardHeader>
          <div className="flex gap-2 items-center">
            <CardTitle>Справочник {config.title.toLowerCase()}</CardTitle>
            <CardDescription>Всего записей: {items.length}</CardDescription>
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
                  {searchTerm ? "Ничего не найдено" : "Нет данных для отображения"}
                </p>
              </div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    {config.tableColumns.map((column) => (
                      <TableHead key={String(column.key)}>{column.label}</TableHead>
                    ))}
                    <TableHead>Дата создания</TableHead>
                    <TableHead className="text-right">Действия</TableHead>
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
                          {column.render ? column.render(item[column.key], item) : String(item[column.key] || "-")}
                        </TableCell>
                      ))}
                      <TableCell>
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString("ru-RU") : "-"}
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
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать {config.title.toLowerCase()}</DialogTitle>
            <DialogDescription>Измените данные записи в справочнике.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {config.fields.map((field) => (
              <div key={`edit-${field.key}`}>
                <Label htmlFor={`edit-${field.key}`}>
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </Label>
                {field.type === "custom" && field.customComponent ? (
                  <field.customComponent
                    value={(formData as Record<string, unknown>)[field.key] || ""}
                    onChange={(value) => updateFormField(field.key, value)}
                  />
                ) : (
                  <Input
                    id={`edit-${field.key}`}
                    type={field.type}
                    value={String((formData as Record<string, unknown>)[field.key] || "")}
                    onChange={(e) => {
                      const value =
                        field.type === "number" ? (e.target.value ? parseInt(e.target.value) : 0) : e.target.value;
                      updateFormField(field.key, value);
                    }}
                    placeholder={field.placeholder}
                  />
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending || !isFormValid()}>
              {updateMutation.isPending ? "Сохранение..." : "Сохранить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
