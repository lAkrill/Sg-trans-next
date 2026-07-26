"use client";

import { useEffect, useCallback, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Button,
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Badge,
} from "@/components/ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Wrench,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  CalendarCog,
  ListChecks,
  ExternalLink,
  Info,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type {
  RailwayCisternRepairsFilterListDTO,
  RailwayCisternRepairsFilterRequestDTO,
} from "@/types/cisterns";
import { cisternsApi } from "@/api/cisterns";
import { partEquipmentApi, partsApi } from "@/api/directories";
import { RepairsFilters, type RepairsFilterTableType } from "@/components/repairs/repairs-filters";
import { PlanningRepairsFilters, countPlanningRepairsFilters } from "@/components/repairs/planning-repairs-filters";
import { PlanningRepairsTable } from "@/components/repairs/planning-repairs-table";
import {
  DEFAULT_PLANNING_VISIBLE_COLUMNS,
  getPlanningExportColumnKeys,
} from "@/lib/repairs/planning-columns";
import { getUpcomingRepairCellClass } from "@/lib/repairs/date-highlighting";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/formatDate";
import {
  evaluatePartNeed,
  formatUpcomingRepairType,
  getPartsNeedRowClass,
  resolveUpcomingRepair,
  type PartsNeedHighlight,
  type UpcomingRepairType,
} from "@/lib/parts/parts-need";
import { useRepairsInFilter, useRepairsOutFilter, useRepairsMatchingFilter } from "@/hooks";
import type {
  RepairsInFilterCriteria,
  RepairsOutFilterCriteria,
  RepairsSortCriteria,
} from "@/types/repairs";
import type { LastEquipmentDTO, PartDTO } from "@/types/directories";

const EMPTY_GUID = "00000000-0000-0000-0000-000000000000";

function isValidEntityId(id?: string | null): id is string {
  return !!id && id !== EMPTY_GUID;
}

type PartsNeedRow = {
  id: string;
  cisternId: string | null;
  partId: string | null;
  partTypeId: string | null;
  stampNumber: string | null;
  serialNumber: string | null;
  cisternNumber: string;
  equipmentTypeName: string;
  partDetails: string;
  thickness: string;
  truckType: string;
  document: string;
  highlight: PartsNeedHighlight | null;
  repairType: UpcomingRepairType | null;
  repairDate: string | null;
};

type PartYearValue = string | { year: number; month: number; day: number };

function formatPartsNeedPartDetails(equipment: LastEquipmentDTO): string {
  const part = equipment.lastEquipment?.part;
  const stamp = part?.stampInfo?.value || "—";
  const serial = part?.serialNumber || "—";
  const year = part?.manufactureYear
    ? new Date(part.manufactureYear).getFullYear()
    : "—";
  return `${stamp}; ${serial}; ${year}`;
}

function formatPartYear(yearData?: PartYearValue) {
  if (!yearData) return "—";
  if (typeof yearData === "string") {
    const yearMatch = yearData.match(/^(\d{4})/);
    return yearMatch ? yearMatch[1] : yearData;
  }
  return String(yearData.year);
}

function getPartLocationDisplay(code?: number | null) {
  switch (code) {
    case 1:
      return "Депо";
    case 2:
      return "Вагон-цистерна";
    case 0:
    default:
      return "Не установлена";
  }
}

function getPartWagonDepotDisplay(part: PartDTO) {
  if (part.currentLocation?.number) return part.currentLocation.number;
  if (part.depot) {
    const depotName = part.depot.shortName || part.depot.name;
    return depotName ? `${part.depot.code} (${depotName})` : part.depot.code;
  }
  return "—";
}

function getPartServiceLifeYears(part: PartDTO): number | null {
  const value = (part as PartDTO & { serviceLifeYears?: number | null }).serviceLifeYears;
  if (value == null || value === 0 || Number.isNaN(value)) return null;
  return value;
}

function getDefaultPartServiceLifeYears(partTypeCode?: number): number {
  switch (partTypeCode) {
    case 1:
      return 42;
    case 2:
      return 35;
    case 3:
      return 35;
    case 4:
      return 30;
    case 10:
      return 32;
    default:
      return 35;
  }
}

function getPartManufactureDate(yearData?: PartYearValue): Date | null {
  if (!yearData) return null;
  if (typeof yearData === "string") {
    const parsed = new Date(yearData);
    if (!Number.isNaN(parsed.getTime())) return parsed;
    const yearMatch = yearData.match(/^(\d{4})/);
    if (!yearMatch) return null;
    return new Date(Number(yearMatch[1]), 0, 1);
  }
  return new Date(yearData.year, (yearData.month || 1) - 1, yearData.day || 1);
}

function getPartExtendedDateDisplay(part: PartDTO): string {
  const manufactureDate = getPartManufactureDate(part.manufactureYear);
  if (!manufactureDate || Number.isNaN(manufactureDate.getTime())) return "—";
  const serviceLifeYears =
    getPartServiceLifeYears(part) ?? getDefaultPartServiceLifeYears(part.partType?.code);
  const endDate = new Date(manufactureDate);
  endDate.setFullYear(endDate.getFullYear() + serviceLifeYears);
  return String(endDate.getFullYear());
}

function formatPartsNeedThickness(equipment: LastEquipmentDTO): string {
  const left = equipment.lastEquipment?.thicknessLeft;
  const right = equipment.lastEquipment?.thicknessRight;
  if (left && right) return `${left}/${right}`;
  return "—";
}

function formatPartsNeedDocument(equipment: LastEquipmentDTO): string {
  const document = equipment.lastEquipment?.document;
  if (!document?.number) return "—";
  const date = document.date
    ? new Date(document.date).toLocaleDateString("ru-RU")
    : "—";
  return `${document.number} (${date})`;
}

function toPartsNeedRow(
  equipment: LastEquipmentDTO,
  cistern: { id: string; number: string },
  index: number,
  options: {
    highlight?: PartsNeedHighlight | null;
    repairType?: UpcomingRepairType | null;
    repairDate?: Date | null;
  } = {}
): PartsNeedRow {
  const last = equipment.lastEquipment;
  const cisternId = last?.railwayCistern?.id || cistern.id;
  const partId = last?.part?.partId;
  const partTypeId = last?.equipmentType?.partTypeId;
  const stampNumber = last?.part?.stampInfo?.value?.trim() || null;
  const serialNumber = last?.part?.serialNumber?.trim() || null;
  return {
    id: `${last?.id ?? equipment.equipmentTypeId}-${cistern.id}-${index}`,
    cisternId: isValidEntityId(cisternId) ? cisternId : null,
    partId: isValidEntityId(partId) ? partId : null,
    partTypeId: isValidEntityId(partTypeId) ? partTypeId : null,
    stampNumber,
    serialNumber,
    cisternNumber: last?.railwayCistern?.number || cistern.number || "—",
    equipmentTypeName:
      last?.equipmentType?.partTypeName || equipment.equipmentTypeName || "—",
    partDetails: formatPartsNeedPartDetails(equipment),
    thickness: formatPartsNeedThickness(equipment),
    truckType: last?.truckType ? String(last.truckType) : "—",
    document: formatPartsNeedDocument(equipment),
    highlight: options.highlight ?? null,
    repairType: options.repairType ?? null,
    repairDate: options.repairDate
      ? options.repairDate.toLocaleDateString("ru-RU")
      : null,
  };
}

function countRepairsInFilters(f: RepairsInFilterCriteria): number {
  let n = 0;
  if (f.cisternNumbers?.length) n++;
  if (f.typeRepairIds?.length) n++;
  if (f.depotIds?.length) n++;
  if (f.depotNames?.length) n++;
  if (f.vu23?.length) n++;
  if (f.roadNames?.length) n++;
  if (f.roadCodes?.length) n++;
  if (f.stationNames?.length) n++;
  if (f.stationIds?.length) n++;
  if (f.dateIn?.from || f.dateIn?.to) n++;
  if (f.adminRoadCodes?.length) n++;
  return n;
}

function countRepairsOutFilters(f: RepairsOutFilterCriteria): number {
  let n = 0;
  if (f.cisternNumbers?.length) n++;
  if (f.typeRepairIds?.length) n++;
  if (f.depotIds?.length) n++;
  if (f.depotNames?.length) n++;
  if (f.vu36?.length) n++;
  if (f.roadNames?.length) n++;
  if (f.roadCodes?.length) n++;
  if (f.dateIn?.from || f.dateIn?.to) n++;
  if (f.dateOut?.from || f.dateOut?.to) n++;
  return n;
}

