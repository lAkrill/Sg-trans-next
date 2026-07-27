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
  useDocumentsRegulatory,
  useCreateDocumentsRegulatory,
  useUpdateDocumentsRegulatory,
  useDeleteDocumentsRegulatory,
} from "@/hooks";
import {
  DEFAULT_DOCUMENTS_REGULATORY_SORT,
  DEFAULT_DOCUMENTS_REGULATORY_VISIBLE_COLUMNS,
  DOCUMENTS_REGULATORY_COLUMN_OPTIONS,
  DocumentsRegulatoryFilter,
  EMPTY_DOCUMENTS_REGULATORY_FILTERS,
  type DocumentsRegulatoryFilterCriteria,
  type DocumentsRegulatorySortConfig,
  type DocumentsRegulatorySortField,
} from "@/components/documents-regulatory-filter";
import { filesApi } from "@/api/files";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/formatDate";
import type {
  CreateDocumentsRegulatoryDTO,
  DocumentsRegulatoryDTO,
  UpdateDocumentsRegulatoryDTO,
} from "@/types/directories";

const EMPTY_FORM: CreateDocumentsRegulatoryDTO = {
  name: "",
  number: "",
  date: "",
  file: "",
  url: "",
};

const DOCUMENT_FILE_DIRECTORY = "DocumentsRegulatory";
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

const DOCUMENT_COLUMNS = DOCUMENTS_REGULATORY_COLUMN_OPTIONS.map((option) => ({
  key: option.value,
  label: option.label,
}));

const includesText = (value: string | null | undefined, query: string | undefined) => {
  if (!query?.trim()) return true;
  return (value ?? "").toLowerCase().includes(query.trim().toLowerCase());
};

