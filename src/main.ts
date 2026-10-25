import "ol/ol.css";
import "./style.css";

import type { Coordinate } from "ol/coordinate";
import { createEmpty, extend, isEmpty } from "ol/extent";
import type Feature from "ol/Feature";
import type Point from "ol/geom/Point";
import Overlay from "ol/Overlay";
import type { Pixel } from "ol/pixel";
import { gpxToFeatures, gpxToTracks } from "@/gpx/parser";
import { baseLayers, createMap, trackSource, vectorLayer, vectorSource } from "@/map";
import { createBaseLayerControl } from "@/map/baseLayerControl";
import { createLocateControl, setupGeolocation } from "@/map/geolocation";
import { createInfoOverlay } from "@/map/overlays";
import type { CacheFeature } from "@/types";
import { initAbout } from "@/ui/about";
import { initI18nDom } from "@/ui/i18nDom";
import { initPanelToggle } from "@/ui/panel";
import { initSearchBox } from "@/ui/searchBox";
import { loadSettings, saveSetting } from "@/ui/settings";
import { initState } from "@/ui/state";
import { applyDocumentLanguage, t } from "./i18n";
import {
  createLabelLayer,
  createPerimeterLayer,
  updateLabels,
  updatePerimeters,
} from "./map/overlaysLayers";
import {
  isFeatureVisible,
  type RangeKey,
  setAllowedTypes,
  setHideFound,
  setRange,
  typesSharingIcon,
  typeToIconFile,
} from "./map/styles";

const statusBar = document.querySelector<HTMLDivElement>("#status");
const statsCount = document.querySelector<HTMLSpanElement>("#cache-count");
const layout = document.querySelector<HTMLElement>(".layout");
const urlInput = document.querySelector<HTMLInputElement>("#gpx-url");
const loadUrlButton = document.querySelector<HTMLButtonElement>("#load-url");
const fileInput = document.querySelector<HTMLInputElement>("#gpx-file");
const clearButton = document.querySelector<HTMLButtonElement>("#clear-map");
const focusButton = document.querySelector<HTMLButtonElement>("#fit-data");
const displayLabelsCheckbox = document.querySelector<HTMLInputElement>("#display-labels");
const displayPerimetersCheckbox = document.querySelector<HTMLInputElement>("#display-perimeters");
const typeFilterContainer = document.querySelector<HTMLDivElement>("#type-filter");
const togglePanelButton = document.querySelector<HTMLButtonElement>("#toggle-panel");
const languageSelect = document.querySelector<HTMLSelectElement>("#language");

const { setStatus, updateStats } = initState(statusBar, statsCount, vectorSource);

const settings = loadSettings();
if (baseLayers.some(({ id }) => id === settings.baseLayer)) {
  for (const { id, layer } of baseLayers) layer.setVisible(id === settings.baseLayer);
}

const infoOverlay = createInfoOverlay();
const map = createMap("map", infoOverlay.overlay);
const geolocation = setupGeolocation(map, (message, isError) => setStatus(message, isError));
const locateControl = createLocateControl(() => {
  infoOverlay.hide();
  geolocation.locate();
}, t("btn.locate"));
map.addControl(locateControl);
map.addControl(
  createBaseLayerControl(baseLayers, t("label.baseLayer"), (id) => saveSetting("baseLayer", id)),
);
const labelLayer = createLabelLayer();
const perimeterLayer = createPerimeterLayer();
map.addLayer(perimeterLayer);
map.addLayer(labelLayer);
const tooltipElement = document.createElement("div");
tooltipElement.className = "ol-tooltip hidden";
const tooltipOverlay = new Overlay({
  element: tooltipElement,
  offset: [0, -12],
  positioning: "bottom-center",
});
map.addOverlay(tooltipOverlay);

const refreshOverlayLayers = (): void => {
  const features = vectorSource.getFeatures() as CacheFeature[];
  const filtered = features.filter(isFeatureVisible);
  if (displayLabelsCheckbox?.checked) {
    updateLabels(labelLayer, filtered);
  } else {
    labelLayer.getSource()?.clear();
  }

  if (displayPerimetersCheckbox?.checked) {
    updatePerimeters(perimeterLayer, filtered);
  } else {
    perimeterLayer.getSource()?.clear();
  }
};

const setButtonLabel = (button: Element | null | undefined, label: string): void => {
  button?.setAttribute("title", label);
  button?.setAttribute("aria-label", label);
};

