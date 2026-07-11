import { Octokit } from "@octokit/rest";

import type { PullRequestResult } from "../types.js";

export interface RepoRef {
  owner: string;
  repo: string;
}

export function parseRepoFullName(fullName: string): RepoRef {
  const [owner, repo] = fullName.split("/");
  if (!owner || !repo) {
    throw new Error(`Invalid repository name: ${fullName}. Expected owner/repo.`);
  }

  return { owner, repo };
}

export function createGitHubClient(token?: string): Octokit {
  if (!token) {
    throw new Error(
      "GitHub token is required. Set PORTFOLIO_REPO_TOKEN (preferred) or GITHUB_TOKEN.",
    );
  }

  return new Octokit({ auth: token });
}

interface CreatePullRequestOptions {
  base: string;
  body: string;
  head: string;
  repoRef: RepoRef;
  title: string;
}

export async function createOrUpdatePullRequest(
  octokit: Octokit,
  options: CreatePullRequestOptions,
): Promise<PullRequestResult> {
  const existingPullRequests = await octokit.pulls.list({
    base: options.base,
    head: `${options.repoRef.owner}:${options.head}`,
    owner: options.repoRef.owner,
    repo: options.repoRef.repo,
    state: "open",
  });

  const existingPullRequest = existingPullRequests.data[0];
  if (existingPullRequest) {
    const updatedPullRequest = await octokit.pulls.update({
      body: options.body,
      owner: options.repoRef.owner,
      pull_number: existingPullRequest.number,
      repo: options.repoRef.repo,
      title: options.title,
    });

    return {
      htmlUrl: updatedPullRequest.data.html_url,
      nodeId: updatedPullRequest.data.node_id,
      number: updatedPullRequest.data.number,
    };
  }

  const createdPullRequest = await octokit.pulls.create({
    base: options.base,
    body: options.body,
    head: options.head,
    owner: options.repoRef.owner,
    repo: options.repoRef.repo,
    title: options.title,
  });

  return {
    htmlUrl: createdPullRequest.data.html_url,
    nodeId: createdPullRequest.data.node_id,
    number: createdPullRequest.data.number,
  };
}

export async function enablePullRequestAutoMerge(
  octokit: Octokit,
  pullRequestNodeId: string,
) {
  await octokit.graphql(
    `
      mutation EnablePullRequestAutoMerge($pullRequestId: ID!) {
        enablePullRequestAutoMerge(
          input: { pullRequestId: $pullRequestId, mergeMethod: SQUASH }
        ) {
          pullRequest {
            number
          }
        }
      }
    `,
    { pullRequestId: pullRequestNodeId },
  );
}

export async function postPullRequestComment(
  octokit: Octokit,
  repoRef: RepoRef,
  pullRequestNumber: number,
  body: string,
) {
  await octokit.issues.createComment({
    body,
    issue_number: pullRequestNumber,
    owner: repoRef.owner,
    repo: repoRef.repo,
  });
}
