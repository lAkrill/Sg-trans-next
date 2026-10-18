"use client";

import { useMemo, useRef, useState, type ChangeEvent } from "react";
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui";
import { AlertTriangle, ArrowLeft, Edit, FileText, Loader2, Paperclip, Plus, Trash2, Upload } from "lucide-react";
import { documentsKeys, partEquipmentKeys, useDocument, usePartEquipmentsByDocument } from "@/hooks";
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
import type { DepotDTO, DocumentDTO, PartDTO, PartEquipmentDTO, RepairTypeDTO } from "@/types/directories";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  importFilesApi,
  type ImportFileProcessDetail,
  type ImportFileProcessResponse,
} from "@/api/import-files";
import { documentsApi, partEquipmentApi } from "@/api/directories";
import { filesApi } from "@/api/files";
import { v4 as uuidv4 } from "uuid";
import { cisternsApi } from "@/api/cisterns";
import { api } from "@/lib/api";

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

const isPdfFile = (file: File) =>
  file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

const isTxtFile = (file: File) =>
  file.type === "text/plain" || file.name.toLowerCase().endsWith(".txt");

const getPdfImportErrorMessage = (err: unknown) => {
  if (!err || typeof err !== "object" || !("response" in err)) {
    return "Не удалось обработать файл";
  }

  const data = (
    err as {
      response?: {
        data?: {
          message?: string;
          Message?: string;
          details?: string;
          Details?: string;
        };
      };
    }
  ).response?.data;

  return data?.message || data?.Message || data?.details || data?.Details || "Не удалось обработать файл";
};

const PDF_DOCUMENT_MISMATCH_MESSAGE =
  "Загруженный документ не соответствует дате и номеру вагона-цистерны.";

const toComparableDate = (value?: string | null) => {
  const trimmed = value?.trim();
  if (!trimmed) return "";

  const dotted = trimmed.match(/^(\d{2})\.(\d{2})\.(\d{4})/);
  if (dotted) return `${dotted[3]}-${dotted[2]}-${dotted[1]}`;

  const iso = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  return "";
};

const pdfResultMatchesDocument = (
  result: ImportFileProcessResponse,
  documentDate: string | undefined,
  wagonNumber: string
) => {
  const expectedDate = toComparableDate(documentDate);
  const details = result.details ?? [];
  if (!expectedDate || details.length === 0) return false;

  return details.every((detail) => {
    const dateMatches = toComparableDate(detail.DocumetnDate) === expectedDate;
    const responseWagonNumber = detail.RailwayCisternsId?.trim() ?? "";
    const wagonMatches = !wagonNumber || responseWagonNumber === wagonNumber;
    return dateMatches && wagonMatches;
  });
};

type EquipmentTypeOption = {
  id: string;
  name?: string;
  code: number;
  partTypeId: string;
  partTypeName?: string;
};

const PDF_SECTION_CODES = [WHEEL_PAIR_CODE_LIST, TRUCK_PART_CODE_LIST, COUPLER_CODE_LIST] as const;

const isWheelPairTypeName = (name?: string) => {
  if (!name) return false;
  const value = name.toLowerCase();
  return value.includes("колес") || value.includes("wheel");
};

const isBolsterTypeName = (name?: string) => {
  if (!name) return false;
  const value = name.toLowerCase();
  return value.includes("надрессор") || value.includes("надрисор") || value.includes("bolster");
};

const unwrapQuotedId = (value?: string | null) => value?.trim().replace(/^'+|'+$/g, "") ?? "";

const nullableText = (value?: string | null) => {
  const trimmed = value?.trim() ?? "";
  return trimmed && trimmed !== "0" ? trimmed : null;
};

const toNumberOrZero = (value?: string | null) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const partManufactureYear = (value?: PartDTO["manufactureYear"]) => {
  if (!value) return "";
  if (typeof value === "string") return value.match(/^\d{4}/)?.[0] ?? "";
  return String(value.year);
};

const samePartCode = (left?: string | null, right?: string | null) => {
  const normalize = (value?: string | null) => value?.trim().replace(/^0+(?=\d)/, "") ?? "";
  const a = left?.trim() ?? "";
  const b = right?.trim() ?? "";
  if (!a || !b) return false;
  return a === b || normalize(a) === normalize(b);
};

const findPdfWheelDetail = (
  details: ImportFileProcessDetail[],
  used: Set<number>,
  code: number,
  operation: number
) =>
  details.findIndex((detail, index) => {
    if (used.has(index)) return false;
    return Number(detail.EquipmentTypeId) === code && Number(detail.Operation) === operation;
  });

