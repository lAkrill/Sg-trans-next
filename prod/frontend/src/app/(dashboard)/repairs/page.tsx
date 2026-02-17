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
import type { RepairsIn, RepairsOut } from "@/api/repairs";

export default function RepairsPage() {
 
  const [repairsIn, setRepairsIn] = useState<RepairsIn[] | null>(null);
  const [repairsOut, setRepairsOut] = useState<RepairsOut[] | null>(null);
  const [activeTab, setActiveTab] = useState<"in" | "out" | "matched">("in");
  const [searchQuery, setSearchQuery] = useState("");
  const [pageIn, setPageIn] = useState(1);
  const [pageOut, setPageOut] = useState(1);
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

  const repairsInFiltered = useMemo(() => {
    if (!searchQuery.trim()) return repairsInSorted ?? [];
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
  }, [repairsInSorted, searchQuery]);

  const repairsOutFiltered = useMemo(() => {
    if (!searchQuery.trim()) return repairsOutSorted ?? [];
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

  useEffect(() => {
    setPageIn(1);
    setPageOut(1);
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

  const totalCountIn = (repairsInFiltered ?? []).length;
  const totalCountOut = (repairsOutFiltered ?? []).length;
  const totalPagesIn = Math.max(1, Math.ceil(totalCountIn / pageSize));
  const totalPagesOut = Math.max(1, Math.ceil(totalCountOut / pageSize));

  const handlePageChangeIn = useCallback((page: number) => {
    setPageIn(Math.max(1, Math.min(page, totalPagesIn)));
  }, [totalPagesIn]);

  const handlePageChangeOut = useCallback((page: number) => {
    setPageOut(Math.max(1, Math.min(page, totalPagesOut)));
  }, [totalPagesOut]);

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setPageIn(1);
    setPageOut(1);
  }, []);

  const handleCisternSelect = useCallback(async () => {
    const res1 = await CisternRepairs.getAllRepairsIn();
    const res2 = await CisternRepairs.getAllRepairsOut();
    setRepairsIn(res1);
    setRepairsOut(res2);
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
          placeholder={
            activeTab === "in"
              ? "Быстрый поиск по столбцам..."
              : activeTab === "out"
                ? "Быстрый поиск по столбцам..."
                : "Выберите вкладку с данными для поиска"
          }
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
          disabled={activeTab === "matched"}
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
                            <TableRow key={r.id} className="even:bg-muted/30">
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
                            <TableRow key={r.id} className="even:bg-muted/30">
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
                  <CardContent className="px-4 py-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Сопоставленные данные</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell colSpan={1} className="text-center text-muted-foreground py-8">
                            Раздел в разработке
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
    </div>
  );
}
