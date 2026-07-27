"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  SearchableSelect,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui";
import { Loader2, Search, Settings } from "lucide-react";
import { useAllDocuments, useFilterAllParts, usePartStatuses, usePartTypes } from "@/hooks";
import { getDocumentTypeLabel } from "@/components/documents-filter";
import { formatDate } from "@/lib/formatDate";
import type { DocumentDTO, PartDTO } from "@/types/directories";

const WRITE_OFF_STATUS_NAME = "на списание";
const WRITE_OFF_DOCUMENT_TYPE = 4;
/** В справочнике для металлолома доступны типы 3 и 4 */
const WRITE_OFF_DOCUMENT_TYPES = [3, 4] as const;
const CREATE_NEW_DOCUMENT_VALUE = "__create_new_document__";

export type ScrapmetalWriteOffDocumentForm = {
  documentId: string | null;
  number: string;
  date: string;
  author: string;
};

const EMPTY_WRITE_OFF_DOCUMENT: ScrapmetalWriteOffDocumentForm = {
  documentId: null,
  number: "",
  date: "",
  author: "",
};

const formatDocumentOptionLabel = (document: DocumentDTO) => {
  const number = document.number?.trim() || "—";
  const date = formatDate(document.date, "ru-RU", "—");
  const author = document.author?.trim() || "—";
  return `${number} (${date}, ${author})`;
};

const formatYear = (yearData?: string | { year: number; month: number; day: number }) => {
  if (!yearData) return "—";
  if (typeof yearData === "string") {
    const yearMatch = yearData.match(/^(\d{4})/);
    return yearMatch ? yearMatch[1] : yearData;
  }
  return String(yearData.year);
};

const getLocationDisplay = (code?: number | null) => {
  switch (code) {
    case 1:
      return "Депо";
    case 2:
      return "Вагон-цистерна";
    case 0:
    default:
      return "Не установлена";
  }
};

const getWagonDepotDisplay = (part: PartDTO) => {
  if (part.code === 2 && part.currentLocation?.number) {
    return part.currentLocation.number;
  }

  if (part.code === 1 && part.depot) {
    const depotName = part.depot.shortName || part.depot.name;
    return depotName ? `${part.depot.code} (${depotName})` : part.depot.code;
  }

  return "—";
};

const getServiceLifeDisplay = (part: PartDTO) => {
  const flatPart = part as PartDTO & { serviceLifeYears?: number | null };
  const value = flatPart.serviceLifeYears;
  if (value == null || value === 0 || Number.isNaN(value)) return "—";
  return String(value);
};

const getWriteOffWeight = (
  part: PartDTO,
  weightByPartTypeId: Map<string, number>
) => {
  const fromDirectory =
    part.partType?.id != null ? weightByPartTypeId.get(part.partType.id) : undefined;
  if (fromDirectory != null && Number.isFinite(fromDirectory)) {
    return fromDirectory;
  }

  const fromPartType = part.partType?.weight;
  if (fromPartType != null && Number.isFinite(fromPartType)) {
    return Number(fromPartType);
  }

  return null;
};

const formatWriteOffWeight = (weight: number | null) =>
  weight == null ? "—" : String(weight);

const matchesSearch = (
  part: PartDTO,
  query: string,
  weightByPartTypeId: Map<string, number>
) => {
  if (!query.trim()) return true;
  const q = query.trim().toLowerCase();
  const haystack = [
    part.partType?.name,
    part.stampNumber?.value,
    part.serialNumber,
    formatYear(part.manufactureYear),
    getLocationDisplay(part.code),
    getWagonDepotDisplay(part),
    formatWriteOffWeight(getWriteOffWeight(part, weightByPartTypeId)),
    part.status?.name,
    part.notes,
    part.model,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(q);
};

const isWriteOffStatusName = (name?: string | null) => {
  if (!name) return false;
  const normalized = name.trim().toLowerCase().replace(/\s+/g, " ");
  return (
    normalized === WRITE_OFF_STATUS_NAME ||
    normalized.includes("списан") ||
    normalized.includes("снисан")
  );
};

interface ScrapmetalPartsPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddSelected: (
    parts: PartDTO[],
    document: ScrapmetalWriteOffDocumentForm
  ) => Promise<void> | void;
  isSubmitting?: boolean;
  defaultAuthor?: string;
  documents?: DocumentDTO[];
  documentsLoading?: boolean;
}

