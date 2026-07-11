import type { ALLOWED_CONTENT_PATHS } from "../domain/portfolio-content.js";
import { isAllowedContentPath, normalizeRepoPath } from "../domain/portfolio-content.js";
import type { ContentMutation } from "../types.js";

export function assertAllowedContentPaths(
  rawPaths: readonly string[],
  context: string,
) {
  const normalizedPaths = rawPaths.map(normalizeRepoPath);
  const disallowedPaths = normalizedPaths.filter(
    (pathname) => !isAllowedContentPath(pathname),
  );

  if (disallowedPaths.length > 0) {
    throw new Error(
      `${context} attempted to modify disallowed paths: ${disallowedPaths.join(", ")}.`,
    );
  }

  return normalizedPaths as (typeof ALLOWED_CONTENT_PATHS)[number][];
}

export function assertAllowedMutations(
  mutations: readonly Pick<ContentMutation, "path">[],
  context: string,
) {
  return assertAllowedContentPaths(
    mutations.map((mutation) => mutation.path),
    context,
  );
}
