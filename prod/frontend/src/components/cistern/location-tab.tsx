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

/** Дни простоя на станции для записи с индексом `index` (подряд идущие операции с той же станцией по имени). */
function downtimeDaysAtIndex(ordered: CisternAllLocation[], index: number): number {
  const station = ordered[index].nameStationOpr;
  let start = index;
  while (start > 0 && ordered[start - 1].nameStationOpr === station) start--;
  let end = index;
  while (end < ordered.length - 1 && ordered[end + 1].nameStationOpr === station) end++;
  const t0 = new Date(ordered[start].dateOpr).getTime();
  const t1 = new Date(ordered[end].dateOpr).getTime();
  return Math.trunc((t1 - t0) / (1000 * 3600 * 24));
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

    const rows = locationInRange ?? [];
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
      bindTooltip: (content: string, options?: object) => Marker & { openTooltip: () => Marker };
      openTooltip: () => Marker;
    };

    if (orderedCoords.length >= 2) {
      new Polyline(
        orderedCoords.map((l) => [l.lat, l.lon] as [number, number]),
        {
          color: "#2563eb",
          weight: 2,
          opacity: 0.85,
          dashArray: "8 10",
        }
      ).addTo(markersLayer);
    }

    orderedCoords.forEach((loc, idx) => {
      const downtimeDays = downtimeDaysAtIndex(orderedCoords, idx);
      const icon = markerIconForLocation(loc, downtimeDays);
      const marker = new Marker([loc.lat, loc.lon], { icon }) as MarkerWithTooltip;
      marker
        .bindTooltip(tooltipHtml(loc), { direction: "top", className: "custom-tooltip" })
        .addTo(markersLayer);
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
    const result: { name: string; code: string; count: number; date: string }[] = [];
    let prevName = "";
    let prevCode = "";
    let count = 0;
    let lastDate = "";
  
   
    let firstDate = "";
    let day1;
    let day2;
    let day3;
    for (const loc of locations) {
      if (loc.nameStationOpr === prevName) {
        firstDate = loc.dateOpr;
      } else {
        if (prevName) {
          if (firstDate) {
            day1 = new Date(firstDate).getTime();
            day2 = new Date(lastDate).getTime();
            day3 = Math.trunc((((day2-day1)/1000) / 3600) / 24);
            count = day3;
            firstDate = "";
          }
          result.push({ name: prevName, code: prevCode, count, date: lastDate });
        }
        prevName = loc.nameStationOpr;
        prevCode = loc.codeStationOpr;
        count = 1;
        lastDate = loc.dateOpr;
      }
      //console.log(loc.nameStationOpr, day2, day1, day3, firstDate)
    }

    // добавляем последнюю группу
    if (prevName) {
      result.push({ name: prevName, code: prevCode, count, date: lastDate });
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
            Груз: {location?.nameShip} ({location?.codeShip})
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
                    {(locationInRange ?? locationAll) && groupStations(locationInRange ?? locationAll ?? []).map((item, idx) => (
                      <li key={idx} className="text-sm">
                        <p className={item.count > 3 ? "text-red-600" : "text-black"}>
                          <b>{item.name} ({item.code})</b> — простой вагона <b>{item.count}</b> дней
                        </p>
                        <p className={item.count > 3 ? "text-red-600" : "text-gray-600"}>
                          Последняя дата операции: <b>{new Date(item.date).toLocaleDateString()}</b>
                        </p>
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
