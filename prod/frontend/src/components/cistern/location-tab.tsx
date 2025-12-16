import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { useState, useEffect, useCallback, useMemo } from "react";
import { MapPin, MapIcon } from "lucide-react";
import { CisternDislocation } from "@/api/dislocations";
import type { CisternLastLocation, CisternAllLocation } from "@/api/dislocations";
import "@/lib/leaflet/dist/leaflet.css";
import L, {Map, TileLayer, Marker, Circle, Polygon, Popup, Tooltip, Icon} from "@/lib/leaflet/dist/leaflet-src.js";


// Определяем тип пропсов
type LocationTabProps = {
  CicternNumber: string; // или другой тип, например объект
};

export function LocationTab({CicternNumber}:LocationTabProps) {

  const [location, setLocation] = useState<CisternLastLocation | null>(null);
  const [locationAll, setLocationAll] = useState<CisternAllLocation[] | null>(null);

  const myIcon = new Icon({
			iconUrl: '../tank.png',
			iconSize: [38, 27],
		
	});

  const handleCisternSelect = useCallback(async () => {
    const res1 = await CisternDislocation.getLastLocation( CicternNumber);
    const res2 = await CisternDislocation.getAllLocation( CicternNumber);
    setLocation(res1); // сохраняем  в state
    setLocationAll(res2);
  }, []);


   useEffect(() => {
     handleCisternSelect(); // вызываем при монтировании
  
    }, [handleCisternSelect]);

  
  useEffect(() => {

    if (!location) return;

    // если карта уже создана, не пересоздаём
    if (L.DomUtil.get("map")?._leaflet_id) {
      return;
    }

    
    const map = new Map('map').setView([location.lat,	location.lon], 13);

		 const osm  = new TileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			maxZoom: 15,
			attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
			opacity: 0.7
		 });

     		// Применяем фильтр после загрузки тайлов
		osm.on('tileload', function(e) {
			e.tile.style.filter = 'grayscale(100%) brightness(0.95)';
		});

    		osm.addTo(map);
		
		// Транспортный слой OpenStreetMap (аналог layers=T на openstreetmap.org)
		// 1. Железнодорожный транспорт (OpenRailwayMap)
		var railwayLayer = new TileLayer('https://tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png', {
			attribution: '&copy; <a href="https://www.openrailwaymap.org/">OpenRailwayMap</a>',
			maxZoom: 15,
			opacity: 1
		}).addTo(map);

    const mark = new Marker([location.lat,	location.lon], {icon: myIcon}).addTo(map)
    .bindTooltip(`${CicternNumber}`, {
			permanent: true,
			direction: 'top',
			className: 'custom-tooltip'
		})
		.openTooltip();

    
  },  [location]);


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
            // console.log(loc.nameStationOpr, day2, day1, day3)
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
          <CardDescription>История пробегов цистерны с датами получения данных</CardDescription>
        </CardHeader>
        <CardContent>
          Последнее местоположение
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
          <CardDescription>Отображение текущего местоположения цистерны на карте</CardDescription>

        </CardHeader>
        <CardContent className="px-0">
          <div className="flex h-[480px] rounded-lg overflow-hidden border ml-[24px] mr-[24px] mb-[24px]">

            <div id="map" className="w-2/3 h-full" />
            {/* Список станций */}
            <div className="w-1/3 h-full overflow-y-auto border-l p-4 bg-gray-50 ml-[24px]">
              <h3 className="font-semibold mb-2">История перемещения</h3>
              <ul className="space-y-2">
                  {locationAll && groupStations(locationAll).map((item, idx) => (
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
