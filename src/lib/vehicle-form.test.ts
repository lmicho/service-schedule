import { describe, expect, it } from "vitest";
import { parseVehicleForm } from "./vehicle-form";

function form(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

const valid = { name: "Civic", type: "car", odometer: "42000", odometerUnit: "km" };

describe("parseVehicleForm", () => {
  it("accepts a minimal vehicle and nulls the empty optional fields", () => {
    const r = parseVehicleForm(form({ ...valid, make: "", model: "", year: "", vin: "" }));
    expect(r).toEqual({
      data: {
        name: "Civic",
        type: "car",
        make: null,
        model: null,
        year: null,
        vin: null,
        odometer: 42000,
        odometerUnit: "km",
      },
    });
  });

  it("trims text and parses the year", () => {
    const r = parseVehicleForm(form({ ...valid, name: "  Civic ", make: " Honda ", year: "2018" }));
    expect(r).toMatchObject({ data: { name: "Civic", make: "Honda", year: 2018 } });
  });

  it("requires a name", () => {
    const r = parseVehicleForm(form({ ...valid, name: "  " }));
    expect(r).toMatchObject({ state: { errors: { name: "Le nom est requis" } } });
  });

  it("rejects a negative or non-integer odometer", () => {
    expect(parseVehicleForm(form({ ...valid, odometer: "-5" }))).toHaveProperty("state");
    expect(parseVehicleForm(form({ ...valid, odometer: "12.5" }))).toHaveProperty("state");
    expect(parseVehicleForm(form({ ...valid, odometer: "abc" }))).toHaveProperty("state");
  });

  it("rejects an unknown vehicle type", () => {
    expect(parseVehicleForm(form({ ...valid, type: "boat" }))).toMatchObject({
      state: { errors: { type: expect.any(String) } },
    });
  });

  it("rejects an out-of-range year", () => {
    expect(parseVehicleForm(form({ ...valid, year: "1800" }))).toHaveProperty("state");
  });

  it("keeps the submitted values so the form can be re-filled", () => {
    const r = parseVehicleForm(form({ ...valid, name: "" }));
    expect(r).toMatchObject({ state: { values: { type: "car", odometer: "42000" } } });
  });
});
