import { describe, expect, test } from "bun:test";
import { matchesAudience, parseAudienceQuery, requiresProductAudience, suggestProductAudience } from "../src/lib/productAudience";

describe("search recognises audience words", () => {
  test("women's shoes → women", () => expect(parseAudienceQuery("women's shoes")).toEqual({ audience: "women", rest: "shoes" }));
  test("ladies / female → women", () => {
    expect(parseAudienceQuery("ladies agbada").audience).toBe("women");
    expect(parseAudienceQuery("female sandals").audience).toBe("women");
  });
  test("men's traditional clothing / male → men", () => {
    expect(parseAudienceQuery("men's traditional clothing")).toEqual({ audience: "men", rest: "traditional clothing" });
    expect(parseAudienceQuery("male kaftan").audience).toBe("men");
  });
  test("children / kids / boys / girls → children", () => {
    for (const q of ["children's clothes", "kids dress", "boys shirt", "girls ankara"]) expect(parseAudienceQuery(q).audience).toBe("children");
  });
  test("no audience word leaves query untouched", () => expect(parseAudienceQuery("ankara bag")).toEqual({ audience: null, rest: "ankara bag" }));
  test("'menu' is not 'men'", () => expect(parseAudienceQuery("menu board").audience).toBeNull());
});

describe("unisex handling", () => {
  test("unisex shows under men and women", () => {
    expect(matchesAudience(["unisex"], "men")).toBe(true);
    expect(matchesAudience(["unisex"], "women")).toBe(true);
  });
  test("adult unisex never shows under children", () => expect(matchesAudience(["unisex"], "children")).toBe(false));
  test("multiple audiences match each", () => {
    expect(matchesAudience(["men", "children"], "men")).toBe(true);
    expect(matchesAudience(["men", "children"], "children")).toBe(true);
    expect(matchesAudience(["men", "children"], "women")).toBe(false);
  });
  test("unclassified product does not match an audience", () => expect(matchesAudience([], "women")).toBe(false));
});

describe("classification rules", () => {
  test("clothing and footwear require audience, furniture does not", () => {
    expect(requiresProductAudience("tailoring")).toBe(true);
    expect(requiresProductAudience("shoemaking")).toBe(true);
    expect(requiresProductAudience("furniture")).toBe(false);
  });
  test("clear evidence is suggested, not applied", () =>
    expect(suggestProductAudience({ name: "Ladies Ankara Gown", category: "tailoring" })).toEqual({ status: "suggested", designedFor: ["women"] }));
  test("no evidence is flagged for manual review", () =>
    expect(suggestProductAudience({ name: "Ankara Gown", category: "tailoring" })).toEqual({ status: "uncertain", designedFor: [] }));
  test("furniture is never classified", () =>
    expect(suggestProductAudience({ name: "Men's chair", category: "furniture" }).status).toBe("not_applicable"));
});
