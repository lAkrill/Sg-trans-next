"use client";

import { useCallback, useMemo, useState, type ChangeEvent } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { v4 as uuidv4 } from "uuid";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Skeleton,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import {
  Plus,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FileText,
  Loader2,
  Paperclip,
  X,
  Eye,
} from "lucide-react";
import {
  useAllDocuments,
  useCreateDocument,
  useUpdateDocument,
  useDeleteDocument,
} from "@/hooks";
import {
  DEFAULT_DOCUMENT_SORT,
  DEFAULT_DOCUMENT_VISIBLE_COLUMNS,
  DOCUMENT_COLUMN_OPTIONS,
  DOCUMENT_TYPE_OPTIONS,
  DocumentsFilter,
  EMPTY_DOCUMENT_FILTERS,
  getDocumentTypeLabel,
  type DocumentFilterCriteria,
  type DocumentSortConfig,
  type DocumentSortField,
} from "@/components/documents-filter";
import { filesApi } from "@/api/files";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/formatDate";
import type { CreateDocumentDTO, DocumentDTO, UpdateDocumentDTO } from "@/types/directories";

const EMPTY_FORM: CreateDocumentDTO = {
  number: "",
  type: null,
  date: "",
  author: "",
  price: null,
  note: "",
  file: "",
};

const DOCUMENT_FILE_DIRECTORY = "Documents";
const ALLOWED_DOCUMENT_FILE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".pdf"] as const;
const ALLOWED_DOCUMENT_FILE_ACCEPT = ".png,.jpg,.jpeg,.pdf,image/png,image/jpeg,application/pdf";
const MAX_DOCUMENT_FILE_SIZE_BYTES = 10 * 1024 * 1024;

const isAllowedDocumentFile = (file: File) => {
  const lowerName = file.name.toLowerCase();
  return ALLOWED_DOCUMENT_FILE_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
};

const getFormErrorMessage = (err: unknown, fallback: string) => {
  if (!err || typeof err !== "object") return fallback;

  const axiosError = err as {
    message?: string;
    code?: string;
    response?: {
      status?: number;
      statusText?: string;
      data?: {
        message?: string;
        Message?: string;
        details?: string;
        Details?: string;
        title?: string;
        Title?: string;
      };
    };
  };

  const data = axiosError.response?.data;
  const serverMessage =
    data?.message || data?.Message || data?.details || data?.Details || data?.title || data?.Title;

  if (serverMessage) return serverMessage;

  const status = axiosError.response?.status;
  if (status) {
    const statusText = axiosError.response?.statusText;
    return statusText ? `Ошибка сервера (${status}: ${statusText})` : `Ошибка сервера (${status})`;
  }

  if (axiosError.code === "ERR_NETWORK" || axiosError.message === "Network Error") {
    return "Нет связи с сервером";
  }

  if (axiosError.message && axiosError.message !== "Network Error") {
    return axiosError.message;
  }

  return fallback;
};

const DOCUMENT_COLUMNS = DOCUMENT_COLUMN_OPTIONS.map((option) => ({
  key: option.value,
  label: option.label,
  type: option.value === "date" ? ("date" as const) : option.value === "type" || option.value === "price" ? ("number" as const) : ("string" as const),
}));

const includesText = (value: string | null | undefined, query: string | undefined) => {
  if (!query?.trim()) return true;
  return (value ?? "").toLowerCase().includes(query.trim().toLowerCase());
};

const getSortValue = (document: DocumentDTO, field: DocumentSortField) => {
  switch (field) {
    case "number":
      return document.number ?? "";
    case "type":
      return document.type ?? Number.NEGATIVE_INFINITY;
    case "date":
      return document.date ?? "";
    case "author":
      return document.author ?? "";
    case "price":
      return document.price ?? Number.NEGATIVE_INFINITY;
    case "note":
      return document.note ?? "";
    case "file":
      return document.file ?? "";
    default:
      return "";
  }
};

