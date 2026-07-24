"use client";

import { useState } from "react";
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
  useAllUsers,
  useCisternIdAndNumbers,
  useCreateDocument,
  useCreateFitmentEquipment,
  useDepots,
  useFitments,
  useUpdateFitment,
} from "@/hooks";
import { fitmentEquipmentApi } from "@/api/directories";
import { formatDate } from "@/lib/formatDate";
import type { FitmentDTO, FitmentEquipmentDTO, UpdateFitmentDTO } from "@/types/directories";

type BindFitmentFormData = {
  railwayCisternsId: string;
  operation: string;
  fitmentId: string;
  jobUserId: string;
  testUserId: string;
  depoId: string;
  date: string;
  documentId: string;
};

type RequestStatus = {
  type: "loading" | "success" | "error";
  message: string;
};

/** Шаблонный документ: при выборе создаётся новый документ на основе данных формы */
const TEMPLATE_DOCUMENT_ID = "a63d2f42-355c-44b6-90b5-7bc522ab7f04";

const initialValues: BindFitmentFormData = {
  railwayCisternsId: "",
  operation: "2",
  fitmentId: "",
  jobUserId: "",
  testUserId: "",
  depoId: "",
  date: "",
  documentId: "",
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
  railwayCisternsId: string
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
    locationDepoId: isRemoval ? depoId || null : null,
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
  const createMutation = useCreateFitmentEquipment();
  const createDocumentMutation = useCreateDocument();
  const updateFitmentMutation = useUpdateFitment();

  const { data: cisternIdAndNumbers, isLoading: cisternsLoading } = useCisternIdAndNumbers();
  const { data: fitments, isLoading: fitmentsLoading } = useFitments();
  const { data: users, isLoading: usersLoading } = useAllUsers();
  const { data: depots, isLoading: depotsLoading } = useDepots();
  const { data: documents, isLoading: documentsLoading } = useAllDocuments();

  const isSubmitting =
    createMutation.isPending ||
    createDocumentMutation.isPending ||
    updateFitmentMutation.isPending;

  const cisternOptions =
    cisternIdAndNumbers?.map((cistern) => ({
      value: cistern.id,
      label: cistern.number,
    })) || [];

  const fitmentOptions =
    fitments?.map((fitment) => ({
      value: fitment.id,
      label: `(${fitment.serialNumber || "—"}; ${fitment.passportNumber || "—"}) — ${
        fitment.fitmentType?.name || "—"
      }`,
    })) || [];

  const userOptions =
    users?.map((user) => ({
      value: user.id,
      label: `${[user.lastName, user.firstName].filter(Boolean).join(" ")} (${user.email})`,
    })) || [];

  const depotOptions =
    depots?.map((depot) => ({
      value: depot.id,
      label: `${depot.shortName || depot.name} (${depot.code})`,
    })) || [];

  const documentOptions =
    documents?.map((document) => ({
      value: document.id,
      label: `${document.number} (${document.author || "—"}, ${formatDate(document.date, "ru-RU", "—")})`,
    })) || [];

  const handleChange = (field: keyof BindFitmentFormData, value: string) => {
    setStatus(null);
    setForm((current) => ({
      ...current,
      [field]: value,
      ...(field === "operation" && value !== "2" ? { railwayCisternsId: "" } : {}),
    }));
  };

  const handleDialogChange = (nextOpen: boolean) => {
    if (isSubmitting) return;
    onOpenChange(nextOpen);
    if (!nextOpen) {
      setStatus(null);
    }
  };

  const handleReset = () => {
    setForm(initialValues);
    setStatus(null);
  };

  const resolveDocumentId = async (): Promise<string | undefined> => {
    if (!form.documentId) return undefined;

    if (form.documentId !== TEMPLATE_DOCUMENT_ID) {
      return form.documentId;
    }

    const selectedFitment = fitments?.find((fitment) => fitment.id === form.fitmentId);
    const selectedJobUser = users?.find((user) => user.id === form.jobUserId);

    if (!selectedFitment?.passportNumber) {
      throw new Error("У выбранной арматуры отсутствует номер паспорта");
    }

    if (!form.date) {
      throw new Error("Укажите дату привязки для создания документа");
    }

    if (!selectedJobUser) {
      throw new Error("Выберите сотрудника, который произвёл работу");
    }

    const author = [selectedJobUser.lastName, selectedJobUser.firstName]
      .filter(Boolean)
      .join(" ")
      .trim();

    if (!author) {
      throw new Error("У выбранного сотрудника отсутствует ФИО");
    }

    setStatus({
      type: "loading",
      message: "Создаём документ...",
    });

    const newDocumentId = await createDocumentMutation.mutateAsync({
      number: `${selectedFitment.passportNumber}-${form.date}`,
      type: 2,
      date: form.date,
      author,
      price: null,
      note: null,
    });

    return newDocumentId;
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

    if (operation === 1 && !form.depoId) {
      setStatus({
        type: "error",
        message: "Выберите место работы для снятия арматуры",
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

    try {
      setStatus({
        type: "loading",
        message: "Загружаем последнюю привязку арматуры...",
      });

      const lastBinding = await fitmentEquipmentApi.getLastByFitment(form.fitmentId);

      const documentId = await resolveDocumentId();

      setStatus({
        type: "loading",
        message: "Отправляем запрос на привязку арматуры...",
      });

      await createMutation.mutateAsync({
        operation,
        fitmentId: form.fitmentId,
        railwayCisternsId:
          operation === 2 ? form.railwayCisternsId : form.railwayCisternsId || undefined,
        jobUserId: form.jobUserId || undefined,
        testUserId: form.testUserId || undefined,
        depoId: form.depoId || undefined,
        date: form.date || undefined,
        documentId,
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
            form.railwayCisternsId
          ),
        });
      }

      setStatus({
        type: "success",
        message: "Арматура успешно привязана",
      });
      setForm(initialValues);
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
                  onValueChange={(value) => handleChange("operation", value)}
                >
                  <SelectTrigger id="bind-operation" className="w-full">
                    <SelectValue placeholder="Выберите операцию" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">Установка</SelectItem>
                    <SelectItem value="1">Снятие</SelectItem>
                    <SelectItem value="0">Не указана</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bind-fitmentId">Арматура *</Label>
                <SearchableSelect
                  value={form.fitmentId}
                  onChange={(value) => handleChange("fitmentId", value)}
                  options={fitmentOptions}
                  placeholder="Выберите арматуру"
                  searchPlaceholder="Введите номер или паспорт"
                  isLoading={fitmentsLoading}
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
                <Label htmlFor="bind-depoId">Место работы *</Label>
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
                <Label htmlFor="bind-testUserId">Испытание провёл *</Label>
                <SearchableSelect
                  value={form.testUserId}
                  onChange={(value) => handleChange("testUserId", value)}
                  options={userOptions}
                  placeholder="Выберите сотрудника"
                  searchPlaceholder="Введите ФИО или email"
                  isLoading={usersLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bind-jobUserId">Работу произвёл *</Label>
                <SearchableSelect
                  value={form.jobUserId}
                  onChange={(value) => handleChange("jobUserId", value)}
                  options={userOptions}
                  placeholder="Выберите сотрудника"
                  searchPlaceholder="Введите ФИО или email"
                  isLoading={usersLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bind-date">Дата привязки *</Label>
                <Input
                  id="bind-date"
                  type="date"
                  value={form.date}
                  onChange={(e) => handleChange("date", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bind-documentId">Документ *</Label>
                <SearchableSelect
                  value={form.documentId}
                  onChange={(value) => handleChange("documentId", value)}
                  options={documentOptions}
                  placeholder="Выберите документ"
                  searchPlaceholder="Введите номер, автора или дату"
                  isLoading={documentsLoading}
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
  );
}