function formatPlanningServiceEndDate(
  buildDate: string | undefined,
  serviceLifeYears: number | undefined
): string {
  if (
    buildDate == null ||
    buildDate === "" ||
    serviceLifeYears == null ||
    Number.isNaN(serviceLifeYears)
  ) {
    return "—";
  }
  const start = new Date(buildDate);
  if (Number.isNaN(start.getTime())) return "—";
  const end = new Date(start);
  end.setFullYear(end.getFullYear() + serviceLifeYears);
  return end.toLocaleDateString("ru-RU");
}

function formatRuDate(value: string | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("ru-RU");
}

function getRecordsCountDisplay(params: {
  count: number;
  isSearch: boolean;
  isFilter: boolean;
  searchQuery?: string;
}): { title: string | null; description: string } {
  const { count, isSearch, isFilter, searchQuery } = params;
  if (isSearch && searchQuery?.trim()) {
    return {
      title: `Результаты поиска: «${searchQuery.trim()}»`,
      description: `Найдено: ${count}`,
    };
  }
  if (isFilter) {
    return {
      title: "Результаты фильтрации",
      description: `Отфильтровано: ${count}`,
    };
  }
  return {
    title: null,
    description: `Всего записей: ${count}`,
  };
}

function TableRecordsHeader({
  title,
  description,
}: {
  title: string | null;
  description: string;
}) {
  return (
    <CardHeader className="pb-3">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {title ? <CardTitle className="text-base">{title}</CardTitle> : null}
        <CardDescription>{description}</CardDescription>
      </div>
    </CardHeader>
  );
}

