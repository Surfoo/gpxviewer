import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import { beforeEach, describe, expect, it } from "vitest";
import type { CacheFeature } from "@/types";
import {
  isFeatureVisible,
  isSupportedCacheType,
  setAllowedTypes,
  setHideFound,
  setRange,
  typesSharingIcon,
} from "./styles";

const cache = (props: Record<string, unknown>): CacheFeature =>
  new Feature({ geometry: new Point([0, 0]), type: "Traditional Cache", ...props }) as CacheFeature;

beforeEach(() => {
  setAllowedTypes(null);
  setHideFound(false);
  setRange("difficulty", 1, 5);
  setRange("terrain", 1, 5);
});

describe("isSupportedCacheType", () => {
  it("accepts known types regardless of case and spacing", () => {
    expect(isSupportedCacheType("  Traditional Cache ")).toBe(true);
    expect(isSupportedCacheType("EARTHCACHE")).toBe(true);
  });

  it("rejects unknown or missing types", () => {
    expect(isSupportedCacheType("Temporarily Disable Listing")).toBe(false);
    expect(isSupportedCacheType(undefined)).toBe(false);
  });
});

describe("isFeatureVisible", () => {
  it("shows everything by default", () => {
    expect(isFeatureVisible(cache({ difficulty: "3", terrain: "4" }))).toBe(true);
  });

  it("filters by allowed types", () => {
    setAllowedTypes(new Set(["multi-cache"]));
    expect(isFeatureVisible(cache({}))).toBe(false);
    expect(isFeatureVisible(cache({ type: "Multi-Cache" }))).toBe(true);
  });

  it("hides found caches on demand", () => {
    setHideFound(true);
    expect(isFeatureVisible(cache({ found: true }))).toBe(false);
    expect(isFeatureVisible(cache({ found: false }))).toBe(true);
  });

  it("filters by difficulty and terrain, bounds included", () => {
    setRange("difficulty", 2, 3);
    setRange("terrain", 1, 1.5);
    expect(isFeatureVisible(cache({ difficulty: "2", terrain: "1.5" }))).toBe(true);
    expect(isFeatureVisible(cache({ difficulty: "3.5", terrain: "1" }))).toBe(false);
    expect(isFeatureVisible(cache({ difficulty: "2.5", terrain: "2" }))).toBe(false);
  });

  it("keeps caches with unknown difficulty or terrain visible", () => {
    setRange("difficulty", 4, 5);
    expect(isFeatureVisible(cache({ difficulty: "?", terrain: "?" }))).toBe(true);
  });
});

describe("typesSharingIcon", () => {
  it("returns every type name drawn with the same icon", () => {
    const types = typesSharingIcon("special event cache");
    expect(types).toContain("groundspeak block party");
    expect(types).toContain("community celebration event");
  });

  it("returns an empty list for an unknown type", () => {
    expect(typesSharingIcon("nope")).toEqual([]);
  });
});

describe("filter with icon aliases", () => {
  it("keeps a Groundspeak block party visible when its icon is selected", () => {
    setAllowedTypes(new Set(typesSharingIcon("special event cache")));
    expect(isFeatureVisible(cache({ type: "Groundspeak Block Party" }))).toBe(true);
    expect(isFeatureVisible(cache({ type: "Traditional Cache" }))).toBe(false);
  });
});
