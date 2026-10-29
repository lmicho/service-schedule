import { describe, expect, it } from "vitest";
import { parseLogForm } from "./log-form";

function form(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

const valid = { title: "Changement d'huile", performedAt: "2026-03-01", odometer: "42000" };

describe("parseLogForm", () => {
  it("accepts a minimal log and nulls the empty optional fields", () => {
    const r = parseLogForm(form({ ...valid, cost: "", shop: "", notes: "" }));
    expect(r).toEqual({
      data: {
        title: "Changement d'huile",
        performedAt: "2026-03-01",
        odometer: 42000,
        cost: null,
        scheduleItemId: null,
        shop: null,
        notes: null,
      },
    });
  });

  it("accepts a log without an odometer reading", () => {
    const noOdometer = { title: valid.title, performedAt: valid.performedAt };
    expect(parseLogForm(form(noOdometer))).toMatchObject({ data: { odometer: null } });
    expect(parseLogForm(form({ ...valid, odometer: "" }))).toMatchObject({
      data: { odometer: null },
    });
  });

  it("accepts a decimal comma in the cost", () => {
    expect(parseLogForm(form({ ...valid, cost: "45,50" }))).toMatchObject({
      data: { cost: 45.5 },
    });
  });

  it("parses the linked rule id", () => {
    expect(parseLogForm(form({ ...valid, scheduleItemId: "7" }))).toMatchObject({
      data: { scheduleItemId: 7 },
    });
    expect(parseLogForm(form({ ...valid, scheduleItemId: "" }))).toMatchObject({
      data: { scheduleItemId: null },
    });
    expect(parseLogForm(form({ ...valid, scheduleItemId: "abc" }))).toHaveProperty("state");
  });

  it("requires a title", () => {
    expect(parseLogForm(form({ ...valid, title: " " }))).toMatchObject({
      state: { errors: { title: "Le titre est requis" } },
    });
  });

  it("rejects bad or future dates", () => {
    expect(parseLogForm(form({ ...valid, performedAt: "01/03/2026" }))).toHaveProperty("state");
    expect(parseLogForm(form({ ...valid, performedAt: "2026-13-45" }))).toHaveProperty("state");
    expect(parseLogForm(form({ ...valid, performedAt: "2999-01-01" }))).toMatchObject({
      state: { errors: { performedAt: expect.stringContaining("futur") } },
    });
  });

  it("rejects an invalid odometer or cost", () => {
    expect(parseLogForm(form({ ...valid, odometer: "-1" }))).toHaveProperty("state");
    expect(parseLogForm(form({ ...valid, odometer: "1.5" }))).toHaveProperty("state");
    expect(parseLogForm(form({ ...valid, cost: "abc" }))).toMatchObject({
      state: { errors: { cost: "Montant invalide" } },
    });
    expect(parseLogForm(form({ ...valid, cost: "-3" }))).toHaveProperty("state");
  });
});
