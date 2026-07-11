import { ALLOWED_CONTENT_PATHS, describeContentSchemas } from "../domain/portfolio-content.js";
import type { AutoMergeIntent, NormalizedDispatchRequest } from "../types.js";

interface PromptOptions {
  autoMergeIntent: AutoMergeIntent;
  currentFiles: Record<string, string>;
  request: NormalizedDispatchRequest;
}

export function buildAiPrompt(options: PromptOptions): string {
  const requestedPaths =
    options.request.requestedPaths.length > 0
      ? options.request.requestedPaths.join(", ")
      : "No explicit paths requested in the dispatch payload.";

  const currentFilesBlock = ALLOWED_CONTENT_PATHS.map((pathname) => {
    const fileContent = options.currentFiles[pathname];
    return [`### ${pathname}`, "```", fileContent, "```"].join("\n");
  }).join("\n\n");

  return `
You are updating structured portfolio content for the repository ${options.request.targetRepo}.

Hard safety rules:
1. Return JSON only.
2. Only emit mutations for these exact paths:
${ALLOWED_CONTENT_PATHS.map((pathname) => `   - ${pathname}`).join("\n")}
3. Do not invent or touch any other path.
4. Omit unchanged files.
5. Each mutation must contain the complete replacement file content for that path.
6. Keep edits tightly scoped to the user's email request.

Schema guidance:
${describeContentSchemas()}

Dispatch metadata:
- Request ID: ${options.request.requestId}
- Sender: ${options.request.sender.email}
- Subject: ${options.request.subject || "(no subject)"}
- Labels: ${options.request.labels.join(", ")}
- Requested paths: ${requestedPaths}
- Auto-merge intent detected: ${options.autoMergeIntent.enabled ? "yes" : "no"}
- Matched phrases: ${options.autoMergeIntent.matchedPhrases.join(", ") || "none"}

Email body:
"""
${options.request.body}
"""

Current file contents:
${currentFilesBlock}

Return this JSON shape:
{
  "summary": "short summary of the proposed content update",
  "mutations": [
    {
      "path": "content/about.md",
      "rationale": "why this file changed",
      "content": "full replacement file contents"
    }
  ]
}
`.trim();
}
