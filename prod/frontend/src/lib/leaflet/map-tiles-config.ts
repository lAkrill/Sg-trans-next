export type MapTilesProvider = "tracestrack" | "osm" | "off";

function parseProvider(value: string | undefined): MapTilesProvider | null {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return null;
  if (normalized === "off" || normalized === "false" || normalized === "none" || normalized === "0") {
    return "off";
  }
  if (normalized === "osm" || normalized === "openstreetmap") {
    return "osm";
  }
  if (normalized === "tracestrack" || normalized === "ru" || normalized === "true" || normalized === "1") {
    return "tracestrack";
  }
  return null;
}

/** Провайдер базовой подложки: tracestrack | osm | off. */
export function getMapTilesProvider(): MapTilesProvider {
  const explicit = parseProvider(process.env.NEXT_PUBLIC_MAP_TILES_PROVIDER);
  if (explicit) return explicit;

  if (process.env.TRACESTRACK_API_KEY?.trim()) {
    return "tracestrack";
  }

  return "osm";
}

export function isMapBaseTilesEnabled(): boolean {
  return getMapTilesProvider() !== "off";
}

export function isTracestrackTilesActive(): boolean {
  return getMapTilesProvider() === "tracestrack" && Boolean(process.env.TRACESTRACK_API_KEY?.trim());
}

export function isRailwayTilesEnabled(): boolean {
  const raw = process.env.NEXT_PUBLIC_MAP_RAILWAY_TILES_ENABLED?.trim().toLowerCase();
  if (raw === "false" || raw === "0" || raw === "no" || raw === "off") {
    return false;
  }
  return true;
}

export const OSM_TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

export const MAP_TILES_PROXY_URL = "/api/map-tiles/{z}/{x}/{y}";

export function getMapBaseTileUrl(): string {
  if (!isMapBaseTilesEnabled()) return "";
  return isTracestrackTilesActive() ? MAP_TILES_PROXY_URL : OSM_TILE_URL;
}

export function getMapBaseTileAttribution(): string {
  if (isTracestrackTilesActive()) {
    return (
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> ' +
      '&copy; <a href="https://tracestrack.com/">Tracestrack</a>'
    );
  }
  return '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
}
