import { createElement } from "lucide";

type IconNode = Parameters<typeof createElement>[0];

export const icon = (node: IconNode, size = 18): SVGElement =>
  createElement(node, { width: size, height: size, "aria-hidden": "true" });

// OpenLayers control labels only accept HTMLElement, not SVGElement
export const iconLabel = (node: IconNode, size = 18): HTMLElement => {
  const span = document.createElement("span");
  span.append(icon(node, size));
  return span;
};
