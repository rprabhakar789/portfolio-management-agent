import type { AllowedContentPath } from "./domain/portfolio-content.js";

export interface AutoMergeIntent {
  enabled: boolean;
  matchedPhrases: string[];
}

export interface DispatchSender {
  email: string;
  name?: string;
}

export interface NormalizedDispatchRequest {
  eventType: string;
  requestId: string;
  source: "gmail";
  sender: DispatchSender;
  subject: string;
  body: string;
  labels: string[];
  receivedAt?: string;
  requestedPaths: AllowedContentPath[];
  targetRepo: string;
}

export interface ContentMutation {
  path: AllowedContentPath;
  content: string;
  rationale: string;
}

export interface AiMutationProposal {
  summary: string;
  mutations: ContentMutation[];
}

export interface TargetContractReport {
  targetRepoPath: string;
  missingPaths: AllowedContentPath[];
}

export interface PullRequestResult {
  number: number;
  htmlUrl: string;
  nodeId: string;
}

export interface NotificationSummary {
  title: string;
  body: string;
}