const formatPostError = (err: unknown) => {
  if (!err || typeof err !== "object" || !("response" in err)) {
    return err instanceof Error ? err.message : "Запрос не выполнен";
  }

  const response = (err as { response?: { status?: number; data?: unknown } }).response;
  const body = response?.data;
  const text =
    body == null ? "" : typeof body === "string" ? body : JSON.stringify(body, null, 2);
  return [response?.status ? `HTTP ${response.status}` : "", text].filter(Boolean).join("\n") || "Запрос не выполнен";
};

const findMatchingPart = (parts: PartDTO[], detail: ImportFileProcessDetail) =>
  parts.find(
    (part) =>
      samePartCode(part.serialNumber, detail.Part_number) &&
      samePartCode(part.stampNumber?.value, detail.Part_stamp) &&
      partManufactureYear(part.manufactureYear) === (detail.Part_year?.trim() ?? "")
  );

const insertMissingEquipments = async ({
  equipments,
  details,
  documentId,
  documentDate,
  fallbackCisternId,
  fallbackRepairTypeId,
}: {
  equipments: PartEquipmentDTO[];
  details: ImportFileProcessDetail[];
  documentId: string;
  documentDate: string;
  fallbackCisternId: string;
  fallbackRepairTypeId: string;
}) => {
  const missingRows = PDF_SECTION_CODES.flatMap((codes) => {
    const codeSet = new Set<number>(codes);
    const items = equipments.filter((item) => {
      const code = getEquipmentTypeCode(item);
      return code != null && codeSet.has(code);
    });
    return buildSectionRows(items, codes).filter((row) => row.isMissing);
  });
  if (!missingRows.length) return { inserted: 0, skipped: 0, failures: [] };

  const [equipmentTypes, depots, repairTypes, cisterns] = await Promise.all([
    api.get<EquipmentTypeOption[]>("/api/equipment-types/all").then((response) => response.data),
    api.get<DepotDTO[]>("/api/depots/all").then((response) => response.data),
    api.get<RepairTypeDTO[]>("/api/repair-types/all").then((response) => response.data),
    cisternsApi.getAllIdAndNumbers(),
  ]);

  const partsByType = new Map<string, PartDTO[]>();
  const usedDetails = new Set<number>();
  const failures: Array<{ key: string; message: string }> = [];
  let inserted = 0;
  let skipped = 0;

  const skipRow = (row: EquipmentSectionRow, message: string) => {
    skipped += 1;
    failures.push({ key: row.key, message });
  };

  for (const row of missingRows) {
    const detailIndex = findPdfWheelDetail(details, usedDetails, row.code, row.operation);
    if (detailIndex < 0) {
      skipRow(row, "В ответе PDF нет строки с этим кодом и операцией");
      continue;
    }
    usedDetails.add(detailIndex);
    const detail = details[detailIndex];
    const equipmentType = equipmentTypes.find((item) => item.code === row.code);
    if (!equipmentType?.partTypeId) {
      skipRow(row, "Не найден тип оборудования");
      continue;
    }

    let parts = partsByType.get(equipmentType.partTypeId);
    if (!parts) {
      const response = await api.get<PartDTO[]>("/api/parts/all", {
        params: { typeId: equipmentType.partTypeId },
      });
      parts = Array.isArray(response.data) ? response.data : [];
      partsByType.set(equipmentType.partTypeId, parts);
    }

    const part = findMatchingPart(parts, detail);
    if (!part) {
      skipRow(row, "Деталь не найдена в справочнике");
      continue;
    }

    const wagonNumber = detail.RailwayCisternsId?.trim() ?? "";
    const railwayCisternsId =
      cisterns.find((cistern) => cistern.number === wagonNumber)?.id || fallbackCisternId || null;
    if (row.operation === 2 && !railwayCisternsId) {
      skipRow(row, "Не найден вагон для установки");
      continue;
    }

    const repairTypeValue = detail.RepairTypesId?.trim() ?? "";
    const repairTypeKey = repairTypeValue.toLowerCase();
    const repairTypesId =
      repairTypes.find((item) => item.id.trim().toLowerCase() === unwrapQuotedId(repairTypeValue).toLowerCase())
        ?.id ||
      repairTypes.find((item) =>
        [item.name, item.shortName, item.portalName, item.code].some(
          (value) => value?.trim().toLowerCase() === repairTypeKey
        )
      )?.id ||
      fallbackRepairTypeId ||
      "";
    if (!repairTypesId) {
      skipRow(row, "Не найден вид ремонта");
      continue;
    }
    const notes = detail.Notes?.trim() || null;
    const typeNames = [equipmentType.name, equipmentType.partTypeName];
    const isWheelPair = typeNames.some(isWheelPairTypeName);
    const isBolster = typeNames.some(isBolsterTypeName);
    const jobDepot = depots.find((depot) => String(depot.code) === (detail.JobDepotsId?.trim() ?? ""));
    const isInstallation = row.operation === 2;

    try {
      await partEquipmentApi.create({
      railwayCisternsId: railwayCisternsId || null,
      operation: row.operation,
      equipmentTypeId: equipmentType.id,
      defectsId: isInstallation ? null : nullableText(detail.DefectsId) ?? "0",
      adminOwnerId: nullableText(detail.AdminOwnerId),
      partsId: part.id,
      jobDepotsId: jobDepot?.id ?? null,
      jobDate: detail.JobDate?.trim() || null,
      jobTypeId: nullableText(detail.JobTypeId),
      thicknessLeft: isWheelPair ? toNumberOrZero(detail.ThicknessLeft) : 0,
      thicknessRight: isWheelPair ? toNumberOrZero(detail.ThicknessRight) : 0,
      truckType: isBolster ? toNumberOrZero(detail.TruckType) : 0,
      notes,
      documentId,
      documentDate: documentDate || null,
      depotsId: isInstallation ? null : unwrapQuotedId(detail.DepotsId) || null,
      repairTypesId,
    });
      inserted += 1;
    } catch (err: unknown) {
      skipRow(row, formatPostError(err));
    }
  }

  return { inserted, skipped, failures };
};

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
  const date = item.jobDate ? item.jobDate : "—";
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
  rowErrors,
}: {
  items: PartEquipmentDTO[];
  emptyText: string;
  showTruckType?: boolean;
  showThickness?: boolean;
  requiredCodes?: readonly number[];
  onAdd?: (row: EquipmentSectionRow) => void;
  onEdit?: (item: PartEquipmentDTO) => void;
  rowErrors?: Record<string, string>;
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
                <div className="flex w-max items-center justify-end gap-2">
                  {rowErrors?.[row.key] ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex">
                          <AlertTriangle className="h-5 w-5 fill-yellow-400 text-yellow-600" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-sm whitespace-pre-wrap text-left">
                        {rowErrors[row.key]}
                      </TooltipContent>
                    </Tooltip>
                  ) : null}
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

  const wagonNumbers = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of equipments) {
      const number = item.railwayCistern?.number?.trim();
      if (!number) continue;
      counts.set(number, (counts.get(number) ?? 0) + 1);
    }

    return [...counts.entries()]
      .sort((left, right) => right[1] - left[1])
      .map(([number]) => number);
  }, [equipments]);
  const trainNumber = wagonNumbers[0] ?? "";

  const [formOpen, setFormOpen] = useState(false);
  const [formPresets, setFormPresets] = useState<PartEquipmentManualPresets>({});
  const [editingItem, setEditingItem] = useState<PartEquipmentDTO | null>(null);
  const [processingKind, setProcessingKind] = useState<"pdf" | "txt" | null>(null);
  const [pdfImportError, setPdfImportError] = useState<string | null>(null);
  const [pdfImportResult, setPdfImportResult] = useState<ImportFileProcessResponse | null>(null);
  const [pdfFillNote, setPdfFillNote] = useState<string | null>(null);
  const [pdfRowErrors, setPdfRowErrors] = useState<Record<string, string>>({});
  const [pdfMismatchOpen, setPdfMismatchOpen] = useState(false);
  const pdfFileInputRef = useRef<HTMLInputElement>(null);
  const txtFileInputRef = useRef<HTMLInputElement>(null);

  const processComplectationFile = async (
    file: File,
    fileType: "pdf2json" | "txt2json"
  ) => {
    setPdfImportError(null);
    setPdfImportResult(null);
    setPdfFillNote(null);
    setPdfRowErrors({});
    setProcessingKind(fileType === "txt2json" ? "txt" : "pdf");

    try {
      const result = await importFilesApi.processImportFile(file, fileType);
      if (result.status && result.status !== "success") {
        setPdfImportError(result.message || "Не удалось обработать файл");
        return;
      }

      const currentDocument = documentItem ?? equipments[0]?.document;
      if (!pdfResultMatchesDocument(result, currentDocument?.date, trainNumber)) {
        setPdfMismatchOpen(true);
        return;
      }

      const fill = await insertMissingEquipments({
        equipments,
        details: result.details ?? [],
        documentId: currentDocument?.id ?? documentId,
        documentDate: currentDocument?.date?.slice(0, 10) ?? "",
        fallbackCisternId: majorityCisternId,
        fallbackRepairTypeId: majorityRepairTypeId,
      });
      setPdfRowErrors(Object.fromEntries(fill.failures.map((failure) => [failure.key, failure.message])));
      if (fill.inserted > 0) {
        queryClient.invalidateQueries({ queryKey: partEquipmentKeys.byDocument(documentId) });
        queryClient.invalidateQueries({ queryKey: partEquipmentKeys.all });
      }

      let fileNote = "";
      if (fill.inserted > 0 && currentDocument && !getDocumentFileValue(currentDocument)) {
        try {
          const extension = file.name.includes(".")
            ? file.name.slice(file.name.lastIndexOf(".")).toLowerCase()
            : fileType === "txt2json"
              ? ".txt"
              : ".pdf";
          const uniqueFileName = `${uuidv4()}${extension}`;
          const uploaded = await filesApi.upload(file, {
            directory: DOCUMENT_FILE_DIRECTORY,
            fileName: uniqueFileName,
          });
          await documentsApi.update(currentDocument.id, {
            number: currentDocument.number,
            type: currentDocument.type,
            date: currentDocument.date.slice(0, 10),
            author: currentDocument.author || null,
            price: currentDocument.price ?? null,
            note: currentDocument.note || null,
            file: `${DOCUMENT_FILE_DIRECTORY}/${uploaded.fileName}`,
          });
          queryClient.invalidateQueries({ queryKey: documentsKeys.byId(documentId) });
          fileNote = " Файл прикреплён к документу.";
        } catch (attachError: unknown) {
          fileNote = ` Файл не удалось прикрепить: ${getPdfImportErrorMessage(attachError)}`;
        }
      }

      setPdfFillNote(
        fill.inserted || fill.skipped
          ? `Добавлено: ${fill.inserted}${
              fill.skipped ? `, не удалось добавить: ${fill.skipped}` : ""
            }.${fileNote}`
          : null
      );
      setPdfImportResult(result);
    } catch (err: unknown) {
      setPdfImportError(getPdfImportErrorMessage(err));
    } finally {
      setProcessingKind(null);
    }
  };

  const handleComplectationFileChange =
    (fileType: "pdf2json" | "txt2json") => async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file) return;

      const isValid = fileType === "txt2json" ? isTxtFile(file) : isPdfFile(file);
      if (!isValid) {
        setPdfImportResult(null);
        setPdfImportError(fileType === "txt2json" ? "Выберите файл TXT" : "Выберите файл PDF");
        return;
      }

      await processComplectationFile(file, fileType);
    };

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

      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <FileText className="h-8 w-8" />
            {getDocumentTypeLabel(documentInfo.type)}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={pdfFileInputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={handleComplectationFileChange("pdf2json")}
            />
            <input
              ref={txtFileInputRef}
              type="file"
              accept="text/plain,.txt"
              className="hidden"
              onChange={handleComplectationFileChange("txt2json")}
            />
            <Button
              type="button"
              variant="outline"
              disabled={processingKind !== null}
              onClick={() => pdfFileInputRef.current?.click()}
            >
              {processingKind === "pdf" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Обработка...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Загрузить комплектацию из PDF
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={processingKind !== null}
              onClick={() => txtFileInputRef.current?.click()}
            >
              {processingKind === "txt" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Обработка...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Загрузить комплектацию из TXT (4634)
                </>
              )}
            </Button>
          </div>
        </div>
        {pdfImportError ? (
          <p className="text-sm text-red-600 dark:text-red-400">{pdfImportError}</p>
        ) : pdfImportResult ? (
          <p className="text-sm text-green-600 dark:text-green-400">
            {pdfImportResult.message || "Файл успешно обработан"}
            {pdfImportResult.statistics
              ? `. Обработано ${pdfImportResult.statistics.success} из ${pdfImportResult.statistics.total_processed}`
              : ""}
            {pdfFillNote ? ` ${pdfFillNote}` : ""}
          </p>
        ) : null}
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
            <div className="lg:col-span-2">
              <span className="text-muted-foreground">Примечание</span>
              <p className="font-medium">{formatNote(documentInfo.note)}</p>
            </div>
            <div >
              <span className="text-muted-foreground">Номера вагонов</span>
              <p className="font-medium">{trainNumber ? wagonNumbers.join(", ") : "—"}</p>
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
                rowErrors={pdfRowErrors}
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
                rowErrors={pdfRowErrors}
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
                rowErrors={pdfRowErrors}
                onAdd={handleAddRow}
                onEdit={handleEditRow}
              />
            </CardContent>
          </Card>
        </>
      )}

      <Dialog open={pdfMismatchOpen} onOpenChange={setPdfMismatchOpen}>
        <DialogContent showCloseButton={false} className="sm:max-w-md">
          <DialogHeader className="text-center sm:text-center">
            <DialogTitle className="flex justify-center">
              <AlertTriangle className="h-14 w-14 fill-yellow-400 text-yellow-600" aria-hidden />
              <span className="sr-only">Предупреждение</span>
            </DialogTitle>
            <DialogDescription className="text-center text-base text-foreground">
              {PDF_DOCUMENT_MISMATCH_MESSAGE}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <Button type="button" onClick={() => setPdfMismatchOpen(false)}>
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
