import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import { describe, expect, it } from "vitest";
import type { CacheFeature } from "@/types";
import { searchCaches } from "./search";

const cache = (code: string, name: string): CacheFeature =>
  new Feature({ geometry: new Point([0, 0]), code, name }) as CacheFeature;

const codes = (features: CacheFeature[]): string[] => features.map((f) => f.get<string>("code"));

const caches = [
  cache("GC1ABC", "Pont de la Seine"),
  cache("GC1", "Abraham"),
  cache("GC2XYZ", "La maison d'Abraham"),
  cache("LC9-GC1", "Etape 1"),
];

describe("searchCaches", () => {
  it("returns nothing for an empty query", () => {
    expect(searchCaches(caches, "  ")).toEqual([]);
  });

  it("ranks exact code, then code prefix, then code part, then name", () => {
    expect(codes(searchCaches(caches, "gc1"))).toEqual(["GC1", "GC1ABC", "LC9-GC1"]);
    expect(codes(searchCaches(caches, "abraham"))).toEqual(["GC1", "GC2XYZ"]);
  });

  it("ignores case and surrounding spaces", () => {
    expect(codes(searchCaches(caches, "  PONT "))).toEqual(["GC1ABC"]);
  });

  it("keeps load order between equal matches", () => {
    expect(codes(searchCaches(caches, "abraham"))).toEqual(["GC1", "GC2XYZ"]);
  });

  it("returns nothing when nothing matches", () => {
    expect(searchCaches(caches, "zzz")).toEqual([]);
  });
});
