import { describe, expect, it } from "vitest";
import { parseVehicleTab, vehicleTabHref } from "./vehicle-tabs";

const ctx = { hasRulesTab: true, hasFilters: false };

describe("parseVehicleTab", () => {
  it("honors an explicit valid tab", () => {
    expect(parseVehicleTab({ tab: "history" }, ctx)).toBe("history");
    expect(parseVehicleTab({ tab: "rules" }, { ...ctx, hasFilters: true })).toBe("rules");
    expect(parseVehicleTab({ tab: ["history", "rules"] }, ctx)).toBe("history");
  });

  it("defaults to the rules", () => {
    expect(parseVehicleTab({}, ctx)).toBe("rules");
    expect(parseVehicleTab({ tab: "bogus" }, ctx)).toBe("rules");
  });

  it("shows the history when filters are in the URL without a tab", () => {
    expect(parseVehicleTab({ q: "huile" }, { ...ctx, hasFilters: true })).toBe("history");
  });

  it("always shows the history when there is no rules tab (retired vehicle)", () => {
    expect(parseVehicleTab({ tab: "rules" }, { ...ctx, hasRulesTab: false })).toBe("history");
    expect(parseVehicleTab({}, { ...ctx, hasRulesTab: false })).toBe("history");
  });
});

describe("vehicleTabHref", () => {
  it("builds the URL", () => {
    expect(vehicleTabHref(3, "history")).toBe("/vehicles/3?tab=history");
  });
});
