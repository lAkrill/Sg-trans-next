"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
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
} from "@/components/ui";
import { ArrowLeft, Save, Settings } from "lucide-react";
import Link from "next/link";
import {
  useFitmentTypeOptions,
  useFitmentModelOptions,
  useCreateFitment,
  useCisternIdAndNumbers,
} from "@/hooks";
import { DepotSearchSelect } from "@/components/depots/DepotSearchSelect";
import { createFitmentSchema, type CreateFitmentFormData } from "@/schemas/fitments.schema";
import type { CreateFitmentDTO } from "@/types/directories";

type FitmentFormRecord = Record<string, unknown>;

const createFitmentDefaultValues: DefaultValues<CreateFitmentFormData> = {
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

function buildCreateFitmentPayload(data: FitmentFormRecord): CreateFitmentDTO {
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

export default function CreateFitmentPage() {
  const router = useRouter();

  const createFitmentMutation = useCreateFitment();

  const { data: fitmentTypeOptions = [] } = useFitmentTypeOptions();
  const { data: fitmentModelOptions = [] } = useFitmentModelOptions();
  const { data: cisternIdAndNumbers = [], isLoading: cisternsLoading } = useCisternIdAndNumbers();
  const cisternOptions = cisternIdAndNumbers.map((cistern) => ({
    value: cistern.id,
    label: cistern.number,
  }));

  const form = useForm<CreateFitmentFormData>({
    resolver: zodResolver(createFitmentSchema),
    defaultValues: createFitmentDefaultValues,
  });

  const locationCode = form.watch("code");

  useEffect(() => {
    if (locationCode === 0) {
      form.setValue("locationCisternId", "");
      form.setValue("locationDepoId", "");
      return;
    }

    if (locationCode === 1) {
      form.setValue("locationDepoId", "");
      return;
    }

    if (locationCode === 2) {
      form.setValue("locationCisternId", "");
    }
  }, [form, locationCode]);

  const onSubmit = async (data: CreateFitmentFormData) => {
    try {
      await createFitmentMutation.mutateAsync(buildCreateFitmentPayload(data));

      router.push("/directories/fitments");
    } catch (error) {
      console.error("Error creating fitment:", error);
      alert("Ошибка при создании арматуры");
    }
  };

  const handleClearForm = () => {
    form.reset(createFitmentDefaultValues);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/directories/fitments">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад к списку
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Settings className="h-8 w-8" />
              Добавить арматуру
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Создание новой записи об арматуре
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
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Тип арматуры *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Выберите тип арматуры" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {fitmentTypeOptions.map((option) => (
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
                  name="modelId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Модель *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Выберите модель" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {fitmentModelOptions.map((option) => (
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
                  name="depotId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Производитель</FormLabel>
                      <FormControl>
                        <DepotSearchSelect
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Выберите производителя"
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
                      name="locationCisternId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Номер вагона-цистерны</FormLabel>
                          <FormControl>
                            <SearchableSelect
                              value={field.value}
                              onChange={field.onChange}
                              options={cisternOptions}
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
            <Button type="button" variant="outline" onClick={handleClearForm}>
              Очистить форму
            </Button>

            <div className="flex justify-end gap-4">
              <Link href="/directories/fitments">
                <Button type="button" variant="outline">
                  Отмена
                </Button>
              </Link>
              <Button type="submit" disabled={createFitmentMutation.isPending}>
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
