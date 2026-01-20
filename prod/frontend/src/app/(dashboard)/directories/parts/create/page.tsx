"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
} from "@/components/ui";
import { ArrowLeft, Save, Settings } from "lucide-react";
import Link from "next/link";
import {
  usePartTypeOptions,
  useStampNumberOptions,
  usePartStatusOptions,
  useCreateWheelPair,
  useCreateSideFrame,
  useCreateBolster,
  useCreateCoupler,
  useCreateShockAbsorber,
} from "@/hooks";
import { DepotSearchSelect } from "@/components/depots/DepotSearchSelect";
import {
  wheelPairSchema,
  sideFrameSchema,
  bolsterSchema,
  couplerSchema,
  shockAbsorberSchema,
  basePartSchema,
} from "@/schemas/parts.schema";
import type {
  CreateWheelPairDTO,
  CreateSideFrameDTO,
  CreateBolsterDTO,
  CreateCouplerDTO,
  CreateShockAbsorberDTO,
} from "@/types/directories";

export default function CreatePartPage() {
  const router = useRouter();

  // Mutations
  const createWheelPairMutation = useCreateWheelPair();
  const createSideFrameMutation = useCreateSideFrame();
  const createBolsterMutation = useCreateBolster();
  const createCouplerMutation = useCreateCoupler();
  const createShockAbsorberMutation = useCreateShockAbsorber();

  // Directory options
  const { data: partTypeOptions = [] } = usePartTypeOptions();
  const { data: stampNumberOptions = [] } = useStampNumberOptions();
  const { data: partStatusOptions = [] } = usePartStatusOptions();

  // Track selected part type
  const [selectedPartTypeId, setSelectedPartTypeId] = useState("");

  // Find selected part type code
  const selectedPartType = partTypeOptions.find((pt) => pt.value === selectedPartTypeId);
  const partTypeCode = selectedPartType
    ? parseInt(selectedPartType.label.match(/\[(\d+)\]/)?.[1] || "0")
    : 0;

  // Get schema based on part type
  const getSchema = () => {
    switch (partTypeCode) {
      case 1: return wheelPairSchema;
      case 2: return bolsterSchema;
      case 3: return sideFrameSchema;
      case 4: return couplerSchema;
      case 10: return shockAbsorberSchema;
      default: return basePartSchema;
    }
  };

  // Initialize form
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<any>({
    resolver: zodResolver(getSchema()),
    defaultValues: {
      partTypeId: "",
      stampNumberId: "",
      statusId: "",
      depotId: "",
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

  // Update schema when part type changes
  useEffect(() => {
    if (selectedPartTypeId !== form.getValues("partTypeId")) {
      form.setValue("partTypeId", selectedPartTypeId);
    }
  }, [selectedPartTypeId, form]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onSubmit = async (data: any) => {
    try {
      // Clean empty strings
      let cleanData = Object.fromEntries(
        Object.entries(data).map(([key, value]) => [key, value === "" ? undefined : value])
      ) as unknown;

      // Convert manufacture year to full date (January 1st of that year)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cleanData = (cleanData as any).manufactureYear
        ? {
            ...(cleanData as any),
            manufactureYear: `${(cleanData as any).manufactureYear}-01-01`,
          }
        : cleanData;

      switch (partTypeCode) {
        case 1:
          await createWheelPairMutation.mutateAsync(cleanData as CreateWheelPairDTO);
          break;
        case 2:
          await createBolsterMutation.mutateAsync(cleanData as CreateBolsterDTO);
          break;
        case 3:
          await createSideFrameMutation.mutateAsync(cleanData as CreateSideFrameDTO);
          break;
        case 4:
          await createCouplerMutation.mutateAsync(cleanData as CreateCouplerDTO);
          break;
        case 10:
          await createShockAbsorberMutation.mutateAsync(cleanData as CreateShockAbsorberDTO);
          break;
        default:
          alert("Выберите тип детали");
          return;
      }

      router.push("/directories/parts");
    } catch (error) {
      console.error("Error creating part:", error);
      alert("Ошибка при создании детали");
    }
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Part Type */}
                <FormField
                  control={form.control}
                  name="partTypeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Тип детали *</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          setSelectedPartTypeId(value);
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
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
          {partTypeCode > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Специфичные параметры</CardTitle>
                <CardDescription>
                  Параметры для типа: {selectedPartType?.label}
                </CardDescription>
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
                    <div className="md:col-span-2 lg:col-span-3">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Автосцепка не имеет дополнительных параметров
                      </p>
                    </div>
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
          )}

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
                createWheelPairMutation.isPending ||
                createSideFrameMutation.isPending ||
                createBolsterMutation.isPending ||
                createCouplerMutation.isPending ||
                createShockAbsorberMutation.isPending
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
