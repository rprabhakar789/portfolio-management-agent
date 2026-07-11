import fs from "node:fs/promises";
import path from "node:path";

import { simpleGit } from "simple-git";

import {
  ALLOWED_CONTENT_PATHS,
  normalizeRepoPath,
  parseContentFile,
} from "../domain/portfolio-content.js";
import { assertAllowedContentPaths } from "../policy/allowed-paths.js";
import type { ContentMutation } from "../types.js";

function createGitClient(repoPath: string) {
  return simpleGit(repoPath);
}

export async function loadCurrentContentFiles(
  targetRepoPath: string,
): Promise<Record<string, string>> {
  const entries = await Promise.all(
    ALLOWED_CONTENT_PATHS.map(async (pathname) => {
      const absolutePath = path.join(targetRepoPath, pathname);
      const rawContent = await fs.readFile(absolutePath, "utf8");
      parseContentFile(pathname, rawContent);
      return [pathname, rawContent] as const;
    }),
  );

  return Object.fromEntries(entries);
}

export async function checkoutAutomationBranch(
  targetRepoPath: string,
  branchName: string,
) {
  const git = createGitClient(targetRepoPath);
  const branchSummary = await git.branchLocal();
  if (branchSummary.all.includes(branchName)) {
    await git.checkout(branchName);
    return;
  }

  await git.checkoutLocalBranch(branchName);
}

export async function writeContentMutations(
  targetRepoPath: string,
  mutations: readonly ContentMutation[],
) {
  for (const mutation of mutations) {
    const absolutePath = path.join(targetRepoPath, mutation.path);
    parseContentFile(mutation.path, mutation.content);
    await fs.writeFile(absolutePath, mutation.content, "utf8");
  }
}

export async function getWorkingTreeChangedPaths(
  targetRepoPath: string,
): Promise<string[]> {
  const git = createGitClient(targetRepoPath);
  const status = await git.status();
  const changedPaths = status.files.map((file: { path: string }) =>
    normalizeRepoPath(file.path),
  );
  return assertAllowedContentPaths(changedPaths, "Working tree");
}

export async function stageAllowedPaths(
  targetRepoPath: string,
  changedPaths: readonly string[],
) {
  const normalizedPaths = assertAllowedContentPaths(changedPaths, "Staging");
  const git = createGitClient(targetRepoPath);
  if (normalizedPaths.length === 0) {
    return;
  }

  await git.add(normalizedPaths);
}

export async function getStagedPaths(targetRepoPath: string): Promise<string[]> {
  const git = createGitClient(targetRepoPath);
  const stagedOutput = await git.diff(["--cached", "--name-only"]);
  const stagedPaths = stagedOutput
    .split("\n")
    .map((entry: string) => entry.trim())
    .filter((entry: string) => entry.length > 0)
    .map(normalizeRepoPath);
  return assertAllowedContentPaths(stagedPaths, "Staged diff");
}

export async function commitAndPushChanges(options: {
  branchName: string;
  commitMessage: string;
  targetRepoPath: string;
}) {
  const git = createGitClient(options.targetRepoPath);
  await git.addConfig("user.name", "portfolio-management-agent", false, "local");
  await git.addConfig(
    "user.email",
    "portfolio-management-agent@users.noreply.github.com",
    false,
    "local",
  );
  await git.commit(options.commitMessage);
  await git.push("origin", options.branchName, { "--set-upstream": null });
}
