"use client";

import { useMemo, useRef, useState } from "react";
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
} from "@/components/ui";
import { Loader2 } from "lucide-react";
import {
  useAllDocuments,
  useCisternIdAndNumbers,
  useCreateDocument,
  useCurrentUser,
  useDepots,
  useEmployees,
  useFitments,
  useUpdateFitment,
  useUpdateFitmentEquipment,
} from "@/hooks";
import { fitmentEquipmentApi } from "@/api/directories";
import { getDocumentTypeLabel } from "@/components/documents-filter";
import { formatDate } from "@/lib/formatDate";
import type {
  CreateDocumentDTO,
  EmployeeDTO,
  FitmentDTO,
  FitmentEquipmentDTO,
  UpdateFitmentDTO,
} from "@/types/directories";

type BindFitmentFormData = {
  railwayCisternsId: string;
  operation: string;
  fitmentId: string;
  jobUserId: string;
  testUserId: string;
  acceptUserId: string;
  installUserId: string;
  approvUserId: string;
  depoId: string;
  locationDepoId: string;
  date: string;
  documentId: string;
};

type RequestStatus = {
  type: "loading" | "success" | "error";
  message: string;
};

const MAINTENANCE_OPERATION = 3;
const FITMENT_DOCUMENT_TYPE = 2;
const CREATE_NEW_DOCUMENT_VALUE = "__create_new_document__";

const initialValues: BindFitmentFormData = {
  railwayCisternsId: "",
  operation: "2",
  fitmentId: "",
  jobUserId: "",
  testUserId: "",
  acceptUserId: "",
  installUserId: "",
  approvUserId: "",
  depoId: "",
  locationDepoId: "",
  date: "",
  documentId: "",
};

const getTodayDate = () => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
};

const formatEmployeeLabel = (employee: EmployeeDTO) => {
  const fullName = [employee.lastName, employee.firstName, employee.patronymic]
    .filter(Boolean)
    .join(" ");
  const name = fullName || employee.initials || "—";
  return employee.position ? `${name} (${employee.position})` : name;
};

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

const formatUserAuthor = (user?: { firstName?: string | null; lastName?: string | null } | null) => {
  if (!user) return "";
  return [user.lastName, user.firstName].filter(Boolean).join(" ").trim();
};

const EMPTY_DOCUMENT_FORM: CreateDocumentDTO = {
  number: "",
  type: FITMENT_DOCUMENT_TYPE,
  date: "",
  author: "",
  price: null,
  note: "",
  file: "",
};

const findLatestMaintenanceRecord = (records: FitmentEquipmentDTO[]) => {
  return records
    .filter((record) => Number(record.operation) === MAINTENANCE_OPERATION)
    .reduce<FitmentEquipmentDTO | null>((latest, record) => {
      if (!record.date) return latest;
      if (!latest?.date) return record;

      return new Date(record.date).getTime() >= new Date(latest.date).getTime() ? record : latest;
    }, null);
};

