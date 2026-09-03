"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Alert,
  AlertDescription,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  ScrollArea,
  SearchableSelect,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@/components/ui";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { partEquipmentApi } from "@/api/directories";
import { useCisternIdAndNumbers } from "@/hooks";
import type { DepotDTO, PartDTO, RepairTypeDTO } from "@/types/directories";

const EMPTY_GUID = "00000000-0000-0000-0000-000000000000";

const isMeaningfulId = (value?: string | null) => {
  const trimmed = value?.trim();
  if (!trimmed) return false;
  return trimmed.toLowerCase() !== EMPTY_GUID;
};

const withSelectedOption = (
  options: Array<{ value: string; label: string }>,
  value?: string,
  label?: string
) => {
  if (!isMeaningfulId(value)) return options;
  const selected = value!.trim();
  const selectedKey = selected.toLowerCase();
  const matchIndex = options.findIndex((option) => option.value.trim().toLowerCase() === selectedKey);
  if (matchIndex >= 0) {
    return options.map((option, index) =>
      index === matchIndex ? { ...option, value: selected } : option
    );
  }
  return [{ value: selected, label: label || selected }, ...options];
};

export type PartEquipmentManualFormData = {
  railwayCisternsId: string;
  operation: string;
  equipmentTypeId: string;
  defectsId: string;
  adminOwnerId: string;
  partsId: string;
  jobDepotsId: string;
  jobDate: string;
  jobTypeId: string;
  thicknessLeft: string;
  thicknessRight: string;
  truckType: string;
  notes: string;
  documentId: string;
  documentDate: string;
  depotsId: string;
  repairTypesId: string;
};

export type PartEquipmentManualLockedField = keyof PartEquipmentManualFormData;

export interface PartEquipmentManualPresets extends Partial<PartEquipmentManualFormData> {
  equipmentTypeCode?: number;
}

type EquipmentTypeOptionDTO = {
  id: string;
  name: string;
  code: number;
  partTypeId: string;
  partTypeName: string;
};

type DefectOptionDTO = {
  id: number;
  name: string;
  shortName: string;
  cause: string;
};

type AdminOwnerOptionDTO = {
  id: number;
  name: string;
};

type DocumentOptionDTO = {
  id: string;
  number: string;
  type: number;
  date: string;
  author: string;
  price: number | null;
  note: string | null;
};

type RequestStatus = {
  type: "loading" | "success" | "error";
  message: string;
};

const EMPTY_FORM: PartEquipmentManualFormData = {
  railwayCisternsId: "",
  operation: "2",
  equipmentTypeId: "",
  defectsId: "",
  adminOwnerId: "",
  partsId: "",
  jobDepotsId: "",
  jobDate: "",
  jobTypeId: "0",
  thicknessLeft: "0",
  thicknessRight: "0",
  truckType: "0",
  notes: "",
  documentId: "",
  documentDate: "",
  depotsId: "",
  repairTypesId: "",
};

const EXTRA_FIELDS: Array<{
  name: keyof PartEquipmentManualFormData;
  label: string;
  type?: string;
}> = [
  { name: "jobDate", label: "Дата работы" },
  { name: "jobTypeId", label: "Код вида работ" },
  { name: "thicknessLeft", label: "Толщина слева", type: "number" },
  { name: "thicknessRight", label: "Толщина справа", type: "number" },
  { name: "truckType", label: "Тип тележки", type: "number" },
  { name: "documentDate", label: "Дата документа", type: "date" },
];

const formatPartManufactureYear = (
  manufactureYear?: string | { year: number; month: number; day: number }
) => {
  if (!manufactureYear) return "—";
  if (typeof manufactureYear === "string") {
    return manufactureYear.match(/^\d{4}/)?.[0] || manufactureYear;
  }
  return String(manufactureYear.year);
};

const isBolsterPartType = (partTypeName?: string) => {
  if (!partTypeName) return false;
  const name = partTypeName.toLowerCase();
  return name.includes("надрессор") || name.includes("надрисор") || name.includes("bolster");
};

