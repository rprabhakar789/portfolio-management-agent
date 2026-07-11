import { describe, expect, it } from "vitest";

import { parseAiMutationProposal } from "../src/ai/structured-output.js";
import { parseContentFile } from "../src/domain/portfolio-content.js";

describe("portfolio content schemas", () => {
  it("parses valid contact yaml", () => {
    const result = parseContentFile(
      "content/contact.yaml",
      [
        "email: rahul@example.com",
        "phone: +1-555-123-4567",
        "links:",
        "  - label: GitHub",
        "    url: https://github.com/rprabhakar789",
      ].join("\n"),
    );

    expect(result).toMatchObject({
      email: "rahul@example.com",
    });
  });

  it("rejects malformed content schemas", () => {
    expect(() =>
      parseContentFile("content/projects.yaml", "- name: Demo"),
    ).toThrow();
  });

  it("parses structured AI output", () => {
    const result = parseAiMutationProposal(`
\`\`\`json
{
  "summary": "Update the about section.",
  "mutations": [
    {
      "path": "content/about.md",
      "rationale": "Refresh the biography.",
      "content": "Updated biography."
    }
  ]
}
\`\`\`
`);

    expect(result.mutations[0]?.path).toBe("content/about.md");
  });
});
