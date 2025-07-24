#!/usr/bin/env node

/**
 * API Contract Test Runner
 *
 * This script runs all API contract tests to verify that no breaking changes
 * have been introduced. If any test fails, it indicates a potential breaking
 * change requiring a major version bump.
 */

const { spawn } = require("child_process");
const path = require("path");

const tests = [
  {
    name: "Core API Contract",
    file: "api-contract.test.ts",
    description: "Tests classes, methods, properties, and return types",
  },
  {
    name: "CLI Interface Contract",
    file: "cli-contract.test.ts",
    description: "Tests command-line interface stability",
  },
  {
    name: "TypeScript Type Contract",
    file: "type-contract.test.ts",
    description: "Tests type signatures and constraints",
  },
];

// Whitelist of allowed test files to prevent path traversal
const ALLOWED_TEST_FILES = new Set([
  "api-contract.test.ts",
  "cli-contract.test.ts",
  "type-contract.test.ts",
]);

async function runTest(test) {
  return new Promise((resolve, reject) => {
    // Validate test file against whitelist
    if (!ALLOWED_TEST_FILES.has(test.file)) {
      reject(
        new Error(
          `Test file '${test.file}' is not allowed. Allowed files: ${Array.from(ALLOWED_TEST_FILES).join(", ")}`
        )
      );
      return;
    }

    // Ensure the file doesn't contain path traversal sequences
    if (
      test.file.includes("..") ||
      test.file.includes("/") ||
      test.file.includes("\\")
    ) {
      reject(
        new Error(`Test file '${test.file}' contains invalid path characters`)
      );
      return;
    }

    const testPath = path.join(__dirname, test.file);

    console.log(`\n🔍 Running ${test.name}...`);
    console.log(`   ${test.description}`);

    const child = spawn("node", ["-r", "ts-node/register", testPath], {
      stdio: "pipe",
      cwd: process.cwd(),
    });

    let stdout = "";
    let stderr = "";

    child.stdout?.on("data", data => {
      stdout += data.toString();
    });

    child.stderr?.on("data", data => {
      stderr += data.toString();
    });

    child.on("close", code => {
      if (code === 0) {
        // Parse test results from stdout
        const matches = stdout.match(
          /Total:\s+(\d+).*Passed:\s+(\d+).*Duration:\s+([\d.]+)ms/
        );
        if (matches) {
          const [, total, passed, duration] = matches;
          console.log(`   ✅ ${passed}/${total} tests passed (${duration}ms)`);
          resolve({
            success: true,
            total: parseInt(total),
            passed: parseInt(passed),
          });
        } else {
          console.log(`   ✅ Tests completed successfully`);
          resolve({ success: true, total: 1, passed: 1 });
        }
      } else {
        console.log(`   ❌ Tests failed (exit code ${code})`);
        if (stderr) {
          console.log(
            `   Error output:\n${stderr
              .split("\n")
              .map(line => `     ${line}`)
              .join("\n")}`
          );
        }
        resolve({
          success: false,
          total: 0,
          passed: 0,
          error: stderr || "Unknown error",
        });
      }
    });

    child.on("error", error => {
      console.log(`   ❌ Failed to run test: ${error.message}`);
      resolve({ success: false, total: 0, passed: 0, error: error.message });
    });
  });
}

async function main() {
  console.log("🚀 API Contract Test Suite");
  console.log("==========================");
  console.log("");
  console.log(
    "This test suite verifies that the public API contract remains stable."
  );
  console.log(
    "Any failures indicate potential breaking changes requiring a major version bump."
  );

  let totalTests = 0;
  let totalPassed = 0;
  let totalFailed = 0;
  const failures = [];

  for (const test of tests) {
    const result = await runTest(test);

    totalTests += result.total;
    totalPassed += result.passed;

    if (!result.success) {
      totalFailed += result.total - result.passed;
      failures.push({
        name: test.name,
        error: result.error,
      });
    }
  }

  console.log("\n📊 Contract Test Results");
  console.log("========================");
  console.log(`Total tests: ${totalTests}`);
  console.log(`Passed: ${totalPassed}`);
  console.log(`Failed: ${totalFailed}`);

  if (failures.length > 0) {
    console.log("\n❌ BREAKING CHANGES DETECTED");
    console.log("============================");
    console.log("The following API contract violations were found:\n");

    failures.forEach((failure, index) => {
      console.log(`${index + 1}. ${failure.name}`);
      console.log(`   ${failure.error.split("\n")[0]}`);
      console.log("");
    });

    console.log(
      "⚠️  These failures indicate potential breaking changes that may require"
    );
    console.log("   a MAJOR version bump according to semantic versioning.");
    console.log("");
    console.log("📖 Review the API Versioning Policy:");
    console.log("   docs/api-versioning.md");
    console.log("");
    console.log("🔧 If these changes are intentional breaking changes:");
    console.log("   1. Update the version to the next major version");
    console.log("   2. Update the API contract tests to reflect the new API");
    console.log("   3. Document the breaking changes in CHANGELOG.md");
    console.log("   4. Provide migration guidance for users");

    process.exit(1);
  } else {
    console.log("\n✅ ALL API CONTRACT TESTS PASSED");
    console.log("=================================");
    console.log("No breaking changes detected. The API contract is stable.");
    console.log("");
    console.log("🎯 Safe for MINOR or PATCH version releases");

    process.exit(0);
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error("❌ Contract test runner failed:", error);
    process.exit(1);
  });
}

module.exports = { runTest, main };