const getDocumentFileValue = (item: DocumentsRegulatoryDTO) => {
  const raw = item as DocumentsRegulatoryDTO & {
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

const getItemUrl = (url: string | null | undefined) => {
  const trimmed = url?.trim();
  return trimmed ? trimmed : null;
};

const getAbsoluteUrl = (url: string) => {
  if (/^[a-z][a-z0-9+.-]*:/i.test(url)) {
    return url;
  }
  return `https://${url}`;
};

const getSortValue = (item: DocumentsRegulatoryDTO, field: DocumentsRegulatorySortField) => {
  switch (field) {
    case "name":
      return item.name ?? "";
    case "number":
      return item.number ?? "";
    case "date":
      return item.date ?? "";
    case "file":
      return getDocumentFileValue(item) ?? "";
    case "url":
      return item.url ?? "";
    case "updatedAt":
      return item.updatedAt ?? "";
    default:
      return "";
  }
};

const compareItems = (
  a: DocumentsRegulatoryDTO,
  b: DocumentsRegulatoryDTO,
  sort: DocumentsRegulatorySortConfig
) => {
  if (!sort.field) return 0;

  const result = String(getSortValue(a, sort.field)).localeCompare(
    String(getSortValue(b, sort.field)),
    "ru",
    { numeric: true, sensitivity: "base" }
  );

  return sort.direction === "desc" ? -result : result;
};

const matchesFilters = (
  item: DocumentsRegulatoryDTO,
  filters: DocumentsRegulatoryFilterCriteria
) => {
  if (!includesText(item.name, filters.name)) return false;
  if (!includesText(item.number, filters.number)) return false;
  if (!includesText(getDocumentFileValue(item), filters.file)) return false;
  if (!includesText(item.url, filters.url)) return false;

  const itemDate = item.date?.slice(0, 10) ?? "";
  if (filters.dateFrom && (!itemDate || itemDate < filters.dateFrom)) return false;
  if (filters.dateTo && (!itemDate || itemDate > filters.dateTo)) return false;

  return true;
};

const hasActiveFilters = (filters: DocumentsRegulatoryFilterCriteria) =>
  Object.values(filters).some((value) => value !== undefined && value !== null && value !== "");

export default function DocumentsRegulatoryPage() {
  const searchParams = useSearchParams();
  const initialPageNumber = Number(searchParams.get("page")) || 1;
  const initialPageSize = Number(searchParams.get("pageSize")) || 10;

  const [pageNumber, setPageNumber] = useState(initialPageNumber);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [exportingType, setExportingType] = useState<"pdf" | "doc" | "xls" | null>(null);

  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<DocumentsRegulatoryFilterCriteria>(
    EMPTY_DOCUMENTS_REGULATORY_FILTERS
  );
  const [sort, setSort] = useState<DocumentsRegulatorySortConfig>(DEFAULT_DOCUMENTS_REGULATORY_SORT);
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    ...DEFAULT_DOCUMENTS_REGULATORY_VISIBLE_COLUMNS,
  ]);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DocumentsRegulatoryDTO | null>(null);
  const [formData, setFormData] = useState<CreateDocumentsRegulatoryDTO>(EMPTY_FORM);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewingFileId, setViewingFileId] = useState<string | null>(null);

  const { data: items = [], isLoading, error } = useDocumentsRegulatory();
  const createMutation = useCreateDocumentsRegulatory();
  const updateMutation = useUpdateDocumentsRegulatory();
  const deleteMutation = useDeleteDocumentsRegulatory();

  const filteredItems = useMemo(() => {
    const filtered = items.filter((item) => matchesFilters(item, filters));
    if (!sort.field) return filtered;
    return [...filtered].sort((a, b) => compareItems(a, b, sort));
  }, [items, filters, sort]);

  const isFiltered = hasActiveFilters(filters) || Boolean(sort.field);
  const totalCount = filteredItems.length;
  const allCount = items.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = Math.min(pageNumber, totalPages);

  const displayItems = useMemo(
    () => filteredItems.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [filteredItems, currentPage, pageSize]
  );

  const isColumnVisible = (column: string) => visibleColumns.includes(column);

  const handleFilterApply = ({
    filters: nextFilters,
    sort: nextSort,
  }: {
    filters: DocumentsRegulatoryFilterCriteria;
    sort: DocumentsRegulatorySortConfig;
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

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setSelectedFile(null);
    setFormError(null);
    setEditingItem(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsCreateOpen(true);
  };

  const openEditDialog = (item: DocumentsRegulatoryDTO) => {
    setEditingItem(item);
    setFormData({
      name: item.name ?? "",
      number: item.number ?? "",
      date: item.date?.slice(0, 10) ?? "",
      file: getDocumentFileValue(item) ?? "",
      url: item.url ?? "",
    });
    setSelectedFile(null);
    setFormError(null);
    setIsEditOpen(true);
  };

  const handleCreateDialogChange = (open: boolean) => {
    setIsCreateOpen(open);
    if (!open) resetForm();
  };

  const handleEditDialogChange = (open: boolean) => {
    setIsEditOpen(open);
    if (!open) resetForm();
  };

  const updateFormField = <K extends keyof CreateDocumentsRegulatoryDTO>(
    key: K,
    value: CreateDocumentsRegulatoryDTO[K]
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const isFormValid = () => Boolean(formData.name.trim() && formData.date);

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
      if (selectedFile) step = "upload";
      const fileName = await uploadDocumentFileIfNeeded();
      step = "document";

      await createMutation.mutateAsync({
        name: formData.name.trim(),
        number: formData.number || null,
        date: formData.date,
        file: fileName,
        url: formData.url || null,
      });
      handleCreateDialogChange(false);
    } catch (createError) {
      console.error("Ошибка при создании нормативного документа:", createError);
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
    if (!editingItem || !isFormValid() || isSubmitting) return;

    setFormError(null);
    setIsSubmitting(true);
    let step: "upload" | "document" = "document";

    try {
      if (selectedFile) step = "upload";
      const fileName = await uploadDocumentFileIfNeeded();
      step = "document";

      const payload: UpdateDocumentsRegulatoryDTO = {
        name: formData.name.trim(),
        number: formData.number || null,
        date: formData.date,
        file: fileName,
        url: formData.url || null,
      };
      await updateMutation.mutateAsync({ id: editingItem.id, data: payload });
      handleEditDialogChange(false);
    } catch (updateError) {
      console.error("Ошибка при обновлении нормативного документа:", updateError);
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
    if (window.confirm("Вы уверены, что хотите удалить этот нормативный документ?")) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const handleViewFile = async (item: DocumentsRegulatoryDTO) => {
    const fileValue = getDocumentFileValue(item);
    if (!fileValue) return;

    setViewingFileId(item.id);
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

  const formatCell = (item: DocumentsRegulatoryDTO, key: string) => {
    switch (key) {
      case "name":
        return item.name || "—";
      case "number":
        return item.number || "—";
      case "date":
        return formatDate(item.date, "ru-RU", "—");
      case "file":
        return formatDocumentFileName(getDocumentFileValue(item));
      case "url":
        return item.url || "—";
      case "updatedAt":
        return item.updatedAt ? formatDate(item.updatedAt, "ru-RU", "—") : "—";
      default:
        return "—";
    }
  };

  const handleExport = useCallback(
    async (type: "pdf" | "doc" | "xls") => {
      const columns = DOCUMENT_COLUMNS.filter((column) => visibleColumns.includes(column.key)).map(
        (column) => ({
          key: column.key,
          label: column.label,
          type: column.key === "date" || column.key === "updatedAt" ? ("date" as const) : ("string" as const),
        })
      );

      const data = filteredItems.map((item) => {
        const row: Record<string, string> = {
          name: item.name || "—",
          number: item.number || "—",
          date: formatDate(item.date, "ru-RU", "—"),
          file: formatDocumentFileName(getDocumentFileValue(item)),
          url: item.url || "—",
          updatedAt: item.updatedAt ? formatDate(item.updatedAt, "ru-RU", "—") : "—",
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
              type === "pdf"
                ? "DocumentsRegulatoryPDF"
                : type === "doc"
                  ? "DocumentsRegulatoryDOC"
                  : "DocumentsRegulatoryXLS",
          },
          { responseType: "blob" }
        );

        const fileBaseName =
          type === "pdf"
            ? "DocumentsRegulatoryPDF"
            : type === "doc"
              ? "DocumentsRegulatoryDOC"
              : "DocumentsRegulatoryXLS";
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
    [filteredItems, visibleColumns]
  );

  const formFields = (
    <div className="space-y-4">
      <div>
        <Label htmlFor="name">
          Название <span className="text-red-500">*</span>
        </Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => updateFormField("name", e.target.value)}
          placeholder="Введите название"
        />
      </div>
      <div>
        <Label htmlFor="number">Номер</Label>
        <Input
          id="number"
          value={formData.number ?? ""}
          onChange={(e) => updateFormField("number", e.target.value)}
          placeholder="Введите номер"
        />
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
        <Label htmlFor="url">URL</Label>
        <Input
          id="url"
          value={formData.url ?? ""}
          onChange={(e) => updateFormField("url", e.target.value)}
          placeholder="Введите URL"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="document-regulatory-file">Файл</Label>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" asChild disabled={isSubmitting}>
            <label htmlFor="document-regulatory-file" className="cursor-pointer">
              <Paperclip className="mr-2 h-4 w-4" />
              {selectedFile || formData.file ? "Заменить файл" : "Загрузить файл"}
            </label>
          </Button>
          <Input
            id="document-regulatory-file"
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
            <span className="truncate">{selectedFile?.name || formatDocumentFileName(formData.file)}</span>
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
          <p>Произошла ошибка при загрузке нормативных документов: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-3 max-lg:flex-col">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <FileText className="h-8 w-8" />
          Нормативные документы
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Справочник нормативных документов
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
          <DocumentsRegulatoryFilter
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
            <CardTitle>
              {isFiltered ? "Результаты фильтрации" : "Список нормативных документов"}
            </CardTitle>
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
          ) : !filteredItems.length ? (
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
                  {displayItems.map((item) => {
                    const itemUrl = getItemUrl(item.url);
                    const itemFile = getDocumentFileValue(item);

                    return (
                    <TableRow key={item.id}>
                      {DOCUMENT_COLUMNS.map(
                        (column) =>
                          isColumnVisible(column.key) && (
                            <TableCell
                              key={column.key}
                              className={column.key === "name" ? "font-medium" : undefined}
                            >
                              {column.key === "file" ? (
                                itemFile ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleViewFile(item)}
                                    disabled={viewingFileId === item.id}
                                  >
                                    {viewingFileId === item.id ? (
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                      <Eye className="mr-2 h-4 w-4" />
                                    )}
                                    Посмотреть
                                  </Button>
                                ) : (
                                  "—"
                                )
                              ) : column.key === "url" ? (
                                itemUrl ? (
                                  <a
                                    href={getAbsoluteUrl(itemUrl)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline break-all"
                                  >
                                    {itemUrl}
                                  </a>
                                ) : (
                                  "—"
                                )
                              ) : (
                                formatCell(item, column.key)
                              )}
                            </TableCell>
                          )
                      )}
                      <TableCell className="w-[1%] whitespace-nowrap">
                        <div className="flex w-max justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(item)}
                            title="Редактировать"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(item.id)}
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
            <DialogTitle>Добавить нормативный документ</DialogTitle>
            <DialogDescription>
              Создайте новую запись в справочнике нормативных документов.
            </DialogDescription>
          </DialogHeader>
          {formFields}
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
            <DialogTitle>Редактировать нормативный документ</DialogTitle>
            <DialogDescription>
              Измените данные записи в справочнике нормативных документов.
            </DialogDescription>
          </DialogHeader>
          {formFields}
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
