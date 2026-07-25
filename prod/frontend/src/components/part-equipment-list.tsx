"use client";

import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
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
  Loader2,
  Paperclip,
  X,
} from "lucide-react";
import {
  usePartEquipmentsByCistern,
  useLastPartEquipmentsByCistern,
  useFitmentEquipmentsByCistern,
  useLastFitmentEquipmentsByCistern,
  useAllUsers,
  useCurrentUser,
  useCreateMessage,
  useCistern,
} from "@/hooks";
import { filesApi } from "@/api/files";
import { MessagePriority } from "@/types/messages";
import { FitmentEquipmentDTO, FitmentEquipmentUserDTO, LastEquipmentDTO } from "@/types/directories";
import { formatDate as formatDateValue } from "@/lib/formatDate";

interface PartEquipmentListProps {
  cisternId: string;
}

type NonConformityMarks = Record<string, boolean>;

interface NonConformityTableProps {
  equipments: LastEquipmentDTO[];
  nonConformityMarks: NonConformityMarks;
  onToggleNonConformity: (equipmentTypeId: string, checked: boolean) => void;
}

interface FitmentEquipmentTableProps {
  equipments: FitmentEquipmentDTO[];
  nonConformityMarks: NonConformityMarks;
  onToggleNonConformity: (equipmentTypeId: string, checked: boolean) => void;
}

interface SelectedNonConformityItem {
  id: string;
  category: string;
  name: string;
  details: string;
}

const ALLOWED_REPORT_FILE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".pdf"] as const;
const ALLOWED_REPORT_FILE_ACCEPT = ".png,.jpg,.jpeg,.pdf,image/png,image/jpeg,application/pdf";
const MAX_REPORT_FILE_SIZE_BYTES = 10 * 1024 * 1024;

const isAllowedReportFile = (file: File) => {
  const lowerName = file.name.toLowerCase();
  return ALLOWED_REPORT_FILE_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
};

const getReportErrorMessage = (err: unknown, fallback: string) => {
  if (!err || typeof err !== "object") return fallback;

  const axiosError = err as {
    message?: string;
    code?: string;
    response?: {
      status?: number;
      statusText?: string;
      data?: {
        message?: string;
        Message?: string;
        details?: string;
        Details?: string;
        title?: string;
        Title?: string;
      };
    };
  };

  const data = axiosError.response?.data;
  const serverMessage =
    data?.message || data?.Message || data?.details || data?.Details || data?.title || data?.Title;

  if (serverMessage) return serverMessage;

  const status = axiosError.response?.status;
  if (status) {
    const statusText = axiosError.response?.statusText;
    return statusText ? `Ошибка сервера (${status}: ${statusText})` : `Ошибка сервера (${status})`;
  }

  if (axiosError.code === "ERR_NETWORK" || axiosError.message === "Network Error") {
    return "Нет связи с сервером";
  }

  if (axiosError.message && axiosError.message !== "Network Error") {
    return axiosError.message;
  }

  return fallback;
};

const CATEGORY_LABELS = {
  wheels: "Колесные пары",
  trucks: "Детали тележек",
  couplers: "Автосцепное оборудование",
  fitments: "Арматура",
} as const;

const getPartDetails = (equipment: LastEquipmentDTO) => {
  const part = equipment.lastEquipment.part;
  const stamp = part?.stampInfo?.value || "—";
  const serial = part?.serialNumber || "—";
  const year = part?.manufactureYear ? new Date(part.manufactureYear).getFullYear() : "—";
  return `${stamp}; ${serial}; ${year}`;
};

const getFitmentNonConformityId = (equipment: FitmentEquipmentDTO) =>
  `fitment:${equipment.fitmentId || equipment.id}`;

const getFitmentDetails = (equipment: FitmentEquipmentDTO) => {
  const serial = equipment.fitment?.serialNumber || "—";
  const passport = equipment.fitment?.passportNumber || "—";
  return `${serial}; ${passport}`;
};

const formatFitmentUserName = (user?: FitmentEquipmentUserDTO | null) => {
  if (!user) return "—";
  const name = [user.lastName, user.firstName].filter(Boolean).join(" ").trim();
  return name || "—";
};

