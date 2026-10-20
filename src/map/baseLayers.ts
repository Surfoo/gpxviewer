import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import XYZ from "ol/source/XYZ";
import type { BaseLayer } from "@/types";

export const createBaseLayers = (): BaseLayer[] => [
  {
    id: "osm-standard",
    title: "OSM Standard",
    thumb: "osm-standard.jpg",
    layer: new TileLayer({
      source: new OSM(),
      visible: true,
    }),
  },
  {
    id: "osm-hot",
    title: "OSM Humanitarian",
    thumb: "osm-hot.jpg",
    layer: new TileLayer({
      source: new XYZ({
        url: "https://{a-c}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
        attributions: "© OpenStreetMap contributors, Humanitarian style",
      }),
      visible: false,
    }),
  },
  {
    id: "cyc-losm",
    title: "CyclOSM",
    thumb: "cyc-losm.jpg",
    layer: new TileLayer({
      source: new XYZ({
        url: "https://{a-c}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png",
        attributions:
          "© OpenStreetMap contributors, CyclOSM (data reuse under ODbL), style CC-BY-SA",
      }),
      visible: false,
    }),
  },
  {
    id: "opentopomap",
    title: "OpenTopoMap",
    thumb: "opentopomap.jpg",
    layer: new TileLayer({
      source: new XYZ({
        url: "https://{a-c}.tile.opentopomap.org/{z}/{x}/{y}.png",
        attributions: "© OpenStreetMap contributors, SRTM | style © OpenTopoMap (CC-BY-SA)",
        maxZoom: 17,
      }),
      visible: false,
    }),
  },
  {
    id: "esri-imagery",
    title: "Satellite",
    thumb: "esri-imagery.jpg",
    layer: new TileLayer({
      source: new XYZ({
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        attributions: "Tiles © Esri, Maxar, Earthstar Geographics",
        maxZoom: 19,
      }),
      visible: false,
    }),
  },
];
