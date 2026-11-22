import { describe, expect, test } from "bun:test";
import {
  createSizeProfile,
  deriveSizingMode,
  isSizingCategory,
  measurementsFor,
  productTypesForCategory,
  validateSizeProfiles,
} from "../src/lib/productSizing";

describe("product-specific sizing templates", () => {
  test("exposes product types for tailoring and footwear", () => {
    expect(productTypesForCategory("tailoring").some((item) => item.value === "shirt")).toBe(true);
    expect(productTypesForCategory("shoemaking").some((item) => item.value === "sandals")).toBe(true);
    expect(isSizingCategory("home_and_decor")).toBe(true);
  });

  test("suggests shirt measurements for men without trouser fields", () => {
    const keys = measurementsFor("shirt", "men").map((item) => item.key);
    expect(keys).toEqual(expect.arrayContaining(["chest", "shoulder", "sleeve", "shirt_length"]));
    expect(keys.includes("inseam")).toBe(false);
  });

  test("suggests dress measurements for women", () => {
    const keys = measurementsFor("dress", "women").map((item) => item.key);
    expect(keys).toEqual(expect.arrayContaining(["bust", "waist", "hips", "dress_length"]));
  });

  test("uses footwear measurements instead of clothing for sneakers", () => {
    const keys = measurementsFor("sneakers", "men").map((item) => item.key);
    expect(keys.includes("foot_length")).toBe(true);
    expect(keys.includes("chest")).toBe(false);
  });

  test("skips size-chart validation for non-sizing product types", () => {
    expect(
      validateSizeProfiles("jewellery", [], [
        createSizeProfile("jewellery", "unisex", "earrings"),
      ]),
    ).toBeNull();
    expect(
      validateSizeProfiles("home_and_decor", [], [
        createSizeProfile("home_and_decor", "unisex", "tables"),
      ]),
    ).toBeNull();
  });

  test("requires charts for standard apparel sizes", () => {
    const profile = createSizeProfile("tailoring", "men", "shirt");
    expect(validateSizeProfiles("tailoring", ["men"], [profile])).toMatch(/size/i);
    profile.sizes = [
      { label: "M", measurements: { chest: 100, shoulder: 45, sleeve: 60, shirt_length: 72 } },
    ];
    expect(validateSizeProfiles("tailoring", ["men"], [profile])).toBeNull();
  });

  test("allows made-to-measure without standard sizes", () => {
    const profile = createSizeProfile("tailoring", "women", "dress");
    profile.isMadeToMeasure = true;
    expect(deriveSizingMode(profile)).toBe("made_to_measure");
    expect(validateSizeProfiles("tailoring", ["women"], [profile])).toBeNull();
  });

  test("keeps men and women profiles independent", () => {
    const men = createSizeProfile("tailoring", "men", "shirt");
    const women = createSizeProfile("tailoring", "women", "shirt");
    men.sizes = [
      { label: "XL", measurements: { chest: 120, shoulder: 50, sleeve: 65, shirt_length: 78 } },
    ];
    women.sizes = [
      { label: "XL", measurements: { bust: 98, shoulder: 40, sleeve: 58, blouse_length: 66 } },
    ];
    expect(men.sizes[0].measurements).not.toEqual(women.sizes[0].measurements);
    expect(validateSizeProfiles("tailoring", ["men", "women"], [men, women])).toBeNull();
  });

  test("trousers suggest waist and inseam", () => {
    const keys = measurementsFor("trousers", "men").map((item) => item.key);
    expect(keys).toEqual(expect.arrayContaining(["waist", "inseam"]));
  });
});
