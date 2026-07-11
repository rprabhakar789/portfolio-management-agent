import { describe, expect, it } from "vitest";

import { detectAutoMergeIntent } from "../src/intent/detect-auto-merge.js";

describe("detectAutoMergeIntent", () => {
  it("flags explicit publish phrases", () => {
    const result = detectAutoMergeIntent(
      "Please refresh the projects section and publish this after review.",
    );

    expect(result.enabled).toBe(true);
    expect(result.matchedPhrases).toContain("publish this");
  });

  it("keeps PR-first mode when no phrase is present", () => {
    const result = detectAutoMergeIntent("Please update the about section.");

    expect(result.enabled).toBe(false);
    expect(result.matchedPhrases).toEqual([]);
  });
});
