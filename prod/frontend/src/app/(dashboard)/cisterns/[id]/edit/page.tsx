"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
} from "@/components/ui";
import { ArrowLeft, Train, Save, X } from "lucide-react";
import Link from "next/link";
import {
  useManufacturerOptions,
  useWagonTypeOptions,
  useWagonModelOptions,
  useAffiliationOptions,
  useOwnerOptions,
  useRegistrarOptions,
  useCistern,
  useUpdateCistern,
} from "@/hooks";
import type { UpdateRailwayCisternDTO } from "@/types/cisterns";

export default function EditCisternPage() {
  const params = useParams();
  const router = useRouter();
  const cisternId = params.id as string;

  const { data: cistern, isLoading, error, refetch } = useCistern(cisternId);
  const updateMutation = useUpdateCistern();

  // Directory options
  const { data: manufacturerOptions = [], isLoading: loadingManufacturers } = useManufacturerOptions();
  const { data: wagonTypeOptions = [], isLoading: loadingWagonTypes } = useWagonTypeOptions();
  const { data: wagonModelOptions = [], isLoading: loadingWagonModels } = useWagonModelOptions();
  const { data: affiliationOptions = [], isLoading: loadingAffiliations } = useAffiliationOptions();
  const { data: ownerOptions = [], isLoading: loadingOwners } = useOwnerOptions();
  const { data: registrarOptions = [], isLoading: loadingRegistrars } = useRegistrarOptions();

  const [formData, setFormData] = useState<Partial<UpdateRailwayCisternDTO>>({});

  // Separate states for select values to handle loading properly
  const [selectValues, setSelectValues] = useState({
    manufacturerId: "",
    typeId: "",
    modelId: "",
    ownerId: "",
    registrarId: "",
    affiliationId: "",
  });

  // Reset state when cisternId changes (switching between different cisterns)
  useEffect(() => {
    setFormData({});
    setSelectValues({
      manufacturerId: "",
      typeId: "",
      modelId: "",
      ownerId: "",
      registrarId: "",
      affiliationId: "",
    });
    // Force refetch data for the new cistern
    if (refetch) {
      refetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cisternId]); // Intentionally not including refetch

  // Initialize form data when cistern data loads or cisternId changes
  useEffect(() => {
    if (cistern) {
      setFormData({
        id: cistern.id,
        number: cistern.number,
        serialNumber: cistern.serialNumber,
        registrationNumber: cistern.registrationNumber,
        notes: cistern.notes,
        substance: cistern.substance,
        tareWeight: cistern.tareWeight,
        loadCapacity: cistern.loadCapacity,
        length: cistern.length,
        axleCount: cistern.axleCount,
        volume: cistern.volume,
        fillingVolume: cistern.fillingVolume,
        initialTareWeight: cistern.initialTareWeight,
        pressure: cistern.pressure,
        testPressure: cistern.testPressure,
        serviceLifeYears: cistern.serviceLifeYears,
        dangerClass: cistern.dangerClass,
        tareWeight2: cistern.tareWeight2,
        tareWeight3: cistern.tareWeight3,
        buildDate: cistern.buildDate,
        commissioningDate: cistern.commissioningDate,
        registrationDate: cistern.registrationDate,
        reRegistrationDate: cistern.reRegistrationDate,
        manufacturerId: cistern.manufacturer?.id || "",
        typeId: cistern.type?.id || "",
        modelId: cistern.model?.id || "",
        ownerId: cistern.owner?.id || "",
        registrarId: cistern.registrar?.id || "",
        affiliationId: cistern.affiliation?.id || "",
        techConditions: cistern.techConditions,
        pripiska: cistern.pripiska,
        rent: cistern.rent,
        periodMajorRepair: cistern.periodMajorRepair,
        periodPeriodicTest: cistern.periodPeriodicTest,
        periodIntermediateTest: cistern.periodIntermediateTest,
        periodDepotRepair: cistern.periodDepotRepair,
      });
    }
  }, [cistern]);

  // Initialize select values when directories are loaded or cisternId changes
  useEffect(() => {
    if (
      cistern && 
      !loadingManufacturers && 
      !loadingWagonTypes && 
      !loadingAffiliations && 
      !loadingWagonModels && 
      !loadingOwners && 
      !loadingRegistrars
    ) {
      const newSelectValues = {
        manufacturerId: cistern.manufacturer?.id || "",
        typeId: cistern.type?.id || "",
        modelId: cistern.model?.id || "",
        ownerId: cistern.owner?.id || "",
        registrarId: cistern.registrar?.id || "",
        affiliationId: cistern.affiliation?.id || "",
      };
      setSelectValues(newSelectValues);
    }
  }, [
    cistern,
    cisternId,
    loadingManufacturers,
    loadingWagonTypes,
    loadingAffiliations,
    loadingWagonModels,
    loadingOwners,
    loadingRegistrars,
  ]);

  const handleInputChange = (field: keyof UpdateRailwayCisternDTO, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Also update select values if it's a select field
    if (["manufacturerId", "typeId", "modelId", "ownerId", "registrarId", "affiliationId"].includes(field)) {
      setSelectValues((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Validate required fields
      if (!formData.number || !formData.serialNumber || !formData.registrationNumber) {
        alert("Заполните все обязательные поля");
        return;
      }

      // Validate directory fields
      if (!selectValues.manufacturerId) {
        alert("Выберите производителя");
        return;
      }

      if (!selectValues.typeId) {
        alert("Выберите тип вагона");
        return;
      }

      if (!selectValues.affiliationId) {
        alert("Выберите принадлежность");
        return;
      }

      await updateMutation.mutateAsync({
        id: cisternId,
        data: formData as UpdateRailwayCisternDTO,
      });

      router.push(`/cisterns/${cisternId}`);
    } catch (error) {
      console.error("Error updating cistern:", error);
      alert("Ошибка при обновлении цистерны");
    }
  };

  if (error) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Link href="/cisterns">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад к списку
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              Ошибка загрузки данных: {error instanceof Error ? error.message : "Неизвестная ошибка"}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Link href="/cisterns">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад к списку
            </Button>
          </Link>
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <Skeleton key={j} className="h-10 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!cistern) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Link href="/cisterns">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад к списку
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-gray-600">Цистерна не найдена</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/cisterns/${cisternId}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад к паспорту
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Train className="h-8 w-8" />
              Редактировать цистерну {cistern.number}
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Изменение данных о железнодорожной цистерне</p>
          </div>
        </div>
      </div>

      <form key={cisternId} onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Основная информация</CardTitle>
              <CardDescription>Базовые данные о цистерне</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="number">Номер цистерны *</Label>
                <Input
                  id="number"
                  value={formData.number || ""}
                  onChange={(e) => handleInputChange("number", e.target.value)}
                  placeholder="Введите номер цистерны"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="serialNumber">Серийный номер *</Label>
                <Input
                  id="serialNumber"
                  value={formData.serialNumber || ""}
                  onChange={(e) => handleInputChange("serialNumber", e.target.value)}
                  placeholder="Введите серийный номер"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="buildDate">Дата постройки</Label>
                <Input
                  id="buildDate"
                  type="date"
                  value={formData.buildDate || ""}
                  onChange={(e) => handleInputChange("buildDate", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="commissioningDate">Дата ввода в эксплуатацию</Label>
                <Input
                  id="commissioningDate"
                  type="date"
                  value={formData.commissioningDate || ""}
                  onChange={(e) => handleInputChange("commissioningDate", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Technical Specifications */}
          <Card>
            <CardHeader>
              <CardTitle>Технические характеристики</CardTitle>
              <CardDescription>Технические параметры цистерны</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tareWeight">Тара (т)</Label>
                  <Input
                    id="tareWeight"
                    type="number"
                    step="0.1"
                    value={formData.tareWeight || ""}
                    onChange={(e) => handleInputChange("tareWeight", parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="loadCapacity">Грузоподъемность (т)</Label>
                  <Input
                    id="loadCapacity"
                    type="number"
                    step="0.1"
                    value={formData.loadCapacity || ""}
                    onChange={(e) => handleInputChange("loadCapacity", parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="length">Длина (мм)</Label>
                  <Input
                    id="length"
                    type="number"
                    value={formData.length || ""}
                    onChange={(e) => handleInputChange("length", parseInt(e.target.value) || 0)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="axleCount">Количество осей</Label>
                  <Select
                    value={formData.axleCount?.toString() || "4"}
                    onValueChange={(value) => handleInputChange("axleCount", parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="4">4</SelectItem>
                      <SelectItem value="6">6</SelectItem>
                      <SelectItem value="8">8</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="volume">Объем (м³)</Label>
                  <Input
                    id="volume"
                    type="number"
                    step="0.1"
                    value={formData.volume || ""}
                    onChange={(e) => handleInputChange("volume", parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fillingVolume">Объем налива (м³)</Label>
                  <Input
                    id="fillingVolume"
                    type="number"
                    step="0.1"
                    value={formData.fillingVolume || ""}
                    onChange={(e) => handleInputChange("fillingVolume", parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Registration Information */}
          <Card>
            <CardHeader>
              <CardTitle>Регистрационная информация</CardTitle>
              <CardDescription>Данные о регистрации цистерны</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="registrationNumber">Регистрационный номер *</Label>
                <Input
                  id="registrationNumber"
                  value={formData.registrationNumber || ""}
                  onChange={(e) => handleInputChange("registrationNumber", e.target.value)}
                  placeholder="Введите регистрационный номер"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="registrationDate">Дата регистрации</Label>
                <Input
                  id="registrationDate"
                  type="date"
                  value={formData.registrationDate || ""}
                  onChange={(e) => handleInputChange("registrationDate", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reRegistrationDate">Дата перерегистрации</Label>
                <Input
                  id="reRegistrationDate"
                  type="date"
                  value={formData.reRegistrationDate || ""}
                  onChange={(e) => handleInputChange("reRegistrationDate", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Directory Information */}
          <Card>
            <CardHeader>
              <CardTitle>Справочная информация</CardTitle>
              <CardDescription>Производитель, тип, принадлежность и другие справочные данные</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="manufacturerId">Производитель *</Label>
                  <Select
                    key={`manufacturer-${selectValues.manufacturerId}`}
                    value={selectValues.manufacturerId || ""}
                    onValueChange={(value) => handleInputChange("manufacturerId", value)}
                    disabled={loadingManufacturers}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите производителя" />
                    </SelectTrigger>
                    <SelectContent>
                      {manufacturerOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="typeId">Тип вагона *</Label>
                  <Select
                    key={`type-${selectValues.typeId}`}
                    value={selectValues.typeId || ""}
                    onValueChange={(value) => handleInputChange("typeId", value)}
                    disabled={loadingWagonTypes}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите тип вагона" />
                    </SelectTrigger>
                    <SelectContent>
                      {wagonTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="modelId">Модель вагона</Label>
                  <Select
                    key={`model-${selectValues.modelId}`}
                    value={selectValues.modelId || "none"}
                    onValueChange={(value) => {
                      const actualValue = value === "none" ? "" : value;
                      handleInputChange("modelId", actualValue);
                      setSelectValues((prev) => ({ ...prev, modelId: actualValue }));
                    }}
                    disabled={loadingWagonModels}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите модель вагона" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Не выбрано</SelectItem>
                      {wagonModelOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="affiliationId">Принадлежность *</Label>
                  <Select
                    key={`affiliation-${selectValues.affiliationId}`}
                    value={selectValues.affiliationId || ""}
                    onValueChange={(value) => handleInputChange("affiliationId", value)}
                    disabled={loadingAffiliations}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите принадлежность" />
                    </SelectTrigger>
                    <SelectContent>
                      {affiliationOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ownerId">Собственник</Label>
                  <Select
                    key={`owner-${selectValues.ownerId}`}
                    value={selectValues.ownerId || "none"}
                    onValueChange={(value) => {
                      const actualValue = value === "none" ? "" : value;
                      handleInputChange("ownerId", actualValue);
                      setSelectValues((prev) => ({ ...prev, ownerId: actualValue }));
                    }}
                    disabled={loadingOwners}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите собственника" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Не выбрано</SelectItem>
                      {ownerOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="registrarId">Регистратор</Label>
                  <Select
                    key={`registrar-${selectValues.registrarId}`}
                    value={selectValues.registrarId || "none"}
                    onValueChange={(value) => {
                      const actualValue = value === "none" ? "" : value;
                      handleInputChange("registrarId", actualValue);
                      setSelectValues((prev) => ({ ...prev, registrarId: actualValue }));
                    }}
                    disabled={loadingRegistrars}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите регистратора" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Не выбрано</SelectItem>
                      {registrarOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Safety Information */}
          <Card>
            <CardHeader>
              <CardTitle>Информация о безопасности</CardTitle>
              <CardDescription>Данные о безопасности и перевозимых веществах</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dangerClass">Класс опасности</Label>
                  <Select
                    value={formData.dangerClass?.toString() || "3"}
                    onValueChange={(value) => handleInputChange("dangerClass", parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 - Взрывчатые вещества</SelectItem>
                      <SelectItem value="2">2 - Газы</SelectItem>
                      <SelectItem value="3">3 - Легковоспламеняющиеся жидкости</SelectItem>
                      <SelectItem value="4">4 - Легковоспламеняющиеся твердые вещества</SelectItem>
                      <SelectItem value="5">5 - Окисляющие вещества</SelectItem>
                      <SelectItem value="6">6 - Ядовитые вещества</SelectItem>
                      <SelectItem value="7">7 - Радиоактивные материалы</SelectItem>
                      <SelectItem value="8">8 - Коррозионные вещества</SelectItem>
                      <SelectItem value="9">9 - Прочие опасные вещества</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="substance">Вещество</Label>
                  <Input
                    id="substance"
                    value={formData.substance || ""}
                    onChange={(e) => handleInputChange("substance", e.target.value)}
                    placeholder="Название перевозимого вещества"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pressure">Рабочее давление (МПа)</Label>
                  <Input
                    id="pressure"
                    type="number"
                    step="0.1"
                    value={formData.pressure || ""}
                    onChange={(e) => handleInputChange("pressure", parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="testPressure">Испытательное давление (МПа)</Label>
                  <Input
                    id="testPressure"
                    type="number"
                    step="0.1"
                    value={formData.testPressure || ""}
                    onChange={(e) => handleInputChange("testPressure", parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Дополнительная информация</CardTitle>
              <CardDescription>Дополнительные параметры и примечания</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="serviceLifeYears">Срок службы (лет)</Label>
                  <Input
                    id="serviceLifeYears"
                    type="number"
                    value={formData.serviceLifeYears || ""}
                    onChange={(e) => handleInputChange("serviceLifeYears", parseInt(e.target.value) || 0)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tareWeight2">Тара 2 (т)</Label>
                  <Input
                    id="tareWeight2"
                    type="number"
                    step="0.1"
                    value={formData.tareWeight2 || ""}
                    onChange={(e) => handleInputChange("tareWeight2", parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tareWeight3">Тара 3 (т)</Label>
                  <Input
                    id="tareWeight3"
                    type="number"
                    step="0.1"
                    value={formData.tareWeight3 || ""}
                    onChange={(e) => handleInputChange("tareWeight3", parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="initialTareWeight">Первоначальная тара (т)</Label>
                  <Input
                    id="initialTareWeight"
                    type="number"
                    step="0.1"
                    value={formData.initialTareWeight || ""}
                    onChange={(e) => handleInputChange("initialTareWeight", parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Примечания</Label>
                <Textarea
                  id="notes"
                  value={formData.notes || ""}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  placeholder="Дополнительные примечания..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Operational Information */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Информация об эксплуатации и ремонте</CardTitle>
              <CardDescription>Данные о техническом состоянии и сроках проверок</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="techConditions">Техническое состояние</Label>
                  <Input
                    id="techConditions"
                    value={formData.techConditions || ""}
                    onChange={(e) => handleInputChange("techConditions", e.target.value)}
                    placeholder="Описание технического состояния"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pripiska">Приписка</Label>
                  <Input
                    id="pripiska"
                    value={formData.pripiska || ""}
                    onChange={(e) => handleInputChange("pripiska", e.target.value)}
                    placeholder="Место приписки"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rent">Аренда</Label>
                  <Input
                    id="rent"
                    value={formData.rent || ""}
                    onChange={(e) => handleInputChange("rent", e.target.value)}
                    placeholder="Данные об аренде"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="periodMajorRepair">Дата планового капитального ремонта</Label>
                  <Input
                    id="periodMajorRepair"
                    type="date"
                    value={formData.periodMajorRepair || ""}
                    onChange={(e) => handleInputChange("periodMajorRepair", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="periodPeriodicTest">Дата плановой периодической проверки</Label>
                  <Input
                    id="periodPeriodicTest"
                    type="date"
                    value={formData.periodPeriodicTest || ""}
                    onChange={(e) => handleInputChange("periodPeriodicTest", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="periodIntermediateTest">Дата промежуточной проверки</Label>
                  <Input
                    id="periodIntermediateTest"
                    type="date"
                    value={formData.periodIntermediateTest || ""}
                    onChange={(e) => handleInputChange("periodIntermediateTest", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="periodDepotRepair">Дата планового деповского ремонта</Label>
                  <Input
                    id="periodDepotRepair"
                    type="date"
                    value={formData.periodDepotRepair || ""}
                    onChange={(e) => handleInputChange("periodDepotRepair", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-4">
          <Link href={`/cisterns/${cisternId}`}>
            <Button type="button" variant="outline">
              <X className="h-4 w-4 mr-2" />
              Отмена
            </Button>
          </Link>
          <Button type="submit" disabled={updateMutation.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {updateMutation.isPending ? "Сохранение..." : "Сохранить изменения"}
          </Button>
        </div>
      </form>
    </div>
  );
}
