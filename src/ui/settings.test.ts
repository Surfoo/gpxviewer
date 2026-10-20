import { beforeEach, describe, expect, it } from "vitest";
import { loadSettings, saveSetting } from "./settings";

beforeEach(() => localStorage.clear());

describe("settings", () => {
  it("returns defaults when nothing is stored", () => {
    expect(loadSettings()).toEqual({});
  });

  it("persists settings and keeps the others", () => {
    saveSetting("baseLayer", "osm-hot");
    saveSetting("displayLabels", true);
    expect(loadSettings()).toEqual({ baseLayer: "osm-hot", displayLabels: true });
  });

  it("falls back to defaults on corrupted data", () => {
    localStorage.setItem("gpxviewer.settings", "{not json");
    expect(loadSettings()).toEqual({});
    localStorage.setItem("gpxviewer.settings", "null");
    expect(loadSettings()).toEqual({});
  });
});
