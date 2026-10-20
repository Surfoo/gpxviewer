import { describe, expect, it } from "vitest";
import { gpxToFeatures, gpxToTracks } from "./parser";

const wpt = (lat: number, lon: number, code: string, type: string, extra = "") => `
  <wpt lat="${lat}" lon="${lon}">
    <time>2012-01-25T08:00:00Z</time>
    <name>${code}</name>
    <sym>Geocache${extra}</sym>
    <groundspeak:cache xmlns:groundspeak="http://www.groundspeak.com/cache/1/0/1">
      <groundspeak:name>Cache ${code}</groundspeak:name>
      <groundspeak:type>${type}</groundspeak:type>
      <groundspeak:container>Micro</groundspeak:container>
      <groundspeak:difficulty>1.5</groundspeak:difficulty>
      <groundspeak:terrain>2</groundspeak:terrain>
      <groundspeak:owner id="4500214">someone</groundspeak:owner>
    </groundspeak:cache>
  </wpt>`;

const gpx = (body: string) => `<?xml version="1.0"?><gpx version="1.0">${body}</gpx>`;

describe("gpxToFeatures", () => {
  it("reads cache details from a groundspeak waypoint", () => {
    const [feature] = gpxToFeatures(gpx(wpt(48.36, 2.98, "GC1", "Traditional Cache")), "t.gpx");
    expect(feature.getId()).toBe("GC1");
    expect(feature.get("name")).toBe("Cache GC1");
    expect(feature.get("type")).toBe("Traditional Cache");
    expect(feature.get("container")).toBe("Micro");
    expect(feature.get("difficulty")).toBe("1.5");
    expect(feature.get("terrain")).toBe("2");
    expect(feature.get("ownerId")).toBe(4500214);
    expect(feature.get("found")).toBe(false);
  });

  it("flags caches whose symbol says found", () => {
    const [feature] = gpxToFeatures(gpx(wpt(48, 2, "GC2", "Multi-cache", " Found")), "t.gpx");
    expect(feature.get("found")).toBe(true);
  });

  it("skips unsupported types and waypoints without valid coordinates", () => {
    const features = gpxToFeatures(
      gpx(
        wpt(48, 2, "GC3", "Post Reviewer Note") +
          wpt(48, 2, "GC4", "Traditional Cache") +
          '<wpt lat="x" lon="y"><name>bad</name></wpt>',
      ),
      "t.gpx",
    );
    expect(features.map((f) => f.getId())).toEqual(["GC4"]);
  });

  it("projects coordinates to web mercator", () => {
    const [feature] = gpxToFeatures(gpx(wpt(0, 0, "GC5", "Traditional Cache")), "t.gpx");
    const [x, y] = feature.getGeometry()?.getCoordinates() ?? [];
    expect(x).toBeCloseTo(0);
    expect(y).toBeCloseTo(0);
  });

  it("throws on invalid XML", () => {
    expect(() => gpxToFeatures("<gpx><wpt>", "t.gpx")).toThrow();
  });
});

describe("gpxToTracks", () => {
  it("builds one line per track segment", () => {
    const tracks = gpxToTracks(
      gpx(`<trk>
        <trkseg><trkpt lat="48" lon="2"/><trkpt lat="49" lon="3"/></trkseg>
        <trkseg><trkpt lat="50" lon="4"/><trkpt lat="51" lon="5"/><trkpt lat="52" lon="6"/></trkseg>
      </trk>`),
    );
    expect(tracks.map((t) => t.getGeometry()?.getCoordinates().length)).toEqual([2, 3]);
  });

  it("reads routes", () => {
    const tracks = gpxToTracks(
      gpx('<rte><rtept lat="48" lon="2"/><rtept lat="49" lon="3"/></rte>'),
    );
    expect(tracks).toHaveLength(1);
  });

  it("ignores segments with fewer than two valid points", () => {
    const tracks = gpxToTracks(
      gpx('<trk><trkseg><trkpt lat="48" lon="2"/><trkpt lat="x" lon="y"/></trkseg></trk>'),
    );
    expect(tracks).toHaveLength(0);
  });
});
