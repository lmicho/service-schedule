import { describe, expect, it } from "vitest";
import { cycleKey } from "./alerts";

const due = { status: "soon" as const, nextDueOdometer: 12_000, nextDueDate: "2026-12-01" };

describe("cycleKey", () => {
  it("is stable for the same status and deadline", () => {
    expect(cycleKey(due)).toBe(cycleKey({ ...due }));
  });

  it("changes with the status", () => {
    expect(cycleKey(due)).not.toBe(cycleKey({ ...due, status: "overdue" }));
  });

  it("changes with the deadline", () => {
    expect(cycleKey(due)).not.toBe(cycleKey({ ...due, nextDueOdometer: 14_000 }));
    expect(cycleKey(due)).not.toBe(cycleKey({ ...due, nextDueDate: "2027-01-01" }));
  });

  it("handles rules with a single interval", () => {
    expect(cycleKey({ status: "overdue", nextDueOdometer: null, nextDueDate: "2026-01-01" })).toBe(
      "overdue||2026-01-01",
    );
  });
});
