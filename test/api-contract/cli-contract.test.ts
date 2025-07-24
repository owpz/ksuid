import { test } from "uvu";
import * as assert from "uvu/assert";
import { spawn } from "child_process";

/**
 * CLI API Contract Tests
 *
 * These tests ensure the CLI interface remains stable and backward compatible.
 * Any breaking change to CLI arguments, options, or output format requires a MAJOR version bump.
 *
 * CLI Breaking Changes:
 * - Removing or renaming command line options
 * - Changing option behavior or syntax
 * - Changing output formats (for parsing tools)
 * - Removing supported output formats
 * - Changing exit codes
 * - Changing help text structure (if tools parse it)
 */

interface CLIResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

async function runCLI(args: string[]): Promise<CLIResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      "node",
      ["-r", "ts-node/register", "src/cli.ts", ...args],
      {
        stdio: "pipe",
        cwd: process.cwd(),
      }
    );

    let stdout = "";
    let stderr = "";

    child.stdout?.on("data", data => {
      stdout += data.toString();
    });

    child.stderr?.on("data", data => {
      stderr += data.toString();
    });

    child.on("close", code => {
      clearTimeout(timeout);
      resolve({
        stdout,
        stderr,
        exitCode: code || 0,
      });
    });

    child.on("error", error => {
      clearTimeout(timeout);
      reject(error);
    });

    // Timeout after 15 seconds (increased for test suite environment)
    const timeout = setTimeout(() => {
      child.kill();
      reject(new Error("CLI command timed out after 15 seconds"));
    }, 15000);
  });
}

test("CLI help option contract", async () => {
  // Test --help option
  const helpResult = await runCLI(["--help"]);
  assert.is(helpResult.exitCode, 0);
  assert.ok(helpResult.stdout.includes("Usage: ksuid"));
  assert.ok(helpResult.stdout.includes("Options:"));
  assert.ok(helpResult.stdout.includes("-n NUM"));
  assert.ok(helpResult.stdout.includes("-f FORMAT"));
  assert.ok(helpResult.stdout.includes("-t TEXT"));
  assert.ok(helpResult.stdout.includes("-v"));
  assert.ok(helpResult.stdout.includes("-h, --help"));

  // Test -h option (alias)
  const hResult = await runCLI(["-h"]);
  assert.is(hResult.exitCode, 0);
  assert.is(hResult.stdout, helpResult.stdout);
});

test("CLI format options contract", async () => {
  // All supported formats should be documented in help
  const helpResult = await runCLI(["--help"]);
  assert.ok(helpResult.stdout.includes("string"));
  assert.ok(helpResult.stdout.includes("inspect"));
  assert.ok(helpResult.stdout.includes("time"));
  assert.ok(helpResult.stdout.includes("timestamp"));
  assert.ok(helpResult.stdout.includes("payload"));
  assert.ok(helpResult.stdout.includes("raw"));
  assert.ok(helpResult.stdout.includes("template"));
});

test("CLI default behavior contract", async () => {
  // Running with no arguments should generate one KSUID
  const result = await runCLI([]);
  assert.is(result.exitCode, 0);
  assert.is(result.stderr, "");

  const output = result.stdout.trim();
  assert.is(output.length, 27); // Standard KSUID string length
  assert.match(output, /^[0-9A-Za-z]+$/); // Base62 characters only
});

test("CLI count option contract", async () => {
  // -n option should generate specified number of KSUIDs
  const result = await runCLI(["-n", "3"]);
  assert.is(result.exitCode, 0);

  const lines = result.stdout.trim().split("\n");
  assert.is(lines.length, 3);

  // Each line should be a valid KSUID
  for (const line of lines) {
    assert.is(line.length, 27);
    assert.match(line, /^[0-9A-Za-z]+$/);
  }
});

