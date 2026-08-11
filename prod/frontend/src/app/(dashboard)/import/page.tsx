"use client";

import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Alert,
  AlertDescription,
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
import { Import, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { importFilesApi, type ImportFileProcessResponse } from "@/api/import-files";
import { useCisternIdAndNumbers } from "@/hooks";
import type { DepotDTO, PartDTO, RepairTypeDTO } from "@/types/directories";

const REPAIRS_FILE_URL = "http://vagon.sgtrans.by:5000/api/RepairsFiles/process-repairs-file";

type ManualPartsImportFormData = {
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

type ManualPartsImportRequestStatus = {
  type: "loading" | "success" | "error";
  message: string;
};

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

const manualPartsImportInitialValues: ManualPartsImportFormData = {
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

const manualPartsImportFields: Array<{
  name: keyof ManualPartsImportFormData;
  label: string;
  type?: string;
  required?: boolean;
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
  return (
    name.includes("надрессор") ||
    name.includes("надрисор") ||
    name.includes("bolster")
  );
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

export default function ImportPage() {
  const repairsFileInputRef = useRef<HTMLInputElement>(null);
  const partsPdfFileInputRef = useRef<HTMLInputElement>(null);
  const partsTxtFileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingType, setUploadingType] = useState<
    "repairs" | "parts" | "manual-parts" | null
  >(null);
  const [repairsError, setRepairsError] = useState<string | null>(null);
  const [repairsSuccess, setRepairsSuccess] = useState(false);
  const [partsError, setPartsError] = useState<string | null>(null);
  const [partsSuccess, setPartsSuccess] = useState(false);
  const [partsImportResult, setPartsImportResult] =
    useState<ImportFileProcessResponse | null>(null);
  const [manualPartsImport, setManualPartsImport] = useState(false);
  const [manualPartsImportForm, setManualPartsImportForm] =
    useState<ManualPartsImportFormData>(manualPartsImportInitialValues);
  const [manualPartsImportStatus, setManualPartsImportStatus] =
    useState<ManualPartsImportRequestStatus | null>(null);
  const { data: cisternIdAndNumbers, isLoading: cisternsLoading } = useCisternIdAndNumbers();
  const { data: depots, isLoading: depotsLoading } = useQuery<DepotDTO[]>({
    queryKey: ["manual-parts-import", "depots"],
    queryFn: async () => {
      const response = await api.get<DepotDTO[]>("/api/depots/all");
      return response.data;
    },
  });
  const { data: equipmentTypes, isLoading: equipmentTypesLoading } = useQuery<
    EquipmentTypeOptionDTO[]
  >({
    queryKey: ["manual-parts-import", "equipment-types"],
    queryFn: async () => {
      const response = await api.get<EquipmentTypeOptionDTO[]>("/api/equipment-types/all");
      return response.data;
    },
  });
  const { data: defects, isLoading: defectsLoading } = useQuery<DefectOptionDTO[]>({
    queryKey: ["manual-parts-import", "defects"],
    queryFn: async () => {
      const response = await api.get<DefectOptionDTO[]>("/api/defects/all");
      return response.data;
    },
  });
  const { data: repairTypes, isLoading: repairTypesLoading } = useQuery<RepairTypeDTO[]>({
    queryKey: ["manual-parts-import", "repair-types"],
    queryFn: async () => {
      const response = await api.get<RepairTypeDTO[]>("/api/repair-types/all");
      return response.data;
    },
  });
  const { data: adminOwners, isLoading: adminOwnersLoading } = useQuery<AdminOwnerOptionDTO[]>({
    queryKey: ["manual-parts-import", "admin-owner"],
    queryFn: async () => {
      const response = await api.get<AdminOwnerOptionDTO[]>("/api/admin-owner/all");
      return response.data;
    },
  });
  const { data: documentsResponse, isLoading: documentsLoading } = useQuery<DocumentOptionDTO[]>({
    queryKey: ["manual-parts-import", "documents"],
    queryFn: async () => {
      const response = await api.get<DocumentOptionDTO[]>("/api/documents/all");
      return response.data;
    },
  });
  const selectedPartTypeId = equipmentTypes?.find(
    (equipmentType) => equipmentType.id === manualPartsImportForm.equipmentTypeId
  )?.partTypeId;
  const { data: parts, isLoading: partsLoading } = useQuery<PartDTO[]>({
    queryKey: ["manual-parts-import", "parts", selectedPartTypeId ?? null],
    queryFn: async () => {
      const response = await api.get<PartDTO[]>("/api/parts/all", {
        params: { typeId: selectedPartTypeId },
      });
      return Array.isArray(response.data) ? response.data : [];
    },
    enabled: !!selectedPartTypeId,
  });
  const cisternOptions =
    cisternIdAndNumbers?.map((cistern) => ({
      value: cistern.id,
      label: cistern.number,
    })) || [];
  const depotOptions =
    depots?.map((depot) => ({
      value: depot.id,
      label: `${depot.code} (${depot.shortName || depot.name})`,
    })) || [];
  const equipmentTypeOptions =
    equipmentTypes?.map((equipmentType) => ({
      value: equipmentType.id,
      label: `${equipmentType.code} (${equipmentType.name})`,
    })) || [];
  const defectOptions =
    defects?.map((defect) => ({
      value: String(defect.id),
      label: `${defect.id} (${defect.shortName || defect.name})`,
    })) || [];
  const repairTypeOptions =
    repairTypes?.map((repairType) => ({
      value: repairType.id,
      label: `${repairType.name} (${repairType.code})`,
    })) || [];
  const adminOwnerOptions =
    adminOwners?.map((owner) => ({
      value: String(owner.id),
      label: `${owner.id} (${owner.name})`,
    })) || [];
  const documents = documentsResponse || [];
  const documentOptions = documents
    .filter((document) => document.type === 1)
    .map((document) => ({
      value: document.id,
      label: `${document.number} (${document.author}, ${formatRussianDate(document.date)})`,
    }));
  const partOptions =
    parts?.map((part) => ({
      value: part.id,
      label: `${part.serialNumber || "—"} (${part.stampNumber?.value || "—"}; ${formatPartManufactureYear(
        part.manufactureYear
      )})`,
    })) || [];
  const selectedEquipmentType = equipmentTypes?.find(
    (equipmentType) => equipmentType.id === manualPartsImportForm.equipmentTypeId
  );
  const selectedPart = parts?.find((part) => part.id === manualPartsImportForm.partsId);
  const selectedTypeNames = [
    selectedEquipmentType?.name,
    selectedEquipmentType?.partTypeName,
    selectedPart?.partType?.name,
  ];
  const isBolsterSelected = selectedTypeNames.some(isBolsterPartType);
  const isWheelPairSelected = selectedTypeNames.some(isWheelPairPartType);
  const visibleManualPartsImportFields = manualPartsImportFields.filter((field) => {
    if (field.name === "truckType") return isBolsterSelected;
    if (field.name === "thicknessLeft" || field.name === "thicknessRight") {
      return isWheelPairSelected;
    }
    return true;
  });

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

  const handleRepairsFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setRepairsError(null);
    setRepairsSuccess(false);
    setUploadingType("repairs");

    try {
      const formData = new FormData();
      formData.append("file", file);

      await api.post(REPAIRS_FILE_URL, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setRepairsSuccess(true);
    } catch (err: unknown) {
      setRepairsError(getUploadErrorMessage(err) || "Ошибка при загрузке файла");
    } finally {
      setUploadingType(null);
    }
  };

  const handlePartsFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    fileType: "pdf" | "txt"
  ) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setPartsError(null);
    setPartsSuccess(false);
    setPartsImportResult(null);
    setUploadingType("parts");

    try {
      const result = await importFilesApi.processImportFile(file, fileType);
      setPartsImportResult(result);
      setPartsSuccess(true);
    } catch (err: unknown) {
      setPartsError(getUploadErrorMessage(err) || "Ошибка при загрузке файла комплектации");
    } finally {
      setUploadingType(null);
    }
  };

  const handleManualPartsImportChange = (
    field: keyof ManualPartsImportFormData,
    value: string
  ) => {
    setManualPartsImportStatus(null);
    setManualPartsImportForm((current) => {
      const nextForm = {
        ...current,
        [field]: value,
        ...(field === "operation" && value !== "2" ? { railwayCisternsId: "" } : {}),
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

        if (!typeNames.some(isBolsterPartType)) {
          nextForm.truckType = "0";
        }
        if (!typeNames.some(isWheelPairPartType)) {
          nextForm.thicknessLeft = "0";
          nextForm.thicknessRight = "0";
        }
      }

      return nextForm;
    });
  };

  const handleManualDocumentChange = (documentId: string) => {
    const selectedDocument = documents.find((document) => document.id === documentId);

    setManualPartsImportStatus(null);
    setManualPartsImportForm((current) => ({
      ...current,
      documentId,
      documentDate: selectedDocument?.date || "",
    }));
  };

  const handleManualPartsImportSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPartsError(null);
    setPartsSuccess(false);
    setManualPartsImportStatus(null);

    if (manualPartsImportForm.operation === "2" && !manualPartsImportForm.railwayCisternsId) {
      setManualPartsImportStatus({
        type: "error",
        message: "Выберите номер вагона для установки детали",
      });
      return;
    }

    if (!manualPartsImportForm.equipmentTypeId) {
      setManualPartsImportStatus({
        type: "error",
        message: "Выберите тип оборудования",
      });
      return;
    }

    if (!manualPartsImportForm.partsId) {
      setManualPartsImportStatus({
        type: "error",
        message: "Выберите деталь",
      });
      return;
    }

    setUploadingType("manual-parts");
    setManualPartsImportStatus({
      type: "loading",
      message: "Отправляем запрос на сохранение комплектации...",
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

    const payload = {
      railwayCisternsId:
        manualPartsImportForm.operation === "2"
          ? toNullableString(manualPartsImportForm.railwayCisternsId)
          : null,
      operation: toNullableNumber(manualPartsImportForm.operation),
      equipmentTypeId: toNullableString(manualPartsImportForm.equipmentTypeId),
      defectsId:
        manualPartsImportForm.operation === "2"
          ? 0
          : toNullableNumber(manualPartsImportForm.defectsId),
      adminOwnerId: toNullableNumber(manualPartsImportForm.adminOwnerId),
      partsId: toNullableString(manualPartsImportForm.partsId),
      jobDepotsId: toNullableString(manualPartsImportForm.jobDepotsId),
      jobDate: toNullableString(manualPartsImportForm.jobDate),
      jobTypeId: toNullableNumber(manualPartsImportForm.jobTypeId),
      thicknessLeft: isWheelPairSelected
        ? toNullableNumber(manualPartsImportForm.thicknessLeft)
        : 0,
      thicknessRight: isWheelPairSelected
        ? toNullableNumber(manualPartsImportForm.thicknessRight)
        : 0,
      truckType: isBolsterSelected
        ? toNullableNumber(manualPartsImportForm.truckType)
        : 0,
      notes: toNullableString(manualPartsImportForm.notes),
      documentId: toNullableString(manualPartsImportForm.documentId),
      documentDate: toNullableString(manualPartsImportForm.documentDate),
      depotsId:
        manualPartsImportForm.operation === "2"
          ? null
          : toNullableString(manualPartsImportForm.depotsId),
      repairTypesId: toNullableString(manualPartsImportForm.repairTypesId),
    };

    try {
      await api.post("/api/part-equipments", payload);
      setManualPartsImportStatus({
        type: "success",
        message: "Комплектация успешно сохранена",
      });
      setManualPartsImportForm(manualPartsImportInitialValues);
    } catch (err: unknown) {
      setManualPartsImportStatus({
        type: "error",
        message: getUploadErrorMessage(err) || "Ошибка при ручной загрузке комплектации",
      });
    } finally {
      setUploadingType(null);
    }
  };

  const formatFileSize = (size: number) => {
    if (size < 1024) return `${size} Б`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} КБ`;
    return `${(size / (1024 * 1024)).toFixed(1)} МБ`;
  };

  const partsImportStatistics = partsImportResult?.statistics;
  const isManualPartsImportSubmitting = uploadingType === "manual-parts";

  const handleManualPartsImportDialogChange = (open: boolean) => {
    if (isManualPartsImportSubmitting) return;
    setManualPartsImport(open);
    setManualPartsImportStatus(null);
  };

  const handleManualPartsImportFormReset = () => {
    setManualPartsImportForm(manualPartsImportInitialValues);
    setManualPartsImportStatus(null);
  };

  return (
    <div className="space-y-8 w-full">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Импорт данных</h1>
      </div>

 

        {/* System Settings */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Import className="h-5 w-5" />
             Импорт данных о ремонтах
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              ref={repairsFileInputRef}
              type="file"
              accept=".txt,.csv"
              className="hidden"
              onChange={handleRepairsFileChange}
            />
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                disabled={uploadingType !== null}
                onClick={() => repairsFileInputRef.current?.click()}
              >
                {uploadingType === "repairs" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Загрузка...
                  </>
                ) : (
                  "Загрузить данные о ремонтах"
                )}
              </Button>
              {repairsError && (
                <p className="text-sm text-red-600 dark:text-red-400">{repairsError}</p>
              )}
              {repairsSuccess && (
                <p className="text-sm text-green-600 dark:text-green-400">
                  Файл успешно обработан
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Import className="h-5 w-5" />
             Импорт данных о комплектации вагона-цистерны
            </CardTitle>
          
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              ref={partsPdfFileInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => handlePartsFileChange(e, "pdf")}
            />
            <input
              ref={partsTxtFileInputRef}
              type="file"
              accept=".txt"
              className="hidden"
              onChange={(e) => handlePartsFileChange(e, "txt")}
            />
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                disabled={uploadingType !== null}
                onClick={() => partsPdfFileInputRef.current?.click()}
              >
                {uploadingType === "parts" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Загрузка...
                  </>
                ) : (
                  "Загрузить PDF комплектации"
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={uploadingType !== null}
                onClick={() => partsTxtFileInputRef.current?.click()}
              >
                {uploadingType === "parts" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Загрузка...
                  </>
                ) : (
                  "Загрузить TXT файл комплектации"
                )}
              </Button>

              <Button
                variant="outline"
                size="sm"
                disabled={uploadingType !== null}
                onClick={() => setManualPartsImport(true)}
              >
                {uploadingType === "parts" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Загрузка...
                  </>
                ) : (
                  "Загрузить комплектацию вручную"
                )}
              </Button>

              {partsError && (
                <p className="text-sm text-red-600 dark:text-red-400">{partsError}</p>
              )}
              {partsSuccess && (
                <p className="text-sm text-green-600 dark:text-green-400">
                  {partsImportResult?.message || "Файл комплектации успешно обработан"}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

      <Dialog open={manualPartsImport} onOpenChange={handleManualPartsImportDialogChange}>
        <DialogContent className="!flex min-h-[500px] max-h-[85vh] flex-col sm:max-w-5xl">
          <DialogHeader className="shrink-0 text-left">
            <DialogTitle>Ручная загрузка комплектации</DialogTitle>
            <DialogDescription>
              Заполните данные по комплектации вагона-цистерны.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={handleManualPartsImportSubmit}
            className="flex min-h-0 flex-1 flex-col space-y-4"
          >
            {!manualPartsImportForm.equipmentTypeId ? (
              <div className="flex min-h-0 flex-1 flex-col space-y-2">
                <Label htmlFor="equipmentTypeId">Тип оборудования</Label>
                <SearchableSelect
                  value={manualPartsImportForm.equipmentTypeId}
                  onChange={(value) => handleManualPartsImportChange("equipmentTypeId", value)}
                  options={equipmentTypeOptions}
                  placeholder="Выберите тип оборудования"
                  searchPlaceholder="Введите код или название"
                  isLoading={equipmentTypesLoading}
                  fillAvailable
                />
              </div>
            ) : (
            <ScrollArea className="max-h-[58vh] pr-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="equipmentTypeId">Тип оборудования</Label>
                  <SearchableSelect
                    value={manualPartsImportForm.equipmentTypeId}
                    onChange={(value) => handleManualPartsImportChange("equipmentTypeId", value)}
                    options={equipmentTypeOptions}
                    placeholder="Выберите тип оборудования"
                    searchPlaceholder="Введите код или название"
                    isLoading={equipmentTypesLoading}
                  />
                </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="operation">Операция</Label>
                      <Select
                        value={manualPartsImportForm.operation}
                        onValueChange={(value) =>
                          handleManualPartsImportChange("operation", value)
                        }
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
                        value={manualPartsImportForm.partsId}
                        onChange={(value) => handleManualPartsImportChange("partsId", value)}
                        options={partOptions}
                        placeholder="Выберите деталь"
                        searchPlaceholder="Введите заводской номер, клеймо или год"
                        isLoading={partsLoading}
                      />
                    </div>
                    {manualPartsImportForm.operation !== "2" && (
                      <div className="space-y-2">
                        <Label htmlFor="defectsId">Дефект</Label>
                        <SearchableSelect
                          value={manualPartsImportForm.defectsId}
                          onChange={(value) =>
                            handleManualPartsImportChange("defectsId", value)
                          }
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
                        value={manualPartsImportForm.adminOwnerId}
                        onChange={(value) =>
                          handleManualPartsImportChange("adminOwnerId", value)
                        }
                        options={adminOwnerOptions}
                        placeholder="Выберите владельца"
                        searchPlaceholder="Введите код или название"
                        isLoading={adminOwnersLoading}
                      />
                    </div>
                    {manualPartsImportForm.operation === "2" && (
                      <div className="space-y-2">
                        <Label htmlFor="railwayCisternsId">Номер вагона</Label>
                        <SearchableSelect
                          value={manualPartsImportForm.railwayCisternsId}
                          onChange={(value) =>
                            handleManualPartsImportChange("railwayCisternsId", value)
                          }
                          options={cisternOptions}
                          placeholder="Выберите номер вагона"
                          searchPlaceholder="Введите номер вагона"
                          isLoading={cisternsLoading}
                        />
                      </div>
                    )}
                    {manualPartsImportForm.operation !== "2" && (
                      <div className="space-y-2">
                        <Label htmlFor="depotsId">Депо</Label>
                        <SearchableSelect
                          value={manualPartsImportForm.depotsId}
                          onChange={(value) =>
                            handleManualPartsImportChange("depotsId", value)
                          }
                          options={depotOptions}
                          placeholder="Выберите депо"
                          searchPlaceholder="Введите код депо"
                          isLoading={depotsLoading}
                        />
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="jobDepotsId">Депо работ</Label>
                      <SearchableSelect
                        value={manualPartsImportForm.jobDepotsId}
                        onChange={(value) =>
                          handleManualPartsImportChange("jobDepotsId", value)
                        }
                        options={depotOptions}
                        placeholder="Выберите депо работ"
                        searchPlaceholder="Введите код депо"
                        isLoading={depotsLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="repairTypesId">Вид ремонта</Label>
                      <SearchableSelect
                        value={manualPartsImportForm.repairTypesId}
                        onChange={(value) =>
                          handleManualPartsImportChange("repairTypesId", value)
                        }
                        options={repairTypeOptions}
                        placeholder="Выберите вид ремонта"
                        searchPlaceholder="Введите название или код"
                        isLoading={repairTypesLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="documentId">Документ</Label>
                      <SearchableSelect
                        value={manualPartsImportForm.documentId}
                        onChange={handleManualDocumentChange}
                        options={documentOptions}
                        placeholder="Выберите документ"
                        searchPlaceholder="Введите номер, автора или дату"
                        isLoading={documentsLoading}
                      />
                    </div>
                    {visibleManualPartsImportFields.map((field) => (
                      <div key={field.name} className="space-y-2">
                        <Label htmlFor={field.name}>{field.label}</Label>
                        <Input
                          id={field.name}
                          type={field.type || "text"}
                          step={field.type === "number" ? "0.01" : undefined}
                          required={field.required}
                          value={manualPartsImportForm[field.name]}
                          onChange={(e) =>
                            handleManualPartsImportChange(field.name, e.target.value)
                          }
                        />
                      </div>
                    ))}
                    <div className="space-y-2 sm:col-span-2 lg:col-span-3">
                      <Label htmlFor="notes">Примечания</Label>
                      <Textarea
                        id="notes"
                        value={manualPartsImportForm.notes}
                        onChange={(e) =>
                          handleManualPartsImportChange("notes", e.target.value)
                        }
                        placeholder="Введите примечания"
                      />
                    </div>
                  </div>
              </div>
            </ScrollArea>
            )}

            {manualPartsImportStatus ? (
              <Alert
                variant={manualPartsImportStatus.type === "error" ? "destructive" : "default"}
                className={
                  manualPartsImportStatus.type === "success"
                    ? "border-green-200 text-green-700 dark:border-green-900 dark:text-green-400"
                    : undefined
                }
              >
                {manualPartsImportStatus.type === "loading" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                <AlertDescription>{manualPartsImportStatus.message}</AlertDescription>
              </Alert>
            ) : null}

            <DialogFooter className="shrink-0 gap-2 sm:justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={handleManualPartsImportFormReset}
                disabled={isManualPartsImportSubmitting}
              >
                Очистить форму
              </Button>
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleManualPartsImportDialogChange(false)}
                  disabled={isManualPartsImportSubmitting}
                >
                  Отмена
                </Button>
                <Button type="submit" disabled={uploadingType !== null}>
                  {isManualPartsImportSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Сохранение...
                    </>
                  ) : (
                    "Сохранить"
                  )}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(partsImportResult)}
        onOpenChange={(open) => {
          if (!open) setPartsImportResult(null);
        }}
      >
        <DialogContent className="max-h-[85vh] sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Результат обработки файла комплектации</DialogTitle>
            <DialogDescription>
              {partsImportResult?.message || "Статус выполнения импорта комплектации"}
            </DialogDescription>
          </DialogHeader>

          {partsImportResult ? (
            <div className="space-y-4 min-h-0">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">Файл</div>
                  <div className="text-sm font-medium break-all">{partsImportResult.filename}</div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">Размер</div>
                  <div className="text-sm font-medium">{formatFileSize(partsImportResult.size)}</div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">Статус</div>
                  <Badge variant={partsImportResult.status === "success" ? "default" : "destructive"}>
                    {partsImportResult.status}
                  </Badge>
                </div>
              </div>

              {partsImportStatistics ? (
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-md border p-3">
                    <div className="text-xs text-muted-foreground">Всего обработано</div>
                    <div className="text-xl font-semibold">
                      {partsImportStatistics.total_processed}
                    </div>
                  </div>
                  <div className="rounded-md border p-3">
                    <div className="text-xs text-muted-foreground">Успешно</div>
                    <div className="text-xl font-semibold text-green-600">
                      {partsImportStatistics.success}
                    </div>
                  </div>
                  <div className="rounded-md border p-3">
                    <div className="text-xs text-muted-foreground">Ошибки</div>
                    <div className="text-xl font-semibold text-red-600">
                      {partsImportStatistics.errors}
                    </div>
                  </div>
                </div>
              ) : null}

              {partsImportResult.details?.length ? (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Детали обработки</div>
                  <ScrollArea className="h-[320px] rounded-md border">
                    <div className="divide-y">
                      {partsImportResult.details.map((detail, index) => {
                        const isSuccessful = detail.status === "Добавления запчасти успешно";

                        return (
                          <div
                            key={`${detail.EquipmentTypeId}-${detail.Part_number}-${index}`}
                            className={`p-3 ${isSuccessful ? "" : "bg-pink-50 dark:bg-pink-950/30"}`}
                          >
                            <div className="grid gap-2 text-sm sm:grid-cols-4">
                              <div>
                                <div className="text-xs text-muted-foreground">Тип оборудования</div>
                                <div className="font-medium">{detail.EquipmentTypeId || "—"}</div>
                              </div>
                              <div>
                                <div className="text-xs text-muted-foreground">Клеймо</div>
                                <div className="font-medium">{detail.Part_stamp || "—"}</div>
                              </div>
                              <div>
                                <div className="text-xs text-muted-foreground">Зав. номер</div>
                                <div className="font-medium">{detail.Part_number || "—"}</div>
                              </div>
                              <div>
                                <div className="text-xs text-muted-foreground">Год</div>
                                <div className="font-medium">{detail.Part_year || "—"}</div>
                              </div>
                            </div>
                            <pre className="mt-2 whitespace-pre-wrap break-words rounded bg-muted p-2 text-xs">
                              {detail.status || "—"}
                            </pre>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </div>
              ) : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
  

     
    </div>
  );
}