export default function RepairsPage() {
  const router = useRouter();
  const [planningRows, setPlanningRows] = useState<RailwayCisternRepairsFilterListDTO[] | null>(
    null
  );
  const [planningFiltersApplied, setPlanningFiltersApplied] =
    useState<RailwayCisternRepairsFilterRequestDTO>({});
  const [isPlanningFilterLoading, setIsPlanningFilterLoading] = useState(false);
  const [planningVisibleColumns, setPlanningVisibleColumns] = useState<string[]>([
    ...DEFAULT_PLANNING_VISIBLE_COLUMNS,
  ]);
  const [mainSection, setMainSection] = useState<"details" | "planning">("planning");
  const [activeTab, setActiveTab] = useState<"in" | "out" | "matched">("in");
  const [pageIn, setPageIn] = useState(1);
  const [pageOut, setPageOut] = useState(1);
  const [pageMatched, setPageMatched] = useState(1);
  const [pagePlanning, setPagePlanning] = useState(1);
  const [pagePartsNeed, setPagePartsNeed] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pageSizePlanning, setPageSizePlanning] = useState(10);
  const [pageSizePartsNeed, setPageSizePartsNeed] = useState(10);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [exportingType, setExportingType] = useState<"pdf" | "doc" | "xls" | null>(null);
  const [partsNeedRows, setPartsNeedRows] = useState<PartsNeedRow[] | null>(null);
  const [isPartsNeedLoading, setIsPartsNeedLoading] = useState(false);
  const [partsNeedInfoOpen, setPartsNeedInfoOpen] = useState(false);
  const [isPartsNeedInfoLoading, setIsPartsNeedInfoLoading] = useState(false);
  const [partsNeedInfoParts, setPartsNeedInfoParts] = useState<PartDTO[]>([]);
  const [partsNeedInfoError, setPartsNeedInfoError] = useState<string | null>(null);

  // Filters (like cisterns page)
  const [filterTableType, setFilterTableType] = useState<RepairsFilterTableType>("in");
  const [filtersIn, setFiltersIn] = useState<RepairsInFilterCriteria>({});
  const [filtersOut, setFiltersOut] = useState<RepairsOutFilterCriteria>({});
  const [sortFields, setSortFields] = useState<RepairsSortCriteria[]>([]);
  const [onlyUnmatchedRepairs, setOnlyUnmatchedRepairs] = useState(false);

  const hasFiltersIn =
    countRepairsInFilters(filtersIn) > 0 ||
    (filterTableType === "in" && sortFields.length > 0);
  const hasFiltersOut =
    countRepairsOutFilters(filtersOut) > 0 ||
    (filterTableType === "out" && sortFields.length > 0);
  const isFilterModeIn =
    activeTab === "in" && filterTableType === "in" && hasFiltersIn;
  const isFilterModeOut =
    activeTab === "out" && filterTableType === "out" && hasFiltersOut;

  const filterRequestIn = useMemo(
    () => ({
      filters: hasFiltersIn ? filtersIn : undefined,
      sortFields: sortFields.length
        ? sortFields
        : [{ fieldName: "dateIn", descending: true }],
      page: pageIn,
      pageSize,
    }),
    [filtersIn, hasFiltersIn, sortFields, pageIn, pageSize]
  );

  const filterRequestOut = useMemo(
    () => ({
      filters: hasFiltersOut ? filtersOut : undefined,
      sortFields: sortFields.length
        ? sortFields
        : [{ fieldName: "dateOut", descending: true }],
      page: pageOut,
      pageSize,
    }),
    [filtersOut, hasFiltersOut, sortFields, pageOut, pageSize]
  );

  const filterRequestMatched = useMemo(
    () => ({
      sortFields: [{ fieldName: "dateTime", descending: true }],
      page: pageMatched,
      pageSize,
    }),
    [pageMatched, pageSize]
  );

  const { data: filterDataIn, isLoading: isFilterLoadingIn, isFetching: isFetchingIn } =
    useRepairsInFilter(filterRequestIn);

  const { data: filterDataOut, isLoading: isFilterLoadingOut, isFetching: isFetchingOut } =
    useRepairsOutFilter(filterRequestOut);

  const {
    data: filterDataMatching,
    isLoading: isFilterLoadingMatching,
    isFetching: isFetchingMatching,
  } = useRepairsMatchingFilter(filterRequestMatched);

  const handlePlanningFiltersApply = useCallback(
    async (filters: RailwayCisternRepairsFilterRequestDTO) => {
      setPlanningFiltersApplied(filters);
      setIsPlanningFilterLoading(true);
      try {
        const data = await cisternsApi.getRepairsFilter(filters);
        setPlanningRows(data);
      } finally {
        setIsPlanningFilterLoading(false);
      }
    },
    []
  );

  const activePlanningFiltersCount = useMemo(
    () => countPlanningRepairsFilters(planningFiltersApplied),
    [planningFiltersApplied]
  );

  const repairsInSource = useMemo(() => {
    return filterDataIn?.items ?? [];
  }, [filterDataIn?.items]);

  const repairsOutSource = useMemo(() => {
    return filterDataOut?.items ?? [];
  }, [filterDataOut?.items]);

  const repairsInSorted = useMemo(() => repairsInSource, [repairsInSource]);

  const repairsOutSorted = useMemo(() => repairsOutSource, [repairsOutSource]);

  const repairsMatchingSorted = useMemo(
    () => filterDataMatching?.items ?? [],
    [filterDataMatching?.items]
  );

  const repairsInFiltered = useMemo(() => {
    let list = repairsInSorted ?? [];
    if (onlyUnmatchedRepairs && !isFilterModeIn) {
      list = list.filter((r) => !r.isMatching);
    }
    return list;
  }, [repairsInSorted, isFilterModeIn, onlyUnmatchedRepairs]);

  const repairsOutFiltered = useMemo(() => {
    let list = repairsOutSorted ?? [];
    if (onlyUnmatchedRepairs && !isFilterModeOut) {
      list = list.filter((r) => !r.isMatching);
    }
    return list;
  }, [repairsOutSorted, isFilterModeOut, onlyUnmatchedRepairs]);

  const repairsMatchingFiltered = useMemo(
    () => repairsMatchingSorted ?? [],
    [repairsMatchingSorted]
  );

  const planningRowsFiltered = useMemo(() => planningRows ?? [], [planningRows]);

  useEffect(() => {
    setPageIn(1);
  }, [filtersIn, sortFields]);

  useEffect(() => {
    setPageOut(1);
  }, [filtersOut, sortFields]);

  useEffect(() => {
    setPageIn(1);
    setPageOut(1);
  }, [onlyUnmatchedRepairs]);

  useEffect(() => {
    if (isFilterModeIn || isFilterModeOut) {
      setOnlyUnmatchedRepairs(false);
    }
  }, [isFilterModeIn, isFilterModeOut]);

  const repairsInPaginated = useMemo(() => repairsInFiltered ?? [], [repairsInFiltered]);

  const repairsOutPaginated = useMemo(() => repairsOutFiltered ?? [], [repairsOutFiltered]);

  const repairsMatchingPaginated = useMemo(
    () => repairsMatchingFiltered ?? [],
    [repairsMatchingFiltered]
  );

  const planningRowsPaginated = useMemo(() => {
    const list = planningRowsFiltered ?? [];
    const start = (pagePlanning - 1) * pageSizePlanning;
    return list.slice(start, start + pageSizePlanning);
  }, [planningRowsFiltered, pagePlanning, pageSizePlanning]);

  const totalCountIn = filterDataIn?.totalCount ?? 0;
  const totalCountOut = filterDataOut?.totalCount ?? 0;
  const totalCountMatched = filterDataMatching?.totalCount ?? 0;
  const totalCountPlanning = (planningRowsFiltered ?? []).length;
  const totalCountPartsNeed = (partsNeedRows ?? []).length;
  const totalPagesIn = Math.max(1, filterDataIn?.totalPages ?? 1);
  const totalPagesOut = Math.max(1, filterDataOut?.totalPages ?? 1);
  const totalPagesMatched = Math.max(1, filterDataMatching?.totalPages ?? 1);
  const totalPagesPlanning = Math.max(1, Math.ceil(totalCountPlanning / pageSizePlanning));
  const totalPagesPartsNeed = Math.max(1, Math.ceil(totalCountPartsNeed / pageSizePartsNeed));

  const partsNeedRowsPaginated = useMemo(() => {
    const list = partsNeedRows ?? [];
    const start = (pagePartsNeed - 1) * pageSizePartsNeed;
    return list.slice(start, start + pageSizePartsNeed);
  }, [partsNeedRows, pagePartsNeed, pageSizePartsNeed]);

  const partsNeedTypeCountsDescription = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of partsNeedRows ?? []) {
      const typeName = row.equipmentTypeName || "—";
      counts.set(typeName, (counts.get(typeName) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ru"))
      .map(([name, count]) => `${name}: ${count}`)
      .join("; ");
  }, [partsNeedRows]);

  const handlePageChangeIn = useCallback((page: number) => {
    setPageIn(Math.max(1, Math.min(page, totalPagesIn)));
  }, [totalPagesIn]);

  const handlePageChangeOut = useCallback((page: number) => {
    setPageOut(Math.max(1, Math.min(page, totalPagesOut)));
  }, [totalPagesOut]);

  const handlePageChangeMatched = useCallback((page: number) => {
    setPageMatched(Math.max(1, Math.min(page, totalPagesMatched)));
  }, [totalPagesMatched]);

  const handlePageChangePlanning = useCallback((page: number) => {
    setPagePlanning(Math.max(1, Math.min(page, totalPagesPlanning)));
  }, [totalPagesPlanning]);

  const handlePageChangePartsNeed = useCallback((page: number) => {
    setPagePartsNeed(Math.max(1, Math.min(page, totalPagesPartsNeed)));
  }, [totalPagesPartsNeed]);

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setPageIn(1);
    setPageOut(1);
    setPageMatched(1);
  }, []);

  const handlePageSizeChangePlanning = useCallback((newPageSize: number) => {
    setPageSizePlanning(newPageSize);
    setPagePlanning(1);
  }, []);

  const handlePageSizeChangePartsNeed = useCallback((newPageSize: number) => {
    setPageSizePartsNeed(newPageSize);
    setPagePartsNeed(1);
  }, []);

  const handleGeneratePartsNeedList = useCallback(async () => {
    const cisterns = planningRowsFiltered ?? [];
    if (!cisterns.length) return;

    setIsPartsNeedLoading(true);
    setPagePartsNeed(1);
    try {
      const equipmentResults = await Promise.allSettled(
        cisterns.map(async (cistern) => {
          const equipments = await partEquipmentApi.getLastByCistern(cistern.id);
          return { cistern, equipments };
        })
      );

      type PartsNeedCandidate = {
        equipment: LastEquipmentDTO;
        cistern: RailwayCisternRepairsFilterListDTO;
        partId: string;
        repairType: UpcomingRepairType;
        repairDate: Date;
      };

      const candidates: PartsNeedCandidate[] = [];
      equipmentResults.forEach((result) => {
        if (result.status !== "fulfilled") return;
        const { cistern, equipments } = result.value;
        const upcoming = resolveUpcomingRepair({
          planPeriodDepotRepair: cistern.planPeriodDepotRepair,
          planPeriodMajorRepair: cistern.planPeriodMajorRepair,
        });
        // Без даты ближайшего ДР/КР потребность не считаем
        if (!upcoming) return;

        equipments.forEach((equipment) => {
          if (!equipment?.lastEquipment) return;
          const partId = equipment.lastEquipment.part?.partId;
          if (!isValidEntityId(partId)) return;
          candidates.push({
            equipment,
            cistern,
            partId,
            repairType: upcoming.repairType,
            repairDate: upcoming.repairDate,
          });
        });
      });

      const partResults = await Promise.allSettled(
        candidates.map(async (candidate) => {
          const part = await partsApi.getById(candidate.partId);
          return { candidate, part };
        })
      );

      const loaded = partResults.flatMap((result) => {
        if (result.status !== "fulfilled" || !result.value.part) return [];
        return [result.value];
      });

      const rows = loaded.flatMap(({ candidate, part }, index) => {
        const last = candidate.equipment.lastEquipment;
        const need = evaluatePartNeed({
          part,
          repairType: candidate.repairType,
          repairDate: candidate.repairDate,
          wagonModelName: candidate.cistern.wagonModelName,
          thicknessLeft: last?.thicknessLeft,
          thicknessRight: last?.thicknessRight,
        });
        if (!need) return [];
        return [
          toPartsNeedRow(candidate.equipment, candidate.cistern, index, {
            highlight: need.highlight,
            repairType: need.repairType,
            repairDate: need.repairDate,
          }),
        ];
      });
      setPartsNeedRows(rows);
    } finally {
      setIsPartsNeedLoading(false);
    }
  }, [planningRowsFiltered]);

  const handlePartsNeedGoTo = useCallback(
    (row: PartsNeedRow) => {
      if (!row.cisternId) return;
      router.push(`/cisterns/${row.cisternId}?tab=components`);
    },
    [router]
  );

  const handlePartsNeedShowInfo = useCallback(async (row: PartsNeedRow) => {
    if (!row.partId) return;

    setPartsNeedInfoOpen(true);
    setIsPartsNeedInfoLoading(true);
    setPartsNeedInfoError(null);
    setPartsNeedInfoParts([]);

    try {
      const part = await partsApi.getById(row.partId);
      setPartsNeedInfoParts(part ? [part] : []);
    } catch {
      setPartsNeedInfoError("Не удалось загрузить информацию о детали");
    } finally {
      setIsPartsNeedInfoLoading(false);
    }
  }, []);

  const handlePartsNeedOpenPartPage = useCallback(
    (partId: string) => {
      router.push(`/directories/parts/${partId}/edit`);
    },
    [router]
  );

  const handlePartsNeedInfoOpenChange = useCallback((open: boolean) => {
    setPartsNeedInfoOpen(open);
    if (!open) {
      setPartsNeedInfoParts([]);
      setPartsNeedInfoError(null);
      setIsPartsNeedInfoLoading(false);
    }
  }, []);

  const handleExportPartsNeed = useCallback(
    async (type: "pdf" | "doc" | "xls") => {
      if (!partsNeedRows?.length) return;

      const columns = [
        { key: "cisternNumber", label: "Номер вагона-цистерны", type: "string" as const },
        { key: "upcomingRepair", label: "Ближайший ремонт", type: "string" as const },
        { key: "equipmentTypeName", label: "Тип детали", type: "string" as const },
        {
          key: "partDetails",
          label: "Деталь (код пред.; завод. номер; год)",
          type: "string" as const,
        },
        {
          key: "thickness",
          label: "Толщина колесной пары (Л/П)",
          type: "string" as const,
        },
        { key: "truckType", label: "Код вида тележки", type: "string" as const },
        { key: "document", label: "Документ", type: "string" as const },
      ];

      const data = partsNeedRows.map((row) => ({
        cisternNumber: row.cisternNumber || "—",
        upcomingRepair: row.repairType
          ? `${formatUpcomingRepairType(row.repairType)}${
              row.repairDate ? ` (${row.repairDate})` : ""
            }`
          : "—",
        equipmentTypeName: row.equipmentTypeName || "—",
        partDetails: row.partDetails || "—",
        thickness: row.thickness || "—",
        truckType: row.truckType || "—",
        document: row.document || "—",
      }));

      const extensionByType: Record<"pdf" | "doc" | "xls", string> = {
        pdf: "pdf",
        doc: "docx",
        xls: "xlsx",
      };
      const mimeByType: Record<"pdf" | "doc" | "xls", string> = {
        pdf: "application/pdf",
        doc: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        xls: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      };

      setExportingType(type);
      try {
        const response = await api.post(
          "/api/export/table",
          {
            type,
            columns,
            data,
            fileName:
              type === "pdf"
                ? "PartsNeedPDF"
                : type === "doc"
                  ? "PartsNeedDOC"
                  : "PartsNeedXLS",
          },
          {
            responseType: "blob",
          }
        );

        const fileBaseName =
          type === "pdf"
            ? "PartsNeedPDF"
            : type === "doc"
              ? "PartsNeedDOC"
              : "PartsNeedXLS";
        const url = window.URL.createObjectURL(
          new Blob([response.data], { type: mimeByType[type] })
        );
        const link = document.createElement("a");
        link.href = url;
        link.download = `${fileBaseName}.${extensionByType[type]}`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error(`Export parts need ${type.toUpperCase()} failed`, error);
      } finally {
        setExportingType(null);
      }
    },
    [partsNeedRows]
  );

  const activeFiltersCount = useMemo(() => {
    const filterCount =
      filterTableType === "in"
        ? countRepairsInFilters(filtersIn)
        : countRepairsOutFilters(filtersOut);
    const onlyUnmatchedActive =
      onlyUnmatchedRepairs && !isFilterModeIn && !isFilterModeOut;
    return filterCount + sortFields.length + (onlyUnmatchedActive ? 1 : 0);
  }, [
    filterTableType,
    filtersIn,
    filtersOut,
    sortFields,
    onlyUnmatchedRepairs,
    isFilterModeIn,
    isFilterModeOut,
  ]);

  const handleClearFilters = useCallback(() => {
    setFiltersIn({});
    setFiltersOut({});
    setSortFields([]);
    setOnlyUnmatchedRepairs(false);
    setPageIn(1);
    setPageOut(1);
  }, []);

  const handleExport = useCallback(async (type: "pdf" | "doc" | "xls") => {
    type ExportColumn = {
      key: string;
      label: string;
      type: "string" | "date" | "number";
    };

    let columns: ExportColumn[] = [];
    let data: Record<string, string>[] = [];

    if (mainSection === "planning") {
      const visibleExportKeys = getPlanningExportColumnKeys(planningVisibleColumns);
      const allPlanningColumns = [
        { key: "number", label: "Вагон", type: "string" },
        { key: "registrationNumber", label: "Рег. №", type: "string" },
        { key: "serviceLifeYears", label: "Срок эксплуатации, лет", type: "string" },
        { key: "buildDate", label: "Дата постройки", type: "date" },
        { key: "model", label: "Модель", type: "string" },
        { key: "periodMajorRepair", label: "Капитальный ремонт — последний", type: "date" },
        { key: "planPeriodMajorRepair", label: "Капитальный ремонт — следующий", type: "date" },
        { key: "periodDepotRepair", label: "Деповской ремонт — последний", type: "date" },
        { key: "planPeriodDepotRepair", label: "Деповской ремонт — следующий", type: "date" },
        { key: "periodPeriodicTest", label: "ГИ (периодическое испытание) — последний", type: "date" },
        { key: "planPeriodPeriodicTest", label: "ГИ (периодическое испытание) — следующий", type: "date" },
        { key: "periodIntermediateTest", label: "ИГ (промежуточное испытание) — последний", type: "date" },
        { key: "planPeriodIntermediateTest", label: "ИГ (промежуточное испытание) — следующий", type: "date" },
        { key: "periodPPRRepair", label: "Профремонт (ППР) — последний", type: "date" },
        { key: "planPeriodPPRRepair", label: "Профремонт (ППР) — следующий", type: "date" },
        { key: "mileage", label: "Пробег", type: "number" },
        { key: "paintingLast", label: "Покраска — последняя", type: "date" },
        {
          key: "serviceEndDate",
          label: "Дата окончания эксплуатации",
          type: "date",
        },
        {
          key: "extensionServiceLifeDate",
          label: "Дата продления срока эксплуатации",
          type: "date",
        },
        {
          key: "reRegistrationDate",
          label: "Перерегистрация — последняя",
          type: "date",
        },
        {
          key: "reRegistrationNextDate",
          label: "Перерегистрация — следующая",
          type: "date",
        },
        {
          key: "periodDetachRepair",
          label: "Текущий отцепочный ремонт — последний",
          type: "date",
        },
      ] satisfies ExportColumn[];
      columns = allPlanningColumns.filter((col) => visibleExportKeys.has(col.key));
      const allRows: Record<string, string>[] = (planningRowsFiltered ?? []).map((row) => ({
        number: row.number ?? "—",
        registrationNumber: row.registrationNumber ?? "—",
        serviceLifeYears: String(row.serviceLifeYears ?? "—"),
        buildDate: row.buildDate
          ? new Date(row.buildDate).toLocaleDateString("ru-RU")
          : "—",
        model: row.wagonModelName ?? "—",
        periodMajorRepair: formatRuDate(row.periodMajorRepair),
        planPeriodMajorRepair: formatRuDate(row.planPeriodMajorRepair),
        periodDepotRepair: formatRuDate(row.periodDepotRepair),
        planPeriodDepotRepair: formatRuDate(row.planPeriodDepotRepair),
        periodPeriodicTest: formatRuDate(row.periodPeriodicTest),
        planPeriodPeriodicTest: formatRuDate(row.planPeriodPeriodicTest),
        periodIntermediateTest: formatRuDate(row.periodIntermediateTest),
        planPeriodIntermediateTest: formatRuDate(row.planPeriodIntermediateTest),
        periodPPRRepair: formatRuDate(row.periodPPRRepair),
        planPeriodPPRRepair: formatRuDate(row.planPeriodPPRRepair),
        mileage: row.milage != null ? String(row.milage) : "—",
        paintingLast: formatRuDate(row.periodPaintRepair),
        serviceEndDate: formatPlanningServiceEndDate(row.buildDate, row.serviceLifeYears),
        extensionServiceLifeDate: formatRuDate(row.extensionServiceLifeDate),
        periodDetachRepair: formatRuDate(row.periodDetachRepair),
        reRegistrationDate: formatRuDate(row.reRegistrationDate),
        reRegistrationNextDate: formatRuDate(row.reRegistrationNextDate),
      }));
      data = allRows.map((row) => {
        const filtered: Record<string, string> = {};
        for (const col of columns) {
          filtered[col.key] = row[col.key] ?? "—";
        }
        return filtered;
      });
    } else if (activeTab === "in") {
      columns = [
        { key: "dateIn", label: "Дата приёма", type: "date" },
        { key: "number", label: "Номер вагона", type: "string" },
        { key: "repairType", label: "Тип ремонта", type: "string" },
        { key: "vu23", label: "ВУ23", type: "string" },
        { key: "depot", label: "Депо", type: "string" },
        { key: "station", label: "Станция", type: "string" },
        { key: "road", label: "Дорога", type: "string" },
        { key: "defectCode", label: "Код дефектов", type: "string" },
        { key: "defects", label: "Дефекты", type: "string" },
      ];
      data = (repairsInFiltered ?? []).map((r) => ({
        dateIn: r.dateIn
          ? new Date(r.dateIn).toLocaleString("ru-RU", {
              dateStyle: "short",
              timeStyle: "short",
            })
          : "—",
        number: r.cisternNumber ?? "—",
        repairType: r.repairType?.name ?? "—",
        vu23: r.vU23 ?? "—",
        depot: r.depotName ? `${r.depotName} (${r.depotCode})` : "—",
        station: r.stationName ? `${r.stationName} (${r.stationCode})` : "—",
        road: r.roadName ?? "—",
        defectCode: r.defectCode?.length ? r.defectCode.join(", ") : "—",
        defects: r.defectName?.length ? r.defectName.join(", ") : "—",
      }));
    } else if (activeTab === "out") {
      columns = [
        { key: "dateIn", label: "Дата начала ремонта", type: "date" },
        { key: "dateOut", label: "Дата выпуска", type: "date" },
        { key: "number", label: "Номер вагона", type: "string" },
        { key: "repairType", label: "Тип ремонта", type: "string" },
        { key: "vu36", label: "ВУ36", type: "string" },
        { key: "depot", label: "Депо", type: "string" },
        { key: "road", label: "Дорога", type: "string" },
        { key: "modernCode", label: "Код модификации", type: "string" },
        { key: "modern", label: "Модернизации", type: "string" },
      ];
      data = (repairsOutFiltered ?? []).map((r) => ({
        dateIn: r.dateIn
          ? new Date(r.dateIn).toLocaleString("ru-RU", {
              dateStyle: "short",
              timeStyle: "short",
            })
          : "—",
        dateOut: r.dateOut
          ? new Date(r.dateOut).toLocaleString("ru-RU", {
              dateStyle: "short",
              timeStyle: "short",
            })
          : "—",
        number: r.cisternNumber ?? "—",
        repairType: r.repairType?.name ?? "—",
        vu36: r.vU36 ?? "—",
        depot: r.depotName ? `${r.depotName} (${r.depotCode})` : "—",
        road: r.roadName ?? "—",
        modernCode: r.modernCode?.length ? r.modernCode.join(", ") : "—",
        modern: r.modernName?.length ? r.modernName.join(", ") : "—",
      }));
    } else {
      columns = [
        { key: "dateTime", label: "Дата сопоставления", type: "date" },
        { key: "number", label: "Номер вагона", type: "string" },
        { key: "dateIn", label: "Дата приёма", type: "date" },
        { key: "dateOutIn", label: "Дата нач. ремонта", type: "date" },
        { key: "dateOut", label: "Дата выпуска", type: "date" },
        { key: "repairType", label: "Тип ремонта", type: "string" },
        { key: "vu23", label: "ВУ23", type: "string" },
        { key: "vu36", label: "ВУ36", type: "string" },
        { key: "depotIn", label: "Депо (приём)", type: "string" },
        { key: "station", label: "Станция", type: "string" },
        { key: "roadIn", label: "Дорога (приём)", type: "string" },
        { key: "defects", label: "Дефекты", type: "string" },
        { key: "depotOut", label: "Депо (выпуск)", type: "string" },
        { key: "roadOut", label: "Дорога (выпуск)", type: "string" },
        { key: "modern", label: "Модернизации", type: "string" },
      ];
      data = (repairsMatchingFiltered ?? []).map((m) => ({
        dateTime: m.dateTime
          ? new Date(m.dateTime).toLocaleString("ru-RU", {
              dateStyle: "short",
              timeStyle: "short",
            })
          : "—",
        number:
          m.repairIn?.cisternNumber ?? m.repairOut?.cisternNumber ?? m.cistern?.number ?? "—",
        dateIn: m.repairIn?.dateIn
          ? new Date(m.repairIn.dateIn).toLocaleString("ru-RU", {
              dateStyle: "short",
              timeStyle: "short",
            })
          : "—",
        dateOutIn: m.repairOut?.dateIn
          ? new Date(m.repairOut.dateIn).toLocaleString("ru-RU", {
              dateStyle: "short",
              timeStyle: "short",
            })
          : "—",
        dateOut: m.repairOut?.dateOut
          ? new Date(m.repairOut.dateOut).toLocaleString("ru-RU", {
              dateStyle: "short",
              timeStyle: "short",
            })
          : "—",
        repairType: m.repairIn?.repairType?.name ?? m.repairOut?.repairType?.name ?? "—",
        vu23: m.repairIn?.vU23 ?? "—",
        vu36: m.repairOut?.vU36 ?? "—",
        depotIn: m.repairIn?.depotName ? `${m.repairIn?.depotName} (${m.repairIn?.depotCode})` : "—",
        station: m.repairIn?.stationName ? `${m.repairIn?.stationName} (${m.repairIn?.stationCode})` : "—",
        roadIn: m.repairIn?.roadName ?? "—",
        defects: m.repairIn?.defectName?.length ? m.repairIn.defectName.join(", ") : "—",
        depotOut: m.repairOut?.depotName ? `${m.repairOut?.depotName} (${m.repairOut?.depotCode})` : "—",
        roadOut: m.repairOut?.roadName ?? "—",
        modern: m.repairOut?.modernName?.length ? m.repairOut.modernName.join(", ") : "—",
      }));
    }

    const extensionByType: Record<"pdf" | "doc" | "xls", string> = {
      pdf: "pdf",
      doc: "docx",
      xls: "xlsx",
    };
    const mimeByType: Record<"pdf" | "doc" | "xls", string> = {
      pdf: "application/pdf",
      doc: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      xls: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    };

    setExportingType(type);
    try {
      const response = await api.post(
        "/api/export/table",
        {
          type,
          columns,
          data,
          fileName:
            type === "pdf" ? "ExportPDF" : type === "doc" ? "ExportDOC" : "ExportXLS",
        },
        {
          responseType: "blob",
        }
      );

      const fileBaseName =
        type === "pdf" ? "ExportPDF" : type === "doc" ? "ExportDOC" : "ExportXLS";
      const url = window.URL.createObjectURL(
        new Blob([response.data], { type: mimeByType[type] })
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = `${fileBaseName}.${extensionByType[type]}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(`Export ${type.toUpperCase()} failed`, error);
    } finally {
      setExportingType(null);
    }
  }, [
    activeTab,
    mainSection,
    repairsInFiltered,
    repairsOutFiltered,
    repairsMatchingFiltered,
    planningRowsFiltered,
    planningVisibleColumns,
  ]);

  const handleCisternSelect = useCallback(async () => {
    setIsInitialLoading(true);
    try {
      const planningData = await cisternsApi.getRepairsFilter({});
      setPlanningRows(planningData);
    } finally {
      setIsInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    handleCisternSelect();
  }, [handleCisternSelect]);

  useEffect(() => {
    setPagePlanning(1);
  }, [planningFiltersApplied]);

  const getVisiblePages = (currentPage: number, totalPages: number) => {
    const delta = 1;
    const range: number[] = [];
    const rangeWithDots: (number | string)[] = [];
    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }
    if (currentPage - delta > 2) {
      rangeWithDots.push(1, "...");
    } else {
      rangeWithDots.push(1);
    }
    rangeWithDots.push(...range);
    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push("...", totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }
    return rangeWithDots;
  };

  const RepairsPagination = ({
    currentPage,
    totalPages,
    totalCount,
    onPageChange,
    pageSize: pageSizeProp = pageSize,
    onPageSizeChange = handlePageSizeChange,
  }: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    onPageChange: (page: number) => void;
    pageSize?: number;
    onPageSizeChange?: (pageSize: number) => void;
  }) => {
    if (totalPages <= 1) return null;
    const startItem = (currentPage - 1) * pageSizeProp + 1;
    const endItem = Math.min(currentPage * pageSizeProp, totalCount);
    return (
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center space-x-2">
          <p className="text-sm text-muted-foreground">
            Показано {startItem}-{endItem} из {totalCount} записей
          </p>
          <select
            value={pageSizeProp}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="ml-2 text-sm border rounded px-2 py-1 bg-background border-input"
          >
            <option value={5}>5 на странице</option>
            <option value={10}>10 на странице</option>
            <option value={25}>25 на странице</option>
            <option value={50}>50 на странице</option>
          </select>
        </div>
        <div className="flex items-center space-x-1">
          <Button variant="outline" size="sm" onClick={() => onPageChange(1)} disabled={currentPage === 1}>
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {getVisiblePages(currentPage, totalPages).map((pageNum, index) => (
            <Button
              key={index}
              variant={pageNum === currentPage ? "default" : "outline"}
              size="sm"
              onClick={() => typeof pageNum === "number" && onPageChange(pageNum)}
              disabled={typeof pageNum !== "number"}
              className="min-w-[40px]"
            >
              {pageNum}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 w-full">
      <Tabs
        value={mainSection}
        onValueChange={(v) => setMainSection(v as "details" | "planning")}
        className="w-full"
      >
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 p-1">
          <TabsTrigger value="planning" className="py-4 text-[2rem] leading-tight">
            <CalendarCog className="size-[1em] shrink-0" />
            Планирование ремонтов
          </TabsTrigger>
          <TabsTrigger value="details" className="gap-3 py-4 text-[2rem] leading-tight">
            <Wrench className="size-[1em] shrink-0" />
            Сведения о ремонтах
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-6 space-y-8">
      <div className="flex items-center justify-end gap-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-md border bg-background p-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              title="Экспорт DOC"
              onClick={() => handleExport("doc")}
              disabled={!!exportingType || isInitialLoading}
            >
              {exportingType === "doc" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Image src="/icon_word.svg" alt="Экспорт DOC" width={16} height={16} />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              title="Экспорт PDF"
              onClick={() => handleExport("pdf")}
              disabled={!!exportingType || isInitialLoading}
            >
              {exportingType === "pdf" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Image src="/icon_pdf.png" alt="Экспорт PDF" width={16} height={16} />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              title="Экспорт XLS"
              onClick={() => handleExport("xls")}
              disabled={!!exportingType || isInitialLoading}
            >
              {exportingType === "xls" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Image src="/icon_excel.svg" alt="Экспорт XLS" width={16} height={16} />
              )}
            </Button>
          </div>
          <RepairsFilters
            filterTableType={filterTableType}
            onFilterTableTypeChange={setFilterTableType}
            filtersIn={filtersIn}
            filtersOut={filtersOut}
            onFiltersInChange={setFiltersIn}
            onFiltersOutChange={setFiltersOut}
            sortFields={sortFields}
            onSortFieldsChange={setSortFields}
            onClearFilters={handleClearFilters}
            activeFiltersCount={activeFiltersCount}
            onlyUnmatchedRepairs={onlyUnmatchedRepairs}
            onOnlyUnmatchedRepairsChange={setOnlyUnmatchedRepairs}
            onlyUnmatchedRepairsDisabled={isFilterModeIn || isFilterModeOut}
          />
        </div>
      </div>


            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "in" | "out" | "matched")} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="in">Перечисленные в ремонт</TabsTrigger>
                <TabsTrigger value="out">Выпуск из ремонта</TabsTrigger>
                <TabsTrigger value="matched">Сопоставленные данные</TabsTrigger>
              </TabsList>
              <TabsContent value="in" className="mt-4">
                <Card>
                  <CardContent className="px-4 py-0 overflow-x-auto">
                  <TableRecordsHeader
                    {...getRecordsCountDisplay({
                      count: totalCountIn,
                      isSearch: false,
                      isFilter: isFilterModeIn || (onlyUnmatchedRepairs && !isFilterModeIn),
                    })}
                  />
                    <Table className="w-full text-xs">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="whitespace-nowrap w-0">Дата приёма</TableHead>
                          <TableHead className="whitespace-nowrap w-0">№ Вагона</TableHead>
                          <TableHead className="whitespace-normal py-2 min-w-0">Тип ремонта</TableHead>
                          <TableHead className="whitespace-nowrap w-0">ВУ23</TableHead>
                          <TableHead className="whitespace-normal py-2 min-w-0">Депо</TableHead>
                          <TableHead className="whitespace-normal py-2 min-w-0">Станция</TableHead>
                          <TableHead className="whitespace-nowrap w-0">Дорога</TableHead>
                          <TableHead className="whitespace-normal py-2 min-w-0">Код дефектов</TableHead>
                          <TableHead className="whitespace-normal py-2 min-w-0">Дефекты</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isInitialLoading || isFilterLoadingIn || isFetchingIn ? (
                          <TableRow>
                            <TableCell
                              colSpan={9}
                              className="text-center text-muted-foreground py-8"
                            >
                              <div className="inline-flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Загрузка данных...</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : repairsInPaginated?.length ? (
                          repairsInPaginated.map((r) => (
                            <TableRow
                              key={r.id}
                              className={
                                r.isMatching
                                  ? "even:bg-muted/30"
                                  : "bg-rose-200/80 dark:bg-rose-900/60"
                              }
                            >
                              <TableCell
                                className={cn(
                                  "whitespace-nowrap",
                                  getUpcomingRepairCellClass(r.dateIn)
                                )}
                              >
                                {r.dateIn
                                  ? new Date(r.dateIn).toLocaleString("ru-RU", {
                                      dateStyle: "short",
                                      timeStyle: "short",
                                    })
                                  : "—"}
                              </TableCell>
                              <TableCell className="whitespace-nowrap">{r.cisternNumber}</TableCell>
                              <TableCell className="whitespace-normal break-words min-w-0">{r.repairType?.name ?? "—"}</TableCell>
                              <TableCell className="whitespace-nowrap">{r.vU23 ?? "—"}</TableCell>
                              <TableCell className="whitespace-normal break-words min-w-0">{r.depotName ? `${r.depotName} (${r.depotCode})` : "—"}</TableCell>
                              <TableCell className="whitespace-normal break-words min-w-0">{r.stationName ? `${r.stationName} (${r.stationCode})` : "—"}</TableCell>
                              <TableCell className="whitespace-normal break-words min-w-0">{r.roadName ?? "—"}</TableCell>
                              <TableCell className="whitespace-normal break-words min-w-0">
                                {r.defectCode?.length ? r.defectCode.join(", ") : "—"}
                              </TableCell>
                              <TableCell className="whitespace-normal break-words min-w-0">
                                {r.defectName?.length ? r.defectName.join(", ") : "—"}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                              Нет данных
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                  <div className="mt-4 px-4 pb-2">
                    <RepairsPagination
                      currentPage={pageIn}
                      totalPages={totalPagesIn}
                      totalCount={totalCountIn}
                      onPageChange={handlePageChangeIn}
                    />
                  </div>
                </Card>
              </TabsContent>
              <TabsContent value="out" className="mt-4">
                <Card>
                  <CardContent className="px-4 py-0 overflow-x-auto">
                  <TableRecordsHeader
                    {...getRecordsCountDisplay({
                      count: totalCountOut,
                      isSearch: false,
                      isFilter: isFilterModeOut || (onlyUnmatchedRepairs && !isFilterModeOut),
                    })}
                  />
                    <Table className="w-full text-xs">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="whitespace-nowrap w-0">Дата начала ремонта</TableHead>
                          <TableHead className="whitespace-nowrap w-0">Дата выпуска</TableHead>
                          <TableHead className="whitespace-nowrap w-0">№ Вагона</TableHead>
                          <TableHead className="whitespace-normal py-2 min-w-0">Тип ремонта</TableHead>
                          <TableHead className="whitespace-nowrap w-0">ВУ36</TableHead>
                          <TableHead className="whitespace-normal py-2 min-w-0">Депо</TableHead>
                          <TableHead className="whitespace-nowrap w-0">Дорога</TableHead>
                          <TableHead className="whitespace-normal py-2 min-w-0">Код модификации</TableHead>
                          <TableHead className="whitespace-normal py-2 min-w-0">Модернизации</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isInitialLoading || isFilterLoadingOut || isFetchingOut ? (
                          <TableRow>
                            <TableCell
                              colSpan={9}
                              className="text-center text-muted-foreground py-8"
                            >
                              <div className="inline-flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Загрузка данных...</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : repairsOutPaginated?.length ? (
                          repairsOutPaginated.map((r) => (
                            <TableRow
                              key={r.id}
                              className={
                                r.isMatching
                                  ? "even:bg-muted/30"
                                  : "bg-rose-200/80 dark:bg-rose-900/60"
                              }
                            >
                              <TableCell
                                className={cn(
                                  "whitespace-nowrap",
                                  getUpcomingRepairCellClass(r.dateIn)
                                )}
                              >
                                {r.dateIn
                                  ? new Date(r.dateIn).toLocaleString("ru-RU", {
                                      dateStyle: "short",
                                      timeStyle: "short",
                                    })
                                  : "—"}
                              </TableCell>
                              <TableCell
                                className={cn(
                                  "whitespace-nowrap",
                                  getUpcomingRepairCellClass(r.dateOut)
                                )}
                              >
                                {r.dateOut
                                  ? new Date(r.dateOut).toLocaleString("ru-RU", {
                                      dateStyle: "short",
                                      timeStyle: "short",
                                    })
                                  : "—"}
                              </TableCell>
                              <TableCell className="whitespace-nowrap">{r.cisternNumber}</TableCell>
                              <TableCell className="whitespace-normal break-words min-w-0">{r.repairType?.name ?? "—"}</TableCell>
                              <TableCell className="whitespace-nowrap">{r.vU36 ?? "—"}</TableCell>
                              <TableCell className="whitespace-normal break-words min-w-0">{r.depotName ? `${r.depotName} (${r.depotCode})` : "—"}</TableCell>
                              <TableCell className="whitespace-normal break-words min-w-0">{r.roadName ?? "—"}</TableCell>
                              <TableCell className="whitespace-normal break-words min-w-0">
                                {r.modernCode?.length ? r.modernCode.join(", ") : "—"}
                              </TableCell>
                              <TableCell className="whitespace-normal break-words min-w-0">
                                {r.modernName?.length ? r.modernName.join(", ") : "—"}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                              Нет данных
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                  <div className="mt-4 px-4 pb-2">
                    <RepairsPagination
                      currentPage={pageOut}
                      totalPages={totalPagesOut}
                      totalCount={totalCountOut}
                      onPageChange={handlePageChangeOut}
                    />
                  </div>
                </Card>
              </TabsContent>
              <TabsContent value="matched" className="mt-4">
                <Card>

                  <CardContent className="px-4 py-0 overflow-x-auto">
                  <TableRecordsHeader
                    {...getRecordsCountDisplay({
                      count: totalCountMatched,
                      isSearch: false,
                      isFilter: false,
                    })}
                  />
                    <Table className="w-full text-xs">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="whitespace-nowrap w-0">Дата сопоставления</TableHead>
                          <TableHead className="whitespace-nowrap w-0">№ Вагона</TableHead>
                          <TableHead className="whitespace-nowrap w-0">Дата приёма</TableHead>
                          <TableHead className="whitespace-nowrap w-0">Дата нач. ремонта</TableHead>
                          <TableHead className="whitespace-nowrap w-0">Дата выпуска</TableHead>
                          <TableHead className="whitespace-normal py-2 min-w-0">Тип ремонта</TableHead>
                          <TableHead className="whitespace-nowrap w-0">ВУ23</TableHead>
                          <TableHead className="whitespace-nowrap w-0">ВУ36</TableHead>
                          <TableHead className="whitespace-normal py-2 min-w-0">Депо (приём)</TableHead>
                          <TableHead className="whitespace-normal py-2 min-w-0">Станция</TableHead>
                          <TableHead className="whitespace-nowrap w-0">Дорога (приём)</TableHead>
                          <TableHead className="whitespace-normal py-2 min-w-0">Дефекты</TableHead>
                          <TableHead className="whitespace-normal py-2 min-w-0">Депо (выпуск)</TableHead>
                          <TableHead className="whitespace-nowrap w-0">Дорога (выпуск)</TableHead>
                          <TableHead className="whitespace-normal py-2 min-w-0">Модернизации</TableHead>
                          <TableHead className="whitespace-normal py-2 min-w-0">Период ремонта</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isInitialLoading || isFilterLoadingMatching || isFetchingMatching ? (
                          <TableRow>
                            <TableCell colSpan={15} className="text-center text-muted-foreground py-8">
                              <div className="inline-flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Загрузка данных...</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : repairsMatchingPaginated?.length ? (
                          repairsMatchingPaginated.map((m) => (
                            <TableRow key={m.id} className="even:bg-muted/30">
                              <TableCell
                                className={cn(
                                  "whitespace-nowrap",
                                  getUpcomingRepairCellClass(m.dateTime)
                                )}
                              >
                                {m.dateTime
                                  ? new Date(m.dateTime).toLocaleString("ru-RU", {
                                      dateStyle: "short",
                                      timeStyle: "short",
                                    })
                                  : "—"}
                              </TableCell>
                              <TableCell className="whitespace-nowrap">{m.repairIn?.cisternNumber ?? m.repairOut?.cisternNumber ?? m.cistern?.number ?? "—"}</TableCell>
                              <TableCell
                                className={cn(
                                  "whitespace-nowrap",
                                  getUpcomingRepairCellClass(m.repairIn?.dateIn)
                                )}
                              >
                                {m.repairIn?.dateIn
                                  ? new Date(m.repairIn.dateIn).toLocaleString("ru-RU", {
                                      dateStyle: "short",
                                      timeStyle: "short",
                                    })
                                  : "—"}
                              </TableCell>
                              <TableCell
                                className={cn(
                                  "whitespace-nowrap",
                                  getUpcomingRepairCellClass(m.repairOut?.dateIn)
                                )}
                              >
                                {m.repairOut?.dateIn
                                  ? new Date(m.repairOut.dateIn).toLocaleString("ru-RU", {
                                      dateStyle: "short",
                                      timeStyle: "short",
                                    })
                                  : "—"}
                              </TableCell>
                              <TableCell
                                className={cn(
                                  "whitespace-nowrap",
                                  getUpcomingRepairCellClass(m.repairOut?.dateOut)
                                )}
                              >
                                {m.repairOut?.dateOut
                                  ? new Date(m.repairOut.dateOut).toLocaleString("ru-RU", {
                                      dateStyle: "short",
                                      timeStyle: "short",
                                    })
                                  : "—"}
                              </TableCell>
                              <TableCell className="whitespace-normal break-words min-w-0">
                                {m.repairIn?.repairType?.name ?? m.repairOut?.repairType?.name ?? "—"}
                              </TableCell>
                              <TableCell className="whitespace-nowrap">{m.repairIn?.vU23 ?? "—"}</TableCell>
                              <TableCell className="whitespace-nowrap">{m.repairOut?.vU36 ?? "—"}</TableCell>

                             

                              <TableCell className="whitespace-normal break-words min-w-0"> {m.repairIn?.depotName ? `${m.repairIn?.depotName} (${m.repairIn?.depotCode})` : "—"} </TableCell>
                              <TableCell className="whitespace-normal break-words min-w-0"> {m.repairIn?.stationName ? `${m.repairIn?.stationName} (${m.repairIn?.stationCode})` : "—"} </TableCell>
                              <TableCell className="whitespace-normal break-words min-w-0">{m.repairIn?.roadName ?? "—"}</TableCell>
                              <TableCell className="whitespace-normal break-words min-w-0">
                                {m.repairIn?.defectName?.length ? m.repairIn.defectName.join(", ") : "—"}
                              </TableCell>
                              <TableCell className="whitespace-normal break-words min-w-0"> {m.repairOut?.depotName ? `${m.repairOut?.depotName} (${m.repairOut?.depotCode})` : "—"} </TableCell>
                              <TableCell className="whitespace-normal break-words min-w-0">{m.repairOut?.roadName ?? "—"}</TableCell>
                              <TableCell className="whitespace-normal break-words min-w-0">
                                {m.repairOut?.modernName?.length ? m.repairOut.modernName.join(", ") : "—"}
                              </TableCell>
                              <TableCell className="whitespace-normal break-words min-w-0">
                                {m.repairPeriod}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={15} className="text-center text-muted-foreground py-8">
                              Нет данных
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                  <div className="mt-4 px-4 pb-2">
                    <RepairsPagination
                      currentPage={pageMatched}
                      totalPages={totalPagesMatched}
                      totalCount={totalCountMatched}
                      onPageChange={handlePageChangeMatched}
                    />
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
        </TabsContent>

        <TabsContent value="planning" className="mt-6">
          <div className="mb-4 flex items-center justify-end gap-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 rounded-md border bg-background p-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                title="Экспорт DOC"
                onClick={() => handleExport("doc")}
                disabled={!!exportingType || isInitialLoading || isPlanningFilterLoading}
              >
                {exportingType === "doc" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Image src="/icon_word.svg" alt="Экспорт DOC" width={16} height={16} />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                title="Экспорт PDF"
                onClick={() => handleExport("pdf")}
                disabled={!!exportingType || isInitialLoading || isPlanningFilterLoading}
              >
                {exportingType === "pdf" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Image src="/icon_pdf.png" alt="Экспорт PDF" width={16} height={16} />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                title="Экспорт XLS"
                onClick={() => handleExport("xls")}
                disabled={!!exportingType || isInitialLoading || isPlanningFilterLoading}
              >
                {exportingType === "xls" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Image src="/icon_excel.svg" alt="Экспорт XLS" width={16} height={16} />
                )}
              </Button>
            </div>
            <PlanningRepairsFilters
              appliedFilters={planningFiltersApplied}
              onApply={handlePlanningFiltersApply}
              activeFiltersCount={activePlanningFiltersCount}
              visibleColumns={planningVisibleColumns}
              onVisibleColumnsChange={(columns) =>
                setPlanningVisibleColumns(columns)
              }
            />
            </div>
          </div>
          <Card>
            <CardContent className="px-4 py-0 overflow-x-auto">
            <TableRecordsHeader
              {...getRecordsCountDisplay({
                count: totalCountPlanning,
                isSearch: false,
                isFilter: activePlanningFiltersCount > 0,
              })}
            />
              <PlanningRepairsTable
                rows={planningRowsPaginated ?? []}
                visibleColumns={planningVisibleColumns}
                isLoading={isInitialLoading || isPlanningFilterLoading}
              />
            </CardContent>
            <div className="mt-4 px-4 pb-2">
              <RepairsPagination
                currentPage={pagePlanning}
                totalPages={totalPagesPlanning}
                totalCount={totalCountPlanning}
                onPageChange={handlePageChangePlanning}
                pageSize={pageSizePlanning}
                onPageSizeChange={handlePageSizeChangePlanning}
              />
            </div>
          </Card >

          <Card className="mt-6">
            <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
              <CardTitle>
                <h3 className="font-bold">Потребность в запасных частях</h3>
              </CardTitle>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 rounded-md border bg-background p-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    title="Экспорт DOC"
                    onClick={() => handleExportPartsNeed("doc")}
                    disabled={
                      !!exportingType ||
                      isPartsNeedLoading ||
                      !partsNeedRows?.length
                    }
                  >
                    {exportingType === "doc" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Image
                        src="/icon_word.svg"
                        alt="Экспорт DOC"
                        width={16}
                        height={16}
                      />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    title="Экспорт PDF"
                    onClick={() => handleExportPartsNeed("pdf")}
                    disabled={
                      !!exportingType ||
                      isPartsNeedLoading ||
                      !partsNeedRows?.length
                    }
                  >
                    {exportingType === "pdf" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Image
                        src="/icon_pdf.png"
                        alt="Экспорт PDF"
                        width={16}
                        height={16}
                      />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    title="Экспорт XLS"
                    onClick={() => handleExportPartsNeed("xls")}
                    disabled={
                      !!exportingType ||
                      isPartsNeedLoading ||
                      !partsNeedRows?.length
                    }
                  >
                    {exportingType === "xls" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Image
                        src="/icon_excel.svg"
                        alt="Экспорт XLS"
                        width={16}
                        height={16}
                      />
                    )}
                  </Button>
                </div>
                <Button
                  onClick={handleGeneratePartsNeedList}
                  disabled={
                    isInitialLoading ||
                    isPlanningFilterLoading ||
                    isPartsNeedLoading ||
                    totalCountPlanning === 0
                  }
                >
                  {isPartsNeedLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ListChecks className="h-4 w-4" />
                  )}
                  Сформировать список запчастей для замены
                </Button>
              </div>
            </CardHeader>
            {(isPartsNeedLoading || partsNeedRows !== null) && (
              <CardContent className="space-y-4">
                <div className="overflow-x-auto">
                  <CardHeader className="pb-3">
                    <div className="flex flex-col gap-1">
                      <CardDescription>
                        Всего записей: {totalCountPartsNeed}
                      </CardDescription>
                      {partsNeedTypeCountsDescription ? (
                        <CardDescription>{partsNeedTypeCountsDescription}</CardDescription>
                      ) : null}
                    </div>
                  </CardHeader>
                  <Table className="w-full text-xs">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="whitespace-nowrap w-0">
                          Номер вагона-цистерны
                        </TableHead>
                        <TableHead className="whitespace-nowrap w-0">
                          Ближайший ремонт
                        </TableHead>
                        <TableHead className="whitespace-normal py-2 min-w-0">
                          Тип детали
                        </TableHead>
                        <TableHead className="whitespace-normal py-2 min-w-0">
                          Деталь <br />
                          (код пред.; завод. номер; год)
                        </TableHead>
                        <TableHead className="whitespace-nowrap w-0">
                          Толщина колесной <br /> пары (Л/П)
                        </TableHead>
                        <TableHead className="whitespace-nowrap w-0">
                          Код вида тележки
                        </TableHead>
                        <TableHead className="whitespace-nowrap w-0">Документ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isPartsNeedLoading ? (
                        <TableRow>
                          <TableCell
                            colSpan={7}
                            className="text-center text-muted-foreground py-8"
                          >
                            <div className="inline-flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Формирование списка запчастей...</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : partsNeedRowsPaginated.length ? (
                        partsNeedRowsPaginated.map((row) => (
                          <ContextMenu key={row.id}>
                            <ContextMenuTrigger asChild>
                              <TableRow
                                className={cn(
                                  "cursor-context-menu",
                                  getPartsNeedRowClass(row.highlight) ??
                                    "even:bg-muted/30"
                                )}
                              >
                                <TableCell className="whitespace-nowrap">
                                  {row.cisternNumber}
                                </TableCell>
                                <TableCell className="whitespace-nowrap">
                                  {row.repairType
                                    ? `${formatUpcomingRepairType(row.repairType)}${
                                        row.repairDate ? ` (${row.repairDate})` : ""
                                      }`
                                    : "—"}
                                </TableCell>
                                <TableCell className="whitespace-normal break-words min-w-0">
                                  {row.equipmentTypeName}
                                </TableCell>
                                <TableCell className="whitespace-normal break-words min-w-0">
                                  {row.partDetails}
                                </TableCell>
                                <TableCell className="whitespace-nowrap">
                                  {row.thickness}
                                </TableCell>
                                <TableCell className="whitespace-nowrap">
                                  {row.truckType}
                                </TableCell>
                                <TableCell className="whitespace-nowrap">
                                  {row.document}
                                </TableCell>
                              </TableRow>
                            </ContextMenuTrigger>
                            <ContextMenuContent>
                              <ContextMenuItem
                                disabled={!row.cisternId}
                                onSelect={() => handlePartsNeedGoTo(row)}
                              >
                                <ExternalLink className="h-4 w-4" />
                                Перейти к комплектации вагона-цистерны
                              </ContextMenuItem>
                              <ContextMenuItem
                                disabled={!row.partId}
                                onSelect={() => handlePartsNeedShowInfo(row)}
                              >
                                <Info className="h-4 w-4" />
                                Показать информацию о детали
                              </ContextMenuItem>
                            </ContextMenuContent>
                          </ContextMenu>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={7}
                            className="text-center text-muted-foreground py-8"
                          >
                            Нет данных
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                <div className="px-2 pb-2">
                  <RepairsPagination
                    currentPage={pagePartsNeed}
                    totalPages={totalPagesPartsNeed}
                    totalCount={totalCountPartsNeed}
                    onPageChange={handlePageChangePartsNeed}
                    pageSize={pageSizePartsNeed}
                    onPageSizeChange={handlePageSizeChangePartsNeed}
                  />
                </div>
              </CardContent>
            )}
          </Card>

          <Dialog open={partsNeedInfoOpen} onOpenChange={handlePartsNeedInfoOpenChange}>
            <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-6xl">
              <DialogHeader>
                <DialogTitle>Информация о детали</DialogTitle>
                <DialogDescription>
                  Результат поиска в справочнике деталей
                </DialogDescription>
              </DialogHeader>

              {isPartsNeedInfoLoading ? (
                <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Загрузка информации о детали...</span>
                </div>
              ) : partsNeedInfoError ? (
                <div className="py-8 text-center text-sm text-destructive">
                  {partsNeedInfoError}
                </div>
              ) : !partsNeedInfoParts.length ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  По заданным параметрам детали не найдены
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table className="w-full text-xs">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Тип детали</TableHead>
                        <TableHead>Клеймо</TableHead>
                        <TableHead>
                          Заводской <br /> номер
                        </TableHead>
                        <TableHead>
                          Год <br /> производства
                        </TableHead>
                        <TableHead>Местоположение</TableHead>
                        <TableHead>Вагон/Депо</TableHead>
                        <TableHead>
                          Срок <br /> службы
                        </TableHead>
                        <TableHead>
                          Дата окончания <br /> эксплуатации
                        </TableHead>
                        <TableHead>
                          Дата продления <br /> эксплуатации
                        </TableHead>
                        <TableHead>Статус</TableHead>
                        <TableHead>Примечания</TableHead>
                        <TableHead>Модель</TableHead>
                        <TableHead className="w-[1%] whitespace-nowrap text-right">
                          Действия
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {partsNeedInfoParts.map((part) => (
                        <TableRow key={part.id}>
                          <TableCell className="font-medium">
                            {part.partType?.name ?? "—"}
                          </TableCell>
                          <TableCell>{part.stampNumber?.value ?? "—"}</TableCell>
                          <TableCell>{part.serialNumber || "—"}</TableCell>
                          <TableCell>{formatPartYear(part.manufactureYear)}</TableCell>
                          <TableCell>{getPartLocationDisplay(part.code)}</TableCell>
                          <TableCell>{getPartWagonDepotDisplay(part)}</TableCell>
                          <TableCell>{getPartServiceLifeYears(part) ?? "—"}</TableCell>
                          <TableCell>{getPartExtendedDateDisplay(part)}</TableCell>
                          <TableCell>
                            {formatDate(part.extendedUntil, "ru-RU", "—")}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              style={{ borderColor: part.status?.color }}
                            >
                              {part.status?.name ?? "—"}
                            </Badge>
                          </TableCell>
                          <TableCell>{part.notes || "—"}</TableCell>
                          <TableCell>{part.model || "—"}</TableCell>
                          <TableCell className="w-[1%] whitespace-nowrap text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePartsNeedOpenPartPage(part.id)}
                            >
                              Открыть
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => handlePartsNeedInfoOpenChange(false)}
                >
                  Закрыть
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  );
}
