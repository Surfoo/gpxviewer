import { Layers } from "lucide";
import Control from "ol/control/Control";
import type { BaseLayer } from "@/types";
import { icon } from "@/ui/icons";

// Layers button; opens a thumbnail picker to the left of it.
export const createBaseLayerControl = (layers: BaseLayer[], label: string): Control => {
  const element = document.createElement("div");
  element.className = "ol-control ol-basemap-control ol-unselectable";

  const button = document.createElement("button");
  button.type = "button";
  button.title = label;
  button.setAttribute("aria-label", label);
  button.setAttribute("aria-expanded", "false");
  button.append(icon(Layers));

  const picker = document.createElement("div");
  picker.className = "basemap-picker";
  picker.hidden = true;

  const base = import.meta.env.BASE_URL ?? "/";
  const items = layers.map(({ id, title, layer, thumb }) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "basemap-item";
    item.dataset.id = id;
    item.innerHTML = `<img src="${base}icons/basemaps/${thumb}" alt="" /><span>${title}</span>`;
    item.addEventListener("click", () => {
      for (const entry of layers) entry.layer.setVisible(entry.id === id);
      mark(id);
      setOpen(false);
    });
    picker.appendChild(item);
    return { id, item, layer };
  });

  const mark = (activeId: string): void => {
    for (const { id, item } of items) item.classList.toggle("is-active", id === activeId);
  };
  mark(items.find(({ layer }) => layer.getVisible())?.id ?? "");

  const setOpen = (open: boolean): void => {
    picker.hidden = !open;
    button.setAttribute("aria-expanded", String(open));
  };

  button.addEventListener("click", () => setOpen(picker.hidden));
  document.addEventListener("click", (event) => {
    if (!element.contains(event.target as Node)) setOpen(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setOpen(false);
  });

  element.append(button, picker);
  return new Control({ element });
};
