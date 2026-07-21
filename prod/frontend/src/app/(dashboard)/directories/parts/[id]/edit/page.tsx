"use client";

import { useEffect } from "react";
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
  Textarea,
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
  usePartTypeOptions,
  useStampNumberOptions,
  usePartStatusOptions,
  usePartById,
  useDepotOptions,
  useUpdatePart,
  useAllDocuments,
  useCisternIdAndNumbers,
} from "@/hooks";
import { createPartSchema, type CreatePartFormData } from "@/schemas/parts.schema";
import type {
  PartDTO,
  UpdatePartDTO,
} from "@/types/directories";

type PartFormRecord = Record<string, unknown>;
type DateOnlyValue = string | { year: number; month: number; day: number } | null | undefined;

const editPartDefaultValues: DefaultValues<CreatePartFormData> = {
  partTypeId: "",
  stampNumberId: "",
  statusId: "",
  depotId: "",
  currentLocation: "",
  serialNumber: "",
  manufactureYear: undefined,
  notes: "",
  code: 0,
  documentId: "",
  serviceLifeYears: undefined,
  extendedUntil: "",
  model: "",
};

function convertDateOnlyToString(value: DateOnlyValue): string {
  if (!value) return "";
  if (typeof value === "string" && value) return value.split("T")[0] || value;
  if (typeof value === "object" && "year" in value) {
    const { year, month, day } = value;
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  return "";
}

function parseManufactureYear(value: DateOnlyValue): number | undefined {
  if (!value) return undefined;
  if (typeof value === "object" && "year" in value) return value.year;
  if (typeof value === "string") {
    const year = parseInt(value.split("-")[0]);
    return Number.isFinite(year) ? year : undefined;
  }
  return undefined;
}

function formatDocumentDate(date: string): string {
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return date;

  return parsedDate.toLocaleDateString("ru-RU");
}

function mergeCurrentOption(
  options: { value: string; label: string }[],
  currentOption: { value: string; label: string } | null
): { value: string; label: string }[] {
  if (!currentOption || options.some((option) => option.value === currentOption.value)) {
    return options;
  }

  return [currentOption, ...options];
}

function getStampNumberValue(part: PartDTO): string {
  const stampNumber = part.stampNumber as PartDTO["stampNumber"] & { Value?: string };
  return stampNumber.value || stampNumber.Value || "";
}

function nullableString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function nullableNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function manufactureYearDate(value: unknown): string | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return `${value}-01-01`;
  }

  return null;
}

function getLocationCode(part: PartDTO): number {
  if (typeof part.code === "number") return part.code;
  if (part.currentLocation?.id) return 1;
  if (part.depot?.id) return 2;
  return 0;
}

function getServiceLifeYears(part: PartDTO): number | undefined {
  const flatPart = part as PartDTO & { serviceLifeYears?: number | null };
  return flatPart.serviceLifeYears ?? undefined;
}

function buildPartDefaultValues(part: PartDTO): DefaultValues<CreatePartFormData> {
  const flatPart = part as PartDTO & {
    extendedUntil?: DateOnlyValue;
    model?: string | null;
  };

  return {
    partTypeId: part.partType.id,
    stampNumberId: part.stampNumber.id,
    statusId: part.status.id,
    depotId: part.depot?.id || "",
    currentLocation: part.currentLocation?.id || "",
    serialNumber: part.serialNumber || "",
    manufactureYear: parseManufactureYear(part.manufactureYear),
    notes: part.notes || "",
    code: getLocationCode(part),
    documentId: part.documentId || part.document?.id || "",
    serviceLifeYears: getServiceLifeYears(part),
    extendedUntil: convertDateOnlyToString(flatPart.extendedUntil),
    model: flatPart.model || "",
  };
}

