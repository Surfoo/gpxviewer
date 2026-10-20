import type Feature from "ol/Feature";
import type Point from "ol/geom/Point";
import type TileLayer from "ol/layer/Tile";

export type CacheFeature = Feature<Point> & {
  get: <T>(key: string) => T;
};

export type CacheDetails = {
  code: string;
  name: string;
  description: string;
  type: string;
  container: string;
  difficulty: string;
  terrain: string;
  owner: string;
  ownerId?: number;
  found: boolean;
  date?: string;
  url?: string;
  lon: number;
  lat: number;
};

export type BaseLayer = {
  id: string;
  title: string;
  thumb: string;
  layer: TileLayer;
};

export type SetStatusFn = (message: string, isError?: boolean) => void;