const compareDocuments = (
  a: DocumentDTO,
  b: DocumentDTO,
  sort: DocumentSortConfig
) => {
  if (!sort.field) return 0;

  const aValue = getSortValue(a, sort.field);
  const bValue = getSortValue(b, sort.field);

  let result = 0;
  if (typeof aValue === "number" && typeof bValue === "number") {
    result = aValue - bValue;
  } else {
    result = String(aValue).localeCompare(String(bValue), "ru", {
      numeric: true,
      sensitivity: "base",
    });
  }

  return sort.direction === "desc" ? -result : result;
};

const matchesFilters = (document: DocumentDTO, filters: DocumentFilterCriteria) => {
  if (!includesText(document.number, filters.number)) return false;
  if (filters.type && String(document.type ?? "") !== filters.type) return false;
  if (!includesText(document.author, filters.author)) return false;
  if (!includesText(document.note, filters.note)) return false;
  if (!includesText(document.file, filters.file)) return false;

  const documentDate = document.date?.slice(0, 10) ?? "";
  if (filters.dateFrom && (!documentDate || documentDate < filters.dateFrom)) return false;
  if (filters.dateTo && (!documentDate || documentDate > filters.dateTo)) return false;

  if (filters.priceFrom) {
    const from = Number(filters.priceFrom);
    if (!Number.isNaN(from) && (document.price == null || document.price < from)) return false;
  }
  if (filters.priceTo) {
    const to = Number(filters.priceTo);
    if (!Number.isNaN(to) && (document.price == null || document.price > to)) return false;
  }

  return true;
};

const hasActiveFilters = (filters: DocumentFilterCriteria) =>
  Object.values(filters).some((value) => value !== undefined && value !== null && value !== "");