function buildUpdatePartPayload(data: PartFormRecord): UpdatePartDTO {
  return {
    depotId: nullableString(data.depotId),
    stampNumberId: String(data.stampNumberId),
    serialNumber: typeof data.serialNumber === "string" ? data.serialNumber : "",
    manufactureYear: manufactureYearDate(data.manufactureYear),
    currentLocation: nullableString(data.currentLocation),
    statusId: String(data.statusId),
    notes: typeof data.notes === "string" ? data.notes : "",
    code: nullableNumber(data.code) ?? 0,
    documentId: nullableString(data.documentId),
    serviceLifeYears: nullableNumber(data.serviceLifeYears),
    extendedUntil: nullableString(data.extendedUntil),
    model: nullableString(data.model),
  };
}

export default function EditPartPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const partId = params.id as string;
  const returnPage = searchParams.get("returnPage");
  const returnPageSize = searchParams.get("returnPageSize");
  const returnType = searchParams.get("returnType");
  const partsListParams = new URLSearchParams();

  if (returnPage) partsListParams.set("page", returnPage);
  if (returnPageSize) partsListParams.set("pageSize", returnPageSize);
  if (returnType) partsListParams.set("type", returnType);

  const partsListHref = partsListParams.size
    ? `/directories/parts?${partsListParams.toString()}`
    : "/directories/parts";

  const { data: part, isLoading, error } = usePartById(partId);

  const updatePartMutation = useUpdatePart();

  const { data: partTypeOptions = [] } = usePartTypeOptions();
  const { data: stampNumberOptions = [] } = useStampNumberOptions();
  const { data: partStatusOptions = [] } = usePartStatusOptions();
  const { data: depotOptions = [], isLoading: depotsLoading } = useDepotOptions();
  const { data: documents = [], isLoading: documentsLoading } = useAllDocuments();
  const { data: cisternIdAndNumbers = [], isLoading: cisternsLoading } = useCisternIdAndNumbers();

  const documentOptions = documents.map((document) => ({
    value: document.id,
    label: `${document.number}(${formatDocumentDate(document.date)})`,
  }));
  const cisternOptions = cisternIdAndNumbers.map((cistern) => ({
    value: cistern.id,
    label: cistern.number,
  }));
  const mergedPartTypeOptions = mergeCurrentOption(
    partTypeOptions,
    part ? { value: part.partType.id, label: `${part.partType.name} [${part.partType.code}]` } : null
  );
  const mergedPartStatusOptions = mergeCurrentOption(
    partStatusOptions,
    part ? { value: part.status.id, label: part.status.name } : null
  );
  const mergedStampNumberOptions = mergeCurrentOption(
    stampNumberOptions,
    part ? { value: part.stampNumber.id, label: getStampNumberValue(part) } : null
  );
  const mergedDocumentOptions = mergeCurrentOption(
    documentOptions,
    part?.document
      ? {
          value: part.document.id,
          label: `${part.document.number}(${formatDocumentDate(part.document.date)})`,
        }
      : null
  );
  const mergedCisternOptions = mergeCurrentOption(
    cisternOptions,
    part?.currentLocation
      ? { value: part.currentLocation.id, label: part.currentLocation.number }
      : null
  );
  const mergedDepotOptions = mergeCurrentOption(
    depotOptions,
    part?.depot
      ? { value: part.depot.id, label: part.depot.shortName || part.depot.name }
      : null
  );

  const form = useForm<CreatePartFormData>({
    resolver: zodResolver(createPartSchema),
    defaultValues: editPartDefaultValues,
  });

  const locationCode = form.watch("code");

  useEffect(() => {
    if (part) {
      form.reset(buildPartDefaultValues(part));
    }
  }, [form, part]);

  useEffect(() => {
    if (locationCode === 0) {
      form.setValue("currentLocation", "");
      form.setValue("depotId", "");
      return;
    }

    if (locationCode === 1) {
      form.setValue("depotId", "");
      return;
    }

    if (locationCode === 2) {
      form.setValue("currentLocation", "");
    }
  }, [form, locationCode]);

  const isUpdating = updatePartMutation.isPending;

  const onSubmit = async (data: CreatePartFormData) => {
    try {
      const payload = buildUpdatePartPayload(data);
      await updatePartMutation.mutateAsync({ id: partId, data: payload });

      router.push(partsListHref);
    } catch (updateError) {
      console.error("Error updating part:", updateError);
      alert("Ошибка при обновлении детали");
    }
  };

  const handleResetForm = () => {
    if (part) {
      form.reset(buildPartDefaultValues(part));
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

  if (error || !part) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Ошибка</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Произошла ошибка при загрузке детали</p>
          <Link href={partsListHref}>
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
          <Link href={partsListHref}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад к списку
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Settings className="h-8 w-8" />
              Редактировать деталь
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Изменение данных о детали: {part.partType.name}
            </p>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Основная информация</CardTitle>
              <CardDescription>Базовые данные о детали</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 [&_[data-slot=select-trigger]]:w-full [&_[data-slot=select-trigger]]:min-w-0">
                <FormField
                  control={form.control}
                  name="partTypeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Тип детали *</FormLabel>
                      <Select disabled value={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={part.partType.name} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {mergedPartTypeOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="statusId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Статус *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Выберите статус" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {mergedPartStatusOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="documentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Документ</FormLabel>
                      <FormControl>
                        <SearchableSelect
                          value={field.value}
                          onChange={field.onChange}
                          options={mergedDocumentOptions}
                          placeholder="Выберите документ"
                          searchPlaceholder="Введите номер или дату"
                          isLoading={documentsLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="stampNumberId"
                  render={({ field }) => {
                    const stampNumberValue = field.value || part.stampNumber.id;
                    const selectedStampNumberLabel =
                      mergedStampNumberOptions.find((option) => option.value === stampNumberValue)?.label ||
                      getStampNumberValue(part);

                    return (
                      <FormItem>
                        <FormLabel>Клеймо *</FormLabel>
                        <Select onValueChange={field.onChange} value={stampNumberValue}>
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <span className="truncate">
                                {selectedStampNumberLabel || "Выберите клеймо"}
                              </span>
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {mergedStampNumberOptions.map((option) => (
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
                  name="manufactureYear"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Год производства *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Введите год производства"
                          {...field}
                          value={field.value || ""}
                          onChange={(event) =>
                            field.onChange(event.target.value ? parseInt(event.target.value) : undefined)
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
                          <SelectItem value="1">Вагон</SelectItem>
                          <SelectItem value="2">Депо</SelectItem>
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
                      name="currentLocation"
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

                {locationCode === 2 && (
                  <>
                    <div className="hidden md:block" />

                    <FormField
                      control={form.control}
                      name="depotId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Депо</FormLabel>
                          <FormControl>
                            <SearchableSelect
                              value={field.value}
                              onChange={field.onChange}
                              options={mergedDepotOptions}
                              placeholder="Выберите депо"
                              searchPlaceholder="Введите депо"
                              isLoading={depotsLoading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                <FormField
                  control={form.control}
                  name="model"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Модель</FormLabel>
                      <FormControl>
                        <Input placeholder="Введите модель" {...field} />
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
                          onChange={(event) =>
                            field.onChange(event.target.value ? parseInt(event.target.value) : undefined)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="extendedUntil"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Продлен до</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem className="md:col-span-3">
                      <FormLabel>Примечание</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Введите примечание"
                          rows={1}
                          className="h-9 min-h-9 resize-none py-1"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between gap-4">
            <Button type="button" variant="outline" onClick={handleResetForm}>
              Сбросить изменения
            </Button>

            <div className="flex justify-end gap-4">
              <Link href={partsListHref}>
                <Button type="button" variant="outline">
                  Отмена
                </Button>
              </Link>
              <Button type="submit" disabled={isUpdating}>
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
