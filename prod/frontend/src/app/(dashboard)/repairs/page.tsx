"use client";

import { useEffect, useCallback, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
} from "lucide-react";
import { api } from "@/lib/api";
import { CisternRepairs } from "@/api/repairs";
import type { RepairsIn, RepairsOut, RepairsMatching } from "@/api/repairs";

export default function RepairsPage() {
 
  const [repairsIn, setRepairsIn] = useState<RepairsIn[] | null>(null);
  const [repairsOut, setRepairsOut] = useState<RepairsOut[] | null>(null);
  const [repairsMatching, setRepairsMatching] = useState<RepairsMatching[] | null>(null);
  const [activeTab, setActiveTab] = useState<"in" | "out" | "matched">("in");
  const [searchQuery, setSearchQuery] = useState("");
  const [pageIn, setPageIn] = useState(1);
  const [pageOut, setPageOut] = useState(1);
  const [pageMatched, setPageMatched] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const repairsInSorted = useMemo(() => {
    if (!repairsIn?.length) return repairsIn ?? [];
    return [...repairsIn].sort(
      (a, b) => new Date(b.dateIn).getTime() - new Date(a.dateIn).getTime()
    );
  }, [repairsIn]);

  const repairsOutSorted = useMemo(() => {
    if (!repairsOut?.length) return repairsOut ?? [];
    return [...repairsOut].sort(
      (a, b) => new Date(b.dateOut).getTime() - new Date(a.dateOut).getTime()
    );
  }, [repairsOut]);

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
    if (activeTab !== "in" || !searchQuery.trim()) return repairsInSorted ?? [];
    const q = searchQuery.trim().toLowerCase();
    return (repairsInSorted ?? []).filter((r) => {
      const dateStr = r.dateIn ? new Date(r.dateIn).toLocaleString("ru-RU", { dateStyle: "short", timeStyle: "short" }) : "";
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
      ].join(" ").toLowerCase();
      return searchable.includes(q);
    });
  }, [repairsInSorted, searchQuery, activeTab]);

  const repairsOutFiltered = useMemo(() => {
    if (activeTab !== "out" || !searchQuery.trim()) return repairsOutSorted ?? [];
    const q = searchQuery.trim().toLowerCase();
    return (repairsOutSorted ?? []).filter((r) => {
      const dateInStr = r.dateIn ? new Date(r.dateIn).toLocaleString("ru-RU", { dateStyle: "short", timeStyle: "short" }) : "";
      const dateOutStr = r.dateOut ? new Date(r.dateOut).toLocaleString("ru-RU", { dateStyle: "short", timeStyle: "short" }) : "";
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
      ].join(" ").toLowerCase();
      return searchable.includes(q);
    });
  }, [repairsOutSorted, searchQuery]);

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

  useEffect(() => {
    setPageIn(1);
    setPageOut(1);
    setPageMatched(1);
  }, [searchQuery]);

  const repairsInPaginated = useMemo(() => {
    const list = repairsInFiltered ?? [];
    const start = (pageIn - 1) * pageSize;
    return list.slice(start, start + pageSize);
  }, [repairsInFiltered, pageIn, pageSize]);

  const repairsOutPaginated = useMemo(() => {
    const list = repairsOutFiltered ?? [];
    const start = (pageOut - 1) * pageSize;
    return list.slice(start, start + pageSize);
  }, [repairsOutFiltered, pageOut, pageSize]);

  const repairsMatchingPaginated = useMemo(() => {
    const list = repairsMatchingFiltered ?? [];
    const start = (pageMatched - 1) * pageSize;
    return list.slice(start, start + pageSize);
  }, [repairsMatchingFiltered, pageMatched, pageSize]);

  const totalCountIn = (repairsInFiltered ?? []).length;
  const totalCountOut = (repairsOutFiltered ?? []).length;
  const totalCountMatched = (repairsMatchingFiltered ?? []).length;
  const totalPagesIn = Math.max(1, Math.ceil(totalCountIn / pageSize));
  const totalPagesOut = Math.max(1, Math.ceil(totalCountOut / pageSize));
  const totalPagesMatched = Math.max(1, Math.ceil(totalCountMatched / pageSize));

  const handlePageChangeIn = useCallback((page: number) => {
    setPageIn(Math.max(1, Math.min(page, totalPagesIn)));
  }, [totalPagesIn]);

  const handlePageChangeOut = useCallback((page: number) => {
    setPageOut(Math.max(1, Math.min(page, totalPagesOut)));
  }, [totalPagesOut]);

  const handlePageChangeMatched = useCallback((page: number) => {
    setPageMatched(Math.max(1, Math.min(page, totalPagesMatched)));
  }, [totalPagesMatched]);

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setPageIn(1);
    setPageOut(1);
    setPageMatched(1);
  }, []);

  const handleCisternSelect = useCallback(async () => {
    const res1 = await CisternRepairs.getAllRepairsIn();
    const res2 = await CisternRepairs.getAllRepairsOut();
    const res3 = await CisternRepairs.getAllRepairsMatching();
    setRepairsIn(res1);
    setRepairsOut(res2);
    setRepairsMatching(res3);
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
      {/* Header */}
      <div className="flex gap-3 max-lg:flex-col">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <Wrench className="h-8 w-8" />
          Сведения о ремонтах
        </h1>
       
      </div>

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
                          <TableHead className="whitespace-normal py-2 min-w-0">Дефекты</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {repairsInPaginated?.length ? (
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
                              <TableCell className="whitespace-normal break-words min-w-0">{r.depotName ?? "—"}</TableCell>
                              <TableCell className="whitespace-normal break-words min-w-0">{r.stationName ?? "—"}</TableCell>
                              <TableCell className="whitespace-normal break-words min-w-0">{r.roadName ?? "—"}</TableCell>
                              <TableCell className="whitespace-normal break-words min-w-0">
                                {r.defectName?.length ? r.defectName.join(", ") : "—"}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
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
                          <TableHead className="whitespace-normal py-2 min-w-0">Модернизации</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {repairsOutPaginated?.length ? (
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
                              <TableCell className="whitespace-normal break-words min-w-0">{r.depotName ?? "—"}</TableCell>
                              <TableCell className="whitespace-normal break-words min-w-0">{r.roadName ?? "—"}</TableCell>
                              <TableCell className="whitespace-normal break-words min-w-0">
                                {r.modernName?.length ? r.modernName.join(", ") : "—"}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
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
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {repairsMatchingPaginated?.length ? (
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
                              <TableCell className="whitespace-normal break-words min-w-0">{m.repairIn?.depotName ?? "—"}</TableCell>
                              <TableCell className="whitespace-normal break-words min-w-0">{m.repairIn?.stationName ?? "—"}</TableCell>
                              <TableCell className="whitespace-normal break-words min-w-0">{m.repairIn?.roadName ?? "—"}</TableCell>
                              <TableCell className="whitespace-normal break-words min-w-0">
                                {m.repairIn?.defectName?.length ? m.repairIn.defectName.join(", ") : "—"}
                              </TableCell>
                              <TableCell className="whitespace-normal break-words min-w-0">{m.repairOut?.depotName ?? "—"}</TableCell>
                              <TableCell className="whitespace-normal break-words min-w-0">{m.repairOut?.roadName ?? "—"}</TableCell>
                              <TableCell className="whitespace-normal break-words min-w-0">
                                {m.repairOut?.modernName?.length ? m.repairOut.modernName.join(", ") : "—"}
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
    </div>
  );
}
