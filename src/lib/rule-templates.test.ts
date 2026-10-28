import { describe, expect, it } from "vitest";
import { RULE_TEMPLATES, findTemplate, templateDistance } from "./rule-templates";

describe("rule templates", () => {
  it("every template has at least one interval and ids are unique per type", () => {
    for (const list of Object.values(RULE_TEMPLATES)) {
      expect(new Set(list.map((t) => t.id)).size).toBe(list.length);
      for (const t of list) expect(t.intervalDistance || t.intervalDays).toBeTruthy();
    }
  });

  it("finds a template by id for a vehicle type", () => {
    expect(findTemplate("motorcycle", "chain")?.name).toBe("Graissage de la chaîne");
    expect(findTemplate("car", "chain")).toBeUndefined();
    expect(findTemplate("car", undefined)).toBeUndefined();
  });

  it("keeps km and converts to rounded miles", () => {
    expect(templateDistance(8000, "km")).toBe(8000);
    expect(templateDistance(8000, "mi")).toBe(5000);
    expect(templateDistance(600, "mi")).toBe(350);
    expect(templateDistance(undefined, "mi")).toBeUndefined();
  });
});
