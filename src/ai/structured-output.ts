import { z } from "zod";

import { ALLOWED_CONTENT_PATHS } from "../domain/portfolio-content.js";
import { assertAllowedMutations } from "../policy/allowed-paths.js";
import type { AiMutationProposal } from "../types.js";

const contentMutationSchema = z.object({
  content: z.string().trim().min(1),
  path: z.enum(ALLOWED_CONTENT_PATHS),
  rationale: z.string().trim().min(1),
});

const proposalSchema = z.object({
  mutations: z.array(contentMutationSchema),
  summary: z.string().trim().min(1),
});

function extractJsonPayload(responseText: string): string {
  const trimmed = responseText.trim();
  if (trimmed.startsWith("{")) {
    return trimmed;
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error("AI response did not contain a JSON object.");
  }

  return trimmed.slice(firstBrace, lastBrace + 1);
}

export function parseAiMutationProposal(responseText: string): AiMutationProposal {
  const parsedProposal = proposalSchema.parse(JSON.parse(extractJsonPayload(responseText)));
  assertAllowedMutations(parsedProposal.mutations, "AI proposal");

  return {
    summary: parsedProposal.summary,
    mutations: parsedProposal.mutations.map((mutation) => ({
      content: mutation.content,
      path: mutation.path,
      rationale: mutation.rationale,
    })),
  };
}