const formatFitmentLabel = (item: FitmentEquipmentDTO) => {
  if (!item.fitment) return "—";
  const serial = item.fitment.serialNumber || "—";
  const passport = item.fitment.passportNumber || "—";
  return `(${serial}; ${passport})`;
};

const formatFitmentDepot = (item: FitmentEquipmentDTO) => {
  if (!item.depot) return "—";
  const shortName = item.depot.shortName || "—";
  const code = item.depot.code || "—";
  return `${shortName} (${code})`;
};

const formatFitmentDocument = (item: FitmentEquipmentDTO) => {
  if (!item.document) return "—";
  const number = item.document.number || "—";
  const author = item.document.author || "—";
  const date = formatDateValue(item.document.date, "ru-RU", "—");
  return `${number} (${author}; ${date})`;
};

const getFitmentOperationText = (operation: number) => {
  switch (operation) {
    case 1:
      return { text: "Снятие", variant: "destructive" as const };
    case 2:
      return { text: "Установка", variant: "default" as const };
    default:
      return { text: "Не указана", variant: "secondary" as const };
  }
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
              <TableHead>Толщина обода <br /> (Л/П)</TableHead>
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
                    <br /> {equipment.lastEquipment.repairType?.name || "—"}
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
              Тип детали
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
              <TableHead>                Код вида <br />
              работы</TableHead>
              <TableHead>Код вида <br />тележки</TableHead>
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
                    <br /> {equipment.lastEquipment.repairType?.name || "—"}
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
        <CardDescription>Автосцепка, поглощающие аппараты</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                Тип детали
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
                <TableCell colSpan={8} className="text-center py-8">
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
                  <TableCell>{formatDate(equipment.lastEquipment.documentDate)}</TableCell>
                  <TableCell>{equipment.lastEquipment.jobTypeId || "—"}</TableCell>
                  <TableCell>
                    {equipment.lastEquipment.document?.number || "—"};{" "}
                    {equipment.lastEquipment.documentDate
                      ? new Date(equipment.lastEquipment.documentDate).toLocaleDateString("ru-RU")
                      : "—"}
                    <br /> {equipment.lastEquipment.repairType?.name || "—"}
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

const FitmentEquipmentTable = ({
  equipments,
  nonConformityMarks,
  onToggleNonConformity,
}: FitmentEquipmentTableProps) => {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Арматура</CardTitle>
        <CardDescription>Последние привязки арматуры к вагону</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Тип арматуры</TableHead>
              <TableHead>Арматура</TableHead>
              <TableHead>Место работы</TableHead>
              <TableHead>Документ</TableHead>
              <TableHead>Дата привязки</TableHead>
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
                <TableCell colSpan={6} className="text-center py-8">
                  Арматура не привязана
                </TableCell>
              </TableRow>
            ) : (
              equipments.map((equipment) => {
                const markId = getFitmentNonConformityId(equipment);
                return (
                  <TableRow
                    key={equipment.id}
                    className={nonConformityMarks[markId] ? "bg-pink-100 hover:bg-pink-100" : undefined}
                  >
                    <TableCell>{equipment.fitment?.fitmentTypeName || "—"}</TableCell>
                    <TableCell>{formatFitmentLabel(equipment)}</TableCell>
                    <TableCell>{formatFitmentDepot(equipment)}</TableCell>
                    <TableCell>{formatFitmentDocument(equipment)}</TableCell>
                    <TableCell>{formatDateValue(equipment.date, "ru-RU", "—")}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <Checkbox
                          checked={!!nonConformityMarks[markId]}
                          onCheckedChange={(checked) =>
                            onToggleNonConformity(markId, checked === true)
                          }
                          aria-label="Отметка несоответствия"
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
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
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportRecipientId, setReportRecipientId] = useState("");
  const [reportComment, setReportComment] = useState("");
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);

  const { data: allEquipments, isLoading: isLoadingAll, error: errorAll } = usePartEquipmentsByCistern(cisternId);
  const {
    data: lastEquipments,
    isLoading: isLoadingLast,
    error: errorLast,
  } = useLastPartEquipmentsByCistern(cisternId);
  const {
    data: allFitmentEquipments,
    isLoading: isLoadingAllFitments,
    error: errorAllFitments,
  } = useFitmentEquipmentsByCistern(cisternId);
  const {
    data: lastFitmentEquipments,
    isLoading: isLoadingLastFitments,
    error: errorLastFitments,
  } = useLastFitmentEquipmentsByCistern(cisternId);
  const { data: cistern } = useCistern(cisternId);
  const { data: users, isLoading: isLoadingUsers } = useAllUsers();
  const { data: currentUser } = useCurrentUser();
  const createMessageMutation = useCreateMessage();

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

  const filteredAllFitmentEquipments =
    allFitmentEquipments?.filter((equipment) => {
      if (!searchTerm) return true;
      const search = searchTerm.toLowerCase();
      return (
        equipment.fitment?.fitmentTypeName?.toLowerCase().includes(search) ||
        equipment.fitment?.serialNumber?.toLowerCase().includes(search) ||
        equipment.fitment?.passportNumber?.toLowerCase().includes(search) ||
        equipment.depot?.name?.toLowerCase().includes(search) ||
        equipment.depot?.shortName?.toLowerCase().includes(search) ||
        equipment.jobUser?.lastName?.toLowerCase().includes(search) ||
        equipment.testUser?.lastName?.toLowerCase().includes(search) ||
        equipment.document?.number?.toLowerCase().includes(search)
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

    (lastFitmentEquipments || []).forEach((equipment) => {
      const markId = getFitmentNonConformityId(equipment);
      if (!nonConformityMarks[markId]) return;
      items.push({
        id: markId,
        category: CATEGORY_LABELS.fitments,
        name: equipment.fitment?.fitmentTypeName || "Арматура",
        details: getFitmentDetails(equipment),
      });
    });

    return items;
  }, [
    groupedEquipments.couplers,
    groupedEquipments.trucks,
    groupedEquipments.wheels,
    lastFitmentEquipments,
    nonConformityMarks,
  ]);

  const resetReportForm = () => {
    setReportRecipientId("");
    setReportComment("");
    setReportFile(null);
    setReportError(null);
  };

  const handleReportDialogChange = (open: boolean) => {
    setReportDialogOpen(open);
    if (!open) {
      resetReportForm();
    }
  };

  const handleReportFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";

    if (!file) {
      setReportFile(null);
      return;
    }

    if (!isAllowedReportFile(file)) {
      setReportError("Допустимые форматы файла: PNG, JPG, JPEG, PDF");
      setReportFile(null);
      return;
    }

    if (file.size > MAX_REPORT_FILE_SIZE_BYTES) {
      setReportError("Размер файла не должен превышать 10 МБ");
      setReportFile(null);
      return;
    }

    setReportError(null);
    setReportFile(file);
  };

  const buildNonConformityMessageText = () => {
    const detailsBlock = selectedNonConformityItems
      .map((item) => `${item.name}: ${item.details}`)
      .join("\n");
    const wagonNumber = cistern?.number ? `Номер вагона: ${cistern.number}` : "Номер вагона: —";

    return `${wagonNumber}\n\n${detailsBlock}\n\n${reportComment.trim()}`;
  };

  const handleReportSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setReportError(null);

    if (!currentUser?.userId) {
      setReportError("Не удалось определить текущего пользователя");
      return;
    }

    if (!reportRecipientId || !reportComment.trim() || selectedNonConformityItems.length === 0) {
      return;
    }

    let step: "upload" | "message" = "message";

    try {
      let fileName: string | null = null;
      let filePath: string | null = null;

      if (reportFile) {
        step = "upload";
        const extension = reportFile.name.includes(".")
          ? reportFile.name.slice(reportFile.name.lastIndexOf(".")).toLowerCase()
          : "";
        const uniqueFileName = `${crypto.randomUUID()}${extension}`;
        const uploaded = await filesApi.upload(reportFile, {
          directory: "Message",
          fileName: uniqueFileName,
        });
        fileName = uploaded.fileName;
        filePath = "Message";
      }

      step = "message";
      await createMessageMutation.mutateAsync({
        text: buildNonConformityMessageText(),
        fromUserId: currentUser.userId,
        toUserId: reportRecipientId,
        priority: MessagePriority.Normal,
        fileName,
        filePath,
      });

      setNonConformityMarks({});
      handleReportDialogChange(false);
    } catch (err) {
      const fallback =
        step === "upload"
          ? "Не удалось загрузить файл. Попробуйте ещё раз."
          : "Не удалось отправить сообщение. Попробуйте ещё раз.";
      const details = getReportErrorMessage(err, fallback);
      setReportError(
        details === fallback
          ? fallback
          : `${step === "upload" ? "Ошибка загрузки файла" : "Ошибка отправки сообщения"}: ${details}`
      );
    }
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

  if (errorAll || errorLast || errorAllFitments || errorLastFitments) {
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
          {isLoadingLast || isLoadingLastFitments ? (
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
              <FitmentEquipmentTable
                equipments={lastFitmentEquipments || []}
                nonConformityMarks={nonConformityMarks}
                onToggleNonConformity={toggleNonConformity}
              />
            </div>
          )}
        </TabsContent>

        {/* Полная история */}
        <TabsContent value="history">
          <div className="space-y-6">
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
                          const dateA = new Date(a.documentDate || 0);
                          const dateB = new Date(b.documentDate || 0);
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
                            </TableRow>
                          );
                        })}
                      {filteredAllEquipments.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-8">
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

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  История привязок арматуры
                </CardTitle>
                <CardDescription>Полная история установки и снятия арматуры</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingAllFitments ? (
                  <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Дата привязки</TableHead>
                        <TableHead>Операция</TableHead>
                        <TableHead>Арматура</TableHead>
                        <TableHead>Тип арматуры</TableHead>
                        <TableHead>Работу произвёл</TableHead>
                        <TableHead>Испытание провёл</TableHead>
                        <TableHead>Место работы</TableHead>
                        <TableHead>Документ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAllFitmentEquipments
                        .sort((a, b) => {
                          const dateA = new Date(a.date || 0);
                          const dateB = new Date(b.date || 0);
                          return dateB.getTime() - dateA.getTime();
                        })
                        .map((equipment) => {
                          const operation = getFitmentOperationText(equipment.operation);
                          return (
                            <TableRow key={equipment.id}>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4 text-gray-400" />
                                  {formatDateValue(equipment.date, "ru-RU", "—")}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={operation.variant}>{operation.text}</Badge>
                              </TableCell>
                              <TableCell>{formatFitmentLabel(equipment)}</TableCell>
                              <TableCell>{equipment.fitment?.fitmentTypeName || "—"}</TableCell>
                              <TableCell>{formatFitmentUserName(equipment.jobUser)}</TableCell>
                              <TableCell>{formatFitmentUserName(equipment.testUser)}</TableCell>
                              <TableCell>{formatFitmentDepot(equipment)}</TableCell>
                              <TableCell>{formatFitmentDocument(equipment)}</TableCell>
                            </TableRow>
                          );
                        })}
                      {filteredAllFitmentEquipments.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8">
                            {allFitmentEquipments?.length === 0
                              ? "История привязок арматуры пуста"
                              : "Записи не найдены"}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
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

            <div className="space-y-2">
              <Label htmlFor="nonconformity-file">Файл</Label>
              <div className="flex flex-wrap items-center gap-2">
                <Button type="button" variant="outline" asChild>
                  <label htmlFor="nonconformity-file" className="cursor-pointer">
                    <Paperclip className="mr-2 h-4 w-4" />
                    {reportFile ? "Заменить файл" : "Загрузить файл"}
                  </label>
                </Button>
                <Input
                  id="nonconformity-file"
                  type="file"
                  accept={ALLOWED_REPORT_FILE_ACCEPT}
                  className="hidden"
                  onChange={handleReportFileChange}
                />
                <span className="text-xs text-muted-foreground">PNG, JPG, JPEG, PDF до 10 МБ</span>
              </div>
              {reportFile && (
                <div className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm">
                  <span className="truncate">{reportFile.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setReportFile(null)}
                    disabled={createMessageMutation.isPending}
                    aria-label="Удалить файл"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {reportError && <p className="text-sm text-red-600">{reportError}</p>}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleReportDialogChange(false)}
                disabled={createMessageMutation.isPending}
              >
                Отмена
              </Button>
              <Button
                type="submit"
                disabled={
                  createMessageMutation.isPending ||
                  !currentUser?.userId ||
                  !reportRecipientId ||
                  !reportComment.trim() ||
                  selectedNonConformityItems.length === 0
                }
              >
                {createMessageMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Отправка...
                  </>
                ) : (
                  "Отправить"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
