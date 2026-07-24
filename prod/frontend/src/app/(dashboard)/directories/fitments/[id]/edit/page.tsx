"use client";

import { useEffect, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { type DefaultValues, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  SearchableSelect,
  Skeleton,
} from "@/components/ui";
import { ArrowLeft, Save, Settings } from "lucide-react";
import Link from "next/link";
import {
  useFitmentTypeOptions,
  useFitmentModelOptions,
  useFitment,
  useFitments,
  useUpdateFitment,
  useCisternIdAndNumbers,
} from "@/hooks";
import { DepotSearchSelect } from "@/components/depots/DepotSearchSelect";
import { createFitmentSchema, type CreateFitmentFormData } from "@/schemas/fitments.schema";
import type { FitmentDTO, UpdateFitmentDTO } from "@/types/directories";

type FitmentFormRecord = Record<string, unknown>;

const editFitmentDefaultValues: DefaultValues<CreateFitmentFormData> = {
  fitmentTypeId: "",
  serialNumber: "",
  passportNumber: "",
  buildDate: "",
  lastRepairDate: "",
  periodRep: 0,
  serviceLifeYears: undefined,
  modelId: "",
  depotId: "",
  code: 0,
  locationDepoId: "",
  locationCisternId: "",
};

function toDateInputValue(value?: string | null): string {
  if (!value) return "";
  return value.split("T")[0] || value;
}

function nullableString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function nullableNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function toIsoDate(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return null;

  return parsedDate.toISOString();
}

const EMPTY_GUID = "00000000-0000-0000-0000-000000000000";

function pickId(...candidates: Array<string | null | undefined>): string {
  for (const value of candidates) {
    if (typeof value === "string" && value.trim() && value !== EMPTY_GUID) {
      return value;
    }
  }

  return "";
}

function mergeCurrentOption(
  options: { value: string; label: string }[],
  currentOption: { value: string; label: string } | null
): { value: string; label: string }[] {
  if (!currentOption?.value || options.some((option) => option.value === currentOption.value)) {
    return options;
  }

  return [currentOption, ...options];
}

function getLocationCode(fitment: FitmentDTO): number {
  if (typeof fitment.code === "number") return fitment.code;
  // 1 — депо (снятие), 2 — вагон (установка)
  if (fitment.locationDepoId || fitment.locationDepo?.id) return 1;
  if (fitment.locationCisternId || fitment.locationCistern?.id) return 2;
  return 0;
}

function buildFitmentDefaultValues(fitment: FitmentDTO): DefaultValues<CreateFitmentFormData> {
  return {
    fitmentTypeId: pickId(fitment.fitmentType?.id, fitment.fitmentTypeId),
    serialNumber: fitment.serialNumber || "",
    passportNumber: fitment.passportNumber || "",
    buildDate: toDateInputValue(fitment.buildDate),
    lastRepairDate: toDateInputValue(fitment.lastRepairDate),
    periodRep: fitment.periodRep ?? 0,
    serviceLifeYears: fitment.serviceLifeYears,
    modelId: pickId(fitment.model?.id, fitment.modelId),
    depotId: pickId(fitment.depot?.id, fitment.depotId),
    code: getLocationCode(fitment),
    locationDepoId: pickId(fitment.locationDepo?.id, fitment.locationDepoId),
    locationCisternId: pickId(fitment.locationCistern?.id, fitment.locationCisternId),
  };
}

function buildUpdateFitmentPayload(data: FitmentFormRecord): UpdateFitmentDTO {
  return {
    fitmentTypeId: String(data.fitmentTypeId),
    serialNumber: typeof data.serialNumber === "string" ? data.serialNumber : "",
    passportNumber: typeof data.passportNumber === "string" ? data.passportNumber : "",
    buildDate: toIsoDate(data.buildDate) ?? String(data.buildDate),
    lastRepairDate: toIsoDate(data.lastRepairDate),
    periodRep: nullableNumber(data.periodRep) ?? 0,
    serviceLifeYears: nullableNumber(data.serviceLifeYears) ?? 0,
    modelId: String(data.modelId),
    depotId: nullableString(data.depotId),
    code: nullableNumber(data.code) ?? 0,
    locationDepoId: nullableString(data.locationDepoId),
    locationCisternId: nullableString(data.locationCisternId),
  };
}

export default function EditFitmentPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fitmentId = params.id as string;
  const returnPage = searchParams.get("returnPage");
  const returnPageSize = searchParams.get("returnPageSize");
  const fitmentsListParams = new URLSearchParams();

  if (returnPage) fitmentsListParams.set("page", returnPage);
  if (returnPageSize) fitmentsListParams.set("pageSize", returnPageSize);

  const fitmentsListHref = fitmentsListParams.size
    ? `/directories/fitments?${fitmentsListParams.toString()}`
    : "/directories/fitments";

  const { data: fitment, isLoading, error } = useFitment(fitmentId);
  const { data: fitmentsList = [] } = useFitments();
  const updateFitmentMutation = useUpdateFitment();

  const { data: fitmentTypeOptions = [] } = useFitmentTypeOptions();
  const { data: fitmentModelOptions = [] } = useFitmentModelOptions();
  const { data: cisternIdAndNumbers = [], isLoading: cisternsLoading } = useCisternIdAndNumbers();
  const cisternOptions = cisternIdAndNumbers.map((cistern) => ({
    value: cistern.id,
    label: cistern.number,
  }));

  // getById иногда без depot — подстраховываемся данными из списка
  const fitmentFromList = fitmentsList.find((item) => item.id === fitmentId);
  const resolvedFitment = useMemo(() => {
    if (!fitment) return undefined;

    return {
      ...fitment,
      depot: fitment.depot ?? fitmentFromList?.depot,
      fitmentType: fitment.fitmentType ?? fitmentFromList?.fitmentType,
      model: fitment.model ?? fitmentFromList?.model,
    };
  }, [fitment, fitmentFromList]);

  const mergedFitmentTypeOptions = mergeCurrentOption(
    fitmentTypeOptions,
    resolvedFitment?.fitmentType
      ? {
          value: pickId(resolvedFitment.fitmentType.id, resolvedFitment.fitmentTypeId),
          label: `${resolvedFitment.fitmentType.name}${
            typeof resolvedFitment.fitmentType.code === "number"
              ? ` [${resolvedFitment.fitmentType.code}]`
              : ""
          }`,
        }
      : null
  );
  const mergedFitmentModelOptions = mergeCurrentOption(
    fitmentModelOptions,
    resolvedFitment?.model
      ? {
          value: pickId(resolvedFitment.model.id, resolvedFitment.modelId),
          label: resolvedFitment.model.name,
        }
      : null
  );
  const mergedCisternOptions = mergeCurrentOption(
    cisternOptions,
    resolvedFitment?.locationCistern
      ? {
          value: pickId(resolvedFitment.locationCistern.id, resolvedFitment.locationCisternId),
          label: resolvedFitment.locationCistern.number,
        }
      : null
  );
  const manufacturerLabel = resolvedFitment?.depot?.shortName || "";
  const locationDepotLabel = resolvedFitment?.locationDepo?.shortName || "";

  const form = useForm<CreateFitmentFormData>({
    resolver: zodResolver(createFitmentSchema),
    defaultValues: editFitmentDefaultValues,
  });

  const locationCode = form.watch("code");
  const fitmentTypeId = form.watch("fitmentTypeId");
  const modelId = form.watch("modelId");

  useEffect(() => {
    if (resolvedFitment) {
      form.reset(buildFitmentDefaultValues(resolvedFitment));
    }
  }, [form, resolvedFitment]);

  useEffect(() => {
    if (!resolvedFitment) return;

    if (locationCode === 0) {
      form.setValue("locationCisternId", "");
      form.setValue("locationDepoId", "");
      return;
    }

    if (locationCode === 1) {
      form.setValue("locationCisternId", "");
      return;
    }

    if (locationCode === 2) {
      form.setValue("locationDepoId", "");
    }
  }, [resolvedFitment, form, locationCode]);

  const onSubmit = async (data: CreateFitmentFormData) => {
    try {
      await updateFitmentMutation.mutateAsync({
        id: fitmentId,
        data: buildUpdateFitmentPayload(data),
      });

      router.push(fitmentsListHref);
    } catch (updateError) {
      console.error("Error updating fitment:", updateError);
      alert("Ошибка при обновлении арматуры");
    }
  };

  const handleResetForm = () => {
    if (resolvedFitment) {
      form.reset(buildFitmentDefaultValues(resolvedFitment));
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error || !fitment) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Ошибка</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Произошла ошибка при загрузке арматуры</p>
          <Link href={fitmentsListHref}>
            <Button className="mt-4" variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад к списку
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={fitmentsListHref}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад к списку
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Settings className="h-8 w-8" />
              Редактировать арматуру
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Изменение данных об арматуре: {resolvedFitment?.fitmentType?.name}
            </p>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Основная информация</CardTitle>
              <CardDescription>Базовые данные об арматуре</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 [&_[data-slot=select-trigger]]:w-full [&_[data-slot=select-trigger]]:min-w-0">
                <FormField
                  control={form.control}
                  name="fitmentTypeId"
                  render={({ field }) => {
                    const selectedTypeLabel =
                      mergedFitmentTypeOptions.find((option) => option.value === (field.value || fitmentTypeId))
                        ?.label ||
                      resolvedFitment?.fitmentType?.name ||
                      "Выберите тип арматуры";

                    return (
                      <FormItem>
                        <FormLabel>Тип арматуры *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <span className="truncate">{selectedTypeLabel}</span>
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {mergedFitmentTypeOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />

                <FormField
                  control={form.control}
                  name="modelId"
                  render={({ field }) => {
                    const selectedModelLabel =
                      mergedFitmentModelOptions.find((option) => option.value === (field.value || modelId))
                        ?.label ||
                      resolvedFitment?.model?.name ||
                      "Выберите модель";

                    return (
                      <FormItem>
                        <FormLabel>Модель *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <span className="truncate">{selectedModelLabel}</span>
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {mergedFitmentModelOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />

                <FormField
                  control={form.control}
                  name="depotId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Производитель</FormLabel>
                      <FormControl>
                        <DepotSearchSelect
                          value={field.value || resolvedFitment?.depot?.id || ""}
                          onValueChange={field.onChange}
                          placeholder="Выберите производителя"
                          selectedLabel={resolvedFitment?.depot?.shortName || manufacturerLabel}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="serialNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Заводской номер *</FormLabel>
                      <FormControl>
                        <Input placeholder="Введите заводской номер" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="passportNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Номер паспорта *</FormLabel>
                      <FormControl>
                        <Input placeholder="Введите номер паспорта" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="buildDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Дата постройки *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastRepairDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Дата последнего ТО</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="periodRep"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Период ремонта *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Введите период ремонта"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(e.target.value ? parseInt(e.target.value) : undefined)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="serviceLifeYears"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Срок службы (лет) *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Введите срок службы"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(e.target.value ? parseInt(e.target.value) : undefined)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Местоположение</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={String(field.value ?? 0)}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Выберите местоположение" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="0">Не установлена</SelectItem>
                          <SelectItem value="1">Депо</SelectItem>
                          <SelectItem value="2">Вагон</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {locationCode === 0 && (
                  <>
                    <div className="hidden md:block" />
                    <div className="hidden md:block" />
                  </>
                )}

                {locationCode === 1 && (
                  <>
                    <FormField
                      control={form.control}
                      name="locationDepoId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Депо</FormLabel>
                          <FormControl>
                            <DepotSearchSelect
                              value={field.value}
                              onValueChange={field.onChange}
                              placeholder="Выберите депо"
                              selectedLabel={locationDepotLabel}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="hidden md:block" />
                  </>
                )}

                {locationCode === 2 && (
                  <>
                    <FormField
                      control={form.control}
                      name="locationCisternId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Номер вагона-цистерны</FormLabel>
                          <FormControl>
                            <SearchableSelect
                              value={field.value}
                              onChange={field.onChange}
                              options={mergedCisternOptions}
                              placeholder="Выберите вагон-цистерну"
                              searchPlaceholder="Введите номер вагона"
                              isLoading={cisternsLoading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="hidden md:block" />
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between gap-4">
            <Button type="button" variant="outline" onClick={handleResetForm}>
              Сбросить изменения
            </Button>

            <div className="flex justify-end gap-4">
              <Link href={fitmentsListHref}>
                <Button type="button" variant="outline">
                  Отмена
                </Button>
              </Link>
              <Button type="submit" disabled={updateFitmentMutation.isPending}>
                <Save className="h-4 w-4 mr-2" />
                Сохранить
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
