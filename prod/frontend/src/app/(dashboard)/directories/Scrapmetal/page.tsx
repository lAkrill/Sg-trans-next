"use client";

import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
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
  SearchableSelect,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@/components/ui";
import {
  Plus,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Recycle,
  Loader2,
  ListChecks,
} from "lucide-react";
import {
  useScrapmetal,
  useCreateScrapmetal,
  useUpdateScrapmetal,
  useDeleteScrapmetal,
  useAllDocuments,
  useAllParts,
  usePartTypes,
  useCreateDocument,
  useCurrentUser,
} from "@/hooks";
import {
  DEFAULT_SCRAPMETAL_SORT,
  DEFAULT_SCRAPMETAL_VISIBLE_COLUMNS,
  SCRAPMETAL_COLUMN_OPTIONS,
  ScrapmetalFilter,
  EMPTY_SCRAPMETAL_FILTERS,
  type ScrapmetalFilterCriteria,
  type ScrapmetalSortConfig,
  type ScrapmetalSortField,
} from "@/components/scrapmetal-filter";
import {
  ScrapmetalPartsPickerDialog,
  type ScrapmetalWriteOffDocumentForm,
} from "@/components/scrapmetal-parts-picker-dialog";
import {
  buildScrapmetalPeriodReport,
  ScrapmetalPeriodReportTable,
  type ScrapmetalPeriodReportData,
} from "@/components/scrapmetal-period-report";
import { getDocumentTypeLabel, DOCUMENT_TYPE_OPTIONS } from "@/components/documents-filter";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/formatDate";
import type {
  CreateDocumentDTO,
  CreateScrapmetalDTO,
  PartDTO,
  ScrapmetalDTO,
  UpdateScrapmetalDTO,
} from "@/types/directories";

type ScrapmetalFormState = {
  partId: string;
  weight: string;
  date: string;
  code: string;
  note: string;
  documentId: string;
};

const EMPTY_FORM: ScrapmetalFormState = {
  partId: "",
  weight: "0",
  date: "",
  code: "0",
  note: "",
  documentId: "",
};

const CODE_OPTIONS = [
  { value: "0", label: "Передача" },
  { value: "1", label: "Факт" },
] as const;

const QUARTER_OPTIONS = [
  { value: "all", label: "Весь год" },
  { value: "1", label: "I квартал" },
  { value: "2", label: "II квартал" },
  { value: "3", label: "III квартал" },
  { value: "4", label: "IV квартал" },
] as const;

const getCurrentQuarter = (date = new Date()) => Math.floor(date.getMonth() / 3) + 1;

const REPORT_YEAR_OPTIONS = Array.from({ length: 8 }, (_, index) => {
  const year = new Date().getFullYear() - index;
  return { value: String(year), label: String(year) };
});

const FACT_CODE_VALUE = "1";
const TRANSFER_CODE_VALUE = "0";

const isFactCode = (code: string | number | null | undefined) => String(code ?? "") === FACT_CODE_VALUE;
const isTransferCode = (code: string | number | null | undefined) =>
  String(code ?? TRANSFER_CODE_VALUE) === TRANSFER_CODE_VALUE;

/** Типы документов для металлолома */
const SCRAPMETAL_DOCUMENT_TYPES = [3, 4] as const;
const DEFAULT_SCRAPMETAL_DOCUMENT_TYPE = 4;
const CREATE_NEW_DOCUMENT_VALUE = "__create_new_document__";

const SCRAPMETAL_DOCUMENT_TYPE_OPTIONS = DOCUMENT_TYPE_OPTIONS.filter((option) =>
  (SCRAPMETAL_DOCUMENT_TYPES as readonly number[]).includes(option.value)
);

const isScrapmetalDocumentType = (type: number | string | null | undefined) => {
  if (type == null || type === "") return false;
  const normalized = Number(type);
  return (SCRAPMETAL_DOCUMENT_TYPES as readonly number[]).includes(normalized);
};

/** Номер (Дата, Автор) - Тип документа */
const formatDocumentLabel = (document: {
  number?: string | null;
  date?: string | null;
  author?: string | null;
  type?: number | null;
}) => {
  const number = document.number?.trim() || "—";
  const date = formatDate(document.date, "ru-RU", "—");
  const author = document.author?.trim() || "—";
  const typeLabel = getDocumentTypeLabel(document.type);
  return `${number} (${date}, ${author}) - ${typeLabel}`;
};

