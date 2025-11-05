"use client";

import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
  Button, 
  Input, 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow, 
  Badge, 
  Skeleton, 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui";
import { Search, FileText, History, RefreshCw, Download, Calendar, Wrench, MapPin } from "lucide-react";
import { usePartEquipmentsByCistern, useLastPartEquipmentsByCistern } from "@/hooks";
import { LastEquipmentDTO } from "@/types/directories";

interface PartEquipmentListProps {
  cisternId: string;
}

// Функция для определения категории оборудования
const getEquipmentCategory = (partTypeName?: string): "wheels" | "trucks" | "couplers" | "other" => {
  if (!partTypeName) return "other";

  const name = partTypeName.toLowerCase();

  // Колесные пары
  if (name.includes("колес") || name.includes("пар") || name.includes("wheel")) {
    return "wheels";
  }

  // Детали тележек
  if (
    name.includes("тележ") ||
    name.includes("рам") ||
    name.includes("балк") ||
    name.includes("truck") ||
    name.includes("frame") ||
    name.includes("bolster")
  ) {
    return "trucks";
  }

  // Автосцепное оборудование
  if (
    name.includes("автосцеп") ||
    name.includes("сцеп") ||
    name.includes("поглощ") ||
    name.includes("хомут") ||
    name.includes("coupler") ||
    name.includes("absorber")
  ) {
    return "couplers";
  }

  return "other";
};

