import { describe, expect, it } from "vitest";

import sampleDispatch from "../fixtures/repository-dispatch.sample.json";
import { parseRepositoryDispatch } from "../src/gmail-dispatch/parse-dispatch.js";

describe("parseRepositoryDispatch", () => {
  it("normalizes the Gmail repository_dispatch payload", () => {
    const result = parseRepositoryDispatch(sampleDispatch, {
      defaultTargetRepo: "rprabhakar789/devfolio",
    });

    expect(result.requestId).toBe("gmail-message-123");
    expect(result.sender).toEqual({
      email: "rahul@example.com",
      name: "Rahul",
    });
    expect(result.labels).toEqual(["portfolio-agent"]);
    expect(result.requestedPaths).toEqual([
      "content/about.md",
      "content/projects.yaml",
    ]);
  });

  it("rejects unlabeled dispatch payloads", () => {
    const payload = structuredClone(sampleDispatch);
    payload.client_payload.email.labels = ["inbox"];

    expect(() =>
      parseRepositoryDispatch(payload, {
        defaultTargetRepo: "rprabhakar789/devfolio",
      }),
    ).toThrow(/portfolio-agent/i);
  });
});