export function ScrapmetalPartsPickerDialog({
  open,
  onOpenChange,
  onAddSelected,
  isSubmitting = false,
  defaultAuthor = "",
  documents: documentsProp,
  documentsLoading: documentsLoadingProp,
}: ScrapmetalPartsPickerDialogProps) {
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [documentSelectValue, setDocumentSelectValue] = useState("");
  const [documentForm, setDocumentForm] =
    useState<ScrapmetalWriteOffDocumentForm>(EMPTY_WRITE_OFF_DOCUMENT);
  const [formError, setFormError] = useState<string | null>(null);
  const { data: partStatuses = [], isLoading: statusesLoading } = usePartStatuses();
  const { data: partTypes = [] } = usePartTypes();
  const documentsQuery = useAllDocuments();
  const documents = documentsProp ?? documentsQuery.data ?? [];
  const documentsLoading = documentsLoadingProp ?? documentsQuery.isLoading;
  const filterMutation = useFilterAllParts();

  const weightByPartTypeId = useMemo(() => {
    const map = new Map<string, number>();
    for (const partType of partTypes) {
      if (Number.isFinite(partType.weight)) {
        map.set(partType.id, Number(partType.weight));
      }
    }
    return map;
  }, [partTypes]);

  const writeOffStatusIds = useMemo(
    () => partStatuses.filter((status) => isWriteOffStatusName(status.name)).map((status) => status.id),
    [partStatuses]
  );

  const type4Documents = useMemo(
    () =>
      documents
        .filter((document) =>
          (WRITE_OFF_DOCUMENT_TYPES as readonly number[]).includes(Number(document.type))
        )
        .slice()
        .sort((a, b) => {
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          return (Number.isFinite(dateB) ? dateB : 0) - (Number.isFinite(dateA) ? dateA : 0);
        }),
    [documents]
  );

  const documentOptions = useMemo(
    () => [
      { value: CREATE_NEW_DOCUMENT_VALUE, label: "Создать новый документ" },
      ...type4Documents.map((document) => ({
        value: document.id,
        label: `${formatDocumentOptionLabel(document)} — ${getDocumentTypeLabel(document.type)}`,
      })),
    ],
    [type4Documents]
  );

  const isCreatingNewDocument = documentSelectValue === CREATE_NEW_DOCUMENT_VALUE;

  useEffect(() => {
    if (!open) {
      setSearch("");
      setSelectedIds(new Set());
      setDocumentSelectValue("");
      setDocumentForm(EMPTY_WRITE_OFF_DOCUMENT);
      setFormError(null);
      return;
    }

    setDocumentSelectValue("");
    setDocumentForm({
      documentId: null,
      number: "",
      date: new Date().toISOString().slice(0, 10),
      author: defaultAuthor,
    });
    setFormError(null);

    if (!writeOffStatusIds.length) return;

    filterMutation.mutate({
      filters: {
        statusIds: writeOffStatusIds,
      },
      sortFields: [],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refetch when dialog opens / status ids ready
  }, [open, writeOffStatusIds.join("|"), defaultAuthor]);

  const parts = useMemo(() => {
    const raw = filterMutation.data ?? [];
    return raw.filter((item): item is PartDTO => {
      return typeof item === "object" && item !== null && "partType" in item;
    });
  }, [filterMutation.data]);

  const filteredParts = useMemo(
    () => parts.filter((part) => matchesSearch(part, search, weightByPartTypeId)),
    [parts, search, weightByPartTypeId]
  );

  const filteredIds = useMemo(() => filteredParts.map((part) => part.id), [filteredParts]);
  const selectedCount = selectedIds.size;
  const allFilteredSelected =
    filteredIds.length > 0 && filteredIds.every((id) => selectedIds.has(id));
  const someFilteredSelected = filteredIds.some((id) => selectedIds.has(id));

  const isDocumentValid = isCreatingNewDocument
    ? Boolean(documentForm.number.trim() && documentForm.date)
    : Boolean(documentForm.documentId && documentForm.date);
  const canSubmit = selectedCount > 0 && isDocumentValid && !isSubmitting;

  const isLoading =
    statusesLoading ||
    (open && writeOffStatusIds.length > 0 && filterMutation.isPending && !filterMutation.data);

  const updateDocumentField = <K extends keyof ScrapmetalWriteOffDocumentForm>(
    key: K,
    value: ScrapmetalWriteOffDocumentForm[K]
  ) => {
    setDocumentForm((prev) => ({ ...prev, [key]: value }));
    setFormError(null);
  };

  const handleDocumentSelectChange = (value: string) => {
    setDocumentSelectValue(value);
    setFormError(null);

    if (value === CREATE_NEW_DOCUMENT_VALUE) {
      setDocumentForm({
        documentId: null,
        number: "",
        date: new Date().toISOString().slice(0, 10),
        author: defaultAuthor,
      });
      return;
    }

    if (!value) {
      setDocumentForm({
        documentId: null,
        number: "",
        date: new Date().toISOString().slice(0, 10),
        author: defaultAuthor,
      });
      return;
    }

    const selected = type4Documents.find((document) => document.id === value);
    setDocumentForm({
      documentId: value,
      number: selected?.number?.trim() || "",
      date: selected?.date?.slice(0, 10) || new Date().toISOString().slice(0, 10),
      author: selected?.author?.trim() || defaultAuthor,
    });
  };

  const togglePart = (partId: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(partId);
      else next.delete(partId);
      return next;
    });
  };

  const toggleAllFiltered = (checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const id of filteredIds) {
        if (checked) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  };

  const handleAddSelected = async () => {
    if (!canSubmit) {
      if (isCreatingNewDocument && (!documentForm.number.trim() || !documentForm.date)) {
        setFormError("Укажите номер и дату нового документа");
      } else if (!documentForm.documentId) {
        setFormError("Выберите документ из справочника или создайте новый");
      }
      return;
    }

    const selectedParts = parts.filter((part) => selectedIds.has(part.id));
    if (!selectedParts.length) return;

    await onAddSelected(selectedParts, {
      documentId: documentForm.documentId,
      number: documentForm.number.trim(),
      date: documentForm.date,
      author: documentForm.author.trim(),
    });
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (isSubmitting) return;
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex w-[90vw] max-w-[90vw] sm:max-w-[90vw] max-h-[90vh] flex-col overflow-visible">
        <DialogHeader>
          <DialogTitle>Выбор детали для металлолома</DialogTitle>
          <DialogDescription>
            Список деталей со статусом «На списание». Выберите документ из справочника или создайте
            новый (тип «{getDocumentTypeLabel(WRITE_OFF_DOCUMENT_TYPE)}»), затем отметьте детали.
          </DialogDescription>
        </DialogHeader>

        <div className="relative z-[60] grid gap-3 rounded-md border p-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>
              Документ <span className="text-red-500">*</span>
            </Label>
            <SearchableSelect
              value={documentSelectValue}
              onChange={handleDocumentSelectChange}
              options={documentOptions}
              placeholder="Выберите документ или создайте новый"
              searchPlaceholder="Поиск по номеру, дате, автору"
              isLoading={documentsLoading}
              disabled={isSubmitting}
            />
          </div>
          {isCreatingNewDocument && (
            <div className="space-y-1.5">
              <Label htmlFor="write-off-document-number">
                Номер документа <span className="text-red-500">*</span>
              </Label>
              <Input
                id="write-off-document-number"
                value={documentForm.number}
                onChange={(e) => updateDocumentField("number", e.target.value)}
                placeholder="Введите номер"
                disabled={isSubmitting}
              />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="write-off-document-date">
              Дата <span className="text-red-500">*</span>
            </Label>
            <Input
              id="write-off-document-date"
              type="date"
              value={documentForm.date}
              onChange={(e) => updateDocumentField("date", e.target.value)}
              disabled={isSubmitting || (!isCreatingNewDocument && !documentForm.documentId)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="write-off-document-author">Автор</Label>
            <Input
              id="write-off-document-author"
              value={documentForm.author}
              onChange={(e) => updateDocumentField("author", e.target.value)}
              placeholder="Введите автора"
              disabled={isSubmitting || (!isCreatingNewDocument && Boolean(documentForm.documentId))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Тип документа</Label>
            <Input value={getDocumentTypeLabel(WRITE_OFF_DOCUMENT_TYPE)} disabled readOnly />
          </div>
        </div>
        {formError && <p className="text-sm text-red-600">{formError}</p>}

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Быстрый поиск: номер, клеймо, тип, вес..."
            className="pl-9"
            disabled={isSubmitting}
          />
        </div>

        <div className="min-h-0 flex-1 overflow-auto rounded-md border">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : !writeOffStatusIds.length ? (
            <div className="flex items-center justify-center py-12 text-center">
              <div>
                <Settings className="mx-auto mb-3 h-10 w-10 text-gray-400" />
                <p className="text-sm text-muted-foreground">
                  Статус «На списание» не найден в справочнике статусов деталей
                </p>
              </div>
            </div>
          ) : !filteredParts.length ? (
            <div className="flex items-center justify-center py-12 text-center">
              <div>
                <Settings className="mx-auto mb-3 h-10 w-10 text-gray-400" />
                <p className="text-sm text-muted-foreground">
                  {search.trim()
                    ? "По запросу детали не найдены"
                    : "Нет деталей со статусом «На списание»"}
                </p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={
                        allFilteredSelected
                          ? true
                          : someFilteredSelected
                            ? "indeterminate"
                            : false
                      }
                      onCheckedChange={(checked) => toggleAllFiltered(checked === true)}
                      disabled={isSubmitting}
                      aria-label="Выбрать все"
                    />
                  </TableHead>
                  <TableHead>Тип детали</TableHead>
                  <TableHead>
                    Вес для
                    <br />
                    списания
                  </TableHead>
                  <TableHead>Клеймо</TableHead>
                  <TableHead>
                    Заводской
                    <br />
                    номер
                  </TableHead>
                  <TableHead>
                    Год
                    <br />
                    производства
                  </TableHead>
                  <TableHead>Местоположение</TableHead>
                  <TableHead>Вагон/Депо</TableHead>
                  <TableHead>
                    Срок
                    <br />
                    службы
                  </TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Примечания</TableHead>
                  <TableHead>Модель</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredParts.map((part) => {
                  const checked = selectedIds.has(part.id);
                  return (
                    <TableRow
                      key={part.id}
                      data-state={checked ? "selected" : undefined}
                      className="cursor-pointer"
                      onClick={() => togglePart(part.id, !checked)}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(value) => togglePart(part.id, value === true)}
                          disabled={isSubmitting}
                          aria-label={`Выбрать ${part.serialNumber || part.id}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{part.partType?.name ?? "—"}</TableCell>
                      <TableCell>
                        {formatWriteOffWeight(getWriteOffWeight(part, weightByPartTypeId))}
                      </TableCell>
                      <TableCell>{part.stampNumber?.value ?? "—"}</TableCell>
                      <TableCell>{part.serialNumber || "—"}</TableCell>
                      <TableCell>{formatYear(part.manufactureYear)}</TableCell>
                      <TableCell>{getLocationDisplay(part.code)}</TableCell>
                      <TableCell>{getWagonDepotDisplay(part)}</TableCell>
                      <TableCell>{getServiceLifeDisplay(part)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" style={{ borderColor: part.status?.color }}>
                          {part.status?.name ?? "—"}
                        </Badge>
                      </TableCell>
                      <TableCell>{part.notes || "—"}</TableCell>
                      <TableCell>{part.model || "—"}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>

        <DialogFooter className="flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-muted-foreground">
            Найдено: {filteredParts.length}
            {search.trim() ? ` из ${parts.length}` : ""}
            {selectedCount > 0 ? ` · Выбрано: ${selectedCount}` : ""}
          </div>
          <div className="flex w-full gap-2 sm:w-auto">
            <Button
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none"
            >
              Отмена
            </Button>
            <Button
              onClick={handleAddSelected}
              disabled={!canSubmit}
              className="flex-1 sm:flex-none"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Добавление...
                </>
              ) : (
                `Добавить выбранные${selectedCount > 0 ? ` (${selectedCount})` : ""}`
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
