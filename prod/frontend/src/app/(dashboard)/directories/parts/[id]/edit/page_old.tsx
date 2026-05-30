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
import { ArrowLeft, Save, Settings } from "lucide-react";
import Link from "next/link";
import {
  useDepotOptions,
  useStampNumberOptions,
  usePartStatusOptions,
  usePartById,
  useUpdateWheelPair,
  useUpdateSideFrame,
  useUpdateBolster,
  useUpdateCoupler,
  useUpdateShockAbsorber,
} from "@/hooks";
import type {
  UpdateWheelPairDTO,
  UpdateSideFrameDTO,
  UpdateBolsterDTO,
  UpdateCouplerDTO,
  UpdateShockAbsorberDTO,
} from "@/types/directories";

export default function EditPartPage() {
  const params = useParams();
  const router = useRouter();
  const partId = params.id as string;

  const { data: part, isLoading, error } = usePartById(partId);

  // Mutations for different part types
  const updateWheelPairMutation = useUpdateWheelPair();
  const updateSideFrameMutation = useUpdateSideFrame();
  const updateBolsterMutation = useUpdateBolster();
  const updateCouplerMutation = useUpdateCoupler();
  const updateShockAbsorberMutation = useUpdateShockAbsorber();

  // Directory options
  const { data: depotOptions = [] } = useDepotOptions();
  const { data: stampNumberOptions = [] } = useStampNumberOptions();
  const { data: partStatusOptions = [] } = usePartStatusOptions();

  // Form state - base fields
  const [depotId, setDepotId] = useState("");
  const [stampNumberId, setStampNumberId] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [manufactureYear, setManufactureYear] = useState("");
  const [currentLocation, setCurrentLocation] = useState("");
  const [statusId, setStatusId] = useState("");
  const [notes, setNotes] = useState("");

  // Specific fields for each part type
  // Wheel Pair
  const [thicknessLeft, setThicknessLeft] = useState<number>();
  const [thicknessRight, setThicknessRight] = useState<number>();
  const [wheelType, setWheelType] = useState("");

  // Side Frame & Bolster
  const [serviceLifeYears, setServiceLifeYears] = useState<number>();
  const [extendedUntil, setExtendedUntil] = useState("");

  // Shock Absorber
  const [model, setModel] = useState("");
  const [manufacturerCode, setManufacturerCode] = useState("");
  const [nextRepairDate, setNextRepairDate] = useState("");

  // Initialize form data when part data loads
  useEffect(() => {
    if (part) {
      setDepotId(part.depot?.id || "");
      setStampNumberId(part.stampNumber.id);
      setSerialNumber(part.serialNumber || "");
      setManufactureYear(
        typeof part.manufactureYear === "string"
          ? part.manufactureYear
          : part.manufactureYear?.year != null
            ? String(part.manufactureYear.year)
            : ""
      );
      setCurrentLocation(part.currentLocation || "");
      setStatusId(part.status.id);
      setNotes(part.notes || "");

      // Set specific fields based on part type
      if (part.wheelPair) {
        setThicknessLeft(part.wheelPair.thicknessLeft);
        setThicknessRight(part.wheelPair.thicknessRight);
        setWheelType(part.wheelPair.wheelType || "");
      }

      if (part.sideFrame) {
        setServiceLifeYears(part.sideFrame.serviceLifeYears);
        setExtendedUntil(part.sideFrame.extendedUntil || "");
      }

      if (part.bolster) {
        setServiceLifeYears(part.bolster.serviceLifeYears);
        setExtendedUntil(part.bolster.extendedUntil || "");
      }

      if (part.shockAbsorber) {
        setModel(part.shockAbsorber.model || "");
        setManufacturerCode(part.shockAbsorber.manufacturerCode || "");
        setServiceLifeYears(part.shockAbsorber.serviceLifeYears);
        setNextRepairDate(part.shockAbsorber.nextRepairDate || "");
      }
    }
  }, [part]);

  const partTypeCode = part?.partType.code;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Validate required fields
      if (!stampNumberId || !statusId) {
        alert("Заполните все обязательные поля");
        return;
      }

      // Base data
      const baseData = {
        depotId: depotId || undefined,
        stampNumberId,
        serialNumber: serialNumber || undefined,
        manufactureYear: manufactureYear || undefined,
        currentLocation: currentLocation || undefined,
        statusId,
        notes: notes || undefined,
      };

      // Update appropriate part type based on the current part
      switch (partTypeCode) {
        case 1: // Колесная пара
          const wheelPairData: UpdateWheelPairDTO = {
            ...baseData,
            thicknessLeft,
            thicknessRight,
            wheelType: wheelType || undefined,
          };
          await updateWheelPairMutation.mutateAsync({ id: partId, data: wheelPairData });
          break;

        case 2: // Надрессорная балка
          const bolsterData: UpdateBolsterDTO = {
            ...baseData,
            serviceLifeYears,
            extendedUntil: extendedUntil || undefined,
          };
          await updateBolsterMutation.mutateAsync({ id: partId, data: bolsterData });
          break;

        case 3: // Боковая рама
          const sideFrameData: UpdateSideFrameDTO = {
            ...baseData,
            serviceLifeYears,
            extendedUntil: extendedUntil || undefined,
          };
          await updateSideFrameMutation.mutateAsync({ id: partId, data: sideFrameData });
          break;

        case 4: // Автосцепка
          const couplerData: UpdateCouplerDTO = {
            ...baseData,
          };
          await updateCouplerMutation.mutateAsync({ id: partId, data: couplerData });
          break;

        case 10: // Поглощающий аппарат
          const shockAbsorberData: UpdateShockAbsorberDTO = {
            ...baseData,
            model: model || undefined,
            manufacturerCode: manufacturerCode || undefined,
            nextRepairDate: nextRepairDate || undefined,
            serviceLifeYears,
          };
          await updateShockAbsorberMutation.mutateAsync({ id: partId, data: shockAbsorberData });
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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information - Single Card Full Width */}
        <Card>
          <CardHeader>
            <CardTitle>Основная информация</CardTitle>
            <CardDescription>Базовые данные о детали</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Тип детали</Label>
                <Input value={part.partType.name} disabled />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stampNumberId">Клеймо *</Label>
                <Select value={stampNumberId} onValueChange={setStampNumberId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите клеймо" />
                  </SelectTrigger>
                  <SelectContent>
                    {stampNumberOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="statusId">Статус *</Label>
                <Select value={statusId} onValueChange={setStatusId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите статус" />
                  </SelectTrigger>
                  <SelectContent>
                    {partStatusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="serialNumber">Заводской номер</Label>
                <Input
                  id="serialNumber"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  placeholder="Введите заводской номер"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="manufactureYear">Год производства</Label>
                <Input
                  id="manufactureYear"
                  value={manufactureYear}
                  onChange={(e) => setManufactureYear(e.target.value)}
                  placeholder="Введите год производства"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="depotId">Депо</Label>
                <Select value={depotId} onValueChange={setDepotId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите депо" />
                  </SelectTrigger>
                  <SelectContent>
                    {depotOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentLocation">Текущее местоположение</Label>
                <Input
                  id="currentLocation"
                  value={currentLocation}
                  onChange={(e) => setCurrentLocation(e.target.value)}
                  placeholder="Введите местоположение"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes">Примечания</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Введите примечания"
                  rows={3}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Specific Fields Based on Part Type */}
        <Card>
          <CardHeader>
            <CardTitle>Специфичные параметры</CardTitle>
            <CardDescription>Параметры для типа: {part.partType.name}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {partTypeCode === 1 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="thicknessLeft">Толщина (левая)</Label>
                    <Input
                      id="thicknessLeft"
                      type="number"
                      step="0.1"
                      value={thicknessLeft || ""}
                      onChange={(e) =>
                        setThicknessLeft(
                          e.target.value ? parseFloat(e.target.value) : undefined
                        )
                      }
                      placeholder="Введите толщину левого колеса"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="thicknessRight">Толщина (правая)</Label>
                    <Input
                      id="thicknessRight"
                      type="number"
                      step="0.1"
                      value={thicknessRight || ""}
                      onChange={(e) =>
                        setThicknessRight(
                          e.target.value ? parseFloat(e.target.value) : undefined
                        )
                      }
                      placeholder="Введите толщину правого колеса"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wheelType">Тип колеса</Label>
                    <Input
                      id="wheelType"
                      value={wheelType}
                      onChange={(e) => setWheelType(e.target.value)}
                      placeholder="Введите тип колеса"
                    />
                  </div>
                </>
              )}

              {(partTypeCode === 2 || partTypeCode === 3) && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="serviceLifeYears">Срок службы (лет)</Label>
                    <Input
                      id="serviceLifeYears"
                      type="number"
                      value={serviceLifeYears || ""}
                      onChange={(e) =>
                        setServiceLifeYears(
                          e.target.value ? parseInt(e.target.value) : undefined
                        )
                      }
                      placeholder="Введите срок службы"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="extendedUntil">Продлен до</Label>
                    <Input
                      id="extendedUntil"
                      type="date"
                      value={extendedUntil}
                      onChange={(e) => setExtendedUntil(e.target.value)}
                    />
                  </div>
                </>
              )}

              {partTypeCode === 4 && (
                <p className="text-sm text-gray-600">
                  Автосцепка не имеет дополнительных параметров
                </p>
              )}

              {partTypeCode === 10 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="model">Модель</Label>
                    <Input
                      id="model"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      placeholder="Введите модель"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="manufacturerCode">Код производителя</Label>
                    <Input
                      id="manufacturerCode"
                      value={manufacturerCode}
                      onChange={(e) => setManufacturerCode(e.target.value)}
                      placeholder="Введите код производителя"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="serviceLifeYears">Срок службы (лет)</Label>
                    <Input
                      id="serviceLifeYears"
                      type="number"
                      value={serviceLifeYears || ""}
                      onChange={(e) =>
                        setServiceLifeYears(
                          e.target.value ? parseInt(e.target.value) : undefined
                        )
                      }
                      placeholder="Введите срок службы"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nextRepairDate">Дата следующего ремонта</Label>
                    <Input
                      id="nextRepairDate"
                      type="date"
                      value={nextRepairDate}
                      onChange={(e) => setNextRepairDate(e.target.value)}
                    />
                  </div>
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
    </div>
  );
}