const isWheelPairPartType = (partTypeName?: string) => {
  if (!partTypeName) return false;
  const name = partTypeName.toLowerCase();
  return name.includes("колес") || name.includes("wheel");
};

const formatRussianDate = (date?: string) => {
  if (!date) return "—";
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return date;
  return parsedDate.toLocaleDateString("ru-RU");
};

const getUploadErrorMessage = (err: unknown) => {
  if (!err || typeof err !== "object" || !("response" in err)) return null;
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
  return data?.message || data?.Message || data?.details || data?.Details || null;
};

const applyPresets = (
  presets?: PartEquipmentManualPresets
): PartEquipmentManualFormData => ({
  ...EMPTY_FORM,
  railwayCisternsId: presets?.railwayCisternsId ?? EMPTY_FORM.railwayCisternsId,
  operation: presets?.operation ?? EMPTY_FORM.operation,
  equipmentTypeId: presets?.equipmentTypeId ?? EMPTY_FORM.equipmentTypeId,
  defectsId: presets?.defectsId ?? EMPTY_FORM.defectsId,
  adminOwnerId: presets?.adminOwnerId ?? EMPTY_FORM.adminOwnerId,
  partsId: presets?.partsId ?? EMPTY_FORM.partsId,
  jobDepotsId: presets?.jobDepotsId ?? EMPTY_FORM.jobDepotsId,
  jobDate: presets?.jobDate ?? EMPTY_FORM.jobDate,
  jobTypeId: presets?.jobTypeId ?? EMPTY_FORM.jobTypeId,
  thicknessLeft: presets?.thicknessLeft ?? EMPTY_FORM.thicknessLeft,
  thicknessRight: presets?.thicknessRight ?? EMPTY_FORM.thicknessRight,
  truckType: presets?.truckType ?? EMPTY_FORM.truckType,
  notes: presets?.notes ?? EMPTY_FORM.notes,
  documentId: presets?.documentId ?? EMPTY_FORM.documentId,
  documentDate: presets?.documentDate ?? EMPTY_FORM.documentDate,
  depotsId: presets?.depotsId ?? EMPTY_FORM.depotsId,
  repairTypesId: presets?.repairTypesId ?? EMPTY_FORM.repairTypesId,
});

interface PartEquipmentManualFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  presets?: PartEquipmentManualPresets;
  lockedFields?: PartEquipmentManualLockedField[];
  equipmentId?: string;
  optionLabels?: Partial<Record<keyof PartEquipmentManualFormData, string>>;
  onSuccess?: () => void;
}

