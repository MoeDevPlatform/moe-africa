import { describe, expect, test } from "bun:test";
import { customCategory, minimumDeadline, validateCustomOrder, type CustomOrderFields } from "../src/lib/customOrderForm";
import { normalizeProductPreviews } from "../src/lib/productPreviews";

const today = new Date(2026, 9, 16);
const valid: CustomOrderFields = { description: "a".repeat(50), budgetMin: "1000", budgetMax: "2000", deadline: "2026-10-23", details: {}, imageCount: 3 };
describe("Structured custom order rules", () => {
  test("description requires at least 50 characters", () => {
    expect(validateCustomOrder({ ...valid, description: "a".repeat(49) }, today).description).toBeDefined();
    expect(validateCustomOrder(valid, today).description).toBeUndefined();
  });
  test("references are limited to 3", () => {
    expect(validateCustomOrder({ ...valid, imageCount: 4 }, today).images).toBeDefined();
    expect(validateCustomOrder(valid, today).images).toBeUndefined();
  });
  test("deadline must be at least 7 calendar days away", () => {
    expect(minimumDeadline(today)).toBe("2026-10-23");
    expect(validateCustomOrder({ ...valid, deadline: "2026-10-22" }, today).deadline).toBeDefined();
    expect(validateCustomOrder(valid, today).deadline).toBeUndefined();
  });
  test("engraving is limited to 30 characters", () => {
    expect(validateCustomOrder({ ...valid, details: { engraving: "a".repeat(31) } }, today).engraving).toBeDefined();
    expect(validateCustomOrder({ ...valid, details: { engraving: "a".repeat(30) } }, today).engraving).toBeUndefined();
  });
  test("budget range is nonnegative and ordered", () => {
    expect(validateCustomOrder({ ...valid, budgetMin: "-1" }, today).budgetMin).toBeDefined();
    expect(validateCustomOrder({ ...valid, budgetMax: "999" }, today).budgetMax).toBeDefined();
    expect(validateCustomOrder(valid, today)).toEqual({});
  });
  test("category aliases select the corresponding field set", () => {
    expect(customCategory("Jewelry")).toBe("jewellery");
    expect(customCategory("Arts & Crafts")).toBe("home");
    expect(customCategory("Hair & Beauty")).toBe("other");
  });
  test("listing previews show at most 3 approved products and none when absent", () => {
    expect(normalizeProductPreviews({ products: [ { name: "Pending", status: "pending", imageUrl: "pending.jpg" }, ...[1, 2, 3, 4].map((i) => ({ name: String(i), status: "approved", images: [`${i}.jpg`] })) ] })).toEqual([1, 2, 3].map((i) => ({ imageUrl: `${i}.jpg`, name: String(i) })));
    expect(normalizeProductPreviews({})).toEqual([]);
  });
});