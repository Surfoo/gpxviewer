import { encode } from "geocaching-base-converter";
import type { Coordinate } from "ol/coordinate";
import Overlay from "ol/Overlay";
import { formatDate, t } from "@/i18n";
import type { CacheFeature } from "@/types";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const escapeAttribute = (value: string): string => escapeHtml(value).replaceAll('"', "&quot;");

// degrees + decimal minutes, the format GPS units expect: N 48° 21.791 E 002° 59.094
export const formatCoords = (lat: number, lon: number): string => {
  const part = (value: number, pos: string, neg: string, width: number): string => {
    const abs = Math.abs(value);
    const deg = Math.floor(abs);
    const min = ((abs - deg) * 60).toFixed(3).padStart(6, "0");
    return `${value < 0 ? neg : pos} ${String(deg).padStart(width, "0")}° ${min}`;
  };
  return `${part(lat, "N", "S", 2)} ${part(lon, "E", "W", 3)}`;
};

export const createInfoOverlay = (): {
  overlay: Overlay;
  hide: () => void;
  render: (feature: CacheFeature, coordinate: Coordinate) => void;
} => {
  const popup = document.querySelector<HTMLDivElement>("#popup");
  const popupCloser = document.querySelector<HTMLAnchorElement>("#popup-closer");
  const infoContent = document.querySelector<HTMLDivElement>("#info-content");
  const overlayElement = popup ?? document.createElement("div");

  const overlay = new Overlay({
    element: overlayElement,
    positioning: "bottom-center",
    offset: [0, -12],
    autoPan: { animation: { duration: 200 } },
  });

  const hide = (): void => {
    overlay.setPosition(undefined);
    popupCloser?.blur();
  };

  const render = (feature: CacheFeature, coordinate: Coordinate): void => {
    if (!popup || !infoContent) return;
    const code = feature.get<string>("code");
    const url = feature.get<string>("url");
    const name = feature.get<string>("name");
    const type = feature.get<string>("type");
    const owner = feature.get<string>("owner");
    const ownerId = feature.get<number | undefined>("ownerId");
    const difficulty = feature.get<string>("difficulty");
    const terrain = feature.get<string>("terrain");
    const container = feature.get<string>("container");
    const date = feature.get<string | undefined>("date");
    const lat = feature.get<number>("lat");
    const lon = feature.get<number>("lon");
    const coords = Number.isFinite(lat) && Number.isFinite(lon) ? formatCoords(lat, lon) : "";
    let ownerProfileUrl: string | null = null;

    if (typeof ownerId === "number" && Number.isSafeInteger(ownerId) && ownerId > 0) {
      try {
        const profileCode = encode(ownerId, "PR");
        ownerProfileUrl = `https://coord.info/${profileCode}`;
      } catch {
        ownerProfileUrl = null;
      }
    }

    infoContent.innerHTML = `
      <h3 class="popup-title">${escapeHtml(name ?? t("info.name"))}</h3>
      <dl class="meta">
        <div><dt>${t("info.type")}</dt><dd>${escapeHtml(type ?? "Geocache")}</dd></div>
        <div><dt>${t("info.size")}</dt><dd>${escapeHtml(container ?? "Unknown")}</dd></div>
        <div><dt>${t("info.geocode")}</dt><dd>${
          url && code
            ? `<a href="${escapeAttribute(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(code)}</a>`
            : escapeHtml(code ?? "—")
        }</dd></div>
        <div><dt>${t("info.owner")}</dt><dd>${
          ownerProfileUrl
            ? `<a href="${escapeAttribute(ownerProfileUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(owner ?? "—")}</a>`
            : escapeHtml(owner ?? "—")
        }</dd></div>
        <div><dt>${t("info.dt")}</dt><dd>${escapeHtml(difficulty ?? "?")} / ${escapeHtml(terrain ?? "?")}</dd></div>
        <div><dt>${t("info.date")}</dt><dd>${formatDate(date)}</dd></div>
        ${
          coords
            ? `<div class="meta-wide"><dt>${t("info.coords")}</dt><dd><button type="button" class="copy-coords">${coords}</button></dd></div>`
            : ""
        }
      </dl>
    `;
    const copyButton = infoContent.querySelector<HTMLButtonElement>(".copy-coords");
    copyButton?.addEventListener("click", async () => {
      await navigator.clipboard?.writeText(coords);
      copyButton.textContent = t("info.copied");
      setTimeout(() => {
        copyButton.textContent = coords;
      }, 1200);
    });
    popup.classList.remove("hidden");
    overlay.setPosition(coordinate);
  };

  popupCloser?.addEventListener("click", (event) => {
    event.preventDefault();
    hide();
  });

  return { overlay, hide, render };
};
