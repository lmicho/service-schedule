import { describe, expect, it } from "vitest";
import { parseOdometerUpdate } from "./odometer-form";

const current = { odometer: 132_000, unit: "km" };

describe("parseOdometerUpdate", () => {
  it("accepts a higher or equal reading, with spaces", () => {
    expect(parseOdometerUpdate("132 500", current)).toEqual({ odometer: 132_500 });
    expect(parseOdometerUpdate(" 132000 ", current)).toEqual({ odometer: 132_000 });
    expect(parseOdometerUpdate("132 500", current)).toEqual({ odometer: 132_500 });
  });

  it("requires a value", () => {
    expect(parseOdometerUpdate("", current)).toEqual({ error: "L'odomètre est requis" });
    expect(parseOdometerUpdate(null, current)).toEqual({ error: "L'odomètre est requis" });
  });

  it("rejects anything but a non-negative integer", () => {
    for (const bad of ["abc", "-5", "12.5", "1e5"]) {
      expect(parseOdometerUpdate(bad, current)).toEqual({ error: "Entier positif requis" });
    }
  });

  it("rejects a lower reading and points to the edit page", () => {
    const r = parseOdometerUpdate("131000", current);
    expect(r).toHaveProperty("error");
    expect((r as { error: string }).error).toMatch(/Doit être au moins 132.000 km/);
    expect((r as { error: string }).error).toContain("Modifier");
  });
});
