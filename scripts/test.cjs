const { execFileSync } = require("node:child_process");
const { mkdtempSync, rmSync } = require("node:fs");
const { tmpdir } = require("node:os");
const { join } = require("node:path");
const output = mkdtempSync(join(tmpdir(), "hana-pod-tests-"));
try {
  execFileSync(
    process.execPath,
    [
      require.resolve("typescript/bin/tsc"),
      "src/domain.ts",
      "--outDir",
      output,
      "--module",
      "commonjs",
      "--target",
      "es2020",
      "--strict",
      "--skipLibCheck",
      "--ignoreConfig",
    ],
    { stdio: "inherit" },
  );
  process.env.HANA_DOMAIN_MODULE = join(output, "domain.js");
  execFileSync(process.execPath, ["--test", "tests/domain.test.cjs"], {
    stdio: "inherit",
    env: process.env,
  });
} finally {
  rmSync(output, { recursive: true, force: true });
}
