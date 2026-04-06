"use client";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import type { AllCisternLastLocation } from "@/api/dislocations";
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
} from "lucide-react";

import "@/lib/leaflet/dist/leaflet.css";
import L, {
  Map as LeafletMap,
  TileLayer,
  Icon,
  LayerGroup,
  LatLngBounds,
  Marker,
} from "@/lib/leaflet/dist/leaflet-src.js";

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

function coordGroupKey(lat: number, lon: number): string {
  return `${lat.toFixed(6)},${lon.toFixed(6)}`;
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

export default function LocationsPage() {
  const [location, setLocation] = useState<AllCisternLastLocation[] | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");

  const mapInstanceRef = useRef<InstanceType<typeof LeafletMap> | null>(null);
  const markersLayerRef = useRef<LayerGroup | null>(null);


  const handleCisternSelect = useCallback(async () => {

    const res1  = await CisternDislocation.getAllCisternsLocation();
    setLocation(res1);
  }, []);


  useEffect(() => {
    handleCisternSelect(); // вызываем при монтировании
 
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

    const osm = new TileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 15,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      opacity: 0.7,
    });

    osm.on("tileload", function (e: { tile: { style: CSSStyleDeclaration } }) {
      e.tile.style.filter = "grayscale(100%) brightness(0.95)";
    });

    osm.addTo(map);

    new TileLayer("https://tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openrailwaymap.org/">OpenRailwayMap</a>',
      maxZoom: 15,
      opacity: 1,
    }).addTo(map);
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

      const icon = rows.some((r) => r.downtime != null && r.downtime > 4)
        ? tankWarningIcon
        : tankFullIcon;

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
            <div className="flex items-center gap-2 min-w-0 flex-1 max-w-md justify-end">
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
         </CardHeader>
         <CardContent className="p-4 h-full">
              <Table className="w-full text-xs">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="whitespace-nowrap w-0">Дата операции</TableHead>
                          <TableHead className="whitespace-nowrap w-0">№ Вагона</TableHead>
                          <TableHead className="whitespace-normal w-0">Код стан. операции</TableHead>
                          <TableHead className="whitespace-nowrap w-0">Станция операции</TableHead>
                          <TableHead className="whitespace-normal w-0">Операция</TableHead>
                          <TableHead className="whitespace-normal w-0">Код груза</TableHead>
                          <TableHead className="whitespace-normal w-0">Груз</TableHead>
                          <TableHead className="whitespace-nowrap w-0">Код. стан. назвачения</TableHead>
                          <TableHead className="whitespace-normal w-0">Станция назвачения</TableHead>
                          <TableHead className="whitespace-normal w-0">Простой</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {location === null ? (
                          <TableRow>
                            <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                              Загрузка данных...
                            </TableCell>
                          </TableRow>
                        ) : location.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                              Нет данных
                            </TableCell>
                          </TableRow>
                        ) : locationFiltered.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
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
                              <TableCell className="whitespace-nowrap">
                                {row.dateOpr
                                  ? new Date(row.dateOpr).toLocaleString("ru-RU", {
                                      dateStyle: "short",
                                      timeStyle: "short",
                                    })
                                  : "—"}
                              </TableCell>
                              <TableCell className="whitespace-nowrap">{row.numCistern ?? "—"}</TableCell>
                              <TableCell className="whitespace-normal break-words min-w-0">
                                {row.codeStationOpr ?? "—"}
                              </TableCell>
                              <TableCell className="whitespace-normal break-words min-w-0">
                                {row.nameStationOpr ?? "—"}
                              </TableCell>
                              <TableCell className="whitespace-normal break-words min-w-0">
                                {row.operationNote ?? "—"}
                              </TableCell>
                              <TableCell className="whitespace-normal break-words min-w-0">
                                {row.codeShip ?? "—"}
                              </TableCell>
                              <TableCell className="whitespace-normal break-words min-w-0">
                                {row.nameShip ?? "—"}
                              </TableCell>
                              <TableCell className="whitespace-nowrap">{row.codeStationOut ?? "—"}</TableCell>
                              <TableCell className="whitespace-normal break-words min-w-0">
                                {row.nameStationOut ?? "—"}
                              </TableCell>
                              <TableCell className="whitespace-nowrap">
                                {row.downtime != null ? String(row.downtime) : "—"}
                              </TableCell>
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
