"use client";

import { useEffect, useCallback, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Input,
  Button,
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
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  CalendarCog,
} from "lucide-react";
import Image from "next/image";
import { api } from "@/lib/api";
import { CisternRepairs } from "@/api/repairs";
import type { RailwayCisternDetailDTO } from '@/types/cisterns';
import { cisternsApi } from "@/api/cisterns";
import type { RepairsIn, RepairsOut, RepairsMatching } from "@/api/repairs";
import { RepairsFilters, type RepairsFilterTableType } from "@/components/repairs/repairs-filters";
import { useRepairsInFilter, useRepairsOutFilter } from "@/hooks";
import type {
  RepairsInFilterCriteria,
  RepairsOutFilterCriteria,
  RepairsSortCriteria,
} from "@/types/repairs";

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

export default function RepairsPage() {
  const [repairsIn, setRepairsIn] = useState<RepairsIn[] | null>(null);
  const [repairsOut, setRepairsOut] = useState<RepairsOut[] | null>(null);
  const [repairsMatching, setRepairsMatching] = useState<RepairsMatching[] | null>(null);
  const [planningCisterns, setPlanningCisterns] = useState<RailwayCisternDetailDTO[] | null>(null);
  const [mainSection, setMainSection] = useState<"details" | "planning">("details");
  const [activeTab, setActiveTab] = useState<"in" | "out" | "matched">("in");
  const [searchQuery, setSearchQuery] = useState("");
  const [planningSearchQuery, setPlanningSearchQuery] = useState("");
  const [pageIn, setPageIn] = useState(1);
  const [pageOut, setPageOut] = useState(1);
  const [pageMatched, setPageMatched] = useState(1);
  const [pagePlanning, setPagePlanning] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [exportingType, setExportingType] = useState<"pdf" | "doc" | "xls" | null>(null);

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
      sortFields: sortFields.length ? sortFields : undefined,
      page: pageIn,
      pageSize,
    }),
    [filtersIn, hasFiltersIn, sortFields, pageIn, pageSize]
  );

  const filterRequestOut = useMemo(
    () => ({
      filters: hasFiltersOut ? filtersOut : undefined,
      sortFields: sortFields.length ? sortFields : undefined,
      page: pageOut,
      pageSize,
    }),
    [filtersOut, hasFiltersOut, sortFields, pageOut, pageSize]
  );

  const { data: filterDataIn, isLoading: isFilterLoadingIn } = useRepairsInFilter(
    filterRequestIn,
    isFilterModeIn
  );

  const { data: filterDataOut, isLoading: isFilterLoadingOut } = useRepairsOutFilter(
    filterRequestOut,
    isFilterModeOut
  );

  const repairsInSource = useMemo(() => {
    if (isFilterModeIn && filterDataIn?.items) return filterDataIn.items;
    return repairsIn ?? [];
  }, [isFilterModeIn, filterDataIn?.items, repairsIn]);

  const repairsOutSource = useMemo(() => {
    if (isFilterModeOut && filterDataOut?.items) return filterDataOut.items;
    return repairsOut ?? [];
  }, [isFilterModeOut, filterDataOut?.items, repairsOut]);

  const repairsInSorted = useMemo(() => {
    if (!repairsInSource?.length) return repairsInSource ?? [];
    if (isFilterModeIn) return repairsInSource;
    return [...repairsInSource].sort(
      (a, b) => new Date(b.dateIn).getTime() - new Date(a.dateIn).getTime()
    );
  }, [repairsInSource, isFilterModeIn]);

  const repairsOutSorted = useMemo(() => {
    if (!repairsOutSource?.length) return repairsOutSource ?? [];
    if (isFilterModeOut) return repairsOutSource;
    return [...repairsOutSource].sort(
      (a, b) => new Date(b.dateOut).getTime() - new Date(a.dateOut).getTime()
    );
  }, [repairsOutSource, isFilterModeOut]);

  const repairsMatchingSorted = useMemo(() => {
    if (!repairsMatching?.length) return repairsMatching ?? [];
    return [...repairsMatching].sort(
      (a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()
    );
  }, [repairsMatching]);

  const matchedInIds = useMemo(() => {
    if (!repairsMatching?.length) return new Set<string>();
    return new Set(repairsMatching.map((m) => m.repairInId));
  }, [repairsMatching]);

  const matchedOutIds = useMemo(() => {
    if (!repairsMatching?.length) return new Set<string>();
    return new Set(repairsMatching.map((m) => m.repairOutId));
  }, [repairsMatching]);

  const repairsInFiltered = useMemo(() => {
    let list: RepairsIn[];
    if (isFilterModeIn) {
      list = repairsInSorted ?? [];
    } else if (activeTab !== "in" || !searchQuery.trim()) {
      list = repairsInSorted ?? [];
    } else {
      const q = searchQuery.trim().toLowerCase();
      list = (repairsInSorted ?? []).filter((r) => {
        const dateStr = r.dateIn
          ? new Date(r.dateIn).toLocaleString("ru-RU", { dateStyle: "short", timeStyle: "short" })
          : "";
        const defectStr = r.defectName?.length ? r.defectName.join(" ") : "";
        const searchable = [
          dateStr,
          r.cisternNumber,
          r.repairType?.name ?? "",
          r.vU23 ?? "",
          r.depotName ?? "",
          r.stationName ?? "",
          r.roadName ?? "",
          defectStr,
        ]
          .join(" ")
          .toLowerCase();
        return searchable.includes(q);
      });
    }
    if (onlyUnmatchedRepairs && !isFilterModeIn) {
      list = list.filter((r) => !matchedInIds.has(r.id));
    }
    return list;
  }, [repairsInSorted, searchQuery, activeTab, isFilterModeIn, onlyUnmatchedRepairs, matchedInIds]);

  const repairsOutFiltered = useMemo(() => {
    let list: RepairsOut[];
    if (isFilterModeOut) {
      list = repairsOutSorted ?? [];
    } else if (activeTab !== "out" || !searchQuery.trim()) {
      list = repairsOutSorted ?? [];
    } else {
      const q = searchQuery.trim().toLowerCase();
      list = (repairsOutSorted ?? []).filter((r) => {
        const dateInStr = r.dateIn
          ? new Date(r.dateIn).toLocaleString("ru-RU", { dateStyle: "short", timeStyle: "short" })
          : "";
        const dateOutStr = r.dateOut
          ? new Date(r.dateOut).toLocaleString("ru-RU", { dateStyle: "short", timeStyle: "short" })
          : "";
        const modernStr = r.modernName?.length ? r.modernName.join(" ") : "";
        const searchable = [
          dateInStr,
          dateOutStr,
          r.cisternNumber,
          r.repairType?.name ?? "",
          r.vU36 ?? "",
          r.depotName ?? "",
          r.roadName ?? "",
          modernStr,
        ]
          .join(" ")
          .toLowerCase();
        return searchable.includes(q);
      });
    }
    if (onlyUnmatchedRepairs && !isFilterModeOut) {
      list = list.filter((r) => !matchedOutIds.has(r.id));
    }
    return list;
  }, [repairsOutSorted, searchQuery, activeTab, isFilterModeOut, onlyUnmatchedRepairs, matchedOutIds]);

  const repairsMatchingFiltered = useMemo(() => {
    if (!searchQuery.trim()) return repairsMatchingSorted ?? [];
    const q = searchQuery.trim().toLowerCase();
    return (repairsMatchingSorted ?? []).filter((m) => {
      const dateTimeStr = m.dateTime ? new Date(m.dateTime).toLocaleString("ru-RU", { dateStyle: "short", timeStyle: "short" }) : "";
      const dateInStr = m.repairIn?.dateIn ? new Date(m.repairIn.dateIn).toLocaleString("ru-RU", { dateStyle: "short", timeStyle: "short" }) : "";
      const dateOutInStr = m.repairOut?.dateIn ? new Date(m.repairOut.dateIn).toLocaleString("ru-RU", { dateStyle: "short", timeStyle: "short" }) : "";
      const dateOutStr = m.repairOut?.dateOut ? new Date(m.repairOut.dateOut).toLocaleString("ru-RU", { dateStyle: "short", timeStyle: "short" }) : "";
      const cisternNum = m.repairIn?.cisternNumber ?? m.repairOut?.cisternNumber ?? m.cistern?.number ?? "";
      const repairType = m.repairIn?.repairType?.name ?? m.repairOut?.repairType?.name ?? "";
      const defectStr = m.repairIn?.defectName?.length ? m.repairIn.defectName.join(" ") : "";
      const modernStr = m.repairOut?.modernName?.length ? m.repairOut.modernName.join(" ") : "";
      const searchable = [
        dateTimeStr,
        dateInStr,
        dateOutInStr,
        dateOutStr,
        cisternNum,
        repairType,
        m.repairIn?.vU23 ?? "",
        m.repairOut?.vU36 ?? "",
        m.repairIn?.depotName ?? "",
        m.repairIn?.stationName ?? "",
        m.repairIn?.roadName ?? "",
        defectStr,
        m.repairOut?.depotName ?? "",
        m.repairOut?.roadName ?? "",
        modernStr,
      ].join(" ").toLowerCase();
      return searchable.includes(q);
    });
  }, [repairsMatchingSorted, searchQuery, activeTab]);

  const planningCisternsFiltered = useMemo(() => {
    if (!planningSearchQuery.trim()) return planningCisterns ?? [];
    const q = planningSearchQuery.trim().toLowerCase();
    return (planningCisterns ?? []).filter((cistern) => {
      const buildDate = cistern.buildDate
        ? new Date(cistern.buildDate).toLocaleDateString("ru-RU")
        : "";
      const serviceEndDate = formatPlanningServiceEndDate(
        cistern.buildDate,
        cistern.serviceLifeYears
      );
      const searchable = [
        cistern.number,
        cistern.registrationNumber ?? "",
        buildDate,
        serviceEndDate,
        cistern.model?.name ?? "",
        String(cistern.serviceLifeYears ?? ""),
        cistern.periodMajorRepair ?? "",
        cistern.periodPeriodicTest ?? "",
        cistern.periodIntermediateTest ?? "",
        cistern.periodDepotRepair ?? "",
        cistern.periodPPRRepair ?? "",
        cistern.planPeriodMajorRepair ?? "",
        cistern.planPeriodPeriodicTest ?? "",
        cistern.planPeriodIntermediateTest ?? "",
        cistern.planPeriodDepotRepair ?? "",
        cistern.planPeriodPPRRepair ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return searchable.includes(q);
    });
  }, [planningCisterns, planningSearchQuery]);

  useEffect(() => {
    setPageIn(1);
    setPageOut(1);
    setPageMatched(1);
  }, [searchQuery]);

  useEffect(() => {
    setPagePlanning(1);
  }, [planningSearchQuery]);

  useEffect(() => {
    setPageIn(1);
    setPageOut(1);
  }, [onlyUnmatchedRepairs]);

  useEffect(() => {
    if (isFilterModeIn || isFilterModeOut) {
      setOnlyUnmatchedRepairs(false);
    }
  }, [isFilterModeIn, isFilterModeOut]);

  const repairsInPaginated = useMemo(() => {
    if (isFilterModeIn) return repairsInFiltered ?? [];
    const list = repairsInFiltered ?? [];
    const start = (pageIn - 1) * pageSize;
    return list.slice(start, start + pageSize);
  }, [repairsInFiltered, pageIn, pageSize, isFilterModeIn]);

  const repairsOutPaginated = useMemo(() => {
    if (isFilterModeOut) return repairsOutFiltered ?? [];
    const list = repairsOutFiltered ?? [];
    const start = (pageOut - 1) * pageSize;
    return list.slice(start, start + pageSize);
  }, [repairsOutFiltered, pageOut, pageSize, isFilterModeOut]);

  const repairsMatchingPaginated = useMemo(() => {
    const list = repairsMatchingFiltered ?? [];
    const start = (pageMatched - 1) * pageSize;
    return list.slice(start, start + pageSize);
  }, [repairsMatchingFiltered, pageMatched, pageSize]);

  const planningCisternsPaginated = useMemo(() => {
    const list = planningCisternsFiltered ?? [];
    const start = (pagePlanning - 1) * pageSize;
    return list.slice(start, start + pageSize);
  }, [planningCisternsFiltered, pagePlanning, pageSize]);

  const totalCountIn = isFilterModeIn
    ? (filterDataIn?.totalCount ?? 0)
    : (repairsInFiltered ?? []).length;
  const totalCountOut = isFilterModeOut
    ? (filterDataOut?.totalCount ?? 0)
    : (repairsOutFiltered ?? []).length;
  const totalCountMatched = (repairsMatchingFiltered ?? []).length;
  const totalCountPlanning = (planningCisternsFiltered ?? []).length;
  const totalPagesIn = Math.max(
    1,
    isFilterModeIn
      ? (filterDataIn?.totalPages ?? 1)
      : Math.ceil(totalCountIn / pageSize)
  );
  const totalPagesOut = Math.max(
    1,
    isFilterModeOut
      ? (filterDataOut?.totalPages ?? 1)
      : Math.ceil(totalCountOut / pageSize)
  );
  const totalPagesMatched = Math.max(1, Math.ceil(totalCountMatched / pageSize));
  const totalPagesPlanning = Math.max(1, Math.ceil(totalCountPlanning / pageSize));

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

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setPageIn(1);
    setPageOut(1);
    setPageMatched(1);
    setPagePlanning(1);
  }, []);

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
      type: "string";
    };

    let columns: ExportColumn[] = [];
    let data: Record<string, string>[] = [];

    if (mainSection === "planning") {
      columns = [
        { key: "number", label: "Вагон", type: "string" },
        { key: "registrationNumber", label: "Рег. №", type: "string" },
        { key: "serviceLifeYears", label: "Срок эксплуатации, лет", type: "string" },
        { key: "buildDate", label: "Дата постройки", type: "string" },
        { key: "model", label: "Модель", type: "string" },
        { key: "periodMajorRepair", label: "Капитальный ремонт — последний", type: "string" },
        { key: "planPeriodMajorRepair", label: "Капитальный ремонт — следующий", type: "string" },
        { key: "periodDepotRepair", label: "Деповской ремонт — последний", type: "string" },
        { key: "planPeriodDepotRepair", label: "Деповской ремонт — следующий", type: "string" },
        { key: "periodPeriodicTest", label: "ГИ (периодическое испытание) — последний", type: "string" },
        { key: "planPeriodPeriodicTest", label: "ГИ (периодическое испытание) — следующий", type: "string" },
        { key: "periodIntermediateTest", label: "ИГ (промежуточное испытание) — последний", type: "string" },
        { key: "planPeriodIntermediateTest", label: "ИГ (промежуточное испытание) — следующий", type: "string" },
        { key: "periodPPRRepair", label: "Профремонт (ППР) — последний", type: "string" },
        { key: "planPeriodPPRRepair", label: "Профремонт (ППР) — следующий", type: "string" },
        { key: "mileage", label: "Пробег", type: "string" },
        { key: "paintingLast", label: "Покраска — последняя", type: "string" },
        {
          key: "serviceEndDate",
          label: "Дата окончания эксплуатации",
          type: "string",
        },
        {
          key: "currentUncouplingLast",
          label: "Текущий отцепочный ремонт — последний",
          type: "string",
        },
      ];
      data = (planningCisternsFiltered ?? []).map((cistern) => ({
        number: cistern.number ?? "—",
        registrationNumber: cistern.registrationNumber ?? "—",
        serviceLifeYears: String(cistern.serviceLifeYears ?? "—"),
        buildDate: cistern.buildDate
          ? new Date(cistern.buildDate).toLocaleDateString("ru-RU")
          : "—",
        model: cistern.model?.name ?? "—",
        periodMajorRepair: cistern.periodMajorRepair ?? "—",
        planPeriodMajorRepair: cistern.planPeriodMajorRepair ?? "—",
        periodDepotRepair: cistern.periodDepotRepair ?? "—",
        planPeriodDepotRepair: cistern.planPeriodDepotRepair ?? "—",
        periodPeriodicTest: cistern.periodPeriodicTest ?? "—",
        planPeriodPeriodicTest: cistern.planPeriodPeriodicTest ?? "—",
        periodIntermediateTest: cistern.periodIntermediateTest ?? "—",
        planPeriodIntermediateTest: cistern.planPeriodIntermediateTest ?? "—",
        periodPPRRepair: cistern.periodPPRRepair ?? "—",
        planPeriodPPRRepair: cistern.planPeriodPPRRepair ?? "—",
        mileage: "-",
        paintingLast: "-",
        serviceEndDate: formatPlanningServiceEndDate(
          cistern.buildDate,
          cistern.serviceLifeYears
        ),
        currentUncouplingLast: "-",
      }));
    } else if (activeTab === "in") {
      columns = [
        { key: "dateIn", label: "Дата приёма", type: "string" },
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
        { key: "dateIn", label: "Дата начала ремонта", type: "string" },
        { key: "dateOut", label: "Дата выпуска", type: "string" },
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
        { key: "dateTime", label: "Дата сопоставления", type: "string" },
        { key: "number", label: "Номер вагона", type: "string" },
        { key: "dateIn", label: "Дата приёма", type: "string" },
        { key: "dateOutIn", label: "Дата нач. ремонта", type: "string" },
        { key: "dateOut", label: "Дата выпуска", type: "string" },
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
  }, [activeTab, mainSection, repairsInFiltered, repairsOutFiltered, repairsMatchingFiltered, planningCisternsFiltered]);

  const handleCisternSelect = useCallback(async () => {
    setIsInitialLoading(true);
    try {
      const [res1, res2, res3, res4] = await Promise.all([
        CisternRepairs.getAllRepairsIn(),
        CisternRepairs.getAllRepairsOut(),
        CisternRepairs.getAllRepairsMatching(),
        cisternsApi.getAllDetailed(),
      ]);
      setRepairsIn(res1);
      setRepairsOut(res2);
      setRepairsMatching(res3);
      setPlanningCisterns(res4);
    } finally {
      setIsInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    handleCisternSelect();
  }, [handleCisternSelect]);

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
  }: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    onPageChange: (page: number) => void;
  }) => {
    if (totalPages <= 1) return null;
    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalCount);
    return (
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center space-x-2">
          <p className="text-sm text-muted-foreground">
            Показано {startItem}-{endItem} из {totalCount} записей
          </p>
          <select
            value={pageSize}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
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
          <TabsTrigger value="details" className="gap-3 py-4 text-[2rem] leading-tight">
            <Wrench className="size-[1em] shrink-0" />
            Сведения о ремонтах
          </TabsTrigger>
          <TabsTrigger value="planning" className="py-4 text-[2rem] leading-tight">
            <CalendarCog className="size-[1em] shrink-0" />
            Планирование ремонтов
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-6 space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            type="search"
            placeholder="Быстрый поиск по столбцам..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
        </div>
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
                        {isInitialLoading || isFilterLoadingIn ? (
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
                                matchedInIds.has(r.id)
                                  ? "even:bg-muted/30"
                                  : "bg-rose-200/80 dark:bg-rose-900/60"
                              }
                            >
                              <TableCell className="whitespace-nowrap">
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
                        {isInitialLoading || isFilterLoadingOut ? (
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
                                matchedOutIds.has(r.id)
                                  ? "even:bg-muted/30"
                                  : "bg-rose-200/80 dark:bg-rose-900/60"
                              }
                            >
                              <TableCell className="whitespace-nowrap">
                                {r.dateIn
                                  ? new Date(r.dateIn).toLocaleString("ru-RU", {
                                      dateStyle: "short",
                                      timeStyle: "short",
                                    })
                                  : "—"}
                              </TableCell>
                              <TableCell className="whitespace-nowrap">
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
                        {isInitialLoading ? (
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
                              <TableCell className="whitespace-nowrap">
                                {m.dateTime
                                  ? new Date(m.dateTime).toLocaleString("ru-RU", {
                                      dateStyle: "short",
                                      timeStyle: "short",
                                    })
                                  : "—"}
                              </TableCell>
                              <TableCell className="whitespace-nowrap">{m.repairIn?.cisternNumber ?? m.repairOut?.cisternNumber ?? m.cistern?.number ?? "—"}</TableCell>
                              <TableCell className="whitespace-nowrap">
                                {m.repairIn?.dateIn
                                  ? new Date(m.repairIn.dateIn).toLocaleString("ru-RU", {
                                      dateStyle: "short",
                                      timeStyle: "short",
                                    })
                                  : "—"}
                              </TableCell>
                              <TableCell className="whitespace-nowrap">
                                {m.repairOut?.dateIn
                                  ? new Date(m.repairOut.dateIn).toLocaleString("ru-RU", {
                                      dateStyle: "short",
                                      timeStyle: "short",
                                    })
                                  : "—"}
                              </TableCell>
                              <TableCell className="whitespace-nowrap">
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
          <div className="mb-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <Input
                type="search"
                placeholder="Быстрый поиск по столбцам..."
                value={planningSearchQuery}
                onChange={(e) => setPlanningSearchQuery(e.target.value)}
                className="max-w-md"
              />
            </div>
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
          </div>
          <Card>
            <CardContent className="px-4 py-0 overflow-x-auto">
              <Table className="w-full text-xs">
                <TableHeader>
                  <TableRow>
                    <TableHead rowSpan={2} className="whitespace-nowrap w-0 align-middle text-center">
                      Вагон
                    </TableHead>
                    <TableHead rowSpan={2} className="whitespace-nowrap w-0 align-middle text-center">
                      Рег. №
                    </TableHead>
                    <TableHead rowSpan={2} className="whitespace-nowrap w-0 align-middle text-center">
                      Срок <br />
                      эксплуатации
                    </TableHead>
                    <TableHead rowSpan={2} className="whitespace-nowrap w-0 align-middle text-center">
                      Дата постройки
                    </TableHead>
                    <TableHead rowSpan={2} className="whitespace-normal py-2 min-w-0 align-middle text-center">
                      Модель
                    </TableHead>
                    <TableHead
                      colSpan={2}
                      className="whitespace-normal align-middle text-center"
                    >
                      Капитальный ремонт
                    </TableHead>
                    <TableHead
                      colSpan={2}
                      className="whitespace-normal align-middle text-center"
                    >
                      Деповской ремонт
                    </TableHead>
                    <TableHead
                      colSpan={2}
                      className="whitespace-normal align-middle text-center"
                    >
                      ГИ (периодическое<br />испытание)
                    </TableHead>
                    <TableHead
                      colSpan={2}
                      className="whitespace-normal align-middle text-center"
                    >
                      ИГ (промежуточное<br />испытание)
                    </TableHead>
                    <TableHead
                      colSpan={2}
                      className="whitespace-normal align-middle text-center"
                    >
                      Профремонт<br />(ППР)
                    </TableHead>

                    <TableHead className="whitespace-normal align-middle text-center">
                      Пробег
                    </TableHead>
                    <TableHead className="whitespace-normal align-middle text-center">
                      Покраска
                    </TableHead>
                    <TableHead rowSpan={2} className="whitespace-nowrap w-0 align-middle text-center">
                      Дата окончания <br /> эксплуатации
                    </TableHead>
                    <TableHead className="whitespace-normal align-middle text-center">
                      Текущий отцепочный
                      <br />
                      ремонт
                    </TableHead>
                  </TableRow>
                  <TableRow>
                    <TableHead className="whitespace-nowrap w-0 align-middle text-center">
                      последний
                    </TableHead>
                    <TableHead className="whitespace-nowrap w-0 align-middle text-center">
                      следующий
                    </TableHead>
                    <TableHead className="whitespace-nowrap w-0 align-middle text-center">
                      последний
                    </TableHead>
                    <TableHead className="whitespace-nowrap w-0 align-middle text-center">
                      следующий
                    </TableHead>
                    <TableHead className="whitespace-nowrap w-0 align-middle text-center">
                      последний
                    </TableHead>
                    <TableHead className="whitespace-nowrap w-0 align-middle text-center">
                      следующий
                    </TableHead>
                    <TableHead className="whitespace-nowrap w-0 align-middle text-center">
                      последний
                    </TableHead>
                    <TableHead className="whitespace-nowrap w-0 align-middle text-center">
                      следующий
                    </TableHead>
                    <TableHead className="whitespace-nowrap w-0 align-middle text-center">
                      последний
                    </TableHead>
                    <TableHead className="whitespace-nowrap w-0 align-middle text-center">
                      следующий
                    </TableHead>
                    <TableHead className="whitespace-normal align-middle text-center">
                      остаточный
                    </TableHead>
                    <TableHead className="whitespace-normal align-middle text-center">
                      последняя
                    </TableHead>
                    <TableHead className="whitespace-normal align-middle text-center">
                      последний
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isInitialLoading ? (
                    <TableRow>
                      <TableCell colSpan={19} className="text-center text-muted-foreground py-8">
                        <div className="inline-flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Загрузка данных...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : planningCisternsPaginated?.length ? (
                    planningCisternsPaginated.map((cistern) => (
                      <TableRow key={cistern.id} className="even:bg-muted/30">
                        <TableCell className="whitespace-nowrap">{cistern.number}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          {cistern.registrationNumber ?? "—"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{cistern.serviceLifeYears ?? "—"}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          {cistern.buildDate
                            ? new Date(cistern.buildDate).toLocaleDateString("ru-RU")
                            : "—"}
                        </TableCell>
                        <TableCell className="whitespace-normal break-words min-w-0">
                          {cistern.model?.name ?? "—"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{formatRuDate(cistern.periodMajorRepair)}</TableCell>
                        <TableCell className="whitespace-nowrap">{formatRuDate(cistern.planPeriodMajorRepair)}</TableCell>
                        <TableCell className="whitespace-nowrap">{formatRuDate(cistern.periodDepotRepair)}</TableCell>
                        <TableCell className="whitespace-nowrap">{formatRuDate(cistern.planPeriodDepotRepair)}</TableCell>
                        <TableCell className="whitespace-nowrap">{formatRuDate(cistern.periodPeriodicTest)}</TableCell>
                        <TableCell className="whitespace-nowrap">{formatRuDate(cistern.planPeriodPeriodicTest)}</TableCell>
                        <TableCell className="whitespace-nowrap">{formatRuDate(cistern.periodIntermediateTest)}</TableCell>
                        <TableCell className="whitespace-nowrap">{formatRuDate(cistern.planPeriodIntermediateTest)}</TableCell>
                        <TableCell className="whitespace-nowrap">{formatRuDate(cistern.periodPPRRepair)}</TableCell>
                        <TableCell className="whitespace-nowrap">{formatRuDate(cistern.planPeriodPPRRepair)}</TableCell>
                        <TableCell className="whitespace-nowrap text-center">-</TableCell>
                        <TableCell className="whitespace-nowrap text-center">-</TableCell>
                        <TableCell className="whitespace-nowrap text-center">
                          {formatPlanningServiceEndDate(
                            cistern.buildDate,
                            cistern.serviceLifeYears
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-center">-</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={19} className="text-center text-muted-foreground py-8">
                        Нет данных
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
            <div className="mt-4 px-4 pb-2">
              <RepairsPagination
                currentPage={pagePlanning}
                totalPages={totalPagesPlanning}
                totalCount={totalCountPlanning}
                onPageChange={handlePageChangePlanning}
              />
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