const updateControlLabels = (): void => {
  locateControl.updateLabel(t("btn.locate"));
  const root = map.getTargetElement();
  if (!root) return;
  setButtonLabel(root.querySelector(".ol-full-screen button"), t("btn.fullscreen"));
  const [zoomIn, zoomOut] = Array.from(root.querySelectorAll(".ol-zoom button"));
  setButtonLabel(zoomIn, t("btn.zoomIn"));
  setButtonLabel(zoomOut, t("btn.zoomOut"));
};

updateControlLabels();

const syncMapSize = (): void => {
  setTimeout(() => map.updateSize(), 100);
};

initI18nDom({
  languageSelect,
  onLocaleChange: () => {
    setStatus(t("status.ready"));
    updateControlLabels();
    applyDocumentLanguage();
  },
});

const isMobile = window.matchMedia("(max-width: 640px)");

const { setPanelState } = initPanelToggle({
  layout,
  toggle: togglePanelButton,
  initialCollapsed: settings.panelCollapsed ?? isMobile.matches,
  onChange: (collapsed) => {
    saveSetting("panelCollapsed", collapsed);
    syncMapSize();
  },
});

// on a phone the open panel covers the whole map: close it before recentring
const revealMap = (): void => {
  if (isMobile.matches) setPanelState(true);
};

// width of the map hidden under the open sidebar
const coveredLeft = (): number =>
  layout?.dataset.panel === "expanded"
    ? (document.querySelector<HTMLElement>("#import-panel")?.offsetWidth ?? 0)
    : 0;

const fitToData = (): boolean => {
  const extent = createEmpty();
  for (const source of [vectorSource, trackSource]) {
    const sourceExtent = source.getExtent();
    if (sourceExtent && source.getFeatures().length > 0) extend(extent, sourceExtent);
  }
  if (isEmpty(extent)) return false;
  // top: search field; left: sidebar when open
  map
    .getView()
    .fit(extent, { padding: [56, 32, 32, 32 + coveredLeft()], duration: 300, maxZoom: 15 });
  return true;
};

const addFeaturesToMap = (features: Feature<Point>[], sourceLabel: string): void => {
  features.forEach((feature) => {
    vectorSource.addFeature(feature);
  });
  updateStats();
  revealMap();
  fitToData();
  setStatus(t("status.loaded", { source: sourceLabel, count: features.length }));
  refreshOverlayLayers();
};

const loadGpxText = (gpxText: string, sourceLabel: string): void => {
  const features = gpxToFeatures(gpxText, sourceLabel);
  const tracks = gpxToTracks(gpxText);
  if (!features.length && !tracks.length) {
    setStatus(t("status.empty"), true);
    return;
  }
  trackSource.addFeatures(tracks);
  addFeaturesToMap(features, sourceLabel);
};

fileInput?.addEventListener("change", async (event) => {
  const files = (event.target as HTMLInputElement).files;
  if (!files || files.length === 0) return;
  infoOverlay.hide();
  for (const file of files) {
    const text = await file.text();
    try {
      loadGpxText(text, file.name);
    } catch (error) {
      setStatus(
        t("status.parseError", { source: file.name, error: (error as Error).message }),
        true,
      );
    }
  }
});

