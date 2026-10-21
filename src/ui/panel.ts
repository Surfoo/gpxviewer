import { PanelLeftClose, PanelLeftOpen } from "lucide";
import { t } from "@/i18n";
import { icon } from "./icons";

type PanelOptions = {
  layout: HTMLElement | null;
  toggle: HTMLButtonElement | null;
  initialCollapsed?: boolean;
  onChange?: (collapsed: boolean) => void;
};

export const initPanelToggle = ({
  layout,
  toggle,
  initialCollapsed = false,
  onChange,
}: PanelOptions) => {
  const setPanelState = (collapsed: boolean): void => {
    if (!layout || !toggle) return;
    layout.dataset.panel = collapsed ? "collapsed" : "expanded";
    document.body.dataset.panel = collapsed ? "collapsed" : "expanded";

    const node = collapsed ? PanelLeftOpen : PanelLeftClose;
    const key = collapsed ? "panel.show" : "panel.hide";

    // a collapsed panel is only moved off-screen: inert keeps it out of the tab order
    layout.querySelector<HTMLElement>("#import-panel")?.toggleAttribute("inert", collapsed);

    toggle.replaceChildren(icon(node));
    toggle.setAttribute("aria-expanded", String(!collapsed));
    toggle.dataset.i18nAriaLabel = key; // so a language change keeps the right label
    toggle.setAttribute("aria-label", t(key));
    toggle.title = t(key);

    onChange?.(collapsed);
  };

  const handleToggle = (): void => {
    const collapsed = layout?.dataset.panel === "collapsed";
    setPanelState(!collapsed);
  };

  toggle?.addEventListener("click", handleToggle);

  // restore the saved state without playing the slide animation
  layout?.classList.add("no-anim");
  setPanelState(initialCollapsed);
  requestAnimationFrame(() => requestAnimationFrame(() => layout?.classList.remove("no-anim")));

  return { setPanelState };
};
