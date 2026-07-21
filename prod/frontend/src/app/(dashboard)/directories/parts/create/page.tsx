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
} from "@/components/ui";
import { ArrowLeft, Save, Settings } from "lucide-react";
import Link from "next/link";
import {
  usePartTypeOptions,
  useStampNumberOptions,
  usePartStatusOptions,
  useCreatePart,
  useAllDocuments,
  useCisternIdAndNumbers,
} from "@/hooks";
import { DepotSearchSelect } from "@/components/depots/DepotSearchSelect";
import { createPartSchema, type CreatePartFormData } from "@/schemas/parts.schema";
import type { CreatePartDTO } from "@/types/directories";

type PartFormRecord = Record<string, unknown>;

const createPartDefaultValues: DefaultValues<CreatePartFormData> = {
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

function formatDocumentDate(date: string): string {
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return date;

  return parsedDate.toLocaleDateString("ru-RU");
}

function buildCreatePartPayload(data: PartFormRecord): CreatePartDTO {
  return {
    partTypeId: String(data.partTypeId),
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

export default function CreatePartPage() {
  const router = useRouter();

  const createPartMutation = useCreatePart();

  // Directory options
  const { data: partTypeOptions = [] } = usePartTypeOptions();
  const { data: stampNumberOptions = [] } = useStampNumberOptions();
  const { data: partStatusOptions = [] } = usePartStatusOptions();
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

  // Initialize form
  const form = useForm<CreatePartFormData>({
    resolver: zodResolver(createPartSchema),
    defaultValues: createPartDefaultValues,
  });

  const locationCode = form.watch("code");

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

  const onSubmit = async (data: CreatePartFormData) => {
    try {
      await createPartMutation.mutateAsync(buildCreatePartPayload(data));

      router.push("/directories/parts");
    } catch (error) {
      console.error("Error creating part:", error);
      alert("Ошибка при создании детали");
    }
  };

  const handleClearForm = () => {
    form.reset(createPartDefaultValues);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/directories/parts">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад к списку
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Settings className="h-8 w-8" />
              Добавить деталь
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Создание новой записи о детали
            </p>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
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
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Выберите тип детали" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {partTypeOptions.map((option) => (
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
                          {partStatusOptions.map((option) => (
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
                          options={documentOptions}
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
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Клеймо *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Выберите клеймо" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {stampNumberOptions.map((option) => (
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
                      name="currentLocation"
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
                    <div className="hidden md:block" />

                    <FormField
                      control={form.control}
                      name="depotId"
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

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-4">
            <Button type="button" variant="outline" onClick={handleClearForm}>
              Очистить форму
            </Button>

            <div className="flex justify-end gap-4">
              <Link href="/directories/parts">
                <Button type="button" variant="outline">
                  Отмена
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={createPartMutation.isPending}
              >
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
