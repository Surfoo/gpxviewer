import { PanelLeftClose, PanelLeftOpen } from "lucide";
import { icon } from "./icons";

type PanelOptions = {
  layout: HTMLElement | null;
  toggle: HTMLButtonElement | null;
  floatingToggle: HTMLButtonElement | null;
  initialCollapsed?: boolean;
  onChange?: (collapsed: boolean) => void;
};

export const initPanelToggle = ({
  layout,
  toggle,
  floatingToggle,
  initialCollapsed = false,
  onChange,
}: PanelOptions) => {
  const setPanelState = (collapsed: boolean): void => {
    if (!layout || !toggle) return;
    layout.dataset.panel = collapsed ? "collapsed" : "expanded";
    document.body.dataset.panel = collapsed ? "collapsed" : "expanded";

    const node = collapsed ? PanelLeftOpen : PanelLeftClose;
    const label = collapsed ? "Afficher le panneau d'import" : "Masquer le panneau d'import";

    toggle.replaceChildren(icon(node));
    toggle.setAttribute("aria-expanded", String(!collapsed));
    toggle.setAttribute("aria-label", label);

    if (floatingToggle) {
      floatingToggle.replaceChildren(icon(node));
      floatingToggle.setAttribute("aria-expanded", String(!collapsed));
      floatingToggle.setAttribute("aria-label", label);
    }

    onChange?.(collapsed);
  };

  const handleToggle = (): void => {
    const collapsed = layout?.dataset.panel === "collapsed";
    setPanelState(!collapsed);
  };

  toggle?.addEventListener("click", handleToggle);
  floatingToggle?.addEventListener("click", handleToggle);

  // restore the saved state without playing the slide animation
  layout?.classList.add("no-anim");
  setPanelState(initialCollapsed);
  requestAnimationFrame(() => requestAnimationFrame(() => layout?.classList.remove("no-anim")));

  return { setPanelState };
};