export function PartEquipmentManualFormDialog({
  open,
  onOpenChange,
  presets,
  lockedFields = [],
  equipmentId,
  optionLabels,
  onSuccess,
}: PartEquipmentManualFormDialogProps) {
  const isEdit = Boolean(equipmentId);
  const [form, setForm] = useState<PartEquipmentManualFormData>(EMPTY_FORM);
  const [status, setStatus] = useState<RequestStatus | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const locked = useMemo(() => new Set(lockedFields), [lockedFields]);
  const isLocked = (field: PartEquipmentManualLockedField) => locked.has(field);

  useEffect(() => {
    if (!open) return;
    setForm(applyPresets(presets));
    setStatus(null);
  }, [open, presets]);

  const { data: cisternIdAndNumbers, isLoading: cisternsLoading } = useCisternIdAndNumbers();
  const { data: depots, isLoading: depotsLoading } = useQuery<DepotDTO[]>({
    queryKey: ["manual-parts-import", "depots"],
    queryFn: async () => {
      const response = await api.get<DepotDTO[]>("/api/depots/all");
      return response.data;
    },
    enabled: open,
  });
  const { data: equipmentTypes, isLoading: equipmentTypesLoading } = useQuery<
    EquipmentTypeOptionDTO[]
  >({
    queryKey: ["manual-parts-import", "equipment-types"],
    queryFn: async () => {
      const response = await api.get<EquipmentTypeOptionDTO[]>("/api/equipment-types/all");
      return response.data;
    },
    enabled: open,
  });
  const { data: defects, isLoading: defectsLoading } = useQuery<DefectOptionDTO[]>({
    queryKey: ["manual-parts-import", "defects"],
    queryFn: async () => {
      const response = await api.get<DefectOptionDTO[]>("/api/defects/all");
      return response.data;
    },
    enabled: open,
  });
  const { data: repairTypes, isLoading: repairTypesLoading } = useQuery<RepairTypeDTO[]>({
    queryKey: ["manual-parts-import", "repair-types"],
    queryFn: async () => {
      const response = await api.get<RepairTypeDTO[]>("/api/repair-types/all");
      return response.data;
    },
    enabled: open,
  });
  const { data: adminOwners, isLoading: adminOwnersLoading } = useQuery<AdminOwnerOptionDTO[]>({
    queryKey: ["manual-parts-import", "admin-owner"],
    queryFn: async () => {
      const response = await api.get<AdminOwnerOptionDTO[]>("/api/admin-owner/all");
      return response.data;
    },
    enabled: open,
  });
  const { data: documentsResponse, isLoading: documentsLoading } = useQuery<DocumentOptionDTO[]>({
    queryKey: ["manual-parts-import", "documents"],
    queryFn: async () => {
      const response = await api.get<DocumentOptionDTO[]>("/api/documents/all");
      return response.data;
    },
    enabled: open,
  });

  useEffect(() => {
    if (!open || !equipmentTypes?.length) return;
    if (form.equipmentTypeId) return;
    if (presets?.equipmentTypeCode == null) return;
    const found = equipmentTypes.find((item) => item.code === presets.equipmentTypeCode);
    if (found) {
      setForm((current) => ({ ...current, equipmentTypeId: found.id }));
    }
  }, [open, equipmentTypes, form.equipmentTypeId, presets?.equipmentTypeCode]);

  const selectedPartTypeId = equipmentTypes?.find(
    (equipmentType) => equipmentType.id === form.equipmentTypeId
  )?.partTypeId;
  const { data: parts, isLoading: partsLoading } = useQuery<PartDTO[]>({
    queryKey: ["manual-parts-import", "parts", selectedPartTypeId ?? null],
    queryFn: async () => {
      const response = await api.get<PartDTO[]>("/api/parts/all", {
        params: { typeId: selectedPartTypeId },
      });
      return Array.isArray(response.data) ? response.data : [];
    },
    enabled: open && !!selectedPartTypeId,
  });

  const cisternOptions = withSelectedOption(
    cisternIdAndNumbers?.map((cistern) => ({
      value: cistern.id,
      label: cistern.number,
    })) || [],
    form.railwayCisternsId,
    optionLabels?.railwayCisternsId
  );
  const depotOptions =
    depots?.map((depot) => ({
      value: depot.id,
      label: `${depot.code} (${depot.shortName || depot.name})`,
    })) || [];
  const jobDepotOptions = withSelectedOption(depotOptions, form.jobDepotsId, optionLabels?.jobDepotsId);
  const currentDepotOptions = withSelectedOption(depotOptions, form.depotsId, optionLabels?.depotsId);
  const equipmentTypeOptions = withSelectedOption(
    equipmentTypes?.map((equipmentType) => ({
      value: equipmentType.id,
      label: `${equipmentType.code} (${equipmentType.name})`,
    })) || [],
    form.equipmentTypeId,
    optionLabels?.equipmentTypeId
  );
  const defectOptions = withSelectedOption(
    defects?.map((defect) => ({
      value: String(defect.id),
      label: `${defect.id} (${defect.shortName || defect.name})`,
    })) || [],
    form.defectsId,
    optionLabels?.defectsId
  );
  const repairTypeOptions = withSelectedOption(
    repairTypes?.map((repairType) => ({
      value: repairType.id,
      label: `${repairType.name} (${repairType.code})`,
    })) || [],
    form.repairTypesId,
    optionLabels?.repairTypesId
  );
  const adminOwnerOptions = withSelectedOption(
    adminOwners?.map((owner) => ({
      value: String(owner.id),
      label: `${owner.id} (${owner.name})`,
    })) || [],
    form.adminOwnerId,
    optionLabels?.adminOwnerId
  );
  const documentOptions = withSelectedOption(
    (documentsResponse || [])
      .filter((document) => document.type === 1)
      .map((document) => ({
        value: document.id,
        label: `${document.number} (${document.author}, ${formatRussianDate(document.date)})`,
      })),
    form.documentId,
    optionLabels?.documentId
  );
  const partOptions = withSelectedOption(
    parts?.map((part) => ({
      value: part.id,
      label: `${part.serialNumber || "—"} (${part.stampNumber?.value || "—"}; ${formatPartManufactureYear(
        part.manufactureYear
      )})`,
    })) || [],
    form.partsId,
    optionLabels?.partsId
  );

  const selectedEquipmentType = equipmentTypes?.find(
    (equipmentType) => equipmentType.id === form.equipmentTypeId
  );
  const selectedPart = parts?.find((part) => part.id === form.partsId);
  const selectedTypeNames = [
    selectedEquipmentType?.name,
    selectedEquipmentType?.partTypeName,
    selectedPart?.partType?.name,
  ];
  const isBolsterSelected = selectedTypeNames.some(isBolsterPartType);
  const isWheelPairSelected = selectedTypeNames.some(isWheelPairPartType);
  const visibleExtraFields = EXTRA_FIELDS.filter((field) => {
    if (field.name === "truckType") return isBolsterSelected;
    if (field.name === "thicknessLeft" || field.name === "thicknessRight") {
      return isWheelPairSelected;
    }
    return true;
  });

  const updateField = (field: PartEquipmentManualLockedField, value: string) => {
    if (isLocked(field)) return;
    setStatus(null);
    setForm((current) => {
      const nextForm = {
        ...current,
        [field]: value,
        ...(field === "operation" && value !== "2" ? { railwayCisternsId: current.railwayCisternsId } : {}),
        ...(field === "operation" && value === "2" ? { defectsId: "", depotsId: "" } : {}),
        ...(field === "equipmentTypeId" ? { partsId: "" } : {}),
      };

      if (field === "equipmentTypeId" || field === "partsId") {
        const equipmentType =
          field === "equipmentTypeId"
            ? equipmentTypes?.find((item) => item.id === value)
            : equipmentTypes?.find((item) => item.id === nextForm.equipmentTypeId);
        const part =
          field === "partsId"
            ? parts?.find((item) => item.id === value)
            : parts?.find((item) => item.id === nextForm.partsId);
        const typeNames = [equipmentType?.name, equipmentType?.partTypeName, part?.partType?.name];
        if (!typeNames.some(isBolsterPartType)) nextForm.truckType = "0";
        if (!typeNames.some(isWheelPairPartType)) {
          nextForm.thicknessLeft = "0";
          nextForm.thicknessRight = "0";
        }
      }

      return nextForm;
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);

    if (form.operation === "2" && !form.railwayCisternsId) {
      setStatus({ type: "error", message: "Выберите номер вагона для установки детали" });
      return;
    }
    if (!form.equipmentTypeId) {
      setStatus({ type: "error", message: "Выберите тип оборудования" });
      return;
    }
    if (!form.partsId) {
      setStatus({ type: "error", message: "Выберите деталь" });
      return;
    }

    if (isWheelPairSelected) {
      const validateThickness = (value: string, label: string) => {
        const trimmed = value.trim();
        if (trimmed === "" || trimmed === "0") return null;
        const parsed = Number(trimmed);
        if (Number.isNaN(parsed)) return `${label}: введите число`;
        if (parsed <= 100) return `${label}: значение должно быть больше 100`;
        return null;
      };
      const thicknessError =
        validateThickness(form.thicknessLeft, "Толщина слева") ||
        validateThickness(form.thicknessRight, "Толщина справа");
      if (thicknessError) {
        setStatus({ type: "error", message: thicknessError });
        return;
      }
    }

    setIsSubmitting(true);
    setStatus({
      type: "loading",
      message: isEdit
        ? "Отправляем запрос на обновление комплектации..."
        : "Отправляем запрос на сохранение комплектации...",
    });

    const toNullableString = (value: string) => {
      const trimmed = value.trim();
      return trimmed === "" ? null : trimmed;
    };
    const toNullableNumber = (value: string) => {
      const trimmed = value.trim();
      if (trimmed === "") return null;
      const parsed = Number(trimmed);
      return Number.isNaN(parsed) ? null : parsed;
    };
    const toNullableDefectsId = (value: string) => {
      const trimmed = value.trim();
      if (trimmed === "" || trimmed === "0") return null;
      return trimmed;
    };

    const payload = {
      railwayCisternsId:
        isEdit || form.operation === "2" ? toNullableString(form.railwayCisternsId) : null,
      operation: toNullableNumber(form.operation),
      equipmentTypeId: toNullableString(form.equipmentTypeId),
      defectsId: form.operation === "2" ? null : toNullableDefectsId(form.defectsId),
      adminOwnerId: toNullableString(form.adminOwnerId),
      partsId: toNullableString(form.partsId),
      jobDepotsId: toNullableString(form.jobDepotsId),
      jobDate: toNullableString(form.jobDate),
      jobTypeId: toNullableString(form.jobTypeId),
      thicknessLeft: isWheelPairSelected ? toNullableNumber(form.thicknessLeft) : 0,
      thicknessRight: isWheelPairSelected ? toNullableNumber(form.thicknessRight) : 0,
      truckType: isBolsterSelected ? toNullableNumber(form.truckType) : 0,
      notes: toNullableString(form.notes),
      documentId: toNullableString(form.documentId),
      documentDate: toNullableString(form.documentDate),
      depotsId: form.operation === "2" ? null : toNullableString(form.depotsId),
      repairTypesId: toNullableString(form.repairTypesId),
    };

    try {
      if (isEdit && equipmentId) {
        await partEquipmentApi.update(equipmentId, payload);
        setStatus({ type: "success", message: "Комплектация успешно обновлена" });
      } else {
        await partEquipmentApi.create(payload);
        setStatus({ type: "success", message: "Комплектация успешно сохранена" });
      }
      onSuccess?.();
      onOpenChange(false);
    } catch (err: unknown) {
      setStatus({
        type: "error",
        message:
          getUploadErrorMessage(err) ||
          (isEdit ? "Ошибка при обновлении комплектации" : "Ошибка при сохранении комплектации"),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (isSubmitting) return;
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="!flex min-h-[500px] max-h-[85vh] flex-col sm:max-w-5xl">
        <DialogHeader className="shrink-0 text-left">
          <DialogTitle>{isEdit ? "Редактирование комплектации" : "Добавление комплектации"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Измените данные по комплектации вагона-цистерны."
              : "Заполните данные по комплектации вагона-цистерны."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col space-y-4">
          <ScrollArea className="max-h-[58vh] pr-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="equipmentTypeId">Тип оборудования</Label>
                <SearchableSelect
                  value={form.equipmentTypeId}
                  onChange={(value) => updateField("equipmentTypeId", value)}
                  options={equipmentTypeOptions}
                  placeholder="Выберите тип оборудования"
                  searchPlaceholder="Введите код или название"
                  isLoading={equipmentTypesLoading}
                  disabled={isLocked("equipmentTypeId")}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="operation">Операция</Label>
                  <Select
                    value={form.operation}
                    onValueChange={(value) => updateField("operation", value)}
                    disabled={isLocked("operation")}
                  >
                    <SelectTrigger id="operation" className="w-full">
                      <SelectValue placeholder="Выберите операцию" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">Установка</SelectItem>
                      <SelectItem value="1">Снятие</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="partsId">Деталь</Label>
                  <SearchableSelect
                    value={form.partsId}
                    onChange={(value) => updateField("partsId", value)}
                    options={partOptions}
                    placeholder="Выберите деталь"
                    searchPlaceholder="Введите заводской номер, клеймо или год"
                    isLoading={partsLoading}
                  />
                </div>
                {form.operation !== "2" && (
                  <div className="space-y-2">
                    <Label htmlFor="defectsId">Дефект</Label>
                    <SearchableSelect
                      value={form.defectsId}
                      onChange={(value) => updateField("defectsId", value)}
                      options={defectOptions}
                      placeholder="Выберите дефект"
                      searchPlaceholder="Введите код или название"
                      isLoading={defectsLoading}
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="adminOwnerId">Владелец</Label>
                  <SearchableSelect
                    value={form.adminOwnerId}
                    onChange={(value) => updateField("adminOwnerId", value)}
                    options={adminOwnerOptions}
                    placeholder="Выберите владельца"
                    searchPlaceholder="Введите код или название"
                    isLoading={adminOwnersLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="railwayCisternsId">Номер вагона</Label>
                  <SearchableSelect
                    value={form.railwayCisternsId}
                    onChange={(value) => updateField("railwayCisternsId", value)}
                    options={cisternOptions}
                    placeholder="Выберите номер вагона"
                    searchPlaceholder="Введите номер вагона"
                    isLoading={cisternsLoading}
                    disabled={isLocked("railwayCisternsId")}
                  />
                </div>
                {form.operation !== "2" && (
                  <div className="space-y-2">
                    <Label htmlFor="depotsId">Депо</Label>
                    <SearchableSelect
                      value={form.depotsId}
                      onChange={(value) => updateField("depotsId", value)}
                      options={currentDepotOptions}
                      placeholder="Выберите депо"
                      searchPlaceholder="Введите код депо"
                      isLoading={depotsLoading}
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="jobDepotsId">Депо работ</Label>
                  <SearchableSelect
                    value={form.jobDepotsId}
                    onChange={(value) => updateField("jobDepotsId", value)}
                    options={jobDepotOptions}
                    placeholder="Выберите депо работ"
                    searchPlaceholder="Введите код депо"
                    isLoading={depotsLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="repairTypesId">Вид ремонта</Label>
                  <SearchableSelect
                    value={form.repairTypesId}
                    onChange={(value) => updateField("repairTypesId", value)}
                    options={repairTypeOptions}
                    placeholder="Выберите вид ремонта"
                    searchPlaceholder="Введите название или код"
                    isLoading={repairTypesLoading}
                    disabled={isLocked("repairTypesId")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="documentId">Документ</Label>
                  <SearchableSelect
                    value={form.documentId}
                    onChange={(value) => updateField("documentId", value)}
                    options={documentOptions}
                    placeholder="Выберите документ"
                    searchPlaceholder="Введите номер, автора или дату"
                    isLoading={documentsLoading}
                    disabled={isLocked("documentId")}
                  />
                </div>
                {visibleExtraFields.map((field) => (
                  <div key={field.name} className="space-y-2">
                    <Label htmlFor={field.name}>{field.label}</Label>
                    <Input
                      id={field.name}
                      type={field.type || "text"}
                      step={field.type === "number" ? "0.01" : undefined}
                      value={form[field.name]}
                      disabled={isLocked(field.name)}
                      onChange={(event) => updateField(field.name, event.target.value)}
                    />
                  </div>
                ))}
                <div className="space-y-2 sm:col-span-2 lg:col-span-3">
                  <Label htmlFor="notes">Примечания</Label>
                  <Textarea
                    id="notes"
                    value={form.notes}
                    onChange={(event) => updateField("notes", event.target.value)}
                    placeholder="Введите примечания"
                  />
                </div>
              </div>
            </div>
          </ScrollArea>

          {status ? (
            <Alert
              variant={status.type === "error" ? "destructive" : "default"}
              className={
                status.type === "success"
                  ? "border-green-200 text-green-700 dark:border-green-900 dark:text-green-400"
                  : undefined
              }
            >
              {status.type === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              <AlertDescription>{status.message}</AlertDescription>
            </Alert>
          ) : null}

          <DialogFooter className="shrink-0 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={isSubmitting}>
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
        </form>
      </DialogContent>
    </Dialog>
  );
}
