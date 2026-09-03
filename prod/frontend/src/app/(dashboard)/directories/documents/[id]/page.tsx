"use client";

import { useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui";
import { ArrowLeft, Edit, FileText, Paperclip, Plus, Trash2 } from "lucide-react";
import { partEquipmentKeys, useDocument, usePartEquipmentsByDocument } from "@/hooks";
import { ViewFileButton } from "@/components/view-file-button";
import {
  PartEquipmentManualFormDialog,
  type PartEquipmentManualFormData,
  type PartEquipmentManualLockedField,
  type PartEquipmentManualPresets,
} from "@/components/part-equipment-manual-form-dialog";
import {
  DOCUMENT_TYPE_CISTERN_COMPLECTATION,
  getDocumentTypeLabel,
} from "@/components/documents-filter";
import { formatDate } from "@/lib/formatDate";
import type { DocumentDTO, PartEquipmentDTO } from "@/types/directories";

const DOCUMENT_FILE_DIRECTORY = "Documents";

const WHEEL_PAIR_CODE_LIST = [51, 52, 53, 54] as const;
const WHEEL_PAIR_CODES = new Set<number>(WHEEL_PAIR_CODE_LIST);
const TRUCK_PART_CODE_LIST = [61, 62, 71, 72, 73, 74] as const;
const TRUCK_PART_CODES = new Set<number>(TRUCK_PART_CODE_LIST);
const COUPLER_CODE_LIST = [41, 42, 81, 82, 91, 92] as const;
const REQUIRED_OPERATIONS = [1, 2] as const;

const ADD_LOCKED_FIELDS: PartEquipmentManualLockedField[] = [
  "documentId",
  "documentDate",
  "operation",
  "railwayCisternsId",
  "repairTypesId",
  "equipmentTypeId",
];

const EDIT_LOCKED_FIELDS: PartEquipmentManualLockedField[] = ["operation"];

const EMPTY_GUID = "00000000-0000-0000-0000-000000000000";

const isMeaningfulId = (value?: string | null) => {
  const trimmed = value?.trim();
  if (!trimmed) return false;
  return trimmed.toLowerCase() !== EMPTY_GUID;
};

const getMajorityString = (values: Array<string | null | undefined>) => {
  const counts = new Map<string, number>();
  for (const value of values) {
    const trimmed = value?.trim();
    if (!isMeaningfulId(trimmed)) continue;
    counts.set(trimmed!, (counts.get(trimmed!) ?? 0) + 1);
  }

  let winner = "";
  let maxCount = 0;
  for (const [value, count] of counts) {
    if (count > maxCount) {
      winner = value;
      maxCount = count;
    }
  }
  return winner;
};

const getItemRepairTypesId = (item: PartEquipmentDTO) => {
  const raw = item as PartEquipmentDTO & {
    RepairTypesId?: string | null;
    repairTypeId?: string | null;
    RepairTypeId?: string | null;
  };
  return (
    [raw.repairTypesId, raw.RepairTypesId, item.repairType?.id, raw.repairTypeId, raw.RepairTypeId].find(
      (value) => isMeaningfulId(value)
    )?.trim() || ""
  );
};

const toFormId = (value?: string | null) => (isMeaningfulId(value) ? value!.trim() : "");

const toFormDate = (value?: string | null) => {
  if (!value) return "";
  return value.slice(0, 10);
};

const toFormNote = (value?: string | null) => {
  if (value == null) return "";
  const trimmed = value.trim();
  if (!trimmed || trimmed.toLowerCase() === "null" || trimmed === "-") return "";
  return value;
};

const equipmentToPresets = (item: PartEquipmentDTO): PartEquipmentManualPresets => ({
  railwayCisternsId: toFormId(item.railwayCisternsId) || toFormId(item.railwayCistern?.id),
  operation: item.operation != null ? String(item.operation) : "2",
  equipmentTypeId: toFormId(item.equipmentTypeId) || toFormId(item.equipmentType?.id),
  defectsId: item.defectsId && item.defectsId !== "0" ? String(item.defectsId) : "",
  adminOwnerId: item.adminOwnerId ? String(item.adminOwnerId) : "",
  partsId: toFormId(item.partsId) || toFormId(item.part?.partId),
  jobDepotsId: toFormId(item.jobDepotsId) || toFormId(item.jobDepot?.id),
  jobDate: toFormDate(item.jobDate),
  jobTypeId: item.jobTypeId ?? "0",
  thicknessLeft: item.thicknessLeft != null ? String(item.thicknessLeft) : "0",
  thicknessRight: item.thicknessRight != null ? String(item.thicknessRight) : "0",
  truckType: item.truckType != null ? String(item.truckType) : "0",
  notes: toFormNote(item.notes),
  documentId: toFormId(item.documentId) || toFormId(item.document?.id),
  documentDate: toFormDate(item.documentDate) || toFormDate(item.document?.date),
  depotsId: toFormId(item.depotsId) || toFormId(item.depot?.id),
  repairTypesId: getItemRepairTypesId(item),
  equipmentTypeCode: item.equipmentType?.code,
});

const formatYear = (value?: string | number | null): string => {
  if (value == null || value === "" || value === 0 || value === "0") return "—";
  const raw = String(value).trim();
  if (/^\d{4}$/.test(raw)) return raw;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "—";
  const year = date.getFullYear();
  return Number.isNaN(year) ? "—" : String(year);
};

const OPERATION_BADGE_SIZE = "min-w-[5.75rem] justify-center";

const getOperationBadge = (operation: number) => {
  switch (operation) {
    case 1:
      return {
        text: "Снятие",
        variant: "destructive" as const,
        className: OPERATION_BADGE_SIZE,
      };
    case 2:
      return {
        text: "Установка",
        variant: "outline" as const,
        className: `${OPERATION_BADGE_SIZE} border-green-300 bg-green-100 text-green-800`,
      };
    default:
      return { text: "Неизвестно", variant: "secondary" as const, className: OPERATION_BADGE_SIZE };
  }
};

const getPartLabel = (item: PartEquipmentDTO) => {
  const stamp = item.part?.stampInfo?.value || "—";
  const serial = item.part?.serialNumber || "—";
  const year = formatYear(item.part?.manufactureYear);
  return `${stamp}; ${serial}; ${year}`;
};

const getEquipmentOptionLabels = (
  item: PartEquipmentDTO
): Partial<Record<keyof PartEquipmentManualFormData, string>> => {
  const equipmentType = item.equipmentType;
  const document = item.document;
  const repairType = item.repairType;
  return {
    partsId: getPartLabel(item),
    railwayCisternsId: item.railwayCistern?.number,
    equipmentTypeId: equipmentType ? `${equipmentType.code} (${equipmentType.name})` : undefined,
    jobDepotsId: item.jobDepot
      ? `${item.jobDepot.code} (${item.jobDepot.shortName || item.jobDepot.name})`
      : undefined,
    depotsId: item.depot
      ? `${item.depot.code} (${item.depot.shortName || item.depot.name})`
      : undefined,
    repairTypesId: repairType ? `${repairType.name} (${repairType.code})` : undefined,
    documentId: document
      ? `${document.number} (${document.author || "—"}, ${formatDate(document.date, "ru-RU", "—")})`
      : undefined,
  };
};

const formatDepot = (depot?: PartEquipmentDTO["jobDepot"] | PartEquipmentDTO["depot"]) => {
  if (!depot) return "—";
  return depot.shortName || depot.name || "—";
};

const formatJobTypeId = (value?: string | null) => {
  if (!value || value === "0" || value.toLowerCase() === "null") return "—";
  return value;
};

const formatPreviousWork = (item: PartEquipmentDTO) => {
  const place = formatDepot(item.jobDepot);
  const date = formatDate(item.jobDate, "ru-RU", "—");
  const code = formatJobTypeId(item.jobTypeId);
  if (place === "—" && date === "—" && code === "—") return "—";
  return `${place} (${date}, ${code})`;
};

const formatNote = (value?: unknown) => {
  if (value == null) return "—";
  const text = String(value).trim();
  if (!text || text.toLowerCase() === "null" || text === "-" || text === "—") return "—";
  return text;
};

const formatThickness = (item: PartEquipmentDTO) => {
  const left = item.thicknessLeft;
  const right = item.thicknessRight;
  if ((left == null || left === 0) && (right == null || right === 0)) return "—";
  return `${left ?? "—"} / ${right ?? "—"}`;
};

const getDocumentFileValue = (documentItem: DocumentDTO) => {
  const raw = documentItem as DocumentDTO & {
    File?: string | null;
    fileName?: string | null;
    FileName?: string | null;
  };
  const value = raw.file || raw.File || raw.fileName || raw.FileName || null;
  if (!value || value.trim().toLowerCase() === "null") return null;
  return value;
};

const getEquipmentTypeCode = (item: PartEquipmentDTO) => item.equipmentType?.code;

const getOperationSortOrder = (operation: number) => {
  if (operation === 1) return 0;
  if (operation === 2) return 1;
  return 2;
};

const compareSectionItems = (a: PartEquipmentDTO, b: PartEquipmentDTO) => {
  const operationCompare = getOperationSortOrder(a.operation) - getOperationSortOrder(b.operation);
  if (operationCompare !== 0) return operationCompare;

  const codeA = getEquipmentTypeCode(a) ?? Number.POSITIVE_INFINITY;
  const codeB = getEquipmentTypeCode(b) ?? Number.POSITIVE_INFINITY;
  if (codeA !== codeB) return codeA - codeB;

  return (a.railwayCistern?.number || "").localeCompare(b.railwayCistern?.number || "", "ru", {
    numeric: true,
  });
};

type EquipmentSectionRow = {
  key: string;
  item: PartEquipmentDTO | null;
  operation: number;
  code: number;
  equipmentType?: PartEquipmentDTO["equipmentType"];
  isMissing: boolean;
  isHighlighted: boolean;
};

function buildSectionRows(
  items: PartEquipmentDTO[],
  requiredCodes?: readonly number[]
): EquipmentSectionRow[] {
  if (!requiredCodes?.length) {
    return items.map((item) => ({
      key: item.id,
      item,
      operation: item.operation,
      code: getEquipmentTypeCode(item) ?? 0,
      equipmentType: item.equipmentType,
      isMissing: false,
      isHighlighted: false,
    }));
  }

  const typeByCode = new Map<number, PartEquipmentDTO["equipmentType"]>();
  for (const item of items) {
    const code = getEquipmentTypeCode(item);
    if (code != null && item.equipmentType && !typeByCode.has(code)) {
      typeByCode.set(code, item.equipmentType);
    }
  }

  const usedIds = new Set<string>();
  const rows: EquipmentSectionRow[] = [];

  for (const operation of REQUIRED_OPERATIONS) {
    for (const code of requiredCodes) {
      const matches = items.filter(
        (item) => item.operation === operation && getEquipmentTypeCode(item) === code
      );

      if (matches.length > 0) {
        const isDuplicate = matches.length > 1;
        for (const item of matches) {
          usedIds.add(item.id);
          rows.push({
            key: item.id,
            item,
            operation,
            code,
            equipmentType: item.equipmentType,
            isMissing: false,
            isHighlighted: isDuplicate,
          });
        }
        continue;
      }

      rows.push({
        key: `missing-${operation}-${code}`,
        item: null,
        operation,
        code,
        equipmentType: typeByCode.get(code) ?? {
          id: "",
          name: "",
          code,
          partTypeId: "",
          partTypeName: "",
        },
        isMissing: true,
        isHighlighted: true,
      });
    }
  }

  for (const item of items) {
    if (usedIds.has(item.id)) continue;
    rows.push({
      key: item.id,
      item,
      operation: item.operation,
      code: getEquipmentTypeCode(item) ?? 0,
      equipmentType: item.equipmentType,
      isMissing: false,
      isHighlighted: false,
    });
  }

  return rows;
}

function EquipmentSectionTable({
  items,
  emptyText,
  showTruckType = false,
  showThickness = false,
  requiredCodes,
  onAdd,
  onEdit,
}: {
  items: PartEquipmentDTO[];
  emptyText: string;
  showTruckType?: boolean;
  showThickness?: boolean;
  requiredCodes?: readonly number[];
  onAdd?: (row: EquipmentSectionRow) => void;
  onEdit?: (item: PartEquipmentDTO) => void;
}) {
  const rows = buildSectionRows(items, requiredCodes);

  if (!rows.length) {
    return <div className="py-8 text-center text-muted-foreground">{emptyText}</div>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Операция</TableHead>
          <TableHead>Тип оборудования</TableHead>
          <TableHead>
            Деталь
            <br />
            (клеймо; зав. номер; год)
          </TableHead>
          {showThickness && <TableHead>Толщина обода<br />(Л/П)</TableHead>}
          {showTruckType && (
            <TableHead>
              Код вида
              <br />
              тележки
            </TableHead>
          )}
          <TableHead>Предыдущие работы</TableHead>
          <TableHead>Вид ремонта</TableHead>
          <TableHead>Вагон</TableHead>
          <TableHead className="whitespace-normal">Примечание</TableHead>
          <TableHead className="w-[1%] whitespace-nowrap text-right">Действия</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => {
          const operation = getOperationBadge(row.operation);
          const item = row.item;

          return (
            <TableRow
              key={row.key}
              className={row.isHighlighted ? "bg-red-100 hover:bg-red-100" : undefined}
            >
              <TableCell>
                <Badge variant={operation.variant} className={operation.className}>
                  {operation.text}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="font-medium">{row.equipmentType?.name || "—"}</div>
                <div className="text-xs text-muted-foreground">Код: {row.code || "—"}</div>
              </TableCell>
              <TableCell>{item ? getPartLabel(item) : "—"}</TableCell>
              {showThickness && <TableCell>{item ? formatThickness(item) : "—"}</TableCell>}
              {showTruckType && (
                <TableCell>{item?.truckType ? item.truckType : "—"}</TableCell>
              )}
              <TableCell>{item ? formatPreviousWork(item) : "—"}</TableCell>
              <TableCell>{item?.repairType?.name || "—"}</TableCell>
              <TableCell>
                {item ? (
                  <>
                    <div className="font-medium">{item.railwayCistern?.number || "—"}</div>
                    {item.railwayCistern?.model ? (
                      <div className="text-xs text-muted-foreground">{item.railwayCistern.model}</div>
                    ) : null}
                  </>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell className="max-w-[16rem] whitespace-normal break-words">
                {item ? formatNote(item.notes) : "—"}
              </TableCell>
              <TableCell className="w-[1%] whitespace-nowrap">
                <div className="flex w-max justify-end gap-2">
                  {row.isMissing ? (
                    <Button
                      variant="outline"
                      size="sm"
                      title="Добавить"
                      onClick={() => onAdd?.(row)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        title="Редактировать"
                        onClick={() => item && onEdit?.(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" title="Удалить">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

export default function DocumentViewPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const documentId = params.id as string;
  const returnPage = searchParams.get("returnPage");
  const returnPageSize = searchParams.get("returnPageSize");

  const documentsListParams = new URLSearchParams();
  if (returnPage) documentsListParams.set("page", returnPage);
  if (returnPageSize) documentsListParams.set("pageSize", returnPageSize);
  const documentsListHref = documentsListParams.size
    ? `/directories/documents?${documentsListParams.toString()}`
    : "/directories/documents";

  const { data: documentItem, isLoading: isLoadingDocument, error: documentError } =
    useDocument(documentId);
  const {
    data: equipments = [],
    isLoading: isLoadingEquipments,
    error: equipmentsError,
  } = usePartEquipmentsByDocument(documentId);

  const documentInfo = documentItem ?? equipments[0]?.document;
  const isLoading = isLoadingDocument || isLoadingEquipments;
  const error = documentError || equipmentsError;

  const groupedEquipments = useMemo(() => {
    const wheels: PartEquipmentDTO[] = [];
    const trucks: PartEquipmentDTO[] = [];
    const couplers: PartEquipmentDTO[] = [];

    for (const item of equipments) {
      const code = getEquipmentTypeCode(item);
      if (code != null && WHEEL_PAIR_CODES.has(code)) {
        wheels.push(item);
      } else if (code != null && TRUCK_PART_CODES.has(code)) {
        trucks.push(item);
      } else {
        couplers.push(item);
      }
    }

    wheels.sort(compareSectionItems);
    trucks.sort(compareSectionItems);
    couplers.sort(compareSectionItems);

    return { wheels, trucks, couplers };
  }, [equipments]);

  const majorityCisternId = useMemo(
    () =>
      getMajorityString(
        equipments.map((item) =>
          isMeaningfulId(item.railwayCisternsId) ? item.railwayCisternsId : item.railwayCistern?.id
        )
      ),
    [equipments]
  );
  const majorityRepairTypeId = useMemo(
    () => getMajorityString(equipments.map((item) => getItemRepairTypesId(item))),
    [equipments]
  );

  const [formOpen, setFormOpen] = useState(false);
  const [formPresets, setFormPresets] = useState<PartEquipmentManualPresets>({});
  const [editingItem, setEditingItem] = useState<PartEquipmentDTO | null>(null);

  const handleAddRow = (row: EquipmentSectionRow) => {
    const document = documentItem ?? equipments[0]?.document;
    setEditingItem(null);
    setFormPresets({
      documentId: document?.id ?? documentId,
      documentDate: document?.date?.slice(0, 10) ?? "",
      operation: String(row.operation),
      railwayCisternsId: majorityCisternId,
      repairTypesId: majorityRepairTypeId,
      equipmentTypeId: row.equipmentType?.id || "",
      equipmentTypeCode: row.code || undefined,
    });
    setFormOpen(true);
  };

  const handleEditRow = (item: PartEquipmentDTO) => {
    setEditingItem(item);
    setFormPresets(equipmentToPresets(item));
    setFormOpen(true);
  };

  const handleFormOpenChange = (open: boolean) => {
    setFormOpen(open);
    if (!open) setEditingItem(null);
  };

  const handleFormSuccess = () => {
    queryClient.invalidateQueries({ queryKey: partEquipmentKeys.byDocument(documentId) });
    queryClient.invalidateQueries({ queryKey: partEquipmentKeys.all });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-32 w-full" />
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !documentInfo) {
    return (
      <div className="space-y-8">
        <Link href={documentsListHref}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Назад к списку
          </Button>
        </Link>
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Ошибка</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              {error
                ? `Не удалось загрузить документ: ${
                    error instanceof Error ? error.message : "Неизвестная ошибка"
                  }`
                : "Документ не найден"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const fileValue = getDocumentFileValue(documentInfo);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={documentsListHref}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Назад к списку
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <FileText className="h-8 w-8" />
          {getDocumentTypeLabel(documentInfo.type)}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Основные сведения о выбранном документе</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2 lg:grid-cols-4">
            <div>
              <span className="text-muted-foreground">Номер</span>
              <p className="font-medium text-green-600">{documentInfo.number || "—"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Тип</span>
              <p className="font-medium">{getDocumentTypeLabel(documentInfo.type)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Дата</span>
              <p className="font-medium">{formatDate(documentInfo.date, "ru-RU", "—")}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Автор</span>
              <p className="font-medium">{documentInfo.author || "—"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Файл</span>
              {fileValue ? (
                <div className="mt-1">
                  <ViewFileButton
                    value={fileValue}
                    directory={DOCUMENT_FILE_DIRECTORY}
                    icon={Paperclip}
                    label="Посмотреть"
                    title="Посмотреть файл"
                  />
                </div>
              ) : (
                <p className="font-medium">—</p>
              )}
            </div>
            <div className="lg:col-span-3">
              <span className="text-muted-foreground">Примечание</span>
              <p className="font-medium">{formatNote(documentInfo.note)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {documentInfo.type === DOCUMENT_TYPE_CISTERN_COMPLECTATION && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Колесные пары</CardTitle>
              <CardDescription>
                {groupedEquipments.wheels.length
                  ? `Записей: ${groupedEquipments.wheels.length}`
                  : "Нет записей по колесным парам"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EquipmentSectionTable
                items={groupedEquipments.wheels}
                emptyText="Нет данных по колесным парам"
                showThickness
                requiredCodes={WHEEL_PAIR_CODE_LIST}
                onAdd={handleAddRow}
                onEdit={handleEditRow}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Детали тележек</CardTitle>
              <CardDescription>
                {groupedEquipments.trucks.length
                  ? `Записей: ${groupedEquipments.trucks.length}`
                  : "Нет записей по деталям тележек"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EquipmentSectionTable
                items={groupedEquipments.trucks}
                emptyText="Нет данных по деталям тележек"
                showTruckType
                requiredCodes={TRUCK_PART_CODE_LIST}
                onAdd={handleAddRow}
                onEdit={handleEditRow}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Автосцепное оборудование</CardTitle>
              <CardDescription>
                {groupedEquipments.couplers.length
                  ? `Записей: ${groupedEquipments.couplers.length}`
                  : "Нет записей по автосцепному оборудованию"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EquipmentSectionTable
                items={groupedEquipments.couplers}
                emptyText="Нет данных по автосцепному оборудованию"
                requiredCodes={COUPLER_CODE_LIST}
                onAdd={handleAddRow}
                onEdit={handleEditRow}
              />
            </CardContent>
          </Card>
        </>
      )}

      <PartEquipmentManualFormDialog
        open={formOpen}
        onOpenChange={handleFormOpenChange}
        presets={formPresets}
        lockedFields={editingItem ? EDIT_LOCKED_FIELDS : ADD_LOCKED_FIELDS}
        equipmentId={editingItem?.id}
        optionLabels={editingItem ? getEquipmentOptionLabels(editingItem) : undefined}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}
