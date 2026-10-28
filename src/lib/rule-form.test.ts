import { describe, expect, it } from "vitest";
import { parseRuleForm } from "./rule-form";

function form(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

const valid = {
  name: "Huile",
  intervalDistance: "2000",
  baselineOdometer: "10000",
  baselineDate: "2026-01-01",
};

describe("parseRuleForm", () => {
  it("accepts a distance-only rule and nulls the empty fields", () => {
    expect(
      parseRuleForm(form({ ...valid, intervalDays: "", warnDistance: "", notes: "" })),
    ).toEqual({
      data: {
        name: "Huile",
        intervalDistance: 2000,
        intervalDays: null,
        warnDistance: null,
        warnDays: null,
        baselineOdometer: 10_000,
        baselineDate: "2026-01-01",
        notes: null,
      },
    });
  });

  it("accepts a days-only rule with a warning", () => {
    const r = parseRuleForm(
      form({ ...valid, intervalDistance: "", intervalDays: "180", warnDays: "14" }),
    );
    expect(r).toMatchObject({ data: { intervalDistance: null, intervalDays: 180, warnDays: 14 } });
  });

  it("requires a name", () => {
    expect(parseRuleForm(form({ ...valid, name: " " }))).toMatchObject({
      state: { errors: { name: "Le nom est requis" } },
    });
  });

  it("requires at least one interval", () => {
    expect(parseRuleForm(form({ ...valid, intervalDistance: "" }))).toMatchObject({
      state: { errors: { intervalDistance: expect.stringContaining("intervalle") } },
    });
  });

  it("rejects non-positive or non-integer intervals", () => {
    expect(parseRuleForm(form({ ...valid, intervalDistance: "0" }))).toHaveProperty("state");
    expect(parseRuleForm(form({ ...valid, intervalDistance: "1.5" }))).toHaveProperty("state");
    expect(parseRuleForm(form({ ...valid, intervalDistance: "abc" }))).toHaveProperty("state");
  });

  it("requires the warning to be smaller than its interval", () => {
    expect(parseRuleForm(form({ ...valid, warnDistance: "2000" }))).toMatchObject({
      state: { errors: { warnDistance: expect.stringContaining("plus petit") } },
    });
    expect(parseRuleForm(form({ ...valid, warnDays: "10" }))).toMatchObject({
      state: { errors: { warnDays: expect.stringContaining("intervalle en jours") } },
    });
  });

  it("rejects a bad or future baseline date", () => {
    expect(parseRuleForm(form({ ...valid, baselineDate: "nope" }))).toHaveProperty("state");
    expect(parseRuleForm(form({ ...valid, baselineDate: "2999-01-01" }))).toHaveProperty("state");
  });

  it("keeps submitted values on error", () => {
    const r = parseRuleForm(form({ ...valid, name: "" }));
    expect(r).toMatchObject({ state: { values: { intervalDistance: "2000" } } });
  });
});