// Компонент таблицы для колесных пар
const WheelPairsTable = ({ equipments }: { equipments: LastEquipmentDTO[] }) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return `${String(date.getMonth() + 1).padStart(2, "0")}.${date.getFullYear()}`;
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Учёт колесных пар</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                Наименование <br />
                показателя
              </TableHead>
              <TableHead>Код детали</TableHead>
              <TableHead>
                Код неиспр. <br />
                детали
              </TableHead>
              <TableHead>
                Код ЖД <br />
                администр.
              </TableHead>
              <TableHead>Код предпр-изг.</TableHead>
              <TableHead>Номер детали</TableHead>
              <TableHead>Год изготовления</TableHead>
              <TableHead>
                Год работы <br />с деталью
              </TableHead>
              <TableHead>
                Код вида <br />
                работы
              </TableHead>
              <TableHead>Дата работы</TableHead>
              <TableHead>
                Код вида <br />
                ремонта (?)
              </TableHead>
              <TableHead>Толщина обода (Л/П)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {equipments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={12} className="text-center py-8">
                  Колесные пары не установлены
                </TableCell>
              </TableRow>
            ) : (
              equipments.map((equipment) => (
                <TableRow key={equipment.equipmentTypeId}>
                  <TableCell>{equipment.equipmentTypeName}</TableCell>
                  <TableCell>{equipment.lastEquipment.equipmentType?.code || "—"}</TableCell>
                  <TableCell>{equipment.lastEquipment.defectsId || "—"}</TableCell>
                  <TableCell>{equipment.lastEquipment.adminOwnerId || "—"}</TableCell>
                  <TableCell>{equipment.lastEquipment.jobDepot?.code || "—"}</TableCell>
                  <TableCell>
                    {equipment.lastEquipment.part?.stampInfo?.value ||
                      equipment.lastEquipment.part?.serialNumber ||
                      "—"}
                  </TableCell>
                  <TableCell>{equipment.lastEquipment.part?.manufactureYear || "—"}</TableCell>
                  <TableCell>
                    {equipment.lastEquipment.jobDate ? new Date(equipment.lastEquipment.jobDate).getFullYear() : "—"}
                  </TableCell>
                  <TableCell>{equipment.lastEquipment.jobTypeId || "—"}</TableCell>
                  <TableCell>{formatDate(equipment.lastEquipment.documetnDate)}</TableCell>
                  <TableCell>{equipment.lastEquipment.repairType?.code || "—"}</TableCell>
                  <TableCell>
                    {equipment.lastEquipment.thicknessLeft && equipment.lastEquipment.thicknessRight
                      ? `${equipment.lastEquipment.thicknessLeft}/${equipment.lastEquipment.thicknessRight}`
                      : "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

// Компонент таблицы для деталей тележек
const TruckPartsTable = ({ equipments }: { equipments: LastEquipmentDTO[] }) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return `${String(date.getMonth() + 1).padStart(2, "0")}.${date.getFullYear()}`;
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Детали тележек</CardTitle>
        <CardDescription>Надрессорные балки, боковые рамы</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                Наименование <br />
                показателя
              </TableHead>
              <TableHead>Код детали</TableHead>
              <TableHead>
                Код неиспр. <br />
                детали
              </TableHead>
              <TableHead>
                Код ЖД <br />
                администр.
              </TableHead>
              <TableHead>Код предпр-изг.</TableHead>
              <TableHead>
                Номер детали <br />
                (клейма)
              </TableHead>
              <TableHead>Год изготовления</TableHead>
              <TableHead>Код вида работы</TableHead>
              <TableHead>Дата работы</TableHead>
              <TableHead>Код вида тележки</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {equipments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8">
                  Детали тележек не установлены
                </TableCell>
              </TableRow>
            ) : (
              equipments.map((equipment) => (
                <TableRow key={equipment.equipmentTypeId}>
                  <TableCell>{equipment.equipmentTypeName}</TableCell>
                  <TableCell>{equipment.lastEquipment.equipmentType?.code || "—"}</TableCell>
                  <TableCell>{equipment.lastEquipment.defectsId || "—"}</TableCell>
                  <TableCell>{equipment.lastEquipment.adminOwnerId || "—"}</TableCell>
                  <TableCell>{equipment.lastEquipment.jobDepot?.code || "—"}</TableCell>
                  <TableCell>
                    {equipment.lastEquipment.part?.stampInfo?.value ||
                      equipment.lastEquipment.part?.serialNumber ||
                      "—"}
                  </TableCell>
                  <TableCell>{equipment.lastEquipment.part?.manufactureYear || "—"}</TableCell>
                  <TableCell>{equipment.lastEquipment.jobTypeId || "—"}</TableCell>
                  <TableCell>{formatDate(equipment.lastEquipment.documetnDate)}</TableCell>
                  <TableCell>{equipment.lastEquipment.truckType || "—"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

// Компонент таблицы для автосцепного оборудования
const CouplerEquipmentTable = ({ equipments }: { equipments: LastEquipmentDTO[] }) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return `${String(date.getMonth() + 1).padStart(2, "0")}.${date.getFullYear()}`;
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Автосцепное оборудование</CardTitle>
        <CardDescription>Автосцепка, поглощающие аппараты, тяговые хомуты</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                Наименование <br />
                показателя
              </TableHead>
              <TableHead>Код детали</TableHead>
              <TableHead>
                Код неиспр. <br />
                детали
              </TableHead>
              <TableHead>
                Код ЖД <br />
                администр.
              </TableHead>
              <TableHead>Код предпр-изг.</TableHead>
              <TableHead>
                Номер детали <br />
                (клейма)
              </TableHead>
              <TableHead>Год изготовления</TableHead>
              <TableHead>
                Код вида <br />
                работы
              </TableHead>
              <TableHead>Дата работы</TableHead>
              <TableHead>
                Код вида <br />
                ремонта (?)
              </TableHead>
              <TableHead>Примечание</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {equipments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-8">
                  Автосцепное оборудование не установлено
                </TableCell>
              </TableRow>
            ) : (
              equipments.map((equipment) => (
                <TableRow key={equipment.equipmentTypeId}>
                  <TableCell>{equipment.equipmentTypeName}</TableCell>
                  <TableCell>{equipment.lastEquipment.equipmentType?.code || "—"}</TableCell>
                  <TableCell>{equipment.lastEquipment.defectsId || "—"}</TableCell>
                  <TableCell>{equipment.lastEquipment.adminOwnerId || "—"}</TableCell>
                  <TableCell>{equipment.lastEquipment.jobDepot?.code || "—"}</TableCell>
                  <TableCell>
                    {equipment.lastEquipment.part?.stampInfo?.value ||
                      equipment.lastEquipment.part?.serialNumber ||
                      "—"}
                  </TableCell>
                  <TableCell>{equipment.lastEquipment.part?.manufactureYear || "—"}</TableCell>
                  <TableCell>{equipment.lastEquipment.jobTypeId || "—"}</TableCell>
                  <TableCell>{formatDate(equipment.lastEquipment.documetnDate)}</TableCell>
                  <TableCell>{equipment.lastEquipment.repairType?.code || "—"}</TableCell>
                  <TableCell className="max-w-xs truncate">{equipment.lastEquipment.notes || "—"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export function PartEquipmentList({ cisternId }: PartEquipmentListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("current");

  const { data: allEquipments, isLoading: isLoadingAll, error: errorAll } = usePartEquipmentsByCistern(cisternId);

  const {
    data: lastEquipments,
    isLoading: isLoadingLast,
    error: errorLast,
  } = useLastPartEquipmentsByCistern(cisternId);

  const getOperationText = (operation: number) => {
    switch (operation) {
      case 1:
        return { text: "Демонтаж", variant: "destructive" as const };
      case 2:
        return { text: "Монтаж", variant: "default" as const };
      default:
        return { text: "Неизвестно", variant: "secondary" as const };
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("ru-RU");
  };

  // Группировка оборудования по категориям
  const groupedEquipments = {
    wheels:
      lastEquipments?.filter((eq) => getEquipmentCategory(eq.lastEquipment.equipmentType?.partTypeName) === "wheels") ||
      [],
    trucks:
      lastEquipments?.filter((eq) => getEquipmentCategory(eq.lastEquipment.equipmentType?.partTypeName) === "trucks") ||
      [],
    couplers:
      lastEquipments?.filter(
        (eq) => getEquipmentCategory(eq.lastEquipment.equipmentType?.partTypeName) === "couplers"
      ) || [],
  };

  const filteredAllEquipments =
    allEquipments?.filter((equipment) => {
      if (!searchTerm) return true;
      const search = searchTerm.toLowerCase();
      return (
        equipment.equipmentType?.name?.toLowerCase().includes(search) ||
        equipment.jobDepot?.name?.toLowerCase().includes(search) ||
        equipment.depot?.name?.toLowerCase().includes(search) ||
        equipment.repairType?.name?.toLowerCase().includes(search) ||
        equipment.notes?.toLowerCase().includes(search)
      );
    }) || [];

  if (errorAll || errorLast) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Ошибка</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Произошла ошибка при загрузке данных оборудования</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Лист комплектации</h3>
          <p className="text-sm text-gray-600">Информация об установленном оборудовании и истории изменений</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Экспорт
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Обновить
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="current" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Текущая комплектация
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Полная история
          </TabsTrigger>
        </TabsList>

        {/* Поиск */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по типу оборудования, депо..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        {/* Текущая комплектация */}
        <TabsContent value="current">
          {isLoadingLast ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              <WheelPairsTable equipments={groupedEquipments.wheels} />
              <TruckPartsTable equipments={groupedEquipments.trucks} />
              <CouplerEquipmentTable equipments={groupedEquipments.couplers} />
            </div>
          )}
        </TabsContent>

        {/* Полная история */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                История изменений оборудования
              </CardTitle>
              <CardDescription>Полная история установки и демонтажа оборудования</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingAll ? (
                <div className="space-y-2">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Дата операции</TableHead>
                      <TableHead>Операция</TableHead>
                      <TableHead>Тип оборудования</TableHead>
                      <TableHead>Рабочее депо</TableHead>
                      <TableHead>Депо</TableHead>
                      <TableHead>Тип ремонта</TableHead>
                      <TableHead>Толщина колес (мм)</TableHead>
                      <TableHead>Тип тележки</TableHead>
                      <TableHead>Примечания</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAllEquipments
                      .sort((a, b) => {
                        const dateA = new Date(a.documetnDate || 0);
                        const dateB = new Date(b.documetnDate || 0);
                        return dateB.getTime() - dateA.getTime();
                      })
                      .map((equipment) => {
                        const operation = getOperationText(equipment.operation);
                        return (
                          <TableRow key={equipment.id}>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                {formatDate(equipment.document?.date)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={operation.variant}>{operation.text}</Badge>
                            </TableCell>
                            <TableCell className="font-medium">
                              <div>
                                <div>{equipment.equipmentType?.name || "—"}</div>
                                {equipment.equipmentType?.code && (
                                  <div className="text-xs text-gray-500">Код: {equipment.equipmentType.code}</div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Wrench className="h-4 w-4 text-gray-400" />
                                {equipment.jobDepot?.shortName || equipment.jobDepot?.name || "—"}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4 text-gray-400" />
                                {equipment.depot?.shortName || equipment.depot?.name || "—"}
                              </div>
                            </TableCell>
                            <TableCell>{equipment.repairType?.name || "—"}</TableCell>
                            <TableCell>
                              {equipment.thicknessLeft && equipment.thicknessRight
                                ? `${equipment.thicknessLeft}/${equipment.thicknessRight}`
                                : "—"}
                            </TableCell>
                            <TableCell>{equipment.truckType ? `Тип ${equipment.truckType}` : "—"}</TableCell>
                            <TableCell className="max-w-xs truncate">{equipment.notes || "—"}</TableCell>
                          </TableRow>
                        );
                      })}
                    {filteredAllEquipments.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8">
                          {allEquipments?.length === 0 ? "История изменений пуста" : "Записи не найдены"}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
