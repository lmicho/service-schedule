import { describe, expect, it } from "vitest";
import { parseRetireForm } from "./retire-form";

const form = (fields: Record<string, string>) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
};

describe("parseRetireForm", () => {
  it("accepts a reason and a past or current date", () => {
    expect(parseRetireForm(form({ reason: "sold", retiredAt: "2026-01-15" }))).toEqual({
      data: { reason: "sold", retiredAt: "2026-01-15" },
    });
  });

  it("rejects an unknown or missing reason", () => {
    expect(parseRetireForm(form({ reason: "exploded", retiredAt: "2026-01-15" }))).toMatchObject({
      state: { errors: { reason: "Choisis une raison" } },
    });
    expect(parseRetireForm(form({ retiredAt: "2026-01-15" }))).toHaveProperty("state");
  });

  it("rejects a bad or future date", () => {
    expect(parseRetireForm(form({ reason: "sold", retiredAt: "nope" }))).toHaveProperty("state");
    expect(parseRetireForm(form({ reason: "sold", retiredAt: "2999-01-01" }))).toMatchObject({
      state: { errors: { retiredAt: expect.stringContaining("futur") } },
    });
  });
});
