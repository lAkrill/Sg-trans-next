"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
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
  Skeleton,
} from "@/components/ui";
import { ArrowLeft, Save, Settings } from "lucide-react";
import Link from "next/link";
import {
  useStampNumberOptions,
  usePartStatusOptions,
  usePartById,
  useUpdateWheelPair,
  useUpdateSideFrame,
  useUpdateBolster,
  useUpdateCoupler,
  useUpdateShockAbsorber,
} from "@/hooks";
import { DepotSearchSelect } from "@/components/depots/DepotSearchSelect";
import { RailwayCisternSearchSelect } from "@/components/cisterns/RailwayCisternSearchSelect";
import {
  wheelPairUpdateSchema,
  sideFrameUpdateSchema,
  bolsterUpdateSchema,
  couplerUpdateSchema,
  shockAbsorberUpdateSchema,
  basePartUpdateSchema,
} from "@/schemas/parts.schema";
import type {
  UpdateWheelPairDTO,
  UpdateSideFrameDTO,
  UpdateBolsterDTO,
  UpdateCouplerDTO,
  UpdateShockAbsorberDTO,
} from "@/types/directories";

type PartFormRecord = Record<string, unknown>;
type DateOnlyValue = string | { year: number; month: number; day: number } | null | undefined;

function convertDateOnlyToString(value: DateOnlyValue): string {
  if (!value) return "";
  if (typeof value === "string" && value) return value;
  if (typeof value === "object" && "year" in value) {
    const { year, month, day } = value;
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  return "";
}

function withManufactureYearDate(data: PartFormRecord): PartFormRecord {
  const { manufactureYear } = data;
  if (manufactureYear == null || manufactureYear === "") return data;
  if (typeof manufactureYear === "number") {
    return { ...data, manufactureYear: `${manufactureYear}-01-01` };
  }
  return data;
}

function cleanFormData(data: PartFormRecord): PartFormRecord {
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [key, value === "" ? undefined : value])
  );
}

