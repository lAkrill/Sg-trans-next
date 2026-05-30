import { NextRequest, NextResponse } from "next/server";
import { isTracestrackTilesActive, OSM_TILE_URL } from "@/lib/leaflet/map-tiles-config";

type RouteParams = {
  params: Promise<{ z: string; x: string; y: string }>;
};

function isValidTileCoord(value: string): boolean {
  return /^\d+$/.test(value);
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { z, x, y } = await params;

  if (!isValidTileCoord(z) || !isValidTileCoord(x) || !isValidTileCoord(y)) {
    return new NextResponse(null, { status: 400 });
  }

  const tracestrackKey = process.env.TRACESTRACK_API_KEY?.trim();
  const tileUrl = isTracestrackTilesActive()
    ? `https://tile.tracestrack.com/ru/${z}/${x}/${y}@1x.png?key=${encodeURIComponent(tracestrackKey!)}`
    : OSM_TILE_URL.replace("{z}", z).replace("{x}", x).replace("{y}", y);

  const response = await fetch(tileUrl, {
    next: { revalidate: 86400 },
  });

  if (!response.ok) {
    return new NextResponse(null, { status: response.status });
  }

  const body = await response.arrayBuffer();

  return new NextResponse(body, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