export default function DocumentsPage() {
  const searchParams = useSearchParams();
  const initialPageNumber = Number(searchParams.get("page")) || 1;
  const initialPageSize = Number(searchParams.get("pageSize")) || 10;

  const [pageNumber, setPageNumber] = useState(initialPageNumber);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [exportingType, setExportingType] = useState<"pdf" | "doc" | "xls" | null>(null);

  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<DocumentFilterCriteria>(EMPTY_DOCUMENT_FILTERS);
  const [sort, setSort] = useState<DocumentSortConfig>(DEFAULT_DOCUMENT_SORT);
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    ...DEFAULT_DOCUMENT_VISIBLE_COLUMNS,
  ]);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<DocumentDTO | null>(null);
  const [formData, setFormData] = useState<CreateDocumentDTO>(EMPTY_FORM);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewingFileId, setViewingFileId] = useState<string | null>(null);

  const { data: documents = [], isLoading, error } = useAllDocuments();
  const createMutation = useCreateDocument();
  const updateMutation = useUpdateDocument();
  const deleteMutation = useDeleteDocument();

  const filteredDocuments = useMemo(() => {
    const filtered = documents.filter((document) => matchesFilters(document, filters));
    if (!sort.field) return filtered;
    return [...filtered].sort((a, b) => compareDocuments(a, b, sort));
  }, [documents, filters, sort]);

  const isFiltered = hasActiveFilters(filters) || Boolean(sort.field);
  const totalCount = filteredDocuments.length;
  const allCount = documents.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = Math.min(pageNumber, totalPages);

  const displayDocuments = useMemo(
    () => filteredDocuments.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [filteredDocuments, currentPage, pageSize]
  );

  const isColumnVisible = (column: string) => visibleColumns.includes(column);

  const handleFilterApply = ({
    filters: nextFilters,
    sort: nextSort,
  }: {
    filters: DocumentFilterCriteria;
    sort: DocumentSortConfig;
  }) => {
    setFilters(nextFilters);
    setSort(nextSort);
    setPageNumber(1);
  };

  const handlePageChange = (page: number) => {
    setPageNumber(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPageNumber(1);
  };

  const getVisiblePages = () => {
    const delta = 1;
    const range: number[] = [];
    const rangeWithDots: (number | string)[] = [];

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
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

  const Pagination = () => {
    if (totalPages <= 1 && totalCount <= pageSize) return null;

    const startItem = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalCount);

    return (
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center space-x-2">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Показано {startItem}-{endItem} из {totalCount} записей
          </p>
          <select
            value={pageSize}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            className="ml-2 text-sm border rounded px-2 py-1 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
          >
            <option value={5}>5 на странице</option>
            <option value={10}>10 на странице</option>
            <option value={25}>25 на странице</option>
            <option value={50}>50 на странице</option>
          </select>
        </div>

        <div className="flex items-center space-x-1">
          <Button variant="outline" size="sm" onClick={() => handlePageChange(1)} disabled={currentPage === 1}>
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {getVisiblePages().map((pageNum, index) => (
            <Button
              key={index}
              variant={pageNum === currentPage ? "default" : "outline"}
              size="sm"
              onClick={() => typeof pageNum === "number" && handlePageChange(pageNum)}
              disabled={typeof pageNum !== "number"}
              className="min-w-[40px]"
            >
              {pageNum}
            </Button>
          ))}

          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  const resetDocumentForm = () => {
    setFormData(EMPTY_FORM);
    setSelectedFile(null);
    setFormError(null);
    setEditingDocument(null);
  };

  const openCreateDialog = () => {
    resetDocumentForm();
    setIsCreateOpen(true);
  };

  const openEditDialog = (documentItem: DocumentDTO) => {
    const fileValue =
      documentItem.file ||
      (documentItem as DocumentDTO & { File?: string | null }).File ||
      (documentItem as DocumentDTO & { fileName?: string | null }).fileName ||
      (documentItem as DocumentDTO & { FileName?: string | null }).FileName ||
      "";

    setEditingDocument(documentItem);
    setFormData({
      number: documentItem.number ?? "",
      type: documentItem.type,
      date: documentItem.date?.slice(0, 10) ?? "",
      author: documentItem.author ?? "",
      price: documentItem.price,
      note: documentItem.note ?? "",
      file: fileValue,
    });
    setSelectedFile(null);
    setFormError(null);
    setIsEditOpen(true);
  };

  const handleCreateDialogChange = (open: boolean) => {
    setIsCreateOpen(open);
    if (!open) {
      resetDocumentForm();
    }
  };

  const handleEditDialogChange = (open: boolean) => {
    setIsEditOpen(open);
    if (!open) {
      resetDocumentForm();
    }
  };

  const updateFormField = <K extends keyof CreateDocumentDTO>(key: K, value: CreateDocumentDTO[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const isFormValid = () => {
    return Boolean(formData.number.trim() && formData.date);
  };

  const handleDocumentFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";

    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (!isAllowedDocumentFile(file)) {
      setFormError("Допустимые форматы файла: PNG, JPG, JPEG, PDF");
      setSelectedFile(null);
      return;
    }

    if (file.size > MAX_DOCUMENT_FILE_SIZE_BYTES) {
      setFormError("Размер файла не должен превышать 10 МБ");
      setSelectedFile(null);
      return;
    }

    setFormError(null);
    setSelectedFile(file);
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    setFormData((prev) => ({ ...prev, file: "" }));
  };

  const uploadDocumentFileIfNeeded = async () => {
    if (!selectedFile) {
      return formData.file || null;
    }

    const extension = selectedFile.name.includes(".")
      ? selectedFile.name.slice(selectedFile.name.lastIndexOf(".")).toLowerCase()
      : "";
    const uniqueFileName = `${uuidv4()}${extension}`;
    const uploaded = await filesApi.upload(selectedFile, {
      directory: DOCUMENT_FILE_DIRECTORY,
      fileName: uniqueFileName,
    });

    return `${DOCUMENT_FILE_DIRECTORY}/${uploaded.fileName}`;
  };

  const handleCreate = async () => {
    if (!isFormValid() || isSubmitting) return;

    setFormError(null);
    setIsSubmitting(true);
    let step: "upload" | "document" = "document";

    try {
      if (selectedFile) {
        step = "upload";
      }
      const fileName = await uploadDocumentFileIfNeeded();
      step = "document";

      await createMutation.mutateAsync({
        ...formData,
        author: formData.author || null,
        note: formData.note || null,
        file: fileName,
      });
      handleCreateDialogChange(false);
    } catch (createError) {
      console.error("Ошибка при создании документа:", createError);
      const fallback =
        step === "upload"
          ? "Не удалось загрузить файл. Попробуйте ещё раз."
          : "Не удалось создать документ. Попробуйте ещё раз.";
      const details = getFormErrorMessage(createError, fallback);
      setFormError(
        details === fallback
          ? fallback
          : `${step === "upload" ? "Ошибка загрузки файла" : "Ошибка создания документа"}: ${details}`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingDocument || !isFormValid() || isSubmitting) return;

    setFormError(null);
    setIsSubmitting(true);
    let step: "upload" | "document" = "document";

    try {
      if (selectedFile) {
        step = "upload";
      }
      const fileName = await uploadDocumentFileIfNeeded();
      step = "document";

      const payload: UpdateDocumentDTO = {
        ...formData,
        author: formData.author || null,
        note: formData.note || null,
        file: fileName,
      };
      await updateMutation.mutateAsync({ id: editingDocument.id, data: payload });
      handleEditDialogChange(false);
    } catch (updateError) {
      console.error("Ошибка при обновлении документа:", updateError);
      const fallback =
        step === "upload"
          ? "Не удалось загрузить файл. Попробуйте ещё раз."
          : "Не удалось сохранить документ. Попробуйте ещё раз.";
      const details = getFormErrorMessage(updateError, fallback);
      setFormError(
        details === fallback
          ? fallback
          : `${step === "upload" ? "Ошибка загрузки файла" : "Ошибка сохранения документа"}: ${details}`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Вы уверены, что хотите удалить этот документ?")) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const getDocumentFileValue = (documentItem: DocumentDTO) => {
    const raw = documentItem as DocumentDTO & {
      File?: string | null;
      fileName?: string | null;
      FileName?: string | null;
    };
    return raw.file || raw.File || raw.fileName || raw.FileName || null;
  };

  const formatDocumentFileName = (fileValue: string | null | undefined) => {
    if (!fileValue) return "—";
    const normalized = fileValue.replace(/\\/g, "/");
    const parts = normalized.split("/");
    return parts[parts.length - 1] || fileValue;
  };

  const parseStoredFilePath = (fileValue: string) => {
    const normalized = fileValue.replace(/\\/g, "/");
    const slashIndex = normalized.lastIndexOf("/");
    if (slashIndex === -1) {
      return { directory: DOCUMENT_FILE_DIRECTORY, fileName: normalized };
    }
    return {
      directory: normalized.slice(0, slashIndex) || DOCUMENT_FILE_DIRECTORY,
      fileName: normalized.slice(slashIndex + 1),
    };
  };

  const handleViewFile = async (documentItem: DocumentDTO) => {
    const fileValue = getDocumentFileValue(documentItem);
    if (!fileValue) return;

    setViewingFileId(documentItem.id);
    try {
      const { directory, fileName } = parseStoredFilePath(fileValue);
      const blob = await filesApi.download(fileName, directory);
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      window.setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
    } catch (viewError) {
      console.error("Ошибка при открытии файла:", viewError);
    } finally {
      setViewingFileId(null);
    }
  };

  const formatCell = (documentItem: DocumentDTO, key: string) => {
    switch (key) {
      case "date":
        return formatDate(documentItem.date, "ru-RU", "—");
      case "type":
        return getDocumentTypeLabel(documentItem.type);
      case "price":
        return documentItem.price ?? "—";
      case "author":
        return documentItem.author || "—";
      case "note":
        return documentItem.note || "—";
      case "file":
        return formatDocumentFileName(getDocumentFileValue(documentItem));
      case "number":
        return documentItem.number || "—";
      default:
        return "—";
    }
  };

  const handleExport = useCallback(
    async (type: "pdf" | "doc" | "xls") => {
      const columns = DOCUMENT_COLUMNS.filter((column) => visibleColumns.includes(column.key));
      const data = filteredDocuments.map((documentItem) => {
        const row: Record<string, string> = {
          number: documentItem.number || "—",
          type: getDocumentTypeLabel(documentItem.type),
          date: formatDate(documentItem.date, "ru-RU", "—"),
          author: documentItem.author || "—",
          price: documentItem.price != null ? String(documentItem.price) : "—",
          note: documentItem.note || "—",
          file: formatDocumentFileName(getDocumentFileValue(documentItem)),
        };

        const filtered: Record<string, string> = {};
        for (const column of columns) {
          filtered[column.key] = row[column.key] ?? "—";
        }
        return filtered;
      });

      const extensionByType: Record<"pdf" | "doc" | "xls", string> = {
        pdf: "pdf",
        doc: "docx",
        xls: "xlsx",
      };
      const mimeByType: Record<"pdf" | "doc" | "xls", string> = {
        pdf: "application/pdf",
        doc: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        xls: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      };

      setExportingType(type);
      try {
        const response = await api.post(
          "/api/export/table",
          {
            type,
            columns,
            data,
            fileName:
              type === "pdf" ? "DocumentsPDF" : type === "doc" ? "DocumentsDOC" : "DocumentsXLS",
          },
          {
            responseType: "blob",
          }
        );

        const fileBaseName =
          type === "pdf" ? "DocumentsPDF" : type === "doc" ? "DocumentsDOC" : "DocumentsXLS";
        const url = window.URL.createObjectURL(
          new Blob([response.data], { type: mimeByType[type] })
        );
        const link = window.document.createElement("a");
        link.href = url;
        link.download = `${fileBaseName}.${extensionByType[type]}`;
        window.document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } catch (exportError) {
        console.error(`Export ${type.toUpperCase()} failed`, exportError);
      } finally {
        setExportingType(null);
      }
    },
    [filteredDocuments, visibleColumns]
  );

  const documentFormFields = (
    <div className="space-y-4">
      <div>
        <Label htmlFor="number">
          Номер <span className="text-red-500">*</span>
        </Label>
        <Input
          id="number"
          value={formData.number}
          onChange={(e) => updateFormField("number", e.target.value)}
          placeholder="Введите номер документа"
        />
      </div>
      <div>
        <Label htmlFor="type">Тип</Label>
        <Select
          value={formData.type != null ? String(formData.type) : "none"}
          onValueChange={(value) =>
            updateFormField("type", value === "none" ? null : Number(value))
          }
        >
          <SelectTrigger id="type" className="w-full">
            <SelectValue placeholder="Выберите тип" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Не указан</SelectItem>
            {DOCUMENT_TYPE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={String(option.value)}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="date">
          Дата <span className="text-red-500">*</span>
        </Label>
        <Input
          id="date"
          type="date"
          value={formData.date}
          onChange={(e) => updateFormField("date", e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="author">Автор</Label>
        <Input
          id="author"
          value={formData.author ?? ""}
          onChange={(e) => updateFormField("author", e.target.value)}
          placeholder="Введите автора"
        />
      </div>
      <div>
        <Label htmlFor="price">Цена</Label>
        <Input
          id="price"
          type="number"
          step="0.01"
          value={formData.price ?? ""}
          onChange={(e) =>
            updateFormField("price", e.target.value === "" ? null : Number(e.target.value))
          }
          placeholder="Введите цену"
        />
      </div>
      <div>
        <Label htmlFor="note">Примечание</Label>
        <Input
          id="note"
          value={formData.note ?? ""}
          onChange={(e) => updateFormField("note", e.target.value)}
          placeholder="Введите примечание"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="document-file">Файл</Label>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" asChild disabled={isSubmitting}>
            <label htmlFor="document-file" className="cursor-pointer">
              <Paperclip className="mr-2 h-4 w-4" />
              {selectedFile || formData.file ? "Заменить файл" : "Загрузить файл"}
            </label>
          </Button>
          <Input
            id="document-file"
            type="file"
            accept={ALLOWED_DOCUMENT_FILE_ACCEPT}
            className="hidden"
            onChange={handleDocumentFileChange}
            disabled={isSubmitting}
          />
          <span className="text-xs text-muted-foreground">PNG, JPG, JPEG, PDF до 10 МБ</span>
        </div>
        {(selectedFile || formData.file) && (
          <div className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm">
            <span className="truncate">{selectedFile?.name || formData.file}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearSelectedFile}
              disabled={isSubmitting}
              aria-label="Удалить файл"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {formError && <p className="text-sm text-red-600">{formError}</p>}
    </div>
  );

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Ошибка</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Произошла ошибка при загрузке документов: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-3 max-lg:flex-col">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <FileText className="h-8 w-8" />
          Документы
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Справочник документов
          {isFiltered && <span className="ml-2 text-blue-600">(применены фильтры)</span>}
        </p>
      </div>

      <div className="flex justify-end items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-md border bg-background p-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              title="Экспорт DOC"
              onClick={() => handleExport("doc")}
              disabled={!!exportingType || isLoading}
            >
              {exportingType === "doc" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Image src="/icon_word.svg" alt="Экспорт DOC" width={16} height={16} />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              title="Экспорт PDF"
              onClick={() => handleExport("pdf")}
              disabled={!!exportingType || isLoading}
            >
              {exportingType === "pdf" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Image src="/icon_pdf.png" alt="Экспорт PDF" width={16} height={16} />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              title="Экспорт XLS"
              onClick={() => handleExport("xls")}
              disabled={!!exportingType || isLoading}
            >
              {exportingType === "xls" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Image src="/icon_excel.svg" alt="Экспорт XLS" width={16} height={16} />
              )}
            </Button>
          </div>
          <DocumentsFilter
            open={filterOpen}
            onOpenChange={setFilterOpen}
            filters={filters}
            sort={sort}
            visibleColumns={visibleColumns}
            onApply={handleFilterApply}
            onVisibleColumnsChange={setVisibleColumns}
            filteredCount={totalCount}
            totalCount={allCount}
          />
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Добавить документ
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex gap-2 items-center">
            <CardTitle>{isFiltered ? "Результаты фильтрации" : "Список документов"}</CardTitle>
            <CardDescription>
              {isFiltered
                ? `Отфильтровано: ${totalCount} из ${allCount}`
                : `Всего записей: ${totalCount}`}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="-mt-4">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !filteredDocuments.length ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  {isFiltered
                    ? "По заданным фильтрам документы не найдены"
                    : "Нет данных для отображения"}
                </p>
              </div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    {DOCUMENT_COLUMNS.map(
                      (column) =>
                        isColumnVisible(column.key) && (
                          <TableHead key={column.key}>{column.label}</TableHead>
                        )
                    )}
                    <TableHead className="w-[1%] whitespace-nowrap text-right">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayDocuments.map((documentItem) => {
                    const itemFile = getDocumentFileValue(documentItem);

                    return (
                    <TableRow key={documentItem.id}>
                      {DOCUMENT_COLUMNS.map(
                        (column) =>
                          isColumnVisible(column.key) && (
                            <TableCell
                              key={column.key}
                              className={column.key === "number" ? "font-medium" : undefined}
                            >
                              {column.key === "file" ? (
                                itemFile ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleViewFile(documentItem)}
                                    disabled={viewingFileId === documentItem.id}
                                  >
                                    {viewingFileId === documentItem.id ? (
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                      <Eye className="mr-2 h-4 w-4" />
                                    )}
                                    Посмотреть
                                  </Button>
                                ) : (
                                  "—"
                                )
                              ) : (
                                formatCell(documentItem, column.key)
                              )}
                            </TableCell>
                          )
                      )}
                      <TableCell className="w-[1%] whitespace-nowrap">
                        <div className="flex w-max justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(documentItem)}
                            title="Редактировать"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(documentItem.id)}
                            disabled={deleteMutation.isPending}
                            title="Удалить"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              <div className="mt-4">
                <Pagination />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={isCreateOpen} onOpenChange={handleCreateDialogChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить документ</DialogTitle>
            <DialogDescription>Создайте новую запись в справочнике документов.</DialogDescription>
          </DialogHeader>
          {documentFormFields}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => handleCreateDialogChange(false)}
              disabled={isSubmitting}
            >
              Отмена
            </Button>
            <Button onClick={handleCreate} disabled={isSubmitting || !isFormValid()}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {selectedFile ? "Загрузка..." : "Создание..."}
                </>
              ) : (
                "Создать"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={handleEditDialogChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать документ</DialogTitle>
            <DialogDescription>Измените данные записи в справочнике документов.</DialogDescription>
          </DialogHeader>
          {documentFormFields}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => handleEditDialogChange(false)}
              disabled={isSubmitting}
            >
              Отмена
            </Button>
            <Button onClick={handleUpdate} disabled={isSubmitting || !isFormValid()}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {selectedFile ? "Загрузка..." : "Сохранение..."}
                </>
              ) : (
                "Сохранить"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
