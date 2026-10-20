import { Maximize, Minimize, Minus, Plus } from "lucide";
import { defaults as defaultControls, FullScreen, Zoom } from "ol/control";
import VectorLayer from "ol/layer/Vector";
import OlMap from "ol/Map";
import type Overlay from "ol/Overlay";
import { fromLonLat } from "ol/proj";
import VectorSource from "ol/source/Vector";
import { Stroke, Style } from "ol/style";
import View from "ol/View";
import type { BaseLayer } from "@/types";
import { iconLabel } from "@/ui/icons";
import { createBaseLayers } from "./baseLayers";
import { getFeatureStyle } from "./styles";

export const baseLayers: BaseLayer[] = createBaseLayers();
export const vectorSource = new VectorSource();
export const vectorLayer = new VectorLayer({
  source: vectorSource,
  style: getFeatureStyle,
  zIndex: 10,
});

export const trackSource = new VectorSource();
export const trackLayer = new VectorLayer({
  source: trackSource,
  style: new Style({ stroke: new Stroke({ color: "rgba(12, 107, 207, 0.85)", width: 3 }) }),
  zIndex: 5,
});

export const createMap = (targetId: string, overlay?: Overlay): OlMap => {
  const map = new OlMap({
    target: targetId,
    layers: [...baseLayers.map((entry) => entry.layer), trackLayer, vectorLayer],
    controls: defaultControls({
      zoom: false,
      rotate: false,
      attribution: true,
    }).extend([
      new Zoom({
        zoomInLabel: iconLabel(Plus),
        zoomOutLabel: iconLabel(Minus),
        zoomInTipLabel: "Zoom in",
        zoomOutTipLabel: "Zoom out",
      }),
      new FullScreen({
        tipLabel: "Fullscreen",
        label: iconLabel(Maximize),
        labelActive: iconLabel(Minimize),
      }),
    ]),
    view: new View({
      center: fromLonLat([2.2137, 46.2276]),
      zoom: 6,
    }),
  });

  if (overlay) {
    map.addOverlay(overlay);
  }

  return map;
};
