import { runPortfolioDispatch } from "../orchestrator/run-portfolio-dispatch.js";

async function main() {
  const result = await runPortfolioDispatch();
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
