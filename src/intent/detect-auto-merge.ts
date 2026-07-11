import type { AutoMergeIntent } from "../types.js";

export const AUTO_MERGE_INTENT_PHRASES = [
  "merge and deploy",
  "auto merge",
  "publish this",
  "ship this",
  "go live",
] as const;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function detectAutoMergeIntent(messageBody: string): AutoMergeIntent {
  const normalizedBody = messageBody.toLowerCase();
  const matchedPhrases = AUTO_MERGE_INTENT_PHRASES.filter((phrase) => {
    const matcher = new RegExp(`\\b${escapeRegExp(phrase)}\\b`, "i");
    return matcher.test(normalizedBody);
  });

  return {
    enabled: matchedPhrases.length > 0,
    matchedPhrases,
  };
}
