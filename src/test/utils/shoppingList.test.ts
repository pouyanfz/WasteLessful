import { describe, it, expect } from "vitest";
import { shouldAutoAdd, linkedItemNote } from "./shoppingList";

const today = new Date("2026-04-08");

function daysFromToday(n: number) {
  const d = new Date(today);
  d.setDate(d.getDate() + n);
  return d;
}

describe("shouldAutoAdd", () => {
  const base = {
    current: 500,
    initial: 500,
    notifyDaysBeforeExpiry: 3,
    lowQuantityThreshold: 25,
    autoAddOnExpiry: true,
    autoAddOnLowQuantity: true,
  };

  it("returns true when item is expiring soon and autoAddOnExpiry is true", () => {
    expect(shouldAutoAdd({ ...base, expiresAt: daysFromToday(2) })).toBe(true);
  });

  it("returns false when item is expiring soon but autoAddOnExpiry is false", () => {
    expect(
      shouldAutoAdd({
        ...base,
        expiresAt: daysFromToday(2),
        autoAddOnExpiry: false,
      }),
    ).toBe(false);
  });

  it("returns false when item is not expiring soon", () => {
    expect(shouldAutoAdd({ ...base, expiresAt: daysFromToday(10) })).toBe(
      false,
    );
  });

  it("returns false when expiresAt is null", () => {
    expect(shouldAutoAdd({ ...base, expiresAt: null })).toBe(false);
  });

  it("returns true when quantity is low and autoAddOnLowQuantity is true", () => {
    expect(
      shouldAutoAdd({ ...base, expiresAt: null, current: 100, initial: 500 }),
    ).toBe(true); // 20% ≤ 25%
  });

  it("returns false when quantity is low but autoAddOnLowQuantity is false", () => {
    expect(
      shouldAutoAdd({
        ...base,
        expiresAt: null,
        current: 100,
        initial: 500,
        autoAddOnLowQuantity: false,
      }),
    ).toBe(false);
  });

  it("returns false when nothing triggers auto-add", () => {
    expect(
      shouldAutoAdd({
        ...base,
        expiresAt: null,
        autoAddOnExpiry: false,
        autoAddOnLowQuantity: false,
      }),
    ).toBe(false);
  });
});

describe("linkedItemNote", () => {
  it("returns null when linkedItemName is null", () => {
    expect(linkedItemNote(null, daysFromToday(3), today)).toBeNull();
  });

  it("returns note with days remaining when expiry is set", () => {
    expect(linkedItemNote("Milk", daysFromToday(3), today)).toBe(
      "You planned this for Milk (expires in 3 days)",
    );
  });

  it('uses singular "day" when exactly 1 day remains', () => {
    expect(linkedItemNote("Milk", daysFromToday(1), today)).toBe(
      "You planned this for Milk (expires in 1 day)",
    );
  });

  it("returns note without expiry info when expiresAt is null", () => {
    expect(linkedItemNote("Olive Oil", null, today)).toBe(
      "You planned this for Olive Oil",
    );
  });
});
