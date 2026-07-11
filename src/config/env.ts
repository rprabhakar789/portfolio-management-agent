import { z } from "zod";

const envSchema = z.object({
  AI_PROVIDER: z.enum(["openai", "anthropic"]).optional(),
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  ANTHROPIC_MODEL: z.string().min(1).default("claude-3-5-sonnet-latest"),
  DRY_RUN: z.enum(["true", "false"]).default("false"),
  EMAIL_NOTIFICATION_WEBHOOK_URL: z.string().url().optional(),
  GITHUB_EVENT_PATH: z.string().min(1).optional(),
  GITHUB_REPOSITORY: z.string().min(1).optional(),
  GITHUB_SERVER_URL: z.string().url().default("https://github.com"),
  GITHUB_TOKEN: z.string().min(1).optional(),
  OPENAI_API_KEY: z.string().min(1).optional(),
  OPENAI_MODEL: z.string().min(1).default("gpt-4.1-mini"),
  PORTFOLIO_REPO_TOKEN: z.string().min(1).optional(),
  TARGET_BASE_BRANCH: z.string().min(1).default("main"),
  TARGET_REPO: z.string().min(1).default("rprabhakar789/devfolio"),
  TARGET_REPO_PATH: z.string().min(1).default("target-repo"),
});

export interface AppConfig {
  aiProvider?: "openai" | "anthropic";
  dryRun: boolean;
  emailNotificationWebhookUrl?: string;
  eventPath?: string;
  githubRepository?: string;
  githubServerUrl: string;
  githubToken?: string;
  openAiApiKey?: string;
  openAiModel: string;
  anthropicApiKey?: string;
  anthropicModel: string;
  targetBaseBranch: string;
  targetRepo: string;
  targetRepoPath: string;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = envSchema.parse(env);
  const githubToken = parsed.PORTFOLIO_REPO_TOKEN ?? parsed.GITHUB_TOKEN;

  if (parsed.AI_PROVIDER === "openai" && !parsed.OPENAI_API_KEY) {
    throw new Error("AI_PROVIDER=openai requires OPENAI_API_KEY.");
  }

  if (parsed.AI_PROVIDER === "anthropic" && !parsed.ANTHROPIC_API_KEY) {
    throw new Error("AI_PROVIDER=anthropic requires ANTHROPIC_API_KEY.");
  }

  const config: AppConfig = {
    anthropicModel: parsed.ANTHROPIC_MODEL,
    dryRun: parsed.DRY_RUN === "true",
    githubServerUrl: parsed.GITHUB_SERVER_URL,
    openAiModel: parsed.OPENAI_MODEL,
    targetBaseBranch: parsed.TARGET_BASE_BRANCH,
    targetRepo: parsed.TARGET_REPO,
    targetRepoPath: parsed.TARGET_REPO_PATH,
  };

  if (parsed.AI_PROVIDER) {
    config.aiProvider = parsed.AI_PROVIDER;
  }

  if (parsed.ANTHROPIC_API_KEY) {
    config.anthropicApiKey = parsed.ANTHROPIC_API_KEY;
  }

  if (parsed.EMAIL_NOTIFICATION_WEBHOOK_URL) {
    config.emailNotificationWebhookUrl = parsed.EMAIL_NOTIFICATION_WEBHOOK_URL;
  }

  if (parsed.GITHUB_EVENT_PATH) {
    config.eventPath = parsed.GITHUB_EVENT_PATH;
  }

  if (parsed.GITHUB_REPOSITORY) {
    config.githubRepository = parsed.GITHUB_REPOSITORY;
  }

  if (githubToken) {
    config.githubToken = githubToken;
  }

  if (parsed.OPENAI_API_KEY) {
    config.openAiApiKey = parsed.OPENAI_API_KEY;
  }

  return config;
}