export default function EditPartPage() {
  const params = useParams();
  const router = useRouter();
  const partId = params.id as string;

  const { data: part, isLoading, error } = usePartById(partId);
  
  console.log("EditPartPage - partId:", partId, "isLoading:", isLoading, "error:", error, "part:", part);

  // Mutations
  const updateWheelPairMutation = useUpdateWheelPair();
  const updateSideFrameMutation = useUpdateSideFrame();
  const updateBolsterMutation = useUpdateBolster();
  const updateCouplerMutation = useUpdateCoupler();
  const updateShockAbsorberMutation = useUpdateShockAbsorber();

  // Directory options
  const { data: stampNumberOptions = [] } = useStampNumberOptions();
  const { data: partStatusOptions = [] } = usePartStatusOptions();

  const partTypeCode = part?.partType.code;

  // Get schema based on part type
  const getSchema = () => {
    if (!partTypeCode) return basePartUpdateSchema;
    switch (partTypeCode) {
      case 1: return wheelPairUpdateSchema;
      case 2: return bolsterUpdateSchema;
      case 3: return sideFrameUpdateSchema;
      case 4: return couplerUpdateSchema;
      case 10: return shockAbsorberUpdateSchema;
      default: return basePartUpdateSchema;
    }
  };

  // Initialize form
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<any>({
    resolver: zodResolver(getSchema()),
    defaultValues: {
      stampNumberId: "",
      statusId: "",
      depotId: "",
      currentLocation: "",
      serialNumber: "",
      manufactureYear: undefined,
      notes: "",
      // Wheel Pair
      thicknessLeft: undefined,
      thicknessRight: undefined,
      wheelType: "",
      // Side Frame & Bolster
      serviceLifeYears: undefined,
      extendedUntil: "",
      // Shock Absorber
      model: "",
      manufacturerCode: "",
      nextRepairDate: "",
    },
  });

  // Load data into form when part loads
  useEffect(() => {
    if (part) {
      console.log("Loading part data into form:", part);
      
      // Parse manufacture year - can be a date object from backend or string
      let manufYear: number | undefined;
      if (part.manufactureYear) {
        if (typeof part.manufactureYear === 'object' && 'year' in part.manufactureYear) {
          // DateOnly received as object
          manufYear = part.manufactureYear.year;
        } else if (typeof part.manufactureYear === 'string') {
          // DateOnly received as string YYYY-MM-DD
          manufYear = parseInt(part.manufactureYear.split('-')[0]);
        }
      }

      // Helper function to convert DateOnly to string YYYY-MM-DD
      const resetData = {
        stampNumberId: part.stampNumber.id,
        statusId: part.status.id,
        depotId: part.depot?.id || "",
        serialNumber: part.serialNumber || "",
        manufactureYear: manufYear,
        currentLocation: part.currentLocation?.id || "",
        notes: part.notes || "",
        // Wheel Pair
        thicknessLeft: part.wheelPair?.thicknessLeft,
        thicknessRight: part.wheelPair?.thicknessRight,
        wheelType: part.wheelPair?.wheelType || "",
        // Side Frame
        serviceLifeYears: part.sideFrame?.serviceLifeYears || part.bolster?.serviceLifeYears || part.shockAbsorber?.serviceLifeYears,
        extendedUntil: convertDateOnlyToString(part.sideFrame?.extendedUntil || part.bolster?.extendedUntil),
        // Shock Absorber
        model: part.shockAbsorber?.model || "",
        manufacturerCode: part.shockAbsorber?.manufacturerCode || "",
        nextRepairDate: convertDateOnlyToString(part.shockAbsorber?.nextRepairDate),
      };
      
      console.log("Reset data:", resetData);
      form.reset(resetData);
    }
  }, [part, form]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onSubmit = async (data: any) => {
    try {
      const cleanData = withManufactureYearDate(cleanFormData(data as PartFormRecord));

      switch (partTypeCode) {
        case 1:
          await updateWheelPairMutation.mutateAsync({ id: partId, data: cleanData as unknown as UpdateWheelPairDTO });
          break;
        case 2:
          await updateBolsterMutation.mutateAsync({ id: partId, data: cleanData as unknown as UpdateBolsterDTO });
          break;
        case 3:
          await updateSideFrameMutation.mutateAsync({ id: partId, data: cleanData as unknown as UpdateSideFrameDTO });
          break;
        case 4:
          await updateCouplerMutation.mutateAsync({ id: partId, data: cleanData as unknown as UpdateCouplerDTO });
          break;
        case 10:
          await updateShockAbsorberMutation.mutateAsync({ id: partId, data: cleanData as unknown as UpdateShockAbsorberDTO });
          break;
        default:
          alert("Неизвестный тип детали");
          return;
      }

      router.push("/directories/parts");
    } catch (error) {
      console.error("Error updating part:", error);
      alert("Ошибка при обновлении детали");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-12 w-full" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
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
          <Link href="/directories/parts">
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
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Основная информация</CardTitle>
              <CardDescription>Базовые данные о детали</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Part Type (disabled) */}
                <div className="space-y-2">
                  <FormLabel>Тип детали</FormLabel>
                  <Input value={part.partType.name} disabled />
                </div>

                {/* Stamp Number */}
                <FormField
                  control={form.control}
                  name="stampNumberId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Клеймо *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
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

                {/* Status */}
                <FormField
                  control={form.control}
                  name="statusId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Статус *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
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

                {/* Serial Number */}
                <FormField
                  control={form.control}
                  name="serialNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Заводской номер</FormLabel>
                      <FormControl>
                        <Input placeholder="Введите заводской номер" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Manufacture Year */}
                <FormField
                  control={form.control}
                  name="manufactureYear"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Год производства</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Введите год производства" 
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Depot with Search */}
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

                {/* Current Location */}
                <FormField
                  control={form.control}
                  name="currentLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Текущее местоположение (вагон)</FormLabel>
                      <FormControl>
                        <RailwayCisternSearchSelect
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Выберите вагон"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Notes */}
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Примечания</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Введите примечания"
                          rows={3}
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

          {/* Specific Fields */}
          <Card>
            <CardHeader>
              <CardTitle>Специфичные параметры</CardTitle>
              <CardDescription>Параметры для типа: {part.partType.name}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Wheel Pair Fields */}
                {partTypeCode === 1 && (
                  <>
                    <FormField
                      control={form.control}
                      name="thicknessLeft"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Толщина (левая)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.1"
                              placeholder="Введите толщину"
                              {...field}
                              onChange={(e) =>
                                field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="thicknessRight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Толщина (правая)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.1"
                              placeholder="Введите толщину"
                              {...field}
                              onChange={(e) =>
                                field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="wheelType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Тип колеса</FormLabel>
                          <FormControl>
                            <Input placeholder="Введите тип колеса" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                {/* Side Frame & Bolster Fields */}
                {(partTypeCode === 2 || partTypeCode === 3) && (
                  <>
                    <FormField
                      control={form.control}
                      name="serviceLifeYears"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Срок службы (лет)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Введите срок службы"
                              {...field}
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
                  </>
                )}

                {/* Coupler */}
                {partTypeCode === 4 && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Автосцепка не имеет дополнительных параметров
                  </p>
                )}

                {/* Shock Absorber Fields */}
                {partTypeCode === 10 && (
                  <>
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
                      name="manufacturerCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Код производителя</FormLabel>
                          <FormControl>
                            <Input placeholder="Введите код" {...field} />
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
                          <FormLabel>Срок службы (лет)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Введите срок службы"
                              {...field}
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
                      name="nextRepairDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Дата следующего ремонта</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            <Link href="/directories/parts">
              <Button type="button" variant="outline">
                Отмена
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={
                updateWheelPairMutation.isPending ||
                updateSideFrameMutation.isPending ||
                updateBolsterMutation.isPending ||
                updateCouplerMutation.isPending ||
                updateShockAbsorberMutation.isPending
              }
            >
              <Save className="h-4 w-4 mr-2" />
              Сохранить
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