test("CLI string format contract", async () => {
  // Default format should be string
  const defaultResult = await runCLI([]);
  const stringResult = await runCLI(["-f", "string"]);

  // Both should produce similar output format
  assert.is(defaultResult.stdout.trim().length, 27);
  assert.is(stringResult.stdout.trim().length, 27);
});

test("CLI inspect format contract", async () => {
  // Inspect format should have consistent structure
  const validKsuid = "0o5sKzFDBc56T8mbUP8wH1KpSX7";
  const result = await runCLI(["-f", "inspect", validKsuid]);

  assert.is(result.exitCode, 0);
  assert.ok(result.stdout.includes("REPRESENTATION:"));
  assert.ok(result.stdout.includes("String:"));
  assert.ok(result.stdout.includes("Raw:"));
  assert.ok(result.stdout.includes("COMPONENTS:"));
  assert.ok(result.stdout.includes("Time:"));
  assert.ok(result.stdout.includes("Timestamp:"));
  assert.ok(result.stdout.includes("Payload:"));

  // Should contain the original KSUID
  assert.ok(result.stdout.includes(validKsuid));
});

test("CLI time format contract", async () => {
  const validKsuid = "0o5sKzFDBc56T8mbUP8wH1KpSX7";
  const result = await runCLI(["-f", "time", validKsuid]);

  assert.is(result.exitCode, 0);

  const output = result.stdout.trim();
  // Should be ISO date format
  assert.match(output, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
});

test("CLI timestamp format contract", async () => {
  const validKsuid = "0o5sKzFDBc56T8mbUP8wH1KpSX7";
  const result = await runCLI(["-f", "timestamp", validKsuid]);

  assert.is(result.exitCode, 0);

  const output = result.stdout.trim();
  // Should be numeric timestamp
  assert.match(output, /^\d+$/);
  assert.ok(parseInt(output) > 0);
});

test("CLI verbose mode contract", async () => {
  const validKsuid = "0o5sKzFDBc56T8mbUP8wH1KpSX7";

  // Test verbose with different formats
  const inspectVerbose = await runCLI(["-v", "-f", "inspect", validKsuid]);
  assert.is(inspectVerbose.exitCode, 0);
  assert.ok(inspectVerbose.stdout.includes(`${validKsuid}:`));

  const timeVerbose = await runCLI(["-v", "-f", "time", validKsuid]);
  assert.is(timeVerbose.exitCode, 0);
  assert.ok(timeVerbose.stdout.includes(`${validKsuid}:`));
});

test("CLI error handling contract", async () => {
  // Invalid KSUID should produce structured error
  const result = await runCLI(["-f", "inspect", "invalid"]);

  assert.ok(result.exitCode !== 0); // Should exit with error code

  // Error info should be on stderr
  assert.ok(result.stderr.includes("Error:"));
  assert.ok(result.stderr.includes("Expected:"));
  assert.ok(result.stderr.includes("Received:"));
  assert.ok(result.stderr.includes("Error Code:"));

  // Help text should be on stdout
  assert.ok(result.stdout.includes("Usage:"));
  assert.ok(result.stdout.includes("Options:"));
});

test("CLI invalid format error contract", async () => {
  const result = await runCLI(["-f", "invalid_format"]);

  assert.ok(result.exitCode !== 0);
  assert.ok(result.stderr.includes("Bad formatting function"));
});

test("CLI template format contract", async () => {
  const validKsuid = "0o5sKzFDBc56T8mbUP8wH1KpSX7";
  const template = "KSUID: {{ String }}, Time: {{ Time }}";

  const result = await runCLI(["-f", "template", "-t", template, validKsuid]);
  assert.is(result.exitCode, 0);

  const output = result.stdout.trim();
  assert.ok(output.includes("KSUID:"));
  assert.ok(output.includes(validKsuid));
  assert.ok(output.includes("Time:"));
  assert.match(output, /\d{4}-\d{2}-\d{2}T/); // ISO timestamp
});

test("CLI template missing option error contract", async () => {
  const validKsuid = "0o5sKzFDBc56T8mbUP8wH1KpSX7";

  // Using template format without -t should error
  const result = await runCLI(["-f", "template", validKsuid]);

  assert.ok(result.exitCode !== 0);
  assert.ok(result.stderr.includes("Template format requires -t option"));
});

test("CLI option parsing contract", async () => {
  // Test various argument patterns that should work
  const testCases = [
    ["-n", "1"],
    ["-n1"],
    ["-f", "string"],
    ["-fstring"],
    ["-v", "-n", "2"],
    ["-vn2"],
    ["--help"],
  ];

  for (const args of testCases) {
    try {
      const result = await runCLI(args);
      // Should not crash (exit code 0 or 1 are both acceptable)
      assert.ok(result.exitCode === 0 || result.exitCode === 1);
    } catch (error) {
      assert.unreachable(`CLI crashed with args: ${args.join(" ")}`);
    }
  }
});

test("CLI output format consistency contract", async () => {
  // Generate same KSUID with different invocations should be deterministic
  const validKsuid = "0o5sKzFDBc56T8mbUP8wH1KpSX7";

  // Multiple calls to same format should produce identical output
  const result1 = await runCLI(["-f", "timestamp", validKsuid]);
  const result2 = await runCLI(["-f", "timestamp", validKsuid]);

  assert.is(result1.stdout, result2.stdout);
  assert.is(result1.stderr, result2.stderr);
  assert.is(result1.exitCode, result2.exitCode);
});

test("CLI binary output contract", async () => {
  const validKsuid = "0o5sKzFDBc56T8mbUP8wH1KpSX7";

  // Raw and payload formats should produce binary output
  const rawResult = await runCLI(["-f", "raw", validKsuid]);
  assert.is(rawResult.exitCode, 0);
  // Should be binary data (20 bytes for raw format)
  assert.is(Buffer.from(rawResult.stdout, "binary").length, 20);

  const payloadResult = await runCLI(["-f", "payload", validKsuid]);
  assert.is(payloadResult.exitCode, 0);
  // Should be binary data (16 bytes for payload format)
  assert.is(Buffer.from(payloadResult.stdout, "binary").length, 16);
});

test("CLI multiple KSUID processing contract", async () => {
  const ksuids = ["0o5sKzFDBc56T8mbUP8wH1KpSX7", "0o5sKzFDBc56T8mbUP8wH1KpSX8"];

  const result = await runCLI(["-f", "timestamp", ...ksuids]);
  assert.is(result.exitCode, 0);

  const lines = result.stdout.trim().split("\n");
  assert.is(lines.length, 2);

  // Each line should be a valid timestamp
  for (const line of lines) {
    assert.match(line.trim(), /^\d+$/);
  }
});

test("CLI exit codes contract", async () => {
  // Success cases should return 0
  const successResult = await runCLI([]);
  assert.is(successResult.exitCode, 0);

  const helpResult = await runCLI(["--help"]);
  assert.is(helpResult.exitCode, 0);

  // Error cases should return 1
  const errorResult = await runCLI(["-f", "inspect", "invalid"]);
  assert.is(errorResult.exitCode, 1);

  const badFormatResult = await runCLI(["-f", "nonexistent"]);
  assert.is(badFormatResult.exitCode, 1);
});

test("CLI argument validation contract", async () => {
  // Invalid count should handle gracefully
  const result1 = await runCLI(["-n", "0"]);
  assert.is(result1.exitCode, 0); // Should default to 1
  assert.is(result1.stdout.trim().length, 27);

  const result2 = await runCLI(["-n", "abc"]);
  assert.is(result2.exitCode, 0); // Should default to 1
  assert.is(result2.stdout.trim().length, 27);

  const result3 = await runCLI(["-n", "-5"]);
  assert.is(result3.exitCode, 0); // Should default to 1
  assert.is(result3.stdout.trim().length, 27);
});

test.run();
