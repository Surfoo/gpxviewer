import { describe, expect, it } from "vitest";
import { formatCoords } from "./overlays";

describe("formatCoords", () => {
  it("formats degrees and decimal minutes with zero padding", () => {
    expect(formatCoords(48.363183, 2.9849)).toBe("N 48° 21.791 E 002° 59.094");
  });

  it("uses S and W for negative values", () => {
    expect(formatCoords(-33.5, -70.25)).toBe("S 33° 30.000 W 070° 15.000");
  });

  it("pads minutes below ten", () => {
    expect(formatCoords(10.05, 5.1)).toBe("N 10° 03.000 E 005° 06.000");
  });
});
