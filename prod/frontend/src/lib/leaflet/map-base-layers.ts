import { Map as LeafletMap, TileLayer } from "@/lib/leaflet/dist/leaflet-src.js";
import {
  getMapBaseTileAttribution,
  getMapBaseTileUrl,
  isMapBaseTilesEnabled,
  isRailwayTilesEnabled,
} from "@/lib/leaflet/map-tiles-config";

const OPENRAILWAYMAP_URL = "https://{s}.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png";

export type LeafletTileLayerConstructor = new (
  url: string,
  options?: object
) => InstanceType<typeof TileLayer>;

export function createGrayscaleOsmBaseLayer(
  TileLayerClass: LeafletTileLayerConstructor,
  options?: { maxZoom?: number; opacity?: number }
): InstanceType<typeof TileLayer> | null {
  const tileUrl = getMapBaseTileUrl();
  if (!tileUrl) return null;

  const layer = new TileLayerClass(tileUrl, {
    maxZoom: options?.maxZoom ?? 15,
    attribution: getMapBaseTileAttribution(),
    opacity: options?.opacity ?? 0.7,
  });

  layer.on("tileload", (e: { tile: { style: CSSStyleDeclaration } }) => {
    e.tile.style.filter = "grayscale(100%) brightness(0.95)";
  });

  return layer;
}

export function createOpenRailwayMapLayer(
  TileLayerClass: LeafletTileLayerConstructor,
  options?: { maxZoom?: number; opacity?: number }
): InstanceType<typeof TileLayer> | null {
  if (!isRailwayTilesEnabled()) return null;

  return new TileLayerClass(OPENRAILWAYMAP_URL, {
    maxZoom: options?.maxZoom ?? 15,
    attribution: '&copy; <a href="https://www.openrailwaymap.org/">OpenRailwayMap</a>',
    opacity: options?.opacity ?? 1,
  });
}

export function addStandardMapLayers(
  map: InstanceType<typeof LeafletMap>,
  TileLayerClass: LeafletTileLayerConstructor
): void {
  if (!isMapBaseTilesEnabled() && !isRailwayTilesEnabled()) return;

  const baseLayer = createGrayscaleOsmBaseLayer(TileLayerClass);
  if (baseLayer) baseLayer.addTo(map);

  const railwayLayer = createOpenRailwayMapLayer(TileLayerClass);
  if (railwayLayer) railwayLayer.addTo(map);
}
