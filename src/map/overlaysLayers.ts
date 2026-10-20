import Feature from "ol/Feature";
import { Circle as CircleGeometry, type Point } from "ol/geom";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Fill, Stroke, Style, Text } from "ol/style";
import type { CacheFeature } from "@/types";

const metersPerMile = 1609.344;
const perimeterRadius = 0.1 * metersPerMile; // 0.1 mile

export const createLabelLayer = (): VectorLayer<VectorSource> =>
  new VectorLayer({
    source: new VectorSource(),
    zIndex: 20,
  });

export const createPerimeterLayer = (): VectorLayer<VectorSource> =>
  new VectorLayer({
    source: new VectorSource(),
    zIndex: 2,
  });

const labelStyle = (text: string): Style =>
  new Style({
    text: new Text({
      text,
      font: "600 12px 'Space Grotesk', 'Segoe UI', sans-serif",
      fill: new Fill({ color: "#1f2b21" }),
      stroke: new Stroke({ color: "#ffffff", width: 3 }),
      offsetY: -12,
    }),
  });

const perimeterStroke = new Stroke({ color: "rgba(209, 67, 67, 0.9)", width: 2 });
const perimeterFill = new Fill({ color: "rgba(209, 67, 67, 0.5)" });

export const updateLabels = (layer: VectorLayer<VectorSource>, features: CacheFeature[]): void => {
  const source = layer.getSource();
  if (!source) return;
  source.clear();

  const labelFeatures = features
    .map((feature) => {
      const code = feature.get<string>("code");
      const geometry = feature.getGeometry();
      if (!code || !geometry) return null;
      const clone = geometry.clone() as Point;
      return new Feature({ geometry: clone, label: code });
    })
    .filter((f): f is Feature<Point> => Boolean(f));

  labelFeatures.forEach((feat) => {
    const text = (feat.get("label") as string | undefined) ?? "";
    feat.setStyle(labelStyle(text));
  });

  source.addFeatures(labelFeatures);
};

export const updatePerimeters = (
  layer: VectorLayer<VectorSource>,
  features: CacheFeature[],
): void => {
  const source = layer.getSource();
  if (!source) return;
  source.clear();

  const perimeterFeatures = features
    .map((feature) => {
      const geometry = feature.getGeometry();
      if (!geometry) return null;
      const center = (geometry as Point).getCoordinates();
      const circle = new CircleGeometry(center, perimeterRadius);
      return new Feature({ geometry: circle });
    })
    .filter((f): f is Feature<CircleGeometry> => Boolean(f));

  perimeterFeatures.forEach((feat) => {
    feat.setStyle(
      new Style({
        stroke: perimeterStroke,
        fill: perimeterFill,
      }),
    );
  });

  source.addFeatures(perimeterFeatures);
};
