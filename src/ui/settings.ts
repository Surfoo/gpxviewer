const STORAGE_KEY = "gpxviewer.settings";

export type Settings = {
  baseLayer?: string;
  displayLabels?: boolean;
  displayPerimeters?: boolean;
  panelCollapsed?: boolean;
};

// localStorage can be unavailable or hold garbage: fall back to defaults
export const loadSettings = (): Settings => {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

export const saveSetting = <K extends keyof Settings>(key: K, value: Settings[K]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...loadSettings(), [key]: value }));
  } catch {
    // storage full or blocked: the setting just won't persist
  }
};
