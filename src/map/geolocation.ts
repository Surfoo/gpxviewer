import { LocateFixed } from "lucide";
import Control from "ol/control/Control";
import Feature from "ol/Feature";
import Geolocation from "ol/Geolocation";
import { Point } from "ol/geom";
import VectorLayer from "ol/layer/Vector";
import type { default as OlMap } from "ol/Map";
import VectorSource from "ol/source/Vector";
import { Circle as CircleStyle, Fill, Stroke, Style } from "ol/style";
import { t } from "@/i18n";
import type { SetStatusFn } from "@/types";
import { icon } from "@/ui/icons";

class LocateControl extends Control {
  #button: HTMLButtonElement;
  #onLocate: () => void;

  constructor({ onLocate, label }: { onLocate: () => void; label: string }) {
    const button = document.createElement("button");
    button.type = "button";
    button.title = label;
    button.setAttribute("aria-label", label);
    button.append(icon(LocateFixed));

    const element = document.createElement("div");
    element.className = "ol-control ol-custom-control ol-unselectable";
    element.appendChild(button);

    super({ element });

    this.#button = button;
    this.#onLocate = onLocate;

    this.#button.addEventListener("click", (event) => {
      event.preventDefault();
      this.#onLocate();
    });
  }

  updateLabel(label: string): void {
    this.#button.title = label;
    this.#button.setAttribute("aria-label", label);
  }
}

export const createLocateControl = (onLocate: () => void, label: string): LocateControl =>
  new LocateControl({ onLocate, label });

export const setupGeolocation = (map: OlMap, setStatus: SetStatusFn) => {
  const geolocSource = new VectorSource();
  const accuracyFeature = new Feature();
  const positionFeature = new Feature();

  geolocSource.addFeatures([accuracyFeature, positionFeature]);

  const geolocLayer = new VectorLayer({
    source: geolocSource,
    zIndex: 8,
    style: (feature) => {
      const geometry = feature.getGeometry();
      if (geometry instanceof Point) {
        return new Style({
          image: new CircleStyle({
            radius: 8,
            fill: new Fill({ color: "rgba(33, 150, 83, 0.9)" }),
            stroke: new Stroke({ color: "#ffffff", width: 2 }),
          }),
        });
      }
      return new Style({
        stroke: new Stroke({ color: "rgba(33, 150, 83, 0.6)", width: 2 }),
        fill: new Fill({ color: "rgba(33, 150, 83, 0.15)" }),
      });
    },
  });

  map.addLayer(geolocLayer);

  const geolocation = new Geolocation({
    projection: map.getView().getProjection(),
    trackingOptions: { enableHighAccuracy: true },
  });

  geolocation.on("error", (error) => {
    setStatus(t("status.geolocUnavailable", { error: error.message }), true);
    accuracyFeature.setGeometry(undefined);
    positionFeature.setGeometry(undefined);
  });

  const locate = (): void => {
    geolocation.setTracking(true);
    geolocation.once("change:position", () => {
      const position = geolocation.getPosition();
      geolocation.setTracking(false);
      if (!position) {
        setStatus(t("status.positionError"), true);
        accuracyFeature.setGeometry(undefined);
        positionFeature.setGeometry(undefined);
        return;
      }
      accuracyFeature.setGeometry(geolocation.getAccuracyGeometry() ?? undefined);
      positionFeature.setGeometry(new Point(position));
      map.getView().animate({ center: position, zoom: 14, duration: 350 });
      setStatus(t("status.centered"));
    });
  };

  return { locate };
};