const getErrorMessage = (err: unknown) => {
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

const isLastBindingOlder = (
  lastBinding: FitmentEquipmentDTO | null,
  newDate: string
): boolean => {
  if (!lastBinding?.date) return true;
  if (!newDate) return false;

  const lastTime = new Date(lastBinding.date).getTime();
  const newTime = new Date(newDate).getTime();

  if (Number.isNaN(newTime)) return false;
  if (Number.isNaN(lastTime)) return true;

  return lastTime < newTime;
};

const buildFitmentLocationUpdate = (
  fitment: FitmentDTO,
  operation: number,
  depoId: string,
  railwayCisternsId: string,
  locationDepoId: string
): UpdateFitmentDTO => {
  const isInstall = operation === 2;
  const isRemoval = operation === 1;

  return {
    fitmentTypeId: fitment.fitmentTypeId,
    serialNumber: fitment.serialNumber,
    passportNumber: fitment.passportNumber,
    buildDate: fitment.buildDate,
    lastRepairDate: fitment.lastRepairDate ?? null,
    periodRep: fitment.periodRep,
    serviceLifeYears: fitment.serviceLifeYears,
    modelId: fitment.modelId,
    depotId: fitment.depotId ?? null,
    // 1 — снятие, 2 — установка
    code: isRemoval ? 1 : isInstall ? 2 : fitment.code ?? 0,
    locationDepoId: isRemoval ? locationDepoId || depoId || null : null,
    locationCisternId: isInstall ? railwayCisternsId || null : null,
  };
};

interface BindFitmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BindFitmentDialog({ open, onOpenChange }: BindFitmentDialogProps) {
  const [form, setForm] = useState<BindFitmentFormData>(initialValues);
  const [status, setStatus] = useState<RequestStatus | null>(null);
  const [latestMaintenance, setLatestMaintenance] = useState<FitmentEquipmentDTO | null>(null);
  const [isPrefilling, setIsPrefilling] = useState(false);
  const [isCreateDocumentOpen, setIsCreateDocumentOpen] = useState(false);
  const [documentFormData, setDocumentFormData] = useState<CreateDocumentDTO>(EMPTY_DOCUMENT_FORM);
  const [documentFormError, setDocumentFormError] = useState<string | null>(null);
  const [isCreatingDocument, setIsCreatingDocument] = useState(false);
  const prefillRequestIdRef = useRef(0);
  const updateMutation = useUpdateFitmentEquipment();
  const createDocumentMutation = useCreateDocument();
  const updateFitmentMutation = useUpdateFitment();

  const { data: cisternIdAndNumbers, isLoading: cisternsLoading } = useCisternIdAndNumbers();
  const { data: fitments, isLoading: fitmentsLoading } = useFitments();
  const { data: employees, isLoading: employeesLoading } = useEmployees();
  const { data: depots, isLoading: depotsLoading } = useDepots();
  const { data: documents = [], isLoading: documentsLoading } = useAllDocuments();
  const { data: currentUser } = useCurrentUser();

  const isSubmitting =
    updateMutation.isPending ||
    createDocumentMutation.isPending ||
    updateFitmentMutation.isPending ||
    isPrefilling ||
    isCreatingDocument;

  const cisternOptions =
    cisternIdAndNumbers?.map((cistern) => ({
      value: cistern.id,
      label: cistern.number,
    })) || [];

  const expectedFitmentCode = form.operation === "1" ? 2 : 3;

  const fitmentOptions =
    fitments
      ?.filter((fitment) => Number(fitment.code) === expectedFitmentCode)
      .map((fitment) => ({
        value: fitment.id,
        label: `(${fitment.serialNumber || "—"}; ${fitment.passportNumber || "—"}) — ${
          fitment.fitmentType?.name || "—"
        }`,
      })) || [];

  const employeeOptions =
    employees?.map((employee) => ({
      value: employee.id,
      label: formatEmployeeLabel(employee),
    })) || [];

  const locationDepotOptions =
    depots?.map((depot) => ({
      value: depot.id,
      label: `${depot.shortName || depot.name || "—"} (${depot.code})`,
    })) || [];

  const isRemoval = form.operation === "1";

  const documentOptions = useMemo(() => {
    const fitmentDocuments = documents
      .filter((document) => Number(document.type) === FITMENT_DOCUMENT_TYPE)
      .map((document) => ({
        value: document.id,
        label: formatDocumentLabel(document),
      }));

    const options = [
      { value: CREATE_NEW_DOCUMENT_VALUE, label: "Создать новый документ" },
      ...fitmentDocuments,
    ];

    if (
      form.documentId &&
      form.documentId !== CREATE_NEW_DOCUMENT_VALUE &&
      !options.some((option) => option.value === form.documentId)
    ) {
      const selected =
        documents.find((document) => document.id === form.documentId) ?? latestMaintenance?.document;
      options.push({
        value: form.documentId,
        label: selected ? formatDocumentLabel(selected) : form.documentId,
      });
    }

    return options;
  }, [documents, form.documentId, latestMaintenance]);

  const handleDocumentChange = (documentId: string) => {
    setStatus(null);

    if (documentId === CREATE_NEW_DOCUMENT_VALUE) {
      setDocumentFormData({
        ...EMPTY_DOCUMENT_FORM,
        type: FITMENT_DOCUMENT_TYPE,
        date: form.date || getTodayDate(),
        author: formatUserAuthor(currentUser),
      });
      setDocumentFormError(null);
      setIsCreateDocumentOpen(true);
      return;
    }

    const document =
      documents.find((item) => item.id === documentId) ??
      (latestMaintenance?.document?.id === documentId ? latestMaintenance.document : undefined);
    const documentDate = document?.date?.slice(0, 10) ?? "";

    setForm((current) => ({
      ...current,
      documentId,
      ...(documentDate ? { date: documentDate } : {}),
    }));
  };

  const updateDocumentFormField = <K extends keyof CreateDocumentDTO>(
    key: K,
    value: CreateDocumentDTO[K]
  ) => {
    setDocumentFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleCreateDocumentDialogChange = (nextOpen: boolean) => {
    if (!nextOpen && isCreatingDocument) return;
    setIsCreateDocumentOpen(nextOpen);
    if (!nextOpen) {
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
        type: FITMENT_DOCUMENT_TYPE,
        date: documentFormData.date,
        author: documentFormData.author?.trim() || null,
        price: null,
        note: documentFormData.note?.trim() || null,
        file: null,
      });

      setForm((current) => ({
        ...current,
        documentId: newDocumentId,
        date: documentFormData.date || current.date,
      }));
      setIsCreateDocumentOpen(false);
      setDocumentFormData(EMPTY_DOCUMENT_FORM);
      setDocumentFormError(null);
    } catch (createDocumentError) {
      setDocumentFormError(
        getErrorMessage(createDocumentError) ||
          "Не удалось создать документ. Попробуйте ещё раз."
      );
    } finally {
      setIsCreatingDocument(false);
    }
  };

  const handleChange = (field: keyof BindFitmentFormData, value: string) => {
    setStatus(null);
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleOperationChange = (operation: string) => {
    if (operation === form.operation) return;

    prefillRequestIdRef.current += 1;
    setLatestMaintenance(null);
    setIsPrefilling(false);
    setStatus(null);
    setForm({ ...initialValues, operation });
  };

  const handleFitmentChange = async (fitmentId: string) => {
    setStatus(null);
    const requestId = ++prefillRequestIdRef.current;

    if (!fitmentId) {
      setLatestMaintenance(null);
      setForm((current) => ({
        ...current,
        fitmentId: "",
        jobUserId: "",
        testUserId: "",
        acceptUserId: "",
        depoId: "",
        documentId: "",
        date: "",
      }));
      return;
    }

    setLatestMaintenance(null);
    setForm((current) => ({
      ...current,
      fitmentId,
      jobUserId: "",
      testUserId: "",
      acceptUserId: "",
      depoId: "",
      documentId: "",
      date: getTodayDate(),
    }));
    setIsPrefilling(true);

    try {
      const records = await fitmentEquipmentApi.getByFitment(fitmentId);
      if (requestId !== prefillRequestIdRef.current) return;

      const latest = findLatestMaintenanceRecord(records);
      setLatestMaintenance(latest);

      if (!latest) {
        setStatus({
          type: "error",
          message: "Для выбранной арматуры не найдена запись технического обслуживания",
        });
        return;
      }

      setForm((current) => ({
        ...current,
        fitmentId,
        jobUserId: latest.jobUserId || "",
        testUserId: latest.testUserId || "",
        acceptUserId: latest.acceptUserId || "",
        depoId: latest.depoId || "",
        documentId: latest.documentId || "",
        date: getTodayDate(),
      }));
    } catch (err: unknown) {
      if (requestId !== prefillRequestIdRef.current) return;
      setLatestMaintenance(null);
      setStatus({
        type: "error",
        message: getErrorMessage(err) || "Не удалось загрузить данные технического обслуживания",
      });
    } finally {
      if (requestId === prefillRequestIdRef.current) {
        setIsPrefilling(false);
      }
    }
  };

  const handleDialogChange = (nextOpen: boolean) => {
    if (isSubmitting || isCreatingDocument) return;
    onOpenChange(nextOpen);
    if (!nextOpen) {
      setStatus(null);
      setLatestMaintenance(null);
      setIsCreateDocumentOpen(false);
      setDocumentFormData(EMPTY_DOCUMENT_FORM);
      setDocumentFormError(null);
      prefillRequestIdRef.current += 1;
    }
  };

  const handleReset = () => {
    prefillRequestIdRef.current += 1;
    setLatestMaintenance(null);
    setIsPrefilling(false);
    setForm(initialValues);
    setStatus(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus(null);

    const operation = Number(form.operation || 0);

    if (operation === 2 && !form.railwayCisternsId) {
      setStatus({
        type: "error",
        message: "Выберите номер вагона для установки арматуры",
      });
      return;
    }

    if (operation === 1 && !form.locationDepoId) {
      setStatus({
        type: "error",
        message: "Выберите депо для снятия арматуры",
      });
      return;
    }

    if (!form.fitmentId) {
      setStatus({
        type: "error",
        message: "Выберите арматуру",
      });
      return;
    }

    if (!form.documentId || form.documentId === CREATE_NEW_DOCUMENT_VALUE) {
      setStatus({
        type: "error",
        message: "Выберите документ",
      });
      return;
    }

    if (!latestMaintenance?.id) {
      setStatus({
        type: "error",
        message: "Для выбранной арматуры не найдена запись технического обслуживания",
      });
      return;
    }

    try {
      setStatus({
        type: "loading",
        message: "Загружаем последнюю привязку арматуры...",
      });

      const lastBinding = await fitmentEquipmentApi.getLastByFitment(form.fitmentId);

      setStatus({
        type: "loading",
        message: "Отправляем запрос на привязку арматуры...",
      });

      await updateMutation.mutateAsync({
        id: latestMaintenance.id,
        data: {
          railwayCisternsId:
            operation === 2 ? form.railwayCisternsId : form.railwayCisternsId || null,
          operation,
          fitmentId: form.fitmentId,
          jobUserId: operation === 1 ? null : form.jobUserId || null,
          testUserId: operation === 1 ? null : form.testUserId || null,
          depoId: operation === 1 ? form.locationDepoId || null : form.depoId || null,
          date: form.date || undefined,
          documentId: form.documentId,
          acceptUserId: operation === 1 ? null : form.acceptUserId || null,
          installUserId: operation === 1 ? null : form.installUserId || null,
          approvUserId: operation === 1 ? null : form.approvUserId || null,
        },
      });

      if (
        (operation === 1 || operation === 2) &&
        isLastBindingOlder(lastBinding, form.date)
      ) {
        const selectedFitment = fitments?.find((fitment) => fitment.id === form.fitmentId);

        if (!selectedFitment) {
          throw new Error("Не удалось найти выбранную арматуру в справочнике");
        }

        setStatus({
          type: "loading",
          message: "Обновляем данные арматуры в справочнике...",
        });

        await updateFitmentMutation.mutateAsync({
          id: form.fitmentId,
          data: buildFitmentLocationUpdate(
            selectedFitment,
            operation,
            form.depoId,
            form.railwayCisternsId,
            form.locationDepoId
          ),
        });
      }

      setStatus({
        type: "success",
        message: "Арматура успешно привязана",
      });
      setForm((current) => ({
        ...initialValues,
        operation: current.operation,
        railwayCisternsId: current.railwayCisternsId,
        date: current.date,
        installUserId: current.installUserId,
        approvUserId: current.approvUserId,
      }));
      setLatestMaintenance(null);
    } catch (err: unknown) {
      setStatus({
        type: "error",
        message:
          (err instanceof Error && !("response" in err) ? err.message : null) ||
          getErrorMessage(err) ||
          "Ошибка при привязке арматуры",
      });
    }
  };

  return (
    <>
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="max-h-[95vh] sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Привязка арматуры</DialogTitle>
          <DialogDescription>
            Заполните данные по привязке арматуры к вагону-цистерне.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="min-h-0 space-y-4">
          <ScrollArea className="max-h-[75vh] pr-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="bind-operation">Операция *</Label>
                <Select
                  value={form.operation}
                  onValueChange={handleOperationChange}
                >
                  <SelectTrigger id="bind-operation" className="w-full">
                    <SelectValue placeholder="Выберите операцию" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">Установка</SelectItem>
                    <SelectItem value="1">Снятие</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bind-fitmentId">Арматура *</Label>
                <SearchableSelect
                  value={form.fitmentId}
                  onChange={handleFitmentChange}
                  options={fitmentOptions}
                  placeholder="Выберите арматуру"
                  searchPlaceholder="Введите номер или паспорт"
                  isLoading={fitmentsLoading || isPrefilling}
                />
              </div>

              {form.operation === "2" && (
                <div className="space-y-2">
                  <Label htmlFor="bind-railwayCisternsId">Номер вагона *</Label>
                  <SearchableSelect
                    value={form.railwayCisternsId}
                    onChange={(value) => handleChange("railwayCisternsId", value)}
                    options={cisternOptions}
                    placeholder="Выберите номер вагона"
                    searchPlaceholder="Введите номер вагона"
                    isLoading={cisternsLoading}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="bind-date">Дата привязки *</Label>
                <Input
                  id="bind-date"
                  type="date"
                  value={form.date}
                  onChange={(e) => handleChange("date", e.target.value)}
                />
              </div> 

              {!isRemoval && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="bind-installUserId">Установил</Label>
                    <SearchableSelect
                      value={form.installUserId}
                      onChange={(value) => handleChange("installUserId", value)}
                      options={employeeOptions}
                      placeholder="Выберите сотрудника"
                      searchPlaceholder="Введите ФИО или должность"
                      isLoading={employeesLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bind-approvUserId">Утвердил</Label>
                    <SearchableSelect
                      value={form.approvUserId}
                      onChange={(value) => handleChange("approvUserId", value)}
                      options={employeeOptions}
                      placeholder="Выберите сотрудника"
                      searchPlaceholder="Введите ФИО или должность"
                      isLoading={employeesLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bind-testUserId">Испытание провёл *</Label>
                    <SearchableSelect
                      value={form.testUserId}
                      onChange={(value) => handleChange("testUserId", value)}
                      options={employeeOptions}
                      placeholder="Выберите сотрудника"
                      searchPlaceholder="Введите ФИО или должность"
                      isLoading={employeesLoading || isPrefilling}
                      disabled
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bind-jobUserId">Работу произвёл *</Label>
                    <SearchableSelect
                      value={form.jobUserId}
                      onChange={(value) => handleChange("jobUserId", value)}
                      options={employeeOptions}
                      placeholder="Выберите сотрудника"
                      searchPlaceholder="Введите ФИО или должность"
                      isLoading={employeesLoading || isPrefilling}
                      disabled
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bind-acceptUserId">Работу принял</Label>
                    <SearchableSelect
                      value={form.acceptUserId}
                      onChange={(value) => handleChange("acceptUserId", value)}
                      options={employeeOptions}
                      placeholder="Выберите сотрудника"
                      searchPlaceholder="Введите ФИО или должность"
                      isLoading={employeesLoading || isPrefilling}
                      disabled
                    />
                  </div>
                </>
              )}

              {isRemoval && (
                <div className="space-y-2">
                  <Label htmlFor="bind-locationDepoId">Депо *</Label>
                  <SearchableSelect
                    value={form.locationDepoId}
                    onChange={(value) => handleChange("locationDepoId", value)}
                    options={locationDepotOptions}
                    placeholder="Выберите депо"
                    searchPlaceholder="Введите краткое название или код"
                    isLoading={depotsLoading}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="bind-documentId">Документ *</Label>
                <SearchableSelect
                  value={form.documentId}
                  onChange={handleDocumentChange}
                  options={documentOptions}
                  placeholder="Выберите документ"
                  searchPlaceholder="Введите номер, автора или дату"
                  isLoading={documentsLoading || isPrefilling}
                  disabled={!isRemoval}
                />
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
              {status.type === "loading" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              <AlertDescription>{status.message}</AlertDescription>
            </Alert>
          ) : null}

          <DialogFooter className="gap-2 sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={isSubmitting}
            >
              Очистить форму
            </Button>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleDialogChange(false)}
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
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

      <Dialog open={isCreateDocumentOpen} onOpenChange={handleCreateDocumentDialogChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Создать документ</DialogTitle>
            <DialogDescription>
              Новый документ типа «Привязка арматуры».
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="bind-document-number">
                Номер <span className="text-red-500">*</span>
              </Label>
              <Input
                id="bind-document-number"
                value={documentFormData.number}
                onChange={(e) => updateDocumentFormField("number", e.target.value)}
                placeholder="Введите номер документа"
              />
            </div>
            <div>
              <Label htmlFor="bind-document-type">Тип</Label>
              <Select value={String(FITMENT_DOCUMENT_TYPE)} disabled>
                <SelectTrigger id="bind-document-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={String(FITMENT_DOCUMENT_TYPE)}>
                    {getDocumentTypeLabel(FITMENT_DOCUMENT_TYPE)}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="bind-document-date">
                Дата <span className="text-red-500">*</span>
              </Label>
              <Input
                id="bind-document-date"
                type="date"
                value={documentFormData.date}
                onChange={(e) => updateDocumentFormField("date", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="bind-document-author">Автор</Label>
              <Input
                id="bind-document-author"
                value={documentFormData.author ?? ""}
                onChange={(e) => updateDocumentFormField("author", e.target.value)}
                placeholder="Введите автора"
              />
            </div>
            <div>
              <Label htmlFor="bind-document-note">Примечание</Label>
              <Input
                id="bind-document-note"
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
    </>
  );
}
