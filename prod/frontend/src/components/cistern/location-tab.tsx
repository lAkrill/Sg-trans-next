import { Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Button } from "@/components/ui";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { MapPin, MapIcon } from "lucide-react";
import { CisternDislocation } from "@/api/dislocations";
import { CisternMilages } from "@/api/milages";
import type { CisternMilage } from "@/api/milages";
import type { CisternLastLocation, CisternAllLocation } from "@/api/dislocations";
import "@/lib/leaflet/dist/leaflet.css";
import {
  Map as LeafletMap,
  TileLayer,
  Icon,
  DivIcon,
  LayerGroup,
  LatLngBounds,
  Marker,
  Polyline,
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

/** Начальный азимут от точки 1 к точке 2, градусы: 0° — север, по часовой стрелке. */
function bearingDegrees(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const θ = Math.atan2(y, x);
  return ((θ * 180) / Math.PI + 360) % 360;
}

const ROUTE_LINE_COLOR = "#2563eb";

/** Ключ маркера по последней операции на станции (как в `groupStations`: name, code, date). */
function stationHistoryMarkerKey(name: string, code: string, dateOpr: string): string {
  return `${name.trim()}\0${code.trim()}\0${dateOpr}`;
}

function routeDirectionArrowIcon(bearing: number): InstanceType<typeof DivIcon> {
  const b = bearing.toFixed(1);
  return new DivIcon({
    className: "leaflet-div-icon location-tab-route-arrow-root",
    html: `<div style="pointer-events:none;width:22px;height:22px;display:flex;align-items:center;justify-content:center;">
      <div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-bottom:11px solid ${ROUTE_LINE_COLOR};filter:drop-shadow(0 0.5px 1.2px rgba(0,0,0,0.35));transform:rotate(${b}deg);"></div>
    </div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

/**
 * Подряд идущие в хронологии операции с той же станцией (по `nameStationOpr`), что и `ordered[index]`.
 */
function stationConsecutiveGroupRange(ordered: CisternAllLocation[], index: number): {
  start: number;
  end: number;
} {
  const station = ordered[index].nameStationOpr;
  let start = index;
  while (start > 0 && ordered[start - 1].nameStationOpr === station) start--;
  let end = index;
  while (end < ordered.length - 1 && ordered[end + 1].nameStationOpr === station) end++;
  return { start, end };
}

function consecutiveStationGroupAtIndex(ordered: CisternAllLocation[], index: number): CisternAllLocation[] {
  const { start, end } = stationConsecutiveGroupRange(ordered, index);
  return ordered.slice(start, end + 1);
}

/** Дни простоя на станции для записи с индексом `index` (подряд идущие операции с той же станцией по имени). */
function downtimeDaysAtIndex(ordered: CisternAllLocation[], index: number): number {
  const { start, end } = stationConsecutiveGroupRange(ordered, index);
  const t0 = new Date(ordered[start].dateOpr).getTime();
  const t1 = new Date(ordered[end].dateOpr).getTime();
  return Math.trunc((t1 - t0) / (1000 * 3600 * 24));
}

type CargoFields = Pick<CisternAllLocation, "nameShip" | "codeShip">;

/** Текст «Груз» для UI: `Груз (421034): Название.` (запятая в конце названия убирается). */
function formatCargoPlain(g: CargoFields): string | null {
  const nameRaw = (g.nameShip ?? "").trim();
  const codeRaw = (g.codeShip ?? "").trim();
  if (!nameRaw && !codeRaw) return null;
  const nameClean = nameRaw.replace(/,\s*$/, "").trim();
  if (codeRaw && nameClean) {
    return `Груз (${codeRaw}): ${nameClean}.`;
  }
  if (nameClean) {
    return `Груз: ${nameClean}.`;
  }
  return `Груз (${codeRaw}).`;
}

/** HTML-строка «Груз» для Leaflet popup. */
function formatCargoPopupLine(g: CisternAllLocation): string | null {
  const nameRaw = (g.nameShip ?? "").trim();
  const codeRaw = (g.codeShip ?? "").trim();
  if (!nameRaw && !codeRaw) return null;
  const nameClean = nameRaw.replace(/,\s*$/, "").trim();
  if (codeRaw && nameClean) {
    return `Груз (${escapeHtml(codeRaw)}): ${escapeHtml(nameClean)}.`;
  }
  if (nameClean) {
    return `Груз: ${escapeHtml(nameClean)}.`;
  }
  return `Груз (${escapeHtml(codeRaw)}).`;
}

/** HTML всплывающего окна: все операции подряд на той же станции, с датами. */
function stationGroupPopupHtml(group: CisternAllLocation[]): string {
  if (group.length === 0) return "<div></div>";
  const sorted = [...group].sort(
    (a, b) => new Date(b.dateOpr).getTime() - new Date(a.dateOpr).getTime()
  );
  const head = sorted[0];
  const title = `${head.nameStationOpr ?? "—"} (${head.codeStationOpr ?? "—"})`;
  const items = sorted
    .map((g) => {
      const when = new Date(g.dateOpr).toLocaleString("ru-RU");
      const op = (g.operationNote || g.operationShort || "").trim() || "—";
      const cargoText = formatCargoPopupLine(g);
      const cargoLine = cargoText
        ? `<div class="location-tab-popup__cargo">${cargoText}</div>`
        : "";
      return (
        `<li class="location-tab-popup__item">` +
        `<div class="location-tab-popup__time">${escapeHtml(when)}</div>` +
        `<div class="location-tab-popup__op">${escapeHtml(op)}</div>` +
        cargoLine +
        `</li>`
      );
    })
    .join("");
  return (
    `<div class="location-tab-popup">` +
    `<div class="location-tab-popup__title">${escapeHtml(title)}</div>` +
    `<div class="location-tab-popup__meta">Операций в группе: ${sorted.length}</div>` +
    `<ol class="location-tab-popup__list">` +
    items +
    `</ol></div>`
  );
}

function markerIconForLocation(loc: CisternAllLocation, downtimeDays: number): Icon {
  const code = String(loc.codeShip ?? "").trim();
  if (downtimeDays > 5) return tankWarningIcon;
  if (code !== "" && code !== "000000") return tankFullIcon;
  return tankEmptyIcon;
}

function getDefaultDateRange() {
  const today = new Date();
  const oneMonthAgo = new Date(today);
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  return {
    from: oneMonthAgo.toISOString().slice(0, 10),
    to: today.toISOString().slice(0, 10),
  };
}

function formatGroupRouteText(item: {
  nameStationOut: string;
  nameStationEnd: string;
  numShipmen: string;
}): string {
  const from = (item.nameStationOut ?? "").trim() || "—";
  const to = (item.nameStationEnd ?? "").trim() || "—";
  const ship = (item.numShipmen ?? "").trim() || "—";
  if (from === "—" && to === "—" && ship === "—") return "—";
  return `${from} -> ${to} (${ship})`;
}

type LocationTabProps = {
  CicternNumber: string;
};

export function LocationTab({CicternNumber}:LocationTabProps) {
  const defaultRange = useMemo(() => getDefaultDateRange(), []);

  const [location, setLocation] = useState<CisternLastLocation | null>(null);
  const [locationAll, setLocationAll] = useState<CisternAllLocation[] | null>(null);
  const [locationInRange, setLocationInRange] = useState<CisternAllLocation[] | null>(null);
  const [dateFrom, setDateFrom] = useState<string>(defaultRange.from);
  const [dateTo, setDateTo] = useState<string>(defaultRange.to);
  const [rangeLoading, setRangeLoading] = useState(false);
  const [milage, setMilage] = useState<CisternMilage | null>(null);
  const [remainMilage, setRemainMilage] = useState<number>(0);
  const mapRef = useRef<InstanceType<typeof LeafletMap> | null>(null);
  const markersLayerRef = useRef<InstanceType<typeof LayerGroup> | null>(null);
  const stationMarkersByHistoryKeyRef = useRef<Map<string, Marker>>(new Map());

  const handleCisternSelect = useCallback(async () => {
    const range = getDefaultDateRange();
    setDateFrom(range.from);
    setDateTo(range.to);

    const [res1, res2, res3, resRange] = await Promise.all([
      CisternDislocation.getLastLocation(CicternNumber),
      CisternDislocation.getAllLocation(CicternNumber),
      CisternMilages.getLastMilage(CicternNumber),
      CisternDislocation.getLocationsInRange(CicternNumber, range.from, range.to),
    ]);

    setLocation(res1);
    setLocationAll(res2);
    setLocationInRange(resRange);
    setMilage(res3);
    setRemainMilage(res3.milageNorm - res3.milage);
  }, [CicternNumber]);

  const handleLoadRange = useCallback(async () => {
    if (!dateFrom || !dateTo) return;
    setRangeLoading(true);
    try {
      const data = await CisternDislocation.getLocationsInRange(CicternNumber, dateFrom, dateTo);
      setLocationInRange(data);
    } finally {
      setRangeLoading(false);
    }
  }, [CicternNumber, dateFrom, dateTo]);

  const handleResetRange = useCallback(() => {
    setDateFrom("");
    setDateTo("");
    setLocationInRange(null);
  }, []);

  const handleHistoryStationClick = useCallback(
    (item: { name: string; code: string; date: string }) => {
      const map = mapRef.current;
      if (!map) return;

      const exactKey = stationHistoryMarkerKey(item.name, item.code, item.date);
      let marker = stationMarkersByHistoryKeyRef.current.get(exactKey);

      if (!marker) {
        const nameNorm = item.name.trim();
        const codeNorm = item.code.trim();
        const targetTs = new Date(item.date).getTime();
        let best: Marker | undefined;
        let bestDelta = Infinity;
        for (const [k, m] of stationMarkersByHistoryKeyRef.current.entries()) {
          const parts = k.split("\0");
          if (parts.length !== 3) continue;
          const [n, c, d] = parts;
          if (n.trim() !== nameNorm || c.trim() !== codeNorm) continue;
          const ts = new Date(d).getTime();
          if (!Number.isFinite(ts)) continue;
          const delta = Math.abs(ts - targetTs);
          if (delta < bestDelta) {
            bestDelta = delta;
            best = m;
          }
        }
        marker = best;
      }

      if (!marker) return;
      const withLayerUi = marker as Marker & { openPopup: () => void };
      const ll = marker.getLatLng();
      if (ll) {
        map.panTo(ll);
      }
      if (map.getZoom() < 12) {
        map.setZoom(13);
      }
      withLayerUi.openPopup();
    },
    []
  );


   useEffect(() => {
     handleCisternSelect(); // вызываем при монтировании
  
    }, [handleCisternSelect]);

  
  useEffect(() => {
    const el = document.getElementById("map");
    if (!el) return;

    const firstCoord =
      locationInRange?.find((loc) => Number.isFinite(loc.lat) && Number.isFinite(loc.lon)) ??
      location ??
      locationAll?.find((loc) => Number.isFinite(loc.lat) && Number.isFinite(loc.lon));
    if (!firstCoord) return;

    let map = mapRef.current;
    if (!map) {
      map = new LeafletMap("map").setView([firstCoord.lat, firstCoord.lon], 6);

      const osm = new TileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 15,
        attribution:
          '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
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

      const markersLayer = new LayerGroup().addTo(map);
      markersLayerRef.current = markersLayer;
      mapRef.current = map;
    }

    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();
    stationMarkersByHistoryKeyRef.current.clear();

    const rows = (locationInRange ?? locationAll) ?? [];
    const withCoords = rows.filter(
      (loc) => Number.isFinite(loc.lat) && Number.isFinite(loc.lon)
    );
    const orderedCoords = [...withCoords].sort(
      (a, b) => new Date(a.dateOpr).getTime() - new Date(b.dateOpr).getTime()
    );

    const tooltipHtml = (loc: CisternAllLocation | CisternLastLocation) => {
      const title = `${loc.nameStationOpr} (${loc.codeStationOpr})`;
      const op = loc.operationNote || loc.operationShort || "";
      return (
        `<strong>${escapeHtml(title)}</strong><br/>` +
        `${escapeHtml(new Date(loc.dateOpr).toLocaleString())}<br/>` +
        `${escapeHtml(op)}`
      );
    };

    type MarkerWithTooltip = Marker & {
      bindTooltip: (content: string, options?: object) => Marker;
      bindPopup: (content: string, options?: object) => Marker;
      openPopup: () => void;
      openTooltip: () => void;
    };

    if (orderedCoords.length >= 2) {
      new Polyline(
        orderedCoords.map((l) => [l.lat, l.lon] as [number, number]),
        {
          color: ROUTE_LINE_COLOR,
          weight: 2,
          opacity: 0.85,
          dashArray: "8 10",
        }
      ).addTo(markersLayer);

      for (let i = 0; i < orderedCoords.length - 1; i++) {
        const a = orderedCoords[i];
        const b = orderedCoords[i + 1];
        const lat1 = a.lat;
        const lon1 = a.lon;
        const lat2 = b.lat;
        const lon2 = b.lon;
        const dLat = lat2 - lat1;
        const dLon = lon2 - lon1;
        if (dLat * dLat + dLon * dLon < 1e-16) continue;

        const midLat = (lat1 + lat2) / 2;
        const midLon = (lon1 + lon2) / 2;
        const bearing = bearingDegrees(lat1, lon1, lat2, lon2);
        new Marker([midLat, midLon], {
          icon: routeDirectionArrowIcon(bearing),
          interactive: false,
          keyboard: false,
          zIndexOffset: -100,
        }).addTo(markersLayer);
      }
    }

    orderedCoords.forEach((loc, idx) => {
      const downtimeDays = downtimeDaysAtIndex(orderedCoords, idx);
      const icon = markerIconForLocation(loc, downtimeDays);
      const groupAtStation = consecutiveStationGroupAtIndex(orderedCoords, idx);
      const marker = new Marker([loc.lat, loc.lon], { icon }) as MarkerWithTooltip;
      marker.bindTooltip(tooltipHtml(loc), { direction: "top", className: "custom-tooltip" });
      marker.bindPopup(stationGroupPopupHtml(groupAtStation), {
        maxWidth: 340,
        className: "location-tab-marker-popup",
      });
      marker.addTo(markersLayer);
      const historyKey = stationHistoryMarkerKey(
        loc.nameStationOpr ?? "",
        loc.codeStationOpr ?? "",
        loc.dateOpr
      );
      stationMarkersByHistoryKeyRef.current.set(historyKey, marker);
    });

    if (withCoords.length === 0) {
      if (location && Number.isFinite(location.lat) && Number.isFinite(location.lon)) {
        map.setView([location.lat, location.lon], 13);
      }
      return;
    }

    if (withCoords.length > 1) {
      const bounds = new LatLngBounds(withCoords.map((l) => [l.lat, l.lon] as [number, number]));
      map.fitBounds(bounds, { padding: [48, 48], maxZoom: 14 });
    } else if (withCoords.length === 1) {
      map.setView([withCoords[0].lat, withCoords[0].lon], 13);
    }
  }, [location, locationAll, locationInRange, CicternNumber]);

  useEffect(() => {
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      markersLayerRef.current = null;
    };
  }, []);


  // утилита для группировки подряд идущих станций
  function groupStations(locations: CisternAllLocation[]) {
    const result: {
      name: string;
      code: string;
      count: number;
      date: string;
      nameStationOut: string;
      nameStationEnd: string;
      numShipmen: string;
    }[] = [];
    let prevName = "";
    let prevCode = "";
    let count = 0;
    let lastDate = "";
    let lastLocInGroup: CisternAllLocation | null = null;

    let firstDate = "";
    let day1;
    let day2;
    let day3;
    for (const loc of locations) {
      if (loc.nameStationOpr === prevName) {
        firstDate = loc.dateOpr;
        lastLocInGroup = loc;
      } else {
        if (prevName) {
          if (firstDate) {
            day1 = new Date(firstDate).getTime();
            day2 = new Date(lastDate).getTime();
            day3 = Math.trunc((((day2 - day1) / 1000) / 3600) / 24);
            count = day3;
            firstDate = "";
          }
          const route = lastLocInGroup;
          result.push({
            name: prevName,
            code: prevCode,
            count,
            date: lastDate,
            nameStationOut: route?.nameStationOut ?? "",
            nameStationEnd: route?.nameStationEnd ?? "",
            numShipmen: route?.numShipmen ?? "",
          });
        }
        prevName = loc.nameStationOpr;
        prevCode = loc.codeStationOpr;
        count = 1;
        lastDate = loc.dateOpr;
        lastLocInGroup = loc;
      }
    }

    // добавляем последнюю группу
    if (prevName && lastLocInGroup) {
      const route = lastLocInGroup;
      result.push({
        name: prevName,
        code: prevCode,
        count,
        date: lastDate,
        nameStationOut: route?.nameStationOut ?? "",
        nameStationEnd: route?.nameStationEnd ?? "",
        numShipmen: route?.numShipmen ?? "",
      });
    }
    
    day1 = new Date(result[0].date).getTime();
    day2 = new Date().getTime();
    day3 = Math.trunc((((day2-day1)/1000) / 3600) / 24);
            
    
    result[0].count = day3; 
    return result;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Пробеги и местоположения
          </CardTitle>

        </CardHeader>
        <CardContent>
          <i>Пробег</i>
          <br/>Дата получения данных: <b>{new Date(milage?.inputDate ?? "").toLocaleDateString()}</b>
          <br/>Накопленный пробег: {milage?.milage} км; Норма пробега: {milage?.milageNorm} км; Остаточный пробег: <b>{remainMilage} км</b>
          <br/>Дата планируемого ремонта: <b>{new Date(milage?.repairDate ?? "").toLocaleDateString()}</b>
         </CardContent>
        <CardContent>
          <i>Последнее местоположение</i>
          <p>
            Станция: <b>{location?.nameStationOpr} ({location?.codeStationOpr})</b>, Дата операции: <b>{new Date(location?.dateOpr ?? "").toLocaleDateString()}</b>
            <br></br>
            Операция: {location?.operationNote} ({location?.operationShort})
            <br></br>
            {location ? formatCargoPlain(location) : null}
          </p>
          </CardContent>
      </Card>

      <Card className="pb-0 gap-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapIcon className="h-5 w-5" />
            Интерактивная карта
          </CardTitle>
          <CardDescription>Отображение текущего местоположения вагона-цистерны на карте</CardDescription>

        </CardHeader>
        <CardContent className="px-0 gap-2 px-5">
          <div className="flex gap-2 h-[480px] rounded-lg mb-[24px]">
            <Card className="w-2/3 shrink-0 h-full overflow-hidden py-0">
              <CardContent className="p-0 h-full">
                <div id="map" className="w-full h-full min-h-[480px]" />
              </CardContent>
            </Card>
            <Card className="w-1/3 shrink-0 h-full overflow-hidden py-0">
              <CardContent className="h-full p-4 bg-gray-50 flex flex-col gap-3">
                <div>
                  <h3 className="font-semibold">История перемещения</h3>
                  <div className="space-y-2">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs text-muted-foreground">Период</label>
                      <div className="flex gap-2 items-end">
                        <div className="flex-1 min-w-0">
                          <Input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="h-8 text-sm"
                          />
                        </div>
                        <span className="text-muted-foreground shrink-0">—</span>
                        <div className="flex-1 min-w-0">
                          <Input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 justify-center">
                        <Button
                          size="sm"
                          onClick={handleLoadRange}
                          disabled={!dateFrom || !dateTo || rangeLoading}
                        >
                          {rangeLoading ? "Загрузка…" : "Показать"}
                        </Button>
                        {(dateFrom || dateTo || locationInRange) && (
                          <Button size="sm" variant="outline" onClick={handleResetRange}>
                            Сбросить
                          </Button>
                        )}
                      </div>
                    </div>             
                  </div>

                </div>
                <div className="overflow-y-auto">
                  <ul className="space-y-2 flex-1 min-h-0">
                    {(locationInRange ?? locationAll) &&
                      groupStations(locationInRange ?? locationAll ?? []).map((item, idx) => (
                        <li key={idx} className="text-sm">
                          <button
                            type="button"
                            onClick={() => handleHistoryStationClick(item)}
                            className="w-full rounded-md border border-transparent px-1 py-1.5 text-left transition-colors hover:border-border hover:bg-background/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <p className={item.count > 3 ? "text-red-600" : "text-black"}>
                              <b>
                                {item.name} ({item.code})
                              </b>{" "}
                              — простой вагона <b>{item.count}</b> дней
                            </p>
                            <p className={item.count > 3 ? "text-red-600" : "text-gray-600"}>
                              Последняя дата операции:{" "}
                              <b>{new Date(item.date).toLocaleDateString()}</b>
                            </p>
                            <p className={item.count > 3 ? "text-red-600" : "text-gray-600"}>
                              Маршрут:{" "}
                              <b>{formatGroupRouteText(item)}</b>
                            </p>
                          </button>
                        </li>
                      ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>

        
      </Card>
    </div>
  );
}