loadUrlButton?.addEventListener("click", async () => {
  const url = urlInput?.value.trim();
  if (!url) {
    setStatus(t("status.urlRequired"), true);
    return;
  }
  infoOverlay.hide();
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Réponse HTTP ${response.status}`);
    }
    const text = await response.text();
    loadGpxText(text, url);
  } catch (error) {
    setStatus(t("status.urlError", { error: (error as Error).message }), true);
  }
});

clearButton?.addEventListener("click", () => {
  vectorSource.clear();
  trackSource.clear();
  infoOverlay.hide();
  updateStats();
  setStatus(t("status.cleared"));
  refreshOverlayLayers();
});

focusButton?.addEventListener("click", () => {
  infoOverlay.hide();
  revealMap();
  if (!fitToData()) setStatus(t("status.noExtent"), true);
});

const hideFoundCheckbox = document.querySelector<HTMLInputElement>("#hide-found");
hideFoundCheckbox?.addEventListener("change", () => {
  setHideFound(hideFoundCheckbox.checked);
  refreshOverlayLayers();
  vectorLayer.changed();
});

// Enter in the search box: exact code first, then partial code, then name
const goToCache = (feature: CacheFeature): void => {
  const coordinate = feature.getGeometry()?.getCoordinates();
  if (!coordinate) return;
  revealMap();
  const view = map.getView();
  const zoom = Math.max(view.getZoom() ?? 0, 16);
  // centre in the part of the map the sidebar leaves visible
  const shift = (coveredLeft() / 2) * view.getResolutionForZoom(zoom);
  view.animate({ center: [coordinate[0] - shift, coordinate[1]], zoom, duration: 300 });
  infoOverlay.render(feature, coordinate);
};

const searchInput = document.querySelector<HTMLInputElement>("#search");
const searchResults = document.querySelector<HTMLUListElement>("#search-results");
if (searchInput && searchResults) {
  initSearchBox({
    input: searchInput,
    list: searchResults,
    // only the caches the filters leave visible
    getFeatures: () => (vectorSource.getFeatures() as CacheFeature[]).filter(isFeatureVisible),
    onSelect: goToCache,
    onNotFound: (query) => setStatus(t("status.notFound", { query }), true),
  });
}

if (displayLabelsCheckbox) displayLabelsCheckbox.checked = settings.displayLabels ?? false;
if (displayPerimetersCheckbox)
  displayPerimetersCheckbox.checked = settings.displayPerimeters ?? false;
displayLabelsCheckbox?.addEventListener("change", () => {
  saveSetting("displayLabels", displayLabelsCheckbox.checked);
  refreshOverlayLayers();
});
displayPerimetersCheckbox?.addEventListener("change", () => {
  saveSetting("displayPerimeters", displayPerimetersCheckbox.checked);
  refreshOverlayLayers();
});

// topmost cache under the pixel; only the cache layer counts (not tracks, labels, perimeters, position)
const cacheAt = (pixel: Pixel): CacheFeature | null => {
  let found: CacheFeature | null = null;
  map.forEachFeatureAtPixel(
    pixel,
    (feature) => {
      found = feature as CacheFeature;
      return true;
    },
    { hitTolerance: 5, layerFilter: (layer) => layer === vectorLayer },
  );
  return found;
};

map.on("singleclick", (event) => {
  const foundFeature = cacheAt(event.pixel);
  if (foundFeature) {
    infoOverlay.render(foundFeature, event.coordinate as Coordinate);
  } else {
    infoOverlay.hide();
  }
});

map.on("pointermove", (event) => {
  const mapTarget = map.getTargetElement();
  const hovered = cacheAt(event.pixel);
  if (hovered) {
    const name = hovered.get<string>("name") ?? "";
    tooltipElement.textContent = name;
    tooltipElement.classList.remove("hidden");
    tooltipOverlay.setPosition(event.coordinate);
    if (mapTarget) mapTarget.style.cursor = "pointer";
  } else {
    tooltipOverlay.setPosition(undefined);
    tooltipElement.classList.add("hidden");
    if (mapTarget) mapTarget.style.cursor = "";
  }
});

const renderTypeFilter = (): void => {
  if (!typeFilterContainer) return;
  // same groups and colours as the c:geo compact map icons
  const groups = [
    { id: "green", color: "#388e3c", types: ["traditional cache"] },
    { id: "orange", color: "#f57c00", types: ["multi-cache"] },
    {
      id: "blue",
      color: "#303f9f",
      types: ["unknown cache", "wherigo cache", "letterbox hybrid"],
    },
    {
      id: "teal",
      color: "#0288d1",
      types: ["earthcache", "virtual cache", "webcam cache"],
    },
    {
      id: "red",
      color: "#d32f2f",
      types: [
        "event cache",
        "cache in trash out event",
        "mega-event cache",
        "giga-event cache",
        "special event cache",
      ],
    },
    {
      id: "olive",
      color: "#afb42b",
      types: ["project ape cache", "groundspeak hq", "gps adventures exhibit"],
    },
    { id: "purple", color: "#7b1fa2", types: ["lab cache"] },
  ];
  const base = import.meta.env.BASE_URL ?? "/";
  typeFilterContainer.innerHTML = "";
  groups.forEach((group) => {
    const groupEl = document.createElement("div");
    groupEl.className = "type-group";
    groupEl.dataset.group = group.id;
    groupEl.dataset.enabled = "true";

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "group-toggle";
    toggle.dataset.group = group.id;
    toggle.dataset.i18nAriaLabel = "label.toggleGroup";
    toggle.style.setProperty("--group-color", group.color);
    toggle.setAttribute("aria-label", t("label.toggleGroup"));
    toggle.title = t("label.toggleGroup");
    groupEl.appendChild(toggle);

    const iconsWrap = document.createElement("div");
    iconsWrap.className = "type-icons";
    group.types.forEach((type) => {
      const config = typeToIconFile[type];
      if (!config) return;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "type-icon";
      button.dataset.type = type;
      button.title = config.label;
      button.setAttribute("aria-label", config.label);
      const img = document.createElement("img");
      img.alt = "";
      img.src = `${base}icons/mapicons/geocaches/${config.file}`;
      button.appendChild(img);
      iconsWrap.appendChild(button);
    });
    groupEl.appendChild(iconsWrap);

    typeFilterContainer.appendChild(groupEl);
  });
};

const updateAllowedTypesFromUI = (): void => {
  if (!typeFilterContainer) return;
  const selected: string[] = [];
  typeFilterContainer.querySelectorAll<HTMLElement>(".type-group").forEach((group) => {
    const enabled = group.dataset.enabled !== "false";
    if (!enabled) return;
    group.querySelectorAll<HTMLElement>(".type-icon").forEach((icon) => {
      const type = icon.dataset.type ?? "";
      const iconEnabled = icon.dataset.enabled !== "false";
      if (type && iconEnabled) selected.push(...typesSharingIcon(type.trim().toLowerCase()));
    });
  });
  typeFilterContainer.querySelectorAll<HTMLElement>(".type-icon, .group-toggle").forEach((el) => {
    const owner = el.closest<HTMLElement>(".type-group");
    const on = el.classList.contains("group-toggle")
      ? owner?.dataset.enabled !== "false"
      : el.dataset.enabled !== "false";
    el.setAttribute("aria-pressed", String(on));
  });
  setAllowedTypes(new Set(selected));
  refreshOverlayLayers();
  vectorLayer.changed();
};

typeFilterContainer?.addEventListener("click", (event) => {
  const target = event.target as HTMLElement;
  const toggle = target.closest<HTMLElement>(".group-toggle");
  if (toggle) {
    const groupElement = toggle.closest<HTMLDivElement>(".type-group");
    if (groupElement) {
      const isEnabled = groupElement.dataset.enabled !== "false";
      groupElement.dataset.enabled = isEnabled ? "false" : "true";
      groupElement.querySelectorAll<HTMLElement>(".type-icon").forEach((icon) => {
        icon.dataset.enabled = groupElement.dataset.enabled;
      });
      updateAllowedTypesFromUI();
    }
  }

  const icon = target.closest<HTMLElement>(".type-icon");
  if (icon) {
    const isEnabled = icon.dataset.enabled !== "false";
    icon.dataset.enabled = isEnabled ? "false" : "true";
    // ensure group stays enabled if at least one icon is enabled
    const group = icon.closest<HTMLDivElement>(".type-group");
    if (group) {
      const anyEnabled = Array.from(group.querySelectorAll<HTMLElement>(".type-icon")).some(
        (img) => img.dataset.enabled !== "false",
      );
      group.dataset.enabled = anyEnabled ? "true" : "false";
    }
    updateAllowedTypesFromUI();
  }
});

updateStats();
setStatus(t("status.ready"));
syncMapSize();
setTimeout(syncMapSize, 100);

renderTypeFilter();
updateAllowedTypesFromUI();
initAbout();

// difficulty/terrain: one min/max select pair per .range-filter
document.querySelectorAll<HTMLElement>(".range-filter").forEach((row) => {
  const key = row.dataset.key as RangeKey;
  const [minSelect, maxSelect] = Array.from(row.querySelectorAll<HTMLSelectElement>("select"));
  const options = Array.from({ length: 9 }, (_, i) => 1 + i * 0.5)
    .map((v) => `<option value="${v}">${v}</option>`)
    .join("");
  minSelect.innerHTML = options;
  maxSelect.innerHTML = options;
  maxSelect.value = "5";
  const apply = (changed: HTMLSelectElement): void => {
    // keep min <= max by dragging the other bound along
    if (Number(minSelect.value) > Number(maxSelect.value)) {
      (changed === minSelect ? maxSelect : minSelect).value = changed.value;
    }
    setRange(key, Number(minSelect.value), Number(maxSelect.value));
    refreshOverlayLayers();
    vectorLayer.changed();
  };
  minSelect.addEventListener("change", () => apply(minSelect));
  maxSelect.addEventListener("change", () => apply(maxSelect));
});
