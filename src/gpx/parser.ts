import Feature from "ol/Feature";
import LineString from "ol/geom/LineString";
import Point from "ol/geom/Point";
import { fromLonLat } from "ol/proj";
import { isSupportedCacheType } from "@/map/styles";
import type { CacheDetails } from "@/types";

const parseCacheDetails = (wpt: Element): CacheDetails | null => {
  const lat = parseFloat(wpt.getAttribute("lat") ?? "");
  const lon = parseFloat(wpt.getAttribute("lon") ?? "");
  if (Number.isNaN(lat) || Number.isNaN(lon)) return null;

  const textContent = (query: string): string =>
    wpt.getElementsByTagName(query)?.[0]?.textContent?.trim() ?? "";

  const cacheNode = wpt.getElementsByTagNameNS("*", "cache")?.[0];
  const cacheText = (tag: string): string =>
    cacheNode?.getElementsByTagNameNS("*", tag)?.[0]?.textContent?.trim() ?? "";

  const sym = textContent("sym");
  const found = sym.toLowerCase().includes("found");
  const code = textContent("name");
  const name = cacheText("name") || textContent("desc") || code;
  const description = cacheText("short_description") || textContent("cmt");
  const type = cacheText("type") || sym;
  if (!isSupportedCacheType(type)) return null;
  const container = cacheText("container") || "Unknown";
  const difficulty = cacheText("difficulty") || "?";
  const terrain = cacheText("terrain") || "?";
  const ownerNode = cacheNode?.getElementsByTagNameNS("*", "owner")?.[0];
  const owner = ownerNode?.textContent?.trim() || "—";
  const ownerIdRaw = ownerNode?.getAttribute("id");
  const parsedOwnerId = ownerIdRaw ? Number.parseInt(ownerIdRaw, 10) : Number.NaN;
  const ownerId =
    Number.isFinite(parsedOwnerId) && parsedOwnerId >= 0 && Number.isSafeInteger(parsedOwnerId)
      ? parsedOwnerId
      : undefined;
  const date = textContent("time");
  const url = textContent("url") || cacheText("url");

  return {
    code,
    name,
    description,
    type,
    container,
    difficulty,
    terrain,
    owner,
    ownerId,
    found,
    date,
    url,
    lon,
    lat,
  };
};

export const gpxToFeatures = (gpxText: string, sourceLabel: string): Feature<Point>[] => {
  const parser = new DOMParser();
  const xml = parser.parseFromString(gpxText, "text/xml");
  const errorNode = xml.querySelector("parsererror");
  if (errorNode) {
    throw new Error("Le fichier GPX est invalide.");
  }

  const waypoints = Array.from(xml.getElementsByTagName("wpt"));
  return waypoints
    .map((wpt) => parseCacheDetails(wpt))
    .filter((details): details is CacheDetails => Boolean(details))
    .map((details, index) => {
      const geometry = new Point(fromLonLat([details.lon, details.lat]));
      const feature = new Feature<Point>({
        geometry,
        ...details,
      });
      feature.setId(details.code || `${sourceLabel}-${index}`);
      return feature;
    });
};

// <trk> segments and <rte> routes, one LineString per segment
export const gpxToTracks = (gpxText: string): Feature<LineString>[] => {
  const xml = new DOMParser().parseFromString(gpxText, "text/xml");
  const toLine = (points: Element[]): Feature<LineString> | null => {
    const coords = points
      .map((pt) => [
        parseFloat(pt.getAttribute("lon") ?? ""),
        parseFloat(pt.getAttribute("lat") ?? ""),
      ])
      .filter(([lon, lat]) => Number.isFinite(lon) && Number.isFinite(lat))
      .map(([lon, lat]) => fromLonLat([lon, lat]));
    return coords.length > 1 ? new Feature(new LineString(coords)) : null;
  };
  const lines = [
    ...Array.from(xml.getElementsByTagName("trkseg")).map((seg) =>
      toLine(Array.from(seg.getElementsByTagName("trkpt"))),
    ),
    ...Array.from(xml.getElementsByTagName("rte")).map((rte) =>
      toLine(Array.from(rte.getElementsByTagName("rtept"))),
    ),
  ];
  return lines.filter((line): line is Feature<LineString> => line !== null);
};