const EMPTY_DOCUMENT_FORM: CreateDocumentDTO = {
  number: "",
  type: DEFAULT_SCRAPMETAL_DOCUMENT_TYPE,
  date: "",
  author: "",
  price: null,
  note: "",
  file: "",
};

const formatUserAuthor = (user?: { firstName?: string | null; lastName?: string | null } | null) => {
  if (!user) return "";
  return [user.lastName, user.firstName].filter(Boolean).join(" ").trim();
};

const formatCodeLabel = (code: number | string | null | undefined) => {
  const value = String(code ?? 0);
  return CODE_OPTIONS.find((option) => option.value === value)?.label ?? value;
};

const SCRAPMETAL_COLUMNS = SCRAPMETAL_COLUMN_OPTIONS.map((option) => ({
  key: option.value,
  label: option.label,
}));

const includesText = (value: string | null | undefined, query: string | undefined) => {
  if (!query?.trim()) return true;
  return (value ?? "").toLowerCase().includes(query.trim().toLowerCase());
};

const parseOptionalNumber = (value: string | undefined) => {
  if (!value?.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
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

const getSortValue = (
  item: ScrapmetalDTO,
  field: ScrapmetalSortField,
  resolvePartLabel: (id: string | null | undefined) => string,
  resolveDocumentLabel: (id: string | null | undefined) => string
) => {
  switch (field) {
    case "partId":
      return resolvePartLabel(item.partId);
    case "weight":
      return item.weight ?? 0;
    case "date":
      return item.date ?? "";
    case "code":
      return item.code ?? 0;
    case "note":
      return item.note ?? "";
    case "documentId":
      return resolveDocumentLabel(item.documentId);
    case "updatedAt":
      return item.updatedAt ?? "";
    default:
      return "";
  }
};

const compareItems = (
  a: ScrapmetalDTO,
  b: ScrapmetalDTO,
  sort: ScrapmetalSortConfig,
  resolvePartLabel: (id: string | null | undefined) => string,
  resolveDocumentLabel: (id: string | null | undefined) => string
) => {
  if (!sort.field) return 0;

  const aValue = getSortValue(a, sort.field, resolvePartLabel, resolveDocumentLabel);
  const bValue = getSortValue(b, sort.field, resolvePartLabel, resolveDocumentLabel);

  const result =
    typeof aValue === "number" && typeof bValue === "number"
      ? aValue - bValue
      : String(aValue).localeCompare(String(bValue), "ru", {
          numeric: true,
          sensitivity: "base",
        });

  return sort.direction === "desc" ? -result : result;
};

const matchesFilters = (
  item: ScrapmetalDTO,
  filters: ScrapmetalFilterCriteria,
  resolvePartLabel: (id: string | null | undefined) => string,
  resolveDocumentLabel: (id: string | null | undefined) => string
) => {
  if (!includesText(resolvePartLabel(item.partId), filters.partId) && !includesText(item.partId, filters.partId)) {
    return false;
  }
  if (
    !includesText(resolveDocumentLabel(item.documentId), filters.documentId) &&
    !includesText(item.documentId, filters.documentId)
  ) {
    return false;
  }
  if (!includesText(item.note, filters.note)) return false;

  const weightFrom = parseOptionalNumber(filters.weightFrom);
  const weightTo = parseOptionalNumber(filters.weightTo);
  if (weightFrom !== undefined && item.weight < weightFrom) return false;
  if (weightTo !== undefined && item.weight > weightTo) return false;

  const codeFrom = parseOptionalNumber(filters.codeFrom);
  const codeTo = parseOptionalNumber(filters.codeTo);
  if (codeFrom !== undefined && item.code < codeFrom) return false;
  if (codeTo !== undefined && item.code > codeTo) return false;

  const itemDate = item.date?.slice(0, 10) ?? "";
  if (filters.dateFrom && (!itemDate || itemDate < filters.dateFrom)) return false;
  if (filters.dateTo && (!itemDate || itemDate > filters.dateTo)) return false;

  return true;
};

const hasActiveFilters = (filters: ScrapmetalFilterCriteria) =>
  Object.values(filters).some((value) => value !== undefined && value !== null && value !== "");

const toOptionalGuid = (value: string) => {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const buildPayload = (formData: ScrapmetalFormState): CreateScrapmetalDTO => ({
  partId: isFactCode(formData.code) ? null : toOptionalGuid(formData.partId),
  weight: Number(formData.weight) || 0,
  date: formData.date,
  code: Number.parseInt(formData.code, 10) || 0,
  note: formData.note.trim() || null,
  documentId: toOptionalGuid(formData.documentId),
});

export default function ScrapmetalPage() {
  const searchParams = useSearchParams();
  const initialPageNumber = Number(searchParams.get("page")) || 1;
  const initialPageSize = Number(searchParams.get("pageSize")) || 10;

  const [pageNumber, setPageNumber] = useState(initialPageNumber);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [exportingType, setExportingType] = useState<"pdf" | "doc" | "xls" | null>(null);

  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<ScrapmetalFilterCriteria>(EMPTY_SCRAPMETAL_FILTERS);
  const [sort, setSort] = useState<ScrapmetalSortConfig>(DEFAULT_SCRAPMETAL_SORT);
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    ...DEFAULT_SCRAPMETAL_VISIBLE_COLUMNS,
  ]);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCreateDocumentOpen, setIsCreateDocumentOpen] = useState(false);
  const [isPartsPickerOpen, setIsPartsPickerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ScrapmetalDTO | null>(null);
  const [formData, setFormData] = useState<ScrapmetalFormState>(EMPTY_FORM);
  const [documentFormData, setDocumentFormData] = useState<CreateDocumentDTO>(EMPTY_DOCUMENT_FORM);
  const [documentFormError, setDocumentFormError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddingFromPicker, setIsAddingFromPicker] = useState(false);
  const [isCreatingDocument, setIsCreatingDocument] = useState(false);
  const [reportYear, setReportYear] = useState(String(new Date().getFullYear()));
  const [reportQuarter, setReportQuarter] = useState(String(getCurrentQuarter()));
  const [periodReport, setPeriodReport] = useState<ScrapmetalPeriodReportData | null>(null);

  const { data: items = [], isLoading, error } = useScrapmetal();
  const { data: documents = [], isLoading: documentsLoading } = useAllDocuments();
  const { data: parts = [], isLoading: partsLoading } = useAllParts();
  const { data: partTypes = [] } = usePartTypes();
  const { data: currentUser } = useCurrentUser();
  const createMutation = useCreateScrapmetal();
  const updateMutation = useUpdateScrapmetal();
  const deleteMutation = useDeleteScrapmetal();
  const createDocumentMutation = useCreateDocument();

  const partTypeWeightById = useMemo(() => {
    const map = new Map<string, number>();
    for (const partType of partTypes) {
      if (Number.isFinite(partType.weight)) {
        map.set(partType.id, Number(partType.weight));
      }
    }
    return map;
  }, [partTypes]);

  const getWeightForPartId = useCallback(
    (partId: string) => {
      const part = parts.find((item) => item.id === partId);
      if (!part?.partType?.id) return "0";
      const weight =
        partTypeWeightById.get(part.partType.id) ??
        (Number.isFinite(part.partType.weight) ? Number(part.partType.weight) : 0);
      return String(weight ?? 0);
    },
    [parts, partTypeWeightById]
  );

  const partLabelById = useMemo(() => {
    const formatManufactureYear = (
      yearData?: string | { year: number; month: number; day: number }
    ) => {
      if (!yearData) return "—";
      if (typeof yearData === "string") {
        const yearMatch = yearData.match(/^(\d{4})/);
        return yearMatch ? yearMatch[1] : yearData;
      }
      return String(yearData.year);
    };

    const map = new Map<string, string>();
    for (const part of parts) {
      const serial = part.serialNumber?.trim() || "—";
      const stamp = part.stampNumber?.value?.trim() || "—";
      const year = formatManufactureYear(part.manufactureYear);
      const typeName = part.partType?.name?.trim() || "—";
      map.set(part.id, `${serial} (${stamp}; ${year}) - ${typeName}`);
    }
    return map;
  }, [parts]);

  const documentLabelById = useMemo(() => {
    const map = new Map<string, string>();
    for (const document of documents) {
      map.set(document.id, formatDocumentLabel(document));
    }
    return map;
  }, [documents]);

  const resolvePartLabel = useCallback(
    (id: string | null | undefined) => {
      if (!id) return "—";
      return partLabelById.get(id) || id;
    },
    [partLabelById]
  );

  const resolveDocumentLabel = useCallback(
    (id: string | null | undefined) => {
      if (!id) return "—";
      return documentLabelById.get(id) || id;
    },
    [documentLabelById]
  );

  const partOptions = useMemo(
    () =>
      parts.map((part) => ({
        value: part.id,
        label: resolvePartLabel(part.id),
      })),
    [parts, resolvePartLabel]
  );

  const documentOptions = useMemo(() => {
    // Значения из справочника /api/documents/all — только типы 3 и 4
    const scrapmetalDocuments = documents
      .filter((document) => isScrapmetalDocumentType(document.type))
      .slice()
      .sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return (Number.isFinite(dateB) ? dateB : 0) - (Number.isFinite(dateA) ? dateA : 0);
      });

    const options = [
      { value: CREATE_NEW_DOCUMENT_VALUE, label: "Создать новый документ" },
      ...scrapmetalDocuments.map((document) => ({
        value: document.id,
        label: formatDocumentLabel(document),
      })),
    ];

    // Если выбран документ другого типа (например, при редактировании) — показать его в списке
    if (
      formData.documentId &&
      !options.some((option) => option.value === formData.documentId)
    ) {
      const selected = documents.find((document) => document.id === formData.documentId);
      options.splice(1, 0, {
        value: formData.documentId,
        label: selected ? formatDocumentLabel(selected) : resolveDocumentLabel(formData.documentId),
      });
    }

    return options;
  }, [documents, formData.documentId, resolveDocumentLabel]);

  const filteredItems = useMemo(() => {
    const filtered = items.filter((item) =>
      matchesFilters(item, filters, resolvePartLabel, resolveDocumentLabel)
    );
    if (!sort.field) return filtered;
    return [...filtered].sort((a, b) =>
      compareItems(a, b, sort, resolvePartLabel, resolveDocumentLabel)
    );
  }, [items, filters, sort, resolvePartLabel, resolveDocumentLabel]);

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
    filters: ScrapmetalFilterCriteria;
    sort: ScrapmetalSortConfig;
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
    setFormError(null);
    setEditingItem(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsCreateOpen(true);
  };

  const handleBuildPeriodReport = () => {
    const year = Number(reportYear);
    const quarter =
      reportQuarter === "all" ? ("all" as const) : (Number(reportQuarter) as 1 | 2 | 3 | 4);

    setPeriodReport(
      buildScrapmetalPeriodReport({
        items,
        parts,
        year,
        quarter,
      })
    );
  };

  const handleAddSelectedParts = async (
    selectedParts: PartDTO[],
    document: ScrapmetalWriteOffDocumentForm
  ) => {
    if (!selectedParts.length || isAddingFromPicker) return;

    setIsAddingFromPicker(true);

    try {
      let documentId = document.documentId;

      if (!documentId) {
        documentId = await createDocumentMutation.mutateAsync({
          number: document.number,
          type: DEFAULT_SCRAPMETAL_DOCUMENT_TYPE,
          date: document.date,
          author: document.author || null,
          price: null,
          note: null,
          file: null,
        });
      }

      for (const part of selectedParts) {
        const weight =
          (part.partType?.id ? partTypeWeightById.get(part.partType.id) : undefined) ??
          (Number.isFinite(part.partType?.weight) ? Number(part.partType.weight) : 0);

        await createMutation.mutateAsync({
          partId: part.id,
          weight: weight ?? 0,
          date: document.date,
          code: 0,
          note: null,
          documentId,
        });
      }
      setIsPartsPickerOpen(false);
    } catch (addError) {
      console.error("Ошибка при добавлении выбранных деталей в металлолом:", addError);
    } finally {
      setIsAddingFromPicker(false);
    }
  };

  const openEditDialog = (item: ScrapmetalDTO) => {
    const code = String(item.code ?? 0);
    setEditingItem(item);
    setFormData({
      partId: isFactCode(code) ? "" : (item.partId ?? ""),
      weight: String(item.weight ?? 0),
      date: item.date?.slice(0, 10) ?? "",
      code,
      note: item.note ?? "",
      documentId: item.documentId ?? "",
    });
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

  const updateFormField = <K extends keyof ScrapmetalFormState>(
    key: K,
    value: ScrapmetalFormState[K]
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handlePartChange = (partId: string) => {
    if (isFactCode(formData.code)) return;

    setFormData((prev) => ({
      ...prev,
      partId,
      weight: partId ? getWeightForPartId(partId) : "0",
    }));
  };

  const handleCodeChange = (code: string) => {
    setFormData((prev) => {
      if (isFactCode(code)) {
        return {
          ...prev,
          code,
          partId: "",
          weight: prev.partId ? "0" : prev.weight,
        };
      }
      return { ...prev, code };
    });
  };

  const handleDocumentChange = (documentId: string) => {
    if (documentId === CREATE_NEW_DOCUMENT_VALUE) {
      setDocumentFormData({
        ...EMPTY_DOCUMENT_FORM,
        date: formData.date || new Date().toISOString().slice(0, 10),
        author: formatUserAuthor(currentUser),
      });
      setDocumentFormError(null);
      setIsCreateDocumentOpen(true);
      return;
    }

    const document = documents.find((item) => item.id === documentId);
    const documentDate = document?.date?.slice(0, 10) ?? "";

    setFormData((prev) => ({
      ...prev,
      documentId,
      ...(documentId && documentDate ? { date: documentDate } : {}),
    }));
  };

  const updateDocumentFormField = <K extends keyof CreateDocumentDTO>(
    key: K,
    value: CreateDocumentDTO[K]
  ) => {
    setDocumentFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleCreateDocumentDialogChange = (open: boolean) => {
    if (!open && isCreatingDocument) return;
    setIsCreateDocumentOpen(open);
    if (!open) {
      setDocumentFormData(EMPTY_DOCUMENT_FORM);
      setDocumentFormError(null);
    }
  };

  const handleCreateDocument = async () => {
    if (!documentFormData.number.trim() || !documentFormData.date || isCreatingDocument) return;

    setDocumentFormError(null);
    setIsCreatingDocument(true);

    try {
      const newDocumentId = await createDocumentMutation.mutateAsync({
        number: documentFormData.number.trim(),
        type: documentFormData.type ?? DEFAULT_SCRAPMETAL_DOCUMENT_TYPE,
        date: documentFormData.date,
        author: documentFormData.author?.trim() || null,
        price: null,
        note: documentFormData.note?.trim() || null,
        file: null,
      });

      setFormData((prev) => ({
        ...prev,
        documentId: newDocumentId,
        date: documentFormData.date,
      }));
      setIsCreateDocumentOpen(false);
      setDocumentFormData(EMPTY_DOCUMENT_FORM);
      setDocumentFormError(null);
    } catch (createDocumentError) {
      console.error("Ошибка при создании документа:", createDocumentError);
      setDocumentFormError(
        getFormErrorMessage(createDocumentError, "Не удалось создать документ. Попробуйте ещё раз.")
      );
    } finally {
      setIsCreatingDocument(false);
    }
  };

  const isFormValid = () => {
    if (!formData.date) return false;
    if (isTransferCode(formData.code) && !formData.partId.trim()) return false;
    return true;
  };

  const handleCreate = async () => {
    if (!isFormValid() || isSubmitting) return;

    setFormError(null);
    setIsSubmitting(true);

    try {
      await createMutation.mutateAsync(buildPayload(formData));
      handleCreateDialogChange(false);
    } catch (createError) {
      console.error("Ошибка при создании записи металлолома:", createError);
      setFormError(getFormErrorMessage(createError, "Не удалось создать запись. Попробуйте ещё раз."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingItem || !isFormValid() || isSubmitting) return;

    setFormError(null);
    setIsSubmitting(true);

    try {
      const payload: UpdateScrapmetalDTO = buildPayload(formData);
      await updateMutation.mutateAsync({ id: editingItem.id, data: payload });
      handleEditDialogChange(false);
    } catch (updateError) {
      console.error("Ошибка при обновлении записи металлолома:", updateError);
      setFormError(
        getFormErrorMessage(updateError, "Не удалось сохранить запись. Попробуйте ещё раз.")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Вы уверены, что хотите удалить эту запись металлолома?")) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const formatCell = (item: ScrapmetalDTO, key: string) => {
    switch (key) {
      case "partId":
        return resolvePartLabel(item.partId);
      case "weight":
        return Number.isFinite(item.weight) ? String(item.weight) : "—";
      case "date":
        return formatDate(item.date, "ru-RU", "—");
      case "code":
        return formatCodeLabel(item.code);
      case "note":
        return item.note || "—";
      case "documentId":
        return resolveDocumentLabel(item.documentId);
      case "updatedAt":
        return item.updatedAt ? formatDate(item.updatedAt, "ru-RU", "—") : "—";
      default:
        return "—";
    }
  };

  const handleExport = useCallback(
    async (type: "pdf" | "doc" | "xls") => {
      const columns = SCRAPMETAL_COLUMNS.filter((column) => visibleColumns.includes(column.key)).map(
        (column) => ({
          key: column.key,
          label: column.label,
          type: column.key === "date" || column.key === "updatedAt" ? ("date" as const) : ("string" as const),
        })
      );

      const data = filteredItems.map((item) => {
        const row: Record<string, string> = {
          partId: resolvePartLabel(item.partId),
          weight: Number.isFinite(item.weight) ? String(item.weight) : "—",
          date: formatDate(item.date, "ru-RU", "—"),
          code: formatCodeLabel(item.code),
          note: item.note || "—",
          documentId: resolveDocumentLabel(item.documentId),
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
              type === "pdf" ? "ScrapmetalPDF" : type === "doc" ? "ScrapmetalDOC" : "ScrapmetalXLS",
          },
          { responseType: "blob" }
        );

        const fileBaseName =
          type === "pdf" ? "ScrapmetalPDF" : type === "doc" ? "ScrapmetalDOC" : "ScrapmetalXLS";
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
    [filteredItems, visibleColumns, resolvePartLabel, resolveDocumentLabel]
  );

  const formFields = (
    <div className="space-y-4">
      <div>
        <Label htmlFor="code">Тип записи</Label>
        <Select value={formData.code} onValueChange={handleCodeChange}>
          <SelectTrigger id="code">
            <SelectValue placeholder="Выберите тип записи" />
          </SelectTrigger>
          <SelectContent>
            {CODE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="partId">
          Деталь
          {isTransferCode(formData.code) && <span className="text-red-500"> *</span>}
        </Label>
        <SearchableSelect
          value={formData.partId}
          onChange={handlePartChange}
          options={partOptions}
          placeholder={
            isFactCode(formData.code)
              ? "Недоступно для типа «Факт»"
              : "Выберите деталь"
          }
          searchPlaceholder="Введите серийный номер, клеймо или тип"
          isLoading={partsLoading}
          disabled={isFactCode(formData.code)}
        />
      </div>
      <div>
        <Label htmlFor="weight">Вес</Label>
        <Input
          id="weight"
          type="number"
          step="any"
          value={formData.weight}
          onChange={(e) => updateFormField("weight", e.target.value)}
          placeholder="Введите вес"
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
        <Label htmlFor="documentId">Документ</Label>
        <SearchableSelect
          value={formData.documentId}
          onChange={handleDocumentChange}
          options={documentOptions}
          placeholder="Выберите документ"
          searchPlaceholder="Введите номер или дату"
          isLoading={documentsLoading}
        />
      </div>
      <div>
        <Label htmlFor="note">Примечание</Label>
        <Textarea
          id="note"
          value={formData.note}
          onChange={(e) => updateFormField("note", e.target.value)}
          placeholder="Введите примечание"
          rows={3}
        />
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
          <p>Произошла ошибка при загрузке металлолома: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-3 max-lg:flex-col">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <Recycle className="h-8 w-8" />
          Металлолом
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Справочник металлолома
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
          <ScrapmetalFilter
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
          <Button variant="outline" onClick={() => setIsPartsPickerOpen(true)}>
            <ListChecks className="h-4 w-4 mr-2" />
            Выбрать из списка деталей
          </Button>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Добавить запись
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex gap-2 items-center">
            <CardTitle>
              {isFiltered ? "Результаты фильтрации" : "Список металлолома"}
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
                <Recycle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  {isFiltered
                    ? "По заданным фильтрам записи не найдены"
                    : "Нет данных для отображения"}
                </p>
              </div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    {SCRAPMETAL_COLUMNS.map(
                      (column) =>
                        isColumnVisible(column.key) && (
                          <TableHead key={column.key}>{column.label}</TableHead>
                        )
                    )}
                    <TableHead className="w-[1%] whitespace-nowrap text-right">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayItems.map((item) => (
                    <TableRow key={item.id}>
                      {SCRAPMETAL_COLUMNS.map(
                        (column) =>
                          isColumnVisible(column.key) && (
                            <TableCell
                              key={column.key}
                              className={column.key === "partId" ? "font-medium" : undefined}
                            >
                              {formatCell(item, column.key)}
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
                  ))}
                </TableBody>
              </Table>

              <div className="mt-4">
                <Pagination />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Отчет за период</CardTitle>
          <CardDescription>Выберите год и квартал для формирования отчета</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="report-year">Год</Label>
              <Select value={reportYear} onValueChange={setReportYear}>
                <SelectTrigger id="report-year" className="w-[140px]">
                  <SelectValue placeholder="Год" />
                </SelectTrigger>
                <SelectContent>
                  {REPORT_YEAR_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="report-quarter">Квартал</Label>
              <Select value={reportQuarter} onValueChange={setReportQuarter}>
                <SelectTrigger id="report-quarter" className="w-[180px]">
                  <SelectValue placeholder="Квартал" />
                </SelectTrigger>
                <SelectContent>
                  {QUARTER_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="button" onClick={handleBuildPeriodReport}>
              Отчет за период
            </Button>
          </div>
          {periodReport && <ScrapmetalPeriodReportTable report={periodReport} />}
        </CardContent>
      </Card>

      <ScrapmetalPartsPickerDialog
        open={isPartsPickerOpen}
        onOpenChange={setIsPartsPickerOpen}
        onAddSelected={handleAddSelectedParts}
        isSubmitting={isAddingFromPicker}
        defaultAuthor={formatUserAuthor(currentUser)}
        documents={documents}
        documentsLoading={documentsLoading}
      />

      <Dialog open={isCreateOpen} onOpenChange={handleCreateDialogChange}>
        <DialogContent className="w-[80vw] max-w-[80vw] sm:max-w-[80vw] max-h-[80vh] overflow-visible">
          <DialogHeader>
            <DialogTitle>Добавить запись металлолома</DialogTitle>
            <DialogDescription>
              Создайте новую запись в справочнике металлолома.
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
                  Создание...
                </>
              ) : (
                "Создать"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={handleEditDialogChange}>
        <DialogContent className="w-[80vw] max-w-[80vw] sm:max-w-[80vw] max-h-[80vh] overflow-visible">
          <DialogHeader>
            <DialogTitle>Редактировать запись металлолома</DialogTitle>
            <DialogDescription>
              Измените данные записи в справочнике металлолома.
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
                  Сохранение...
                </>
              ) : (
                "Сохранить"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateDocumentOpen} onOpenChange={handleCreateDocumentDialogChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Создать документ</DialogTitle>
            <DialogDescription>
              Новый документ для металлолома: «АКТ приемки металлолома» или «АКТ
              приемки-передачи металлолома».
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="document-number">
                Номер <span className="text-red-500">*</span>
              </Label>
              <Input
                id="document-number"
                value={documentFormData.number}
                onChange={(e) => updateDocumentFormField("number", e.target.value)}
                placeholder="Введите номер документа"
              />
            </div>
            <div>
              <Label htmlFor="document-type">Тип</Label>
              <Select
                value={String(documentFormData.type ?? DEFAULT_SCRAPMETAL_DOCUMENT_TYPE)}
                onValueChange={(value) => updateDocumentFormField("type", Number(value))}
              >
                <SelectTrigger id="document-type">
                  <SelectValue placeholder="Выберите тип" />
                </SelectTrigger>
                <SelectContent>
                  {SCRAPMETAL_DOCUMENT_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={String(option.value)}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="document-date">
                Дата <span className="text-red-500">*</span>
              </Label>
              <Input
                id="document-date"
                type="date"
                value={documentFormData.date}
                onChange={(e) => updateDocumentFormField("date", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="document-author">Автор</Label>
              <Input
                id="document-author"
                value={documentFormData.author ?? ""}
                onChange={(e) => updateDocumentFormField("author", e.target.value)}
                placeholder="Введите автора"
              />
            </div>
            <div>
              <Label htmlFor="document-note">Примечание</Label>
              <Input
                id="document-note"
                value={documentFormData.note ?? ""}
                onChange={(e) => updateDocumentFormField("note", e.target.value)}
                placeholder="Введите примечание"
              />
            </div>
            {documentFormError && <p className="text-sm text-red-600">{documentFormError}</p>}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => handleCreateDocumentDialogChange(false)}
              disabled={isCreatingDocument}
            >
              Отмена
            </Button>
            <Button
              onClick={handleCreateDocument}
              disabled={
                isCreatingDocument ||
                !documentFormData.number.trim() ||
                !documentFormData.date
              }
            >
              {isCreatingDocument ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Создание...
                </>
              ) : (
                "Создать"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
