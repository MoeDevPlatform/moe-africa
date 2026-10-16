import { describe, expect, test } from "bun:test";
import {
  mergeKeywords,
  parseKeywordInput,
  removeKeywordFrom,
} from "../src/lib/sectionKeywords";

describe("Seasonal keyword list rules", () => {
  test("several keywords typed at once are all captured", () => {
    expect(parseKeywordInput(" eid , graduation,,harmattan ")).toEqual([
      "eid",
      "graduation",
      "harmattan",
    ]);
  });

  test("empty and separator-only input adds nothing", () => {
    expect(parseKeywordInput("  ,  \n ; ")).toEqual([]);
  });

  test("a new keyword is saved alongside the ones already saved", () => {
    const result = mergeKeywords(["cold"], ["eid"]);
    expect(result.merged).toEqual(["cold", "eid"]);
    expect(result.added).toEqual(["eid"]);
    expect(result.duplicates).toEqual([]);
  });

  test("adding a keyword that is already saved does not duplicate it", () => {
    const result = mergeKeywords(["cold", "eid"], ["EID", " eid "]);
    expect(result.merged).toEqual(["cold", "eid"]);
    expect(result.added).toEqual([]);
    expect(result.duplicates).toEqual(["EID", "eid"]);
  });

  test("removing one keyword leaves every other keyword saved", () => {
    expect(removeKeywordFrom(["cold", "eid", "harmattan"], "eid")).toEqual([
      "cold",
      "harmattan",
    ]);
    expect(removeKeywordFrom(["Cold", "eid"], "cold")).toEqual(["eid"]);
  });
});
