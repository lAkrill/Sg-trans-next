import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { useState, useEffect, useCallback, useMemo } from "react";
import { MapPin, MapIcon } from "lucide-react";
import { CisternDislocation } from "@/api/dislocations";
import type { CisternLastLocation } from "@/api/dislocations";
import "@/lib/leaflet/dist/leaflet.css";
import L, {Map, TileLayer, Marker, Circle, Polygon, Popup, Tooltip, Icon} from "@/lib/leaflet/dist/leaflet-src.js";


// Определяем тип пропсов
type LocationTabProps = {
  CicternNumber: string; // или другой тип, например объект
};

export function LocationTab({CicternNumber}:LocationTabProps) {

  const [location, setLocation] = useState<CisternLastLocation | null>(null);

  const myIcon = new Icon({
			iconUrl: '../tank.png',
			iconSize: [38, 27],
		
	});

  const handleCisternSelect = useCallback(async () => {
    console.log('Number:', CicternNumber);
    const res = await CisternDislocation.getLastLocation( CicternNumber);
    
    setLocation(res); // сохраняем  в state
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
			maxZoom: 19,
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
			maxZoom: 19,
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
            Станция: <b>{location?.nameStationOpr} </b>, Дата: <b>{new Date(location?.dateOpr ?? "").toLocaleDateString()}</b>
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
          <div className="h-[600px] rounded-lg overflow-hidden border ml-[24px] mr-[24px]">

            <div id="map" className="w-full h-full" />

            {/* <iframe
              src="https://www.openrailwaymap.org/?style=standard&lat=55.519499&lon=28.5920011&zoom=15"
              className="w-full h-full border-0"
              title="Railway Map - Интерактивная карта"
              allowFullScreen
            /> */}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
