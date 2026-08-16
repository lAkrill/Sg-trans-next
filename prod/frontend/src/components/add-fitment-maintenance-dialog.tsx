"use client";

import { useEffect, useMemo, useState } from "react";
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
  useCreateDocument,
  useCreateFitmentEquipment,
  useCurrentUser,
  useDepots,
  useEmployees,
  useFitments,
  useUpdateFitment,
} from "@/hooks";
import { getDocumentTypeLabel } from "@/components/documents-filter";
import { formatDate } from "@/lib/formatDate";
import type { CreateDocumentDTO, EmployeeDTO, FitmentDTO, UpdateFitmentDTO } from "@/types/directories";

type MaintenanceFormData = {
  fitmentId: string;
  jobUserId: string;
  testUserId: string;
  acceptUserId: string;
  depoId: string;
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
const DEFAULT_DEPOT_CODE = "10001";

const initialValues: MaintenanceFormData = {
  fitmentId: "",
  jobUserId: "",
  testUserId: "",
  acceptUserId: "",
  depoId: "",
  date: "",
  documentId: "",
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

const formatEmployeeLabel = (employee: EmployeeDTO) => {
  const fullName = [employee.lastName, employee.firstName, employee.patronymic]
    .filter(Boolean)
    .join(" ");
  const name = fullName || employee.initials || "—";
  return employee.position ? `${name} (${employee.position})` : name;
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

const isNewerRepairDate = (fitment: FitmentDTO, newDate: string): boolean => {
  if (!newDate) return false;
  if (!fitment.lastRepairDate) return true;

  const lastTime = new Date(fitment.lastRepairDate).getTime();
  const newTime = new Date(newDate).getTime();

  if (Number.isNaN(newTime)) return false;
  if (Number.isNaN(lastTime)) return true;

  return lastTime < newTime;
};

const toApiDateTime = (value?: string | null) => {
  if (!value) return "";

  const datePart = value.match(/^(\d{4}-\d{2}-\d{2})/)?.[1];
  if (datePart) return `${datePart}T00:00:00`;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}T00:00:00`;
};

const buildFitmentRepairUpdate = (
  fitment: FitmentDTO,
  lastRepairDate: string
): UpdateFitmentDTO => ({
  fitmentTypeId: fitment.fitmentTypeId,
  serialNumber: fitment.serialNumber,
  passportNumber: fitment.passportNumber,
  buildDate: toApiDateTime(fitment.buildDate),
  lastRepairDate: toApiDateTime(lastRepairDate),
  periodRep: fitment.periodRep,
  serviceLifeYears: fitment.serviceLifeYears,
  modelId: fitment.modelId,
  depotId: fitment.depotId ?? null,
  code: 3,
  locationDepoId: fitment.locationDepoId ?? null,
  locationCisternId: fitment.locationCisternId ?? null,
});

interface AddFitmentMaintenanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddFitmentMaintenanceDialog({
  open,
  onOpenChange,
}: AddFitmentMaintenanceDialogProps) {
  const [form, setForm] = useState<MaintenanceFormData>(initialValues);
  const [status, setStatus] = useState<RequestStatus | null>(null);
  const [isCreateDocumentOpen, setIsCreateDocumentOpen] = useState(false);
  const [documentFormData, setDocumentFormData] = useState<CreateDocumentDTO>(EMPTY_DOCUMENT_FORM);
  const [documentFormError, setDocumentFormError] = useState<string | null>(null);
  const [isCreatingDocument, setIsCreatingDocument] = useState(false);

  const createMutation = useCreateFitmentEquipment();
  const createDocumentMutation = useCreateDocument();
  const updateFitmentMutation = useUpdateFitment();

  const { data: fitments, isLoading: fitmentsLoading } = useFitments();
  const { data: employees, isLoading: employeesLoading } = useEmployees();
  const { data: depots, isLoading: depotsLoading } = useDepots();
  const { data: documents = [], isLoading: documentsLoading } = useAllDocuments();
  const { data: currentUser } = useCurrentUser();

  const isSubmitting =
    createMutation.isPending ||
    createDocumentMutation.isPending ||
    updateFitmentMutation.isPending;

  const fitmentOptions =
    fitments
      ?.filter((fitment) => {
        const code = Number(fitment.code);
        return code === 0 || code === 1 || code === 4;
      })
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

  const depotOptions =
    depots?.map((depot) => ({
      value: depot.id,
      label: `${depot.shortName || depot.name} (${depot.code})`,
    })) || [];

  const defaultDepotId = useMemo(
    () => depots?.find((depot) => String(depot.code) === DEFAULT_DEPOT_CODE)?.id ?? "",
    [depots]
  );

  useEffect(() => {
    if (!defaultDepotId) return;

    setForm((current) => (current.depoId ? current : { ...current, depoId: defaultDepotId }));
  }, [defaultDepotId]);

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
      const selected = documents.find((document) => document.id === form.documentId);
      options.push({
        value: form.documentId,
        label: selected ? formatDocumentLabel(selected) : form.documentId,
      });
    }

    return options;
  }, [documents, form.documentId]);

  const handleChange = (field: keyof MaintenanceFormData, value: string) => {
    setStatus(null);
    setForm((current) => {
      const next = { ...current, [field]: value };

      return next;
    });
  };

  const handleDocumentChange = (documentId: string) => {
    setStatus(null);

    if (documentId === CREATE_NEW_DOCUMENT_VALUE) {
      setDocumentFormData({
        ...EMPTY_DOCUMENT_FORM,
        type: FITMENT_DOCUMENT_TYPE,
        date: form.date || new Date().toISOString().slice(0, 10),
        author: formatUserAuthor(currentUser),
      });
      setDocumentFormError(null);
      setIsCreateDocumentOpen(true);
      return;
    }

    const document = documents.find((item) => item.id === documentId);
    const documentDate = document?.date?.slice(0, 10) ?? "";

    setForm((current) => ({
      ...current,
      documentId,
      ...(documentId && documentDate && !current.date ? { date: documentDate } : {}),
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
        date: current.date || documentFormData.date,
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

  const handleDialogChange = (nextOpen: boolean) => {
    if (isSubmitting || isCreatingDocument) return;
    onOpenChange(nextOpen);
    if (!nextOpen) {
      setStatus(null);
      setIsCreateDocumentOpen(false);
      setDocumentFormData(EMPTY_DOCUMENT_FORM);
      setDocumentFormError(null);
    }
  };

  const handleReset = () => {
    setForm({ ...initialValues, depoId: defaultDepotId });
    setStatus(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus(null);

    if (!form.fitmentId) {
      setStatus({ type: "error", message: "Выберите арматуру" });
      return;
    }

    if (!form.depoId) {
      setStatus({ type: "error", message: "Выберите место работы" });
      return;
    }

    if (!form.testUserId) {
      setStatus({ type: "error", message: "Выберите сотрудника, который провёл испытание" });
      return;
    }

    if (!form.jobUserId) {
      setStatus({ type: "error", message: "Выберите сотрудника, который произвёл работу" });
      return;
    }

    if (!form.acceptUserId) {
      setStatus({ type: "error", message: "Выберите сотрудника, который принял работу" });
      return;
    }

    if (!form.date) {
      setStatus({ type: "error", message: "Укажите дату ТО" });
      return;
    }

    if (!form.documentId || form.documentId === CREATE_NEW_DOCUMENT_VALUE) {
      setStatus({ type: "error", message: "Выберите документ" });
      return;
    }

    try {
      setStatus({
        type: "loading",
        message: "Сохраняем запись технического обслуживания...",
      });

      await createMutation.mutateAsync({
        operation: MAINTENANCE_OPERATION,
        fitmentId: form.fitmentId,
        railwayCisternsId: null,
        jobUserId: form.jobUserId,
        testUserId: form.testUserId,
        acceptUserId: form.acceptUserId,
        depoId: form.depoId,
        date: form.date,
        documentId: form.documentId,
      });

      const selectedFitment = fitments?.find((fitment) => fitment.id === form.fitmentId);

      if (selectedFitment && isNewerRepairDate(selectedFitment, form.date)) {
        setStatus({
          type: "loading",
          message: "Обновляем дату последнего ТО в справочнике арматуры...",
        });

        await updateFitmentMutation.mutateAsync({
          id: form.fitmentId,
          data: buildFitmentRepairUpdate(selectedFitment, form.date),
        });
      }

      setStatus({
        type: "success",
        message: "Запись технического обслуживания успешно добавлена",
      });
      setForm({ ...initialValues, depoId: defaultDepotId });
    } catch (err: unknown) {
      setStatus({
        type: "error",
        message:
          (err instanceof Error && !("response" in err) ? err.message : null) ||
          getErrorMessage(err) ||
          "Ошибка при добавлении записи ТО",
      });
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleDialogChange}>
        <DialogContent className="flex min-h-[500px] max-h-[95vh] flex-col justify-start sm:max-w-5xl">
          <DialogHeader className="shrink-0">
            <DialogTitle>Техническое обслуживание</DialogTitle>
            <DialogDescription>
              Заполните данные по техническому обслуживанию арматуры.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col justify-start space-y-4 overflow-y-auto">
            <div className="grid shrink-0 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="maintenance-fitmentId">Арматура *</Label>
                  <SearchableSelect
                    value={form.fitmentId}
                    onChange={(value) => handleChange("fitmentId", value)}
                    options={fitmentOptions}
                    placeholder="Выберите арматуру"
                    searchPlaceholder="Введите номер или паспорт"
                    isLoading={fitmentsLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maintenance-depoId">Место работы *</Label>
                  <SearchableSelect
                    value={form.depoId}
                    onChange={(value) => handleChange("depoId", value)}
                    options={depotOptions}
                    placeholder="Выберите депо"
                    searchPlaceholder="Введите код или название"
                    isLoading={depotsLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maintenance-testUserId">Испытание провёл *</Label>
                  <SearchableSelect
                    value={form.testUserId}
                    onChange={(value) => handleChange("testUserId", value)}
                    options={employeeOptions}
                    placeholder="Выберите сотрудника"
                    searchPlaceholder="Введите ФИО или должность"
                    isLoading={employeesLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maintenance-jobUserId">Работу произвёл *</Label>
                  <SearchableSelect
                    value={form.jobUserId}
                    onChange={(value) => handleChange("jobUserId", value)}
                    options={employeeOptions}
                    placeholder="Выберите сотрудника"
                    searchPlaceholder="Введите ФИО или должность"
                    isLoading={employeesLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maintenance-acceptUserId">Работу принял *</Label>
                  <SearchableSelect
                    value={form.acceptUserId}
                    onChange={(value) => handleChange("acceptUserId", value)}
                    options={employeeOptions}
                    placeholder="Выберите сотрудника"
                    searchPlaceholder="Введите ФИО или должность"
                    isLoading={employeesLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maintenance-date">Дата ТО *</Label>
                  <Input
                    id="maintenance-date"
                    type="date"
                    value={form.date}
                    onChange={(e) => handleChange("date", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maintenance-documentId">Документ *</Label>
                  <SearchableSelect
                    value={form.documentId}
                    onChange={handleDocumentChange}
                    options={documentOptions}
                    placeholder="Выберите документ"
                    searchPlaceholder="Введите номер, автора или дату"
                    isLoading={documentsLoading}
                  />
                </div>
              </div>

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

            <DialogFooter className="mt-auto gap-2 sm:justify-between">
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
              <Label htmlFor="maintenance-document-number">
                Номер <span className="text-red-500">*</span>
              </Label>
              <Input
                id="maintenance-document-number"
                value={documentFormData.number}
                onChange={(e) => updateDocumentFormField("number", e.target.value)}
                placeholder="Введите номер документа"
              />
            </div>
            <div>
              <Label htmlFor="maintenance-document-type">Тип</Label>
              <Select value={String(FITMENT_DOCUMENT_TYPE)} disabled>
                <SelectTrigger id="maintenance-document-type">
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
              <Label htmlFor="maintenance-document-date">
                Дата <span className="text-red-500">*</span>
              </Label>
              <Input
                id="maintenance-document-date"
                type="date"
                value={documentFormData.date}
                onChange={(e) => updateDocumentFormField("date", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="maintenance-document-author">Автор</Label>
              <Input
                id="maintenance-document-author"
                value={documentFormData.author ?? ""}
                onChange={(e) => updateDocumentFormField("author", e.target.value)}
                placeholder="Введите автора"
              />
            </div>
            <div>
              <Label htmlFor="maintenance-document-note">Примечание</Label>
              <Input
                id="maintenance-document-note"
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
