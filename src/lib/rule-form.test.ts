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
      parseRuleForm(form({ ...valid, intervalMonths: "", warnDistance: "", notes: "" })),
    ).toEqual({
      data: {
        name: "Huile",
        intervalDistance: 2000,
        intervalMonths: null,
        warnDistance: null,
        warnMonths: null,
        baselineOdometer: 10_000,
        baselineDate: "2026-01-01",
        notes: null,
      },
    });
  });

  it("accepts a months-only rule with a warning", () => {
    const r = parseRuleForm(
      form({ ...valid, intervalDistance: "", intervalMonths: "6", warnMonths: "1" }),
    );
    expect(r).toMatchObject({ data: { intervalDistance: null, intervalMonths: 6, warnMonths: 1 } });
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
    expect(parseRuleForm(form({ ...valid, warnMonths: "10" }))).toMatchObject({
      state: { errors: { warnMonths: expect.stringContaining("intervalle en mois") } },
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
