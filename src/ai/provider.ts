import { buildAiPrompt } from "./prompt.js";
import { parseAiMutationProposal } from "./structured-output.js";
import type { AppConfig } from "../config/env.js";
import type {
  AiMutationProposal,
  AutoMergeIntent,
  NormalizedDispatchRequest,
} from "../types.js";

interface GenerateMutationOptions {
  autoMergeIntent: AutoMergeIntent;
  config: AppConfig;
  currentFiles: Record<string, string>;
  request: NormalizedDispatchRequest;
}

async function callOpenAi(prompt: string, config: AppConfig): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    body: JSON.stringify({
      messages: [
        {
          role: "system",
          content:
            "You are a precise portfolio content editor. Return JSON only and never propose disallowed file paths.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      model: config.openAiModel,
      temperature: 0,
    }),
    headers: {
      Authorization: `Bearer ${config.openAiApiKey}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(`OpenAI request failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string | null } }>;
  };
  const content = payload.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("OpenAI response did not contain message content.");
  }

  return content;
}

async function callAnthropic(prompt: string, config: AppConfig): Promise<string> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    body: JSON.stringify({
      max_tokens: 2000,
      messages: [
        {
          content: prompt,
          role: "user",
        },
      ],
      model: config.anthropicModel,
      system:
        "You are a precise portfolio content editor. Return JSON only and never propose disallowed file paths.",
      temperature: 0,
    }),
    headers: {
      "Content-Type": "application/json",
      "anthropic-dangerous-direct-browser-access": "false",
      "anthropic-version": "2023-06-01",
      "x-api-key": config.anthropicApiKey ?? "",
    },
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(`Anthropic request failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as {
    content?: Array<{ text?: string; type?: string }>;
  };
  const textBlock = payload.content?.find((entry) => entry.type === "text");

  if (!textBlock?.text) {
    throw new Error("Anthropic response did not contain a text block.");
  }

  return textBlock.text;
}

export async function generateAiMutationProposal(
  options: GenerateMutationOptions,
): Promise<AiMutationProposal> {
  if (!options.config.aiProvider) {
    throw new Error(
      "AI_PROVIDER is not configured. Set AI_PROVIDER and the matching API key secret before running the workflow.",
    );
  }

  const prompt = buildAiPrompt({
    autoMergeIntent: options.autoMergeIntent,
    currentFiles: options.currentFiles,
    request: options.request,
  });

  const responseText =
    options.config.aiProvider === "openai"
      ? await callOpenAi(prompt, options.config)
      : await callAnthropic(prompt, options.config);

  return parseAiMutationProposal(responseText);
}
