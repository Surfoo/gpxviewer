import { Icon, Style } from "ol/style";
import type { CacheFeature } from "@/types";

export type CacheIconConfig = { file: string; label: string };

export const typeToIconFile: Record<string, CacheIconConfig> = {
  "traditional cache": { file: "type_traditional.png", label: "Traditional Cache" },
  "multi-cache": { file: "type_multi.png", label: "Multi-cache" },
  "virtual cache": { file: "type_virtual.png", label: "Virtual Cache" },
  "letterbox hybrid": { file: "type_letterbox.png", label: "Letterbox Hybrid" },
  "event cache": { file: "type_event.png", label: "Event Cache" },
  "unknown cache": { file: "type_mystery.png", label: "Mystery Cache" },
  "project ape cache": { file: "type_ape.png", label: "Project APE Cache" },
  "webcam cache": { file: "type_webcam.png", label: "Webcam Cache" },
  "cache in trash out event": { file: "type_cito.png", label: "Cache In Trash Out Event" },
  earthcache: { file: "type_earth.png", label: "Earthcache" },
  "mega-event cache": { file: "type_mega.png", label: "Mega-Event Cache" },
  "gps adventures exhibit": { file: "type_maze.png", label: "GPS Adventures Exhibit" },
  "wherigo cache": { file: "type_wherigo.png", label: "Wherigo Cache" },
  "lost and found event caches": {
    file: "type_specialevent.png",
    label: "Lost and Found Event Caches",
  },
  "groundspeak hq": { file: "type_hq.png", label: "Groundspeak HQ" },
  "groundspeak lost and found celebration": {
    file: "type_specialevent.png",
    label: "Groundspeak Lost and Found Celebration",
  },
  "community celebration event": {
    file: "type_specialevent.png",
    label: "Community Celebration Event",
  },
  "groundspeak block party": { file: "type_specialevent.png", label: "Groundspeak Block Party" },
  "giga-event cache": { file: "type_giga.png", label: "Giga-Event Cache" },
  "special event cache": { file: "type_specialevent.png", label: "Special Event Cache" },
  "lab cache": { file: "type_advlab.png", label: "Adventure Lab Cache" },
};

// every type name drawn with the same icon: one filter button covers them all
export const typesSharingIcon = (type: string): string[] => {
  const file = typeToIconFile[type]?.file;
  return Object.keys(typeToIconFile).filter((key) => typeToIconFile[key].file === file);
};

const defaultIconFile = "type_unknown.png";
const styleCache = new Map<string, Style | Style[]>();
let allowedTypes: Set<string> | null = null;

export const isSupportedCacheType = (cacheType: string | undefined): boolean => {
  if (!cacheType) return false;
  const normalized = cacheType.trim().toLowerCase();
  return Boolean(typeToIconFile[normalized]);
};

export const setAllowedTypes = (types: Set<string> | null): void => {
  allowedTypes = types;
};

let hideFound = false;
export const setHideFound = (value: boolean): void => {
  hideFound = value;
};

export type RangeKey = "difficulty" | "terrain";
const ranges: Record<RangeKey, [number, number]> = { difficulty: [1, 5], terrain: [1, 5] };

export const setRange = (key: RangeKey, min: number, max: number): void => {
  ranges[key] = [min, max];
};

// unknown ("?") difficulty/terrain stays visible
export const isFeatureVisible = (feature: CacheFeature): boolean => {
  const type = (feature.get<string>("type") ?? "Unknown Cache").trim().toLowerCase();
  if (allowedTypes && !allowedTypes.has(type)) return false;
  if (hideFound && feature.get<boolean>("found")) return false;
  return (Object.keys(ranges) as RangeKey[]).every((key) => {
    const value = Number.parseFloat(feature.get<string>(key) ?? "");
    return Number.isNaN(value) || (value >= ranges[key][0] && value <= ranges[key][1]);
  });
};

const iconSrcForType = (cacheType: string): string => {
  const normalized = cacheType.trim().toLowerCase();
  const matched = typeToIconFile[normalized]?.file ?? defaultIconFile;
  const base = import.meta.env.BASE_URL ?? "/";
  return `${base}icons/mapicons/geocaches/${matched}`;
};

export const getFeatureStyle = (feature: CacheFeature): Style | Style[] => {
  const type = feature.get<string>("type") ?? "Unknown Cache";
  if (!isFeatureVisible(feature)) return [];
  const found = feature.get<boolean>("found") ?? false;
  const iconSrc = iconSrcForType(type);
  const key = `${iconSrc}-${found ? "found" : "fresh"}`;
  const existing = styleCache.get(key);
  if (existing) return existing;

  const iconStyle = new Style({
    image: new Icon({
      src: iconSrc,
      anchor: [0.5, 1],
    }),
  });

  if (!found) {
    styleCache.set(key, iconStyle);
    return iconStyle;
  }

  // smiley badge on the top right corner of the cache icon (displacement is [right, up] in px)
  const foundStyle = new Style({
    image: new Icon({
      src: `${import.meta.env.BASE_URL ?? "/"}icons/mapicons/geocaches/found.svg`,
      anchor: [0.5, 0.5],
      displacement: [12, 30],
      scale: 0.75,
    }),
  });

  const styleArray: Style[] = [iconStyle, foundStyle];
  styleCache.set(key, styleArray);
  return styleArray;
};
