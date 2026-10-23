import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

/**
 * Telemetry payload-safety regression test.
 *
 * The new translation-job surface (worker handler + API-side dispatcher +
 * publish-time TranslationService) emits structured Winston logs at
 * job-lifecycle boundaries. Per project core principle 2 ("log everything
 * meaningful" — but never raw content or stack traces), no logger payload
 * may contain translation content or stack traces.
 *
 * If a future change introduces a logger.info / logger.warn / logger.error
 * / logger.log call site in any of the scoped files that references
 * translatedText, translatedChoices, question.question, or error.stack —
 * this test fails with the offending call sites listed in the diff output.
 */
describe("Telemetry payload safety: translation jobs do not log content", () => {
  // Spec lives at apps/jobs/src/translation-payload-safety.spec.ts →
  // ../../.. is repo root.
  const repoRoot = resolve(__dirname, "..", "..", "..");
  const scope = [
    "apps/jobs/src/job-worker.service.ts",
    "apps/api/src/job-queue/",
    "apps/api/src/api/assignment/v2/services/translation.service.ts",
  ];
  const excludedSpecs = [
    ":!apps/jobs/src/translation-payload-safety.spec.ts",
    ":!apps/api/src/api/assignment/v2/services/translation-log-shape.spec.ts",
    ":!apps/api/src/api/assignment/v2/services/translation-payload-safety.runtime.spec.ts",
  ];
  const forbidden =
    "translatedText|translatedChoices|question\\.question|error\\.stack";

  // Cross-platform `git grep`: run git directly with an argv array instead of a
  // shell string. Windows cmd.exe has no /dev/null (so `2>/dev/null || true`
  // fails) and does not treat single quotes as quoting (so shell-quoted
  // patterns are passed through with the quotes attached).
  function gitGrepOutput(args: string[]): string {
    try {
      return execFileSync(
        "git",
        ["-C", repoRoot, "grep", "--no-color", ...args],
        { encoding: "utf8" },
      ).trim();
    } catch (error) {
      // git grep exits 1 when nothing matched — the success case here.
      if ((error as { status?: number }).status === 1) return "";
      throw error;
    }
  }

  it("no logger.{info,warn,error,log} call site in the translation-job surface references forbidden content tokens", () => {
    // git grep returns lines matching: a logger call where one of the
    // forbidden tokens appears within the same line. The pattern is loose
    // intentionally — a multi-line logger.error({ ... }) block with the
    // forbidden token on its own line is still caught because the field
    // name appears on its own line in formatted source.
    // gitGrepOutput returns "" when git grep finds no matches, which is the
    // success case for this regression test.
    const output = gitGrepOutput([
      "-nE",
      `logger\\.(info|warn|error|log).*(${forbidden})`,
      "--",
      ...scope,
      ...excludedSpecs,
    ]);
    if (output !== "") {
      throw new Error(
        "Forbidden content token found inside a logger.* call in the translation-job surface:\n" +
          output +
          "\n\n" +
          "Project rule: log identifiers and counts only. " +
          "Translation content and stack traces never appear in info/warn/error JSON payloads. " +
          "Remove the offending field from the log call before committing.",
      );
    }
    expect(output).toBe("");
  });

  it("no logger.{info,warn,error,log} call site in the translation-job surface logs the raw error object (.stack-implied)", () => {
    // Catches the pattern `logger.error("msg", error)` where `error` is
    // the raw Error and the Winston transport serializes it (including
    // .stack) into the JSON payload. Use error.message only at info / warn /
    // error transports; full stacks belong on a separate debug transport.
    const output = gitGrepOutput([
      "-nE",
      `logger\\.(error|warn)\\(.*,\\s*error[\\s),]`,
      "--",
      ...scope,
      ...excludedSpecs,
    ]);
    if (output !== "") {
      throw new Error(
        "logger.* call passing the raw error object found in the translation-job surface:\n" +
          output +
          "\n\nUse `error.message` only in info/warn/error JSON payloads. " +
          "Stack goes to a separate winston debug transport.",
      );
    }
    expect(output).toBe("");
  });
});
