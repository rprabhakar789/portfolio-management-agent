import { describe, expect, it } from "vitest";

import { assertAllowedContentPaths } from "../src/policy/allowed-paths.js";

describe("assertAllowedContentPaths", () => {
  it("accepts the content allowlist", () => {
    const result = assertAllowedContentPaths(
      ["content/about.md", "content/projects.yaml"],
      "Test paths",
    );

    expect(result).toEqual(["content/about.md", "content/projects.yaml"]);
  });

  it("rejects paths outside the content allowlist", () => {
    expect(() =>
      assertAllowedContentPaths(["src/App.jsx"], "Test paths"),
    ).toThrow(/disallowed paths/i);
  });
});
