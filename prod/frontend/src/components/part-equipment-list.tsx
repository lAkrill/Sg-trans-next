"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Badge,
  Checkbox,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@/components/ui";
import {
  Search,
  FileText,
  History,
  RefreshCw,
  Download,
  Calendar,
  Wrench,
  MapPin,
  AlertTriangle,
} from "lucide-react";
import { usePartEquipmentsByCistern, useLastPartEquipmentsByCistern, useAllUsers } from "@/hooks";
import { LastEquipmentDTO } from "@/types/directories";

interface PartEquipmentListProps {
  cisternId: string;
}

type NonConformityMarks = Record<string, boolean>;

interface NonConformityTableProps {
  equipments: LastEquipmentDTO[];
  nonConformityMarks: NonConformityMarks;
  onToggleNonConformity: (equipmentTypeId: string, checked: boolean) => void;
}

interface SelectedNonConformityItem {
  id: string;
  category: string;
  name: string;
  details: string;
}

const CATEGORY_LABELS = {
  wheels: "Колесные пары",
  trucks: "Детали тележек",
  couplers: "Автосцепное оборудование",
  history: "История изменений",
} as const;

const getPartDetails = (equipment: LastEquipmentDTO) => {
  const part = equipment.lastEquipment.part;
  const stamp = part?.stampInfo?.value || "—";
  const serial = part?.serialNumber || "—";
  const year = part?.manufactureYear ? new Date(part.manufactureYear).getFullYear() : "—";
  return `${stamp}; ${serial}; ${year}`;
};

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
const WheelPairsTable = ({
  equipments,
  nonConformityMarks,
  onToggleNonConformity,
}: NonConformityTableProps) => {
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
              <TableHead>
                Код ЖД <br />
                администр.
              </TableHead>
              <TableHead>
                Деталь
                <br />
                (код пред.; завод. номер; год){" "}
              </TableHead>
              <TableHead>
                Код п-я работы <br /> с деталью
              </TableHead>
              <TableHead>
                Дата работ <br />с деталью
              </TableHead>
              <TableHead>
                Код вида <br />
                работы
              </TableHead>
              <TableHead>Толщина обода (Л/П)</TableHead>
              <TableHead>
                Документ <br />
                (договор, дата){" "}
              </TableHead>
              <TableHead className="text-center">
                Отметка
                <br />
                несоответствия
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {equipments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  Колесные пары не установлены
                </TableCell>
              </TableRow>
            ) : (
              equipments.map((equipment) => (
                <TableRow
                  key={equipment.equipmentTypeId}
                  className={
                    nonConformityMarks[equipment.equipmentTypeId]
                      ? "bg-pink-100 hover:bg-pink-100"
                      : undefined
                  }
                >
                  <TableCell>
                    {equipment.equipmentTypeName}
                    <br></br>{" "}
                    <span className="text-xs text-gray-500">
                      Код детали: {equipment.lastEquipment.equipmentType?.code}{" "}
                    </span>
                  </TableCell>
                  <TableCell>{equipment.lastEquipment.adminOwnerId || "—"}</TableCell>
                  <TableCell>
                    <span>
                      {equipment.lastEquipment.part?.stampInfo?.value || "—"};{" "}
                      {equipment.lastEquipment.part?.serialNumber || "—"};{" "}
                      {equipment.lastEquipment.part?.manufactureYear
                        ? new Date(equipment.lastEquipment.part?.manufactureYear).getFullYear()
                        : "—"}{" "}
                    </span>
                  </TableCell>
                  <TableCell>{equipment.lastEquipment.jobDepot?.code || "—"}</TableCell>
                  <TableCell>
                    {equipment.lastEquipment.jobDate
                      ? new Date(equipment.lastEquipment.jobDate).getFullYear()
                      : "—"}
                  </TableCell>
                  <TableCell>{equipment.lastEquipment.jobTypeId || "—"}</TableCell>
                  <TableCell>
                    {equipment.lastEquipment.thicknessLeft && equipment.lastEquipment.thicknessRight
                      ? `${equipment.lastEquipment.thicknessLeft}/${equipment.lastEquipment.thicknessRight}`
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {equipment.lastEquipment.document?.number || "—"};{" "}
                    {equipment.lastEquipment.documentDate
                      ? new Date(equipment.lastEquipment.documentDate).toLocaleDateString("ru-RU")
                      : "—"}
                    <br /> Вид ремонта: {equipment.lastEquipment.repairType?.code || "—"}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center">
                      <Checkbox
                        checked={!!nonConformityMarks[equipment.equipmentTypeId]}
                        onCheckedChange={(checked) =>
                          onToggleNonConformity(equipment.equipmentTypeId, checked === true)
                        }
                        aria-label="Отметка несоответствия"
                      />
                    </div>
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
const TruckPartsTable = ({
  equipments,
  nonConformityMarks,
  onToggleNonConformity,
}: NonConformityTableProps) => {
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
              <TableHead>
                Код ЖД <br />
                администр.
              </TableHead>
              <TableHead>
                Деталь
                <br />
                (код пред.; завод. номер; год){" "}
              </TableHead>
              <TableHead>
                Код п-я работы <br /> с деталью
              </TableHead>
              <TableHead>
                Дата работ <br />с деталью
              </TableHead>
              <TableHead>Код вида работы</TableHead>
              <TableHead>Код вида тележки</TableHead>
              <TableHead>
                Документ <br />
                (договор, дата){" "}
              </TableHead>
              <TableHead className="text-center">
                Отметка
                <br />
                несоответствия
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {equipments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  Детали тележек не установлены
                </TableCell>
              </TableRow>
            ) : (
              equipments.map((equipment) => (
                <TableRow
                  key={equipment.equipmentTypeId}
                  className={
                    nonConformityMarks[equipment.equipmentTypeId]
                      ? "bg-pink-100 hover:bg-pink-100"
                      : undefined
                  }
                >
                  <TableCell>
                    {equipment.equipmentTypeName}
                    <br></br>{" "}
                    <span className="text-xs text-gray-500">
                      Код детали: {equipment.lastEquipment.equipmentType?.code}{" "}
                    </span>
                  </TableCell>
                  <TableCell>{equipment.lastEquipment.adminOwnerId || "—"}</TableCell>
                  <TableCell>
                    <span>
                      {equipment.lastEquipment.part?.stampInfo?.value || "—"};{" "}
                      {equipment.lastEquipment.part?.serialNumber || "—"};{" "}
                      {equipment.lastEquipment.part?.manufactureYear
                        ? new Date(equipment.lastEquipment.part?.manufactureYear).getFullYear()
                        : "—"}{" "}
                    </span>
                  </TableCell>
                  <TableCell>{equipment.lastEquipment.jobDepot?.code || "—"}</TableCell>
                  <TableCell>
                    {equipment.lastEquipment.jobDate
                      ? equipment.lastEquipment.jobDate != "0"
                        ? new Date(equipment.lastEquipment.jobDate).getFullYear()
                        : "—"
                      : "—"}
                  </TableCell>
                  <TableCell>{equipment.lastEquipment.jobTypeId || "—"}</TableCell>
                  <TableCell>{equipment.lastEquipment.truckType || "—"}</TableCell>
                  <TableCell>
                    {equipment.lastEquipment.document?.number || "—"};{" "}
                    {equipment.lastEquipment.documentDate
                      ? new Date(equipment.lastEquipment.documentDate).toLocaleDateString("ru-RU")
                      : "—"}
                    <br /> Вид ремонта: {equipment.lastEquipment.repairType?.code || "—"}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center">
                      <Checkbox
                        checked={!!nonConformityMarks[equipment.equipmentTypeId]}
                        onCheckedChange={(checked) =>
                          onToggleNonConformity(equipment.equipmentTypeId, checked === true)
                        }
                        aria-label="Отметка несоответствия"
                      />
                    </div>
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

// Компонент таблицы для автосцепного оборудования
const CouplerEquipmentTable = ({
  equipments,
  nonConformityMarks,
  onToggleNonConformity,
}: NonConformityTableProps) => {
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
              <TableHead className="text-center">
                Отметка
                <br />
                несоответствия
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {equipments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={12} className="text-center py-8">
                  Автосцепное оборудование не установлено
                </TableCell>
              </TableRow>
            ) : (
              equipments.map((equipment) => (
                <TableRow
                  key={equipment.equipmentTypeId}
                  className={
                    nonConformityMarks[equipment.equipmentTypeId]
                      ? "bg-pink-100 hover:bg-pink-100"
                      : undefined
                  }
                >
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
                  <TableCell>{formatDate(equipment.lastEquipment.documentDate)}</TableCell>
                  <TableCell>{equipment.lastEquipment.repairType?.code || "—"}</TableCell>
                  <TableCell className="max-w-xs truncate">{equipment.lastEquipment.notes || "—"}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center">
                      <Checkbox
                        checked={!!nonConformityMarks[equipment.equipmentTypeId]}
                        onCheckedChange={(checked) =>
                          onToggleNonConformity(equipment.equipmentTypeId, checked === true)
                        }
                        aria-label="Отметка несоответствия"
                      />
                    </div>
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

export function PartEquipmentList({ cisternId }: PartEquipmentListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("current");
  const [nonConformityMarks, setNonConformityMarks] = useState<NonConformityMarks>({});
  const [historyNonConformityMarks, setHistoryNonConformityMarks] = useState<NonConformityMarks>({});
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportRecipientId, setReportRecipientId] = useState("");
  const [reportComment, setReportComment] = useState("");

  const { data: allEquipments, isLoading: isLoadingAll, error: errorAll } = usePartEquipmentsByCistern(cisternId);
  const {
    data: lastEquipments,
    isLoading: isLoadingLast,
    error: errorLast,
  } = useLastPartEquipmentsByCistern(cisternId);
  const { data: users, isLoading: isLoadingUsers } = useAllUsers();

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

  const toggleNonConformity = (equipmentTypeId: string, checked: boolean) => {
    setNonConformityMarks((prev) => ({
      ...prev,
      [equipmentTypeId]: checked,
    }));
  };

  const toggleHistoryNonConformity = (equipmentId: string, checked: boolean) => {
    setHistoryNonConformityMarks((prev) => ({
      ...prev,
      [equipmentId]: checked,
    }));
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

  const selectedNonConformityItems = useMemo(() => {
    const items: SelectedNonConformityItem[] = [];

    (
      [
        ["wheels", groupedEquipments.wheels],
        ["trucks", groupedEquipments.trucks],
        ["couplers", groupedEquipments.couplers],
      ] as const
    ).forEach(([category, equipments]) => {
      equipments.forEach((equipment) => {
        if (!nonConformityMarks[equipment.equipmentTypeId]) return;
        items.push({
          id: equipment.equipmentTypeId,
          category: CATEGORY_LABELS[category],
          name: equipment.equipmentTypeName,
          details: getPartDetails(equipment),
        });
      });
    });

    filteredAllEquipments.forEach((equipment) => {
      if (!historyNonConformityMarks[equipment.id]) return;
      items.push({
        id: equipment.id,
        category: CATEGORY_LABELS.history,
        name: equipment.equipmentType?.name || "—",
        details: [
          equipment.equipmentType?.code ? `Код: ${equipment.equipmentType.code}` : null,
          equipment.jobDepot?.shortName || equipment.jobDepot?.name || null,
          formatDate(equipment.document?.date),
        ]
          .filter(Boolean)
          .join(" · "),
      });
    });

    return items;
  }, [
    filteredAllEquipments,
    groupedEquipments.couplers,
    groupedEquipments.trucks,
    groupedEquipments.wheels,
    historyNonConformityMarks,
    nonConformityMarks,
  ]);

  const resetReportForm = () => {
    setReportRecipientId("");
    setReportComment("");
  };

  const handleReportDialogChange = (open: boolean) => {
    setReportDialogOpen(open);
    if (!open) {
      resetReportForm();
    }
  };

  const handleReportSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Отправка пока только на уровне UI — API для сообщений о несоответствии не подключен
    handleReportDialogChange(false);
  };

  const formatUserName = (user: {
    firstName?: string;
    lastName?: string;
    patronymic?: string;
    email: string;
  }) => {
    const fullName = [user.lastName, user.firstName, user.patronymic].filter(Boolean).join(" ");
    return fullName ? `${fullName} (${user.email})` : user.email;
  };

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
        <div className="flex w-full items-center justify-between gap-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по типу оборудования, депо..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button variant="outline" onClick={() => setReportDialogOpen(true)}>
            <AlertTriangle className="h-4 w-4 mr-2" />
            Сообщить о несоответствии
          </Button>
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
              <WheelPairsTable
                equipments={groupedEquipments.wheels}
                nonConformityMarks={nonConformityMarks}
                onToggleNonConformity={toggleNonConformity}
              />
              <TruckPartsTable
                equipments={groupedEquipments.trucks}
                nonConformityMarks={nonConformityMarks}
                onToggleNonConformity={toggleNonConformity}
              />
              <CouplerEquipmentTable
                equipments={groupedEquipments.couplers}
                nonConformityMarks={nonConformityMarks}
                onToggleNonConformity={toggleNonConformity}
              />
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
                      <TableHead className="text-center">
                        Отметка
                        <br />
                        несоответствия
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAllEquipments
                      .sort((a, b) => {
                        const dateA = new Date(a.documentDate || 0);
                        const dateB = new Date(b.documentDate || 0);
                        return dateB.getTime() - dateA.getTime();
                      })
                      .map((equipment) => {
                        const operation = getOperationText(equipment.operation);
                        return (
                          <TableRow
                            key={equipment.id}
                            className={
                              historyNonConformityMarks[equipment.id]
                                ? "bg-pink-100 hover:bg-pink-100"
                                : undefined
                            }
                          >
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
                                  <div className="text-xs text-gray-500">
                                    Код: {equipment.equipmentType.code}
                                  </div>
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
                            <TableCell>
                              {equipment.truckType ? `Тип ${equipment.truckType}` : "—"}
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                              {equipment.notes || "—"}
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex justify-center">
                                <Checkbox
                                  checked={!!historyNonConformityMarks[equipment.id]}
                                  onCheckedChange={(checked) =>
                                    toggleHistoryNonConformity(equipment.id, checked === true)
                                  }
                                  aria-label="Отметка несоответствия"
                                />
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    {filteredAllEquipments.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-8">
                          {allEquipments?.length === 0
                            ? "История изменений пуста"
                            : "Записи не найдены"}
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

      <Dialog open={reportDialogOpen} onOpenChange={handleReportDialogChange}>
        <DialogContent className="max-h-[85vh] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Сообщить о несоответствии</DialogTitle>
            <DialogDescription>
              Укажите получателя, проверьте отмеченные детали и добавьте комментарий.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleReportSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nonconformity-recipient">Кому отправлять</Label>
              <Select value={reportRecipientId} onValueChange={setReportRecipientId} required>
                <SelectTrigger id="nonconformity-recipient" className="w-full">
                  <SelectValue
                    placeholder={isLoadingUsers ? "Загрузка пользователей..." : "Выберите получателя"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {(users || []).map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {formatUserName(user)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Отмеченные детали</Label>
              {selectedNonConformityItems.length === 0 ? (
                <div className="rounded-md border border-dashed px-3 py-4 text-sm text-muted-foreground">
                  Нет отмеченных деталей. Отметьте чекбоксы в таблицах.
                </div>
              ) : (
                <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border p-3">
                  {selectedNonConformityItems.map((item) => (
                    <div key={`${item.category}-${item.id}`} className="rounded-md bg-pink-50 px-3 py-2">
                      <div className="text-xs text-muted-foreground">{item.category}</div>
                      <div className="text-sm font-medium">{item.name}</div>
                      <div className="text-xs text-muted-foreground">{item.details}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nonconformity-comment">Комментарий</Label>
              <Textarea
                id="nonconformity-comment"
                value={reportComment}
                onChange={(e) => setReportComment(e.target.value)}
                placeholder="Опишите несоответствие..."
                rows={4}
                required
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleReportDialogChange(false)}>
                Отмена
              </Button>
              <Button
                type="submit"
                disabled={!reportRecipientId || !reportComment.trim() || selectedNonConformityItems.length === 0}
              >
                Отправить
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
