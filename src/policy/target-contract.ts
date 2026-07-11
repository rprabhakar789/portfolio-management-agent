import fs from "node:fs/promises";
import path from "node:path";

import { ALLOWED_CONTENT_PATHS } from "../domain/portfolio-content.js";
import type { TargetContractReport } from "../types.js";

export async function inspectTargetContract(
  targetRepoPath: string,
): Promise<TargetContractReport> {
  const existenceChecks = await Promise.all(
    ALLOWED_CONTENT_PATHS.map(async (pathname) => {
      const absolutePath = path.join(targetRepoPath, pathname);
      try {
        await fs.access(absolutePath);
        return null;
      } catch {
        return pathname;
      }
    }),
  );

  return {
    targetRepoPath,
    missingPaths: existenceChecks.filter(
      (pathname): pathname is (typeof ALLOWED_CONTENT_PATHS)[number] => pathname !== null,
    ),
  };
}

export function assertTargetContract(report: TargetContractReport) {
  if (report.missingPaths.length === 0) {
    return;
  }

  throw new Error(
    [
      `Target repo is missing the required content contract at ${report.targetRepoPath}.`,
      `Missing paths: ${report.missingPaths.join(", ")}.`,
      "This automation only supports content-file edits and refuses runs until the target repo exposes those files.",
    ].join(" "),
  );
}
