"use client";
import { useState, useEffect, useCallback, useMemo, useRef, type ReactNode } from "react";
import type {
  AllCisternLastLocation,
  CisternsLocationFilterPayload,
} from "@/api/dislocations";
import { CisternDislocation } from "@/api/dislocations";

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
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue, 
  Badge, 
  Skeleton 
} from "@/components/ui";

import {
  MapPin,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { api } from "@/lib/api";
import { cisternsApi } from "@/api/cisterns";
import { cn } from "@/lib/utils";

import "@/lib/leaflet/dist/leaflet.css";
import L, {
  Map as LeafletMap,
  TileLayer,
  Icon,
  LayerGroup,
  LatLngBounds,
  Marker,
} from "@/lib/leaflet/dist/leaflet-src.js";
import { addStandardMapLayers } from "@/lib/leaflet/map-base-layers";

const tankFullIcon = new Icon({
  iconUrl: "/tank_full.png",
  iconSize: [38, 27],
});

const tankEmptyIcon = new Icon({
  iconUrl: "/tank_empty.png",
  iconSize: [38, 27],
});

const tankWarningIcon = new Icon({
  iconUrl: "/tank_warning.png",
  iconSize: [38, 27],
});

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** `Название (код)`; при одном из полей — только оно; пусто — «—». */
function formatNameWithCode(name?: string | null, code?: string | null): string {
  const n = (name ?? "").trim();
  const c = (code ?? "").trim();
  if (n && c) return `${n} (${c})`;
  if (n) return n;
  if (c) return `(${c})`;
  return "—";
}

function coordGroupKey(lat: number, lon: number): string {
  return `${lat.toFixed(6)},${lon.toFixed(6)}`;
}

function markerIconForRows(rows: AllCisternLastLocation[]) {
  if (rows.some((r) => r.downtime != null && r.downtime > 4)) {
    return tankWarningIcon;
  }
  if (rows.some((r) => (r.codeShip?.trim() ?? "") === "000000")) {
    return tankEmptyIcon;
  }
  return tankFullIcon;
}

function stationGroupKey(row: AllCisternLastLocation): string | null {
  const code = row.codeStationOpr?.trim();
  const name = row.nameStationOpr?.trim();
  if (code || name) {
    return `st:${code ?? ""}|${name ?? ""}`;
  }
  const lat = row.lat;
  const lon = row.lon;
  if (lat != null && lon != null && Number.isFinite(lat) && Number.isFinite(lon)) {
    return `ll:${coordGroupKey(lat, lon)}`;
  }
  return null;
}

function toIsoFromLocal(localValue: string): string {
  return new Date(localValue).toISOString();
}

const LOCATION_TABLE_COLUMNS = [
  { key: "dateOpr", label: "Дата операции", headClassName: "whitespace-nowrap w-0", cellClassName: "whitespace-nowrap" },
  { key: "numCistern", label: "№ Вагона", headClassName: "whitespace-nowrap w-0", cellClassName: "whitespace-nowrap" },
  { key: "stationOpr", label: "Станция операции", headClassName: "whitespace-normal w-0", cellClassName: "whitespace-normal break-words min-w-0" },
  { key: "operationNote", label: "Операция", headClassName: "whitespace-normal w-0", cellClassName: "whitespace-normal break-words min-w-0" },
  { key: "cargo", label: "Груз", headClassName: "whitespace-normal w-0", cellClassName: "whitespace-normal break-words min-w-0" },
  { key: "stationOut", label: "Станция отправления", headClassName: "whitespace-normal w-0", cellClassName: "whitespace-normal break-words min-w-0" },
  { key: "stationEnd", label: "Станция назначения", headClassName: "whitespace-normal w-0", cellClassName: "whitespace-normal break-words min-w-0" },
  { key: "numShipmen", label: "Номер отправки", headClassName: "whitespace-normal w-0", cellClassName: "whitespace-nowrap" },
  { key: "weightShip", label: "Вес", headClassName: "whitespace-normal w-0", cellClassName: "whitespace-nowrap text-right tabular-nums" },
  { key: "downtime", label: "Простой", headClassName: "whitespace-normal w-0", cellClassName: "whitespace-nowrap" },
] as const;

type LocationColumnKey = (typeof LOCATION_TABLE_COLUMNS)[number]["key"];

function formatLocationDateOpr(value?: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("ru-RU", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function formatLocationWeight(value?: number | null): string {
  if (value == null || !Number.isFinite(Number(value))) return "—";
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 3 }).format(Number(value));
}

function getLocationCellPlainText(
  row: AllCisternLastLocation,
  columnKey: LocationColumnKey
): string {
  switch (columnKey) {
    case "dateOpr":
      return formatLocationDateOpr(row.dateOpr);
    case "numCistern":
      return row.numCistern?.trim() || "—";
    case "stationOpr":
      return formatNameWithCode(row.nameStationOpr, row.codeStationOpr);
    case "operationNote":
      return row.operationNote ?? "—";
    case "cargo":
      return formatNameWithCode(row.nameShip, row.codeShip);
    case "stationOut":
      return formatNameWithCode(row.nameStationOut, row.codeStationOut);
    case "stationEnd":
      return formatNameWithCode(row.nameStationEnd, row.codeStationEnd);
    case "numShipmen":
      return row.numShipmen != null && String(row.numShipmen).trim() !== ""
        ? String(row.numShipmen)
        : "—";
    case "weightShip":
      return formatLocationWeight(row.weightShip);
    case "downtime":
      return row.downtime != null ? String(row.downtime) : "—";
    default:
      return "—";
  }
}

function renderLocationCell(
  row: AllCisternLastLocation,
  columnKey: LocationColumnKey,
  cisternIdByNumber: Map<string, string>
): ReactNode {
  switch (columnKey) {
    case "dateOpr":
      return formatLocationDateOpr(row.dateOpr);
    case "numCistern": {
      const wagonNum = row.numCistern?.trim() ?? "";
      const cisternPassportId = wagonNum ? cisternIdByNumber.get(wagonNum) : undefined;
      if (wagonNum && cisternPassportId) {
        return (
          <Link
            href={`/cisterns/${cisternPassportId}?tab=location`}
            className="text-primary font-medium hover:underline"
          >
            {row.numCistern}
          </Link>
        );
      }
      return row.numCistern ?? "—";
    }
    case "stationOpr":
      return formatNameWithCode(row.nameStationOpr, row.codeStationOpr);
    case "operationNote":
      return row.operationNote ?? "—";
    case "cargo":
      return formatNameWithCode(row.nameShip, row.codeShip);
    case "stationOut":
      return formatNameWithCode(row.nameStationOut, row.codeStationOut);
    case "stationEnd":
      return formatNameWithCode(row.nameStationEnd, row.codeStationEnd);
    case "numShipmen":
      return getLocationCellPlainText(row, columnKey);
    case "weightShip":
      return formatLocationWeight(row.weightShip);
    case "downtime":
      return getLocationCellPlainText(row, columnKey);
    default:
      return "—";
  }
}

export default function LocationsPage() {
  const [location, setLocation] = useState<AllCisternLastLocation[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [exportingType, setExportingType] = useState<"pdf" | "doc" | "xls" | null>(null);
  const [isSGTransFilter, setIsSGTransFilter] = useState<"all" | "sgtrans">("all");
  const [dateOprFrom, setDateOprFrom] = useState("");
  const [dateOprTo, setDateOprTo] = useState("");
  const [downtimeFrom, setDowntimeFrom] = useState("");
  const [downtimeTo, setDowntimeTo] = useState("");
  const [weightShipFrom, setWeightShipFrom] = useState("");
  const [weightShipTo, setWeightShipTo] = useState("");
  const [cisternIdByNumber, setCisternIdByNumber] = useState<Map<string, string>>(() => new Map());
  const [selectedColumnKey, setSelectedColumnKey] = useState<LocationColumnKey | null>(null);

  const mapInstanceRef = useRef<InstanceType<typeof LeafletMap> | null>(null);
  const markersLayerRef = useRef<LayerGroup | null>(null);


  const handleCisternSelect = useCallback(async (payload?: Partial<CisternsLocationFilterPayload>) => {
    setIsLoading(true);
    try {
      const res1 = await CisternDislocation.getAllCisternsLocation(payload);
      setLocation(res1);
    } finally {
      setIsLoading(false);
    }
  }, []);


  useEffect(() => {
    handleCisternSelect(); // вызываем при монтировании
 
   }, [handleCisternSelect]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const pairs = await cisternsApi.getAllIdAndNumbers();
        if (cancelled) return;
        const m = new Map<string, string>();
        for (const { id, number } of pairs) {
          const key = (number ?? "").trim();
          if (key) m.set(key, id);
        }
        setCisternIdByNumber(m);
      } catch {
        if (!cancelled) setCisternIdByNumber(new Map());
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const applyLocationFilters = useCallback(() => {
    const payload: Partial<CisternsLocationFilterPayload> = {};

    if (isSGTransFilter === "sgtrans") {
      payload.isSGTrans = true;
    }
    if (dateOprFrom && dateOprTo) {
      payload.dateOpr = {
        from: toIsoFromLocal(dateOprFrom),
        to: toIsoFromLocal(dateOprTo),
      };
    }
    if (downtimeFrom !== "" && downtimeTo !== "") {
      payload.downtime = {
        from: Number(downtimeFrom),
        to: Number(downtimeTo),
      };
    }
    if (weightShipFrom !== "" && weightShipTo !== "") {
      payload.weightShip = {
        from: Number(weightShipFrom),
        to: Number(weightShipTo),
      };
    }

    if (Object.keys(payload).length === 0) {
      handleCisternSelect();
      return;
    }
    handleCisternSelect(payload);
  }, [
    dateOprFrom,
    dateOprTo,
    downtimeFrom,
    downtimeTo,
    handleCisternSelect,
    isSGTransFilter,
    weightShipFrom,
    weightShipTo,
  ]);

  const resetLocationFilters = useCallback(() => {
    setIsSGTransFilter("all");
    setDateOprFrom("");
    setDateOprTo("");
    setDowntimeFrom("");
    setDowntimeTo("");
    setWeightShipFrom("");
    setWeightShipTo("");
    handleCisternSelect();
  }, [handleCisternSelect]);

  useEffect(() => {
    setPage(1);
  }, [location, searchQuery]);

  const locationFiltered = useMemo(() => {
    if (!location?.length) return [];
    if (!searchQuery.trim()) return location;
    const q = searchQuery.trim().toLowerCase();
    return location.filter((row) => {
      const dateStr = row.dateOpr
        ? new Date(row.dateOpr).toLocaleString("ru-RU", {
            dateStyle: "short",
            timeStyle: "short",
          })
        : "";
      const searchable = [
        dateStr,
        row.numCistern,
        row.codeStationOpr,
        row.nameStationOpr,
        row.operationNote,
        row.codeShip,
        row.nameShip,
        row.codeStationOut,
        row.nameStationOut,
        row.codeStationEnd,
        row.nameStationEnd,
        row.numShipmen,
        row.weightShip != null && Number.isFinite(Number(row.weightShip)) ? String(row.weightShip) : "",
        row.downtime != null ? String(row.downtime) : "",
      ]
        .join(" ")
        .toLowerCase();
      return searchable.includes(q);
    });
  }, [location, searchQuery]);

  const totalCount = locationFiltered.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const locationPaginated = useMemo(() => {
    if (!locationFiltered.length) return [];
    const start = (page - 1) * pageSize;
    return locationFiltered.slice(start, start + pageSize);
  }, [locationFiltered, page, pageSize]);

  useEffect(() => {
    setSelectedColumnKey(null);
  }, [location, searchQuery, page]);

  useEffect(() => {
    if (!selectedColumnKey) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== "c") return;
      if (window.getSelection()?.toString()) return;

      event.preventDefault();
      const text = locationFiltered
        .map((row) => getLocationCellPlainText(row, selectedColumnKey))
        .join("\n");
      void navigator.clipboard.writeText(text);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedColumnKey, locationFiltered]);

  const handlePageChange = useCallback(
    (nextPage: number) => {
      setPage(Math.max(1, Math.min(nextPage, totalPages)));
    },
    [totalPages]
  );

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1);
  }, []);

  const handleExport = useCallback(async (type: "pdf" | "doc" | "xls") => {
    type ExportColumn = {
      key: string;
      label: string;
      type: "string" | "date" | "number";
    };

    const columns: ExportColumn[] = [
      { key: "dateOpr", label: "Дата операции", type: "date" },
      { key: "numCistern", label: "№ Вагона", type: "string" },
      { key: "stationOpr", label: "Станция операции", type: "string" },
      { key: "operationNote", label: "Операция", type: "string" },
      { key: "cargo", label: "Груз", type: "string" },
      { key: "stationOut", label: "Станция отправления", type: "string" },
      { key: "stationEnd", label: "Станция назначения", type: "string" },
      { key: "numShipmen", label: "Номер отправки", type: "string" },
      { key: "weightShip", label: "Вес", type: "number" },
      { key: "downtime", label: "Простой", type: "number" },
    ];

    const data = locationFiltered.map((row) => ({
      dateOpr: row.dateOpr
        ? new Date(row.dateOpr).toLocaleString("ru-RU", {
            dateStyle: "short",
            timeStyle: "short",
          })
        : "—",
      numCistern: row.numCistern ?? "—",
      stationOpr: formatNameWithCode(row.nameStationOpr, row.codeStationOpr),
      operationNote: row.operationNote ?? "—",
      cargo: formatNameWithCode(row.nameShip, row.codeShip),
      stationOut: formatNameWithCode(row.nameStationOut, row.codeStationOut),
      stationEnd: formatNameWithCode(row.nameStationEnd, row.codeStationEnd),
      numShipmen: row.numShipmen != null && String(row.numShipmen).trim() !== "" ? String(row.numShipmen) : "—",
      weightShip:
        row.weightShip != null && Number.isFinite(Number(row.weightShip))
          ? new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 3 }).format(Number(row.weightShip))
          : "—",
      downtime: row.downtime != null ? String(row.downtime) : "—",
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
  }, [locationFiltered]);

  const getVisiblePages = (currentPage: number, total: number) => {
    const delta = 1;
    const range: number[] = [];
    const rangeWithDots: (number | string)[] = [];
    for (let i = Math.max(2, currentPage - delta); i <= Math.min(total - 1, currentPage + delta); i++) {
      range.push(i);
    }
    if (currentPage - delta > 2) {
      rangeWithDots.push(1, "...");
    } else {
      rangeWithDots.push(1);
    }
    rangeWithDots.push(...range);
    if (currentPage + delta < total - 1) {
      rangeWithDots.push("...", total);
    } else if (total > 1) {
      rangeWithDots.push(total);
    }
    return rangeWithDots;
  };

  const LocationsPagination = ({
    currentPage,
    totalPages: pagesTotal,
    totalCount: count,
    onPageChange,
  }: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    onPageChange: (page: number) => void;
  }) => {
    if (pagesTotal <= 1) return null;
    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, count);
    return (
      <div className="flex items-center justify-between px-2 mt-4">
        <div className="flex items-center space-x-2">
          <p className="text-sm text-muted-foreground">
            Показано {startItem}-{endItem} из {count} записей
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
          {getVisiblePages(currentPage, pagesTotal).map((pageNum, index) => (
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
            disabled={currentPage === pagesTotal}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pagesTotal)}
            disabled={currentPage === pagesTotal}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  useEffect(() => {
    if (L.DomUtil.get("map")?._leaflet_id) {
      return;
    }

    const map = new LeafletMap("map").setView([55.519358, 28.591718], 13);
    mapInstanceRef.current = map;

    const markersLayer = new LayerGroup().addTo(map);
    markersLayerRef.current = markersLayer;

    addStandardMapLayers(map, TileLayer);
  }, []);

  useEffect(() => {
    const layer = markersLayerRef.current;
    const map = mapInstanceRef.current;
    if (!layer || !map) return;

    layer.clearLayers();

    const groups = new Map<string, AllCisternLastLocation[]>();
    for (const row of locationFiltered) {
      const key = stationGroupKey(row);
      if (key == null) continue;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(row);
    }

    const validLatLngs: [number, number][] = [];

    for (const [, rows] of groups) {
      const withCoords = rows.filter(
        (r) =>
          r.lat != null &&
          r.lon != null &&
          Number.isFinite(r.lat) &&
          Number.isFinite(r.lon)
      );
      if (withCoords.length === 0) continue;

      const lat =
        withCoords.reduce((s, r) => s + r.lat!, 0) / withCoords.length;
      const lon =
        withCoords.reduce((s, r) => s + r.lon!, 0) / withCoords.length;
      validLatLngs.push([lat, lon]);

      const icon = markerIconForRows(rows);

      const popupLines = rows.map((row) => {
        const wagonLabel = row.numCistern?.trim() || "—";
        const station = row.nameStationOpr ?? "—";
        const d = row.downtime != null ? String(row.downtime) : "—";
        return `${wagonLabel} - ${station} (${d})`;
      });
      const lineHtml = popupLines
        .map((line) => `<div>${escapeHtml(line)}</div>`)
        .join("");
      const popupHtml =
        rows.length > 10
          ? `<div class="locations-wagon-popup-scroll text-xs leading-snug">${lineHtml}</div>`
          : `<div class="text-xs leading-snug space-y-1">${lineHtml}</div>`;

      const tooltipText =
        rows.length > 1
          ? `${rows.length} вагонов`
          : rows[0].numCistern?.trim() || "—";

      const marker = new Marker([lat, lon], { icon });
      const m = marker as Marker & {
        bindTooltip: (content: string, options?: object) => Marker & { bindPopup: (html: string) => Marker };
        bindPopup: (html: string) => Marker;
      };
      m.bindTooltip(tooltipText, {
        permanent: false,
        direction: "top",
        className: "custom-tooltip",
      })
        .bindPopup(popupHtml)
        .addTo(layer);
    }

    if (validLatLngs.length === 0) {
      map.setView([55.519358, 28.591718], 13);
      return;
    }
    if (validLatLngs.length === 1) {
      map.setView(validLatLngs[0], 13);
      return;
    }
    const bounds = new LatLngBounds(validLatLngs);
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 14 });
  }, [locationFiltered]);


  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex gap-3 max-lg:flex-col">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <MapPin className="h-8 w-8" />
          Отслеживание местоположений вагонов-цистерн
        </h1>
      </div>

      {/* Content */}
      <Card>
        <CardHeader>
          <div className="flex gap-2">
            <CardTitle>
               Интерактивная карта
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="h-full">
          <div className="flex gap-2 h-[480px] rounded-lg ">
            <Card className="w-full shrink-0 h-full overflow-hidden py-0">
              <CardContent className="p-0 h-full">
                <div id="map" className="w-full h-full min-h-[480px]" />
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

            {/* Content */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4 w-full">
            <CardTitle>Список вагонов-цистерн</CardTitle>
            <div className="flex items-center gap-2 flex-wrap min-w-0 flex-1 justify-end">
              <div className="flex items-center gap-1 rounded-md border bg-background p-1 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  title="Экспорт DOC"
                  onClick={() => handleExport("doc")}
                  disabled={!!exportingType || location === null}
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
                  disabled={!!exportingType || location === null}
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
                  disabled={!!exportingType || location === null}
                >
                  {exportingType === "xls" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Image src="/icon_excel.svg" alt="Экспорт XLS" width={16} height={16} />
                  )}
                </Button>
              </div>
              <div className="flex items-center gap-2 min-w-0 max-w-md flex-1">
                <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                <Input
                  type="search"
                  placeholder="Быстрый поиск по столбцам..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-md w-full"
                />
              </div>
            </div>
           </div>
         </CardHeader>
         <CardContent className="p-4 h-full">
              <div className="flex gap-2 flex-wrap items-end mb-4">
                <div className="min-w-[180px]">
                  <label className="text-xs text-muted-foreground mb-1 block">Дата операции с</label>
                  <Input
                    type="datetime-local"
                    value={dateOprFrom}
                    onChange={(e) => setDateOprFrom(e.target.value)}
                  />
                </div>
                <div className="min-w-[180px]">
                  <label className="text-xs text-muted-foreground mb-1 block">Дата операции по</label>
                  <Input
                    type="datetime-local"
                    value={dateOprTo}
                    onChange={(e) => setDateOprTo(e.target.value)}
                  />
                </div>
                <div className="w-28">
                  <label className="text-xs text-muted-foreground mb-1 block">Простой от</label>
                  <Input
                    type="number"
                    value={downtimeFrom}
                    onChange={(e) => setDowntimeFrom(e.target.value)}
                  />
                </div>
                <div className="w-28">
                  <label className="text-xs text-muted-foreground mb-1 block">Простой до</label>
                  <Input
                    type="number"
                    value={downtimeTo}
                    onChange={(e) => setDowntimeTo(e.target.value)}
                  />
                </div>
                <div className="w-28">
                  <label className="text-xs text-muted-foreground mb-1 block">Вес от</label>
                  <Input
                    type="number"
                    value={weightShipFrom}
                    onChange={(e) => setWeightShipFrom(e.target.value)}
                  />
                </div>
                <div className="w-28">
                  <label className="text-xs text-muted-foreground mb-1 block">Вес до</label>
                  <Input
                    type="number"
                    value={weightShipTo}
                    onChange={(e) => setWeightShipTo(e.target.value)}
                  />
                </div>
                <div className="min-w-[170px]">
                  <label className="text-xs text-muted-foreground mb-1 block">Принадлежность</label>
                  <Select
                    value={isSGTransFilter}
                    onValueChange={(value: "all" | "sgtrans") => setIsSGTransFilter(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sgtrans">СГ-ТРАНС</SelectItem>
                      <SelectItem value="all">Все</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={applyLocationFilters} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Загрузка...
                    </>
                  ) : (
                    "Применить фильтр"
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={resetLocationFilters}
                  disabled={isLoading}
                >
                  Сбросить фильтр
                </Button>
              </div>
              {selectedColumnKey ? (
                <p className="mb-2 text-xs text-muted-foreground">
                  Выделен столбец «
                  {LOCATION_TABLE_COLUMNS.find((col) => col.key === selectedColumnKey)?.label}
                  ». Выделяйте значения мышью или нажмите Ctrl+C, чтобы скопировать все значения
                  столбца. Повторный клик по заголовку снимает выделение.
                </p>
              ) : (
                <p className="mb-2 text-xs text-muted-foreground">
                  Клик по заголовку столбца — выделение для копирования значений только из этого
                  столбца.
                </p>
              )}
              <Table className="w-full text-xs">
                      <TableHeader>
                        <TableRow>
                          {LOCATION_TABLE_COLUMNS.map((column) => (
                            <TableHead
                              key={column.key}
                              className={cn(
                                column.headClassName,
                                "cursor-pointer transition-colors hover:bg-muted/60",
                                selectedColumnKey === column.key &&
                                  "bg-primary/10 ring-1 ring-inset ring-primary/30"
                              )}
                              title="Выделить столбец для копирования"
                              onClick={() =>
                                setSelectedColumnKey((current) =>
                                  current === column.key ? null : column.key
                                )
                              }
                            >
                              {column.label}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoading ? (
                          <TableRow>
                            <TableCell colSpan={LOCATION_TABLE_COLUMNS.length} className="text-center text-muted-foreground py-8">
                              Загрузка данных...
                            </TableCell>
                          </TableRow>
                        ) : !location || location.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={LOCATION_TABLE_COLUMNS.length} className="text-center text-muted-foreground py-8">
                              Нет данных
                            </TableCell>
                          </TableRow>
                        ) : locationFiltered.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={LOCATION_TABLE_COLUMNS.length} className="text-center text-muted-foreground py-8">
                              Нет данных по запросу
                            </TableCell>
                          </TableRow>
                        ) : (
                          locationPaginated.map((row) => (
                            <TableRow
                              key={row.id}
                              className={
                                row.downtime != null && row.downtime > 4
                                  ? "bg-rose-200/80 dark:bg-rose-900/60"
                                  : undefined
                              }
                            >
                              {LOCATION_TABLE_COLUMNS.map((column) => (
                                <TableCell
                                  key={column.key}
                                  className={cn(
                                    column.cellClassName,
                                    selectedColumnKey
                                      ? selectedColumnKey === column.key
                                        ? "select-text bg-primary/5"
                                        : "select-none"
                                      : "select-text"
                                  )}
                                >
                                  {renderLocationCell(row, column.key, cisternIdByNumber)}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))
                        )}
                      </TableBody>
              </Table>
              {location !== null && location.length > 0 && locationFiltered.length > 0 && (
                <LocationsPagination
                  currentPage={page}
                  totalPages={totalPages}
                  totalCount={totalCount}
                  onPageChange={handlePageChange}
                />
              )}
          </CardContent>
      </Card>
    </div>

  );
}
