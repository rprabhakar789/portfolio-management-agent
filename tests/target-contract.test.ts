import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { assertTargetContract, inspectTargetContract } from "../src/policy/target-contract.js";

const tempDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempDirectories.splice(0).map((directory) =>
      fs.rm(directory, { force: true, recursive: true }),
    ),
  );
});

describe("target content contract", () => {
  it("reports missing content files", async () => {
    const temporaryDirectory = await fs.mkdtemp(
      path.join(os.tmpdir(), "portfolio-agent-"),
    );
    tempDirectories.push(temporaryDirectory);

    await fs.mkdir(path.join(temporaryDirectory, "content"));
    await fs.writeFile(
      path.join(temporaryDirectory, "content/about.md"),
      "About me\n",
      "utf8",
    );

    const report = await inspectTargetContract(temporaryDirectory);

    expect(report.missingPaths.length).toBeGreaterThan(0);
    expect(() => assertTargetContract(report)).toThrow(/missing the required content contract/i);
  });
});
