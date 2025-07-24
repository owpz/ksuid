#!/usr/bin/env ts-node

import { KSUID } from "../src/ksuid";
import { Buffer } from "buffer";

/**
 * Comprehensive comparison script to verify Go and TypeScript KSUID implementations
 * generate identical results for timestamps, strings, and all values.
 */

interface TestVector {
  description: string;
  timestamp: number;
  payload: string;
  expectedString: string;
  expectedRaw: string;
}

// Test vectors generated from Go implementation
const GO_TEST_VECTORS: TestVector[] = [
  {
    description: "Fixed timestamp with known payload",
    timestamp: 95004740,
    payload: "669f7efd7b6fe812278486085878563d",
    expectedString: "0o5sKzFDBc56T8mbUP8wH1KpSX7",
    expectedRaw: "05a9a844669f7efd7b6fe812278486085878563d",
  },
  {
    description: "Epoch timestamp (KSUID zero time)",
    timestamp: 0,
    payload: "deadbeefdeadbeefdeadbeefdeadbeef",
    expectedString: "000006mBhJfVeGABNuCXRQc2hOZ",
    expectedRaw: "00000000deadbeefdeadbeefdeadbeefdeadbeef",
  },
  {
    description: "Max timestamp with specific payload",
    timestamp: 4294967295, // Max uint32
    payload: "abcdef0123456789abcdef0123456789",
    expectedString: "aWgEPRC9f9y39AiMcAMCXnpvSIr",
    expectedRaw: "ffffffffabcdef0123456789abcdef0123456789",
  },
];

// Next/Prev test cases from Go
const NEXT_PREV_VECTORS = [
  {
    description: "Standard KSUID next/prev",
    input: "0o5sKzFDBc56T8mbUP8wH1KpSX7",
    expectedNext: "0o5sKzFDBc56T8mbUP8wH1KpSX8",
    expectedPrev: "0o5sKzFDBc56T8mbUP8wH1KpSX6",
  },
  {
    description: "Max payload case",
    input: "0o5sL3ud7B3uapD0WkI3wf4VhoF",
    expectedNext: "0o5sL3ud7B3uapD0WkI3wf4VhoG",
    expectedPrev: "0o5sL3ud7B3uapD0WkI3wf4VhoE",
  },
  {
    description: "Nil payload case",
    input: "0o5sKw7Z4xnYVLXEmaUv9lxG0C8",
    expectedNext: "0o5sKw7Z4xnYVLXEmaUv9lxG0C9",
    expectedPrev: "0o5sKw7Z4xnYVLXEmaUv9lxG0C7",
  },
  {
    description: "Nil KSUID edge case",
    input: "000000000000000000000000000",
    expectedNext: "000000000000000000000000001",
    expectedPrev: "aWgEPTl1tmebfsQzFP4bxwgy80V",
  },
];

function compareBasicGeneration() {
  console.log("=== BASIC GENERATION COMPARISON ===\n");

  let allPassed = true;

  for (const testCase of GO_TEST_VECTORS) {
    console.log(`Testing: ${testCase.description}`);

    const payload = Buffer.from(testCase.payload, "hex");
    const tsKsuid = KSUID.fromParts(testCase.timestamp, payload);

    // Compare timestamp extraction
    const extractedTimestamp = tsKsuid.timestamp;
    console.log(`  Input timestamp: ${testCase.timestamp}`);
    console.log(`  Extracted timestamp: ${extractedTimestamp}`);
    const timestampMatch = extractedTimestamp === testCase.timestamp;
    console.log(`  ✓ Timestamp match: ${timestampMatch}`);

    // Compare string representation
    const tsString = tsKsuid.toString();
    console.log(`  Expected string: ${testCase.expectedString}`);
    console.log(`  Generated string: ${tsString}`);
    const stringMatch = tsString === testCase.expectedString;
    console.log(`  ✓ String match: ${stringMatch}`);

    // Compare raw buffer
    const tsRaw = tsKsuid.toBuffer().toString("hex");
    console.log(`  Expected raw: ${testCase.expectedRaw}`);
    console.log(`  Generated raw: ${tsRaw}`);
    const rawMatch = tsRaw === testCase.expectedRaw;
    console.log(`  ✓ Raw bytes match: ${rawMatch}`);

    // Compare payload extraction
    const extractedPayload = tsKsuid.payload.toString("hex");
    console.log(`  Input payload: ${testCase.payload}`);
    console.log(`  Extracted payload: ${extractedPayload}`);
    const payloadMatch = extractedPayload === testCase.payload;
    console.log(`  ✓ Payload match: ${payloadMatch}`);

    const testPassed =
      timestampMatch && stringMatch && rawMatch && payloadMatch;
    console.log(`  → Test Result: ${testPassed ? "PASS" : "FAIL"}\n`);

    if (!testPassed) allPassed = false;
  }

  return allPassed;
}

function compareNextPrevOperations() {
  console.log("=== NEXT/PREV OPERATIONS COMPARISON ===\n");

  let allPassed = true;

  for (const testCase of NEXT_PREV_VECTORS) {
    console.log(`Testing: ${testCase.description}`);

    const ksuid = KSUID.parse(testCase.input);
    const next = ksuid.next();
    const prev = ksuid.prev();

    console.log(`  Input: ${testCase.input}`);
    console.log(`  Expected next: ${testCase.expectedNext}`);
    console.log(`  Generated next: ${next.toString()}`);
    const nextMatch = next.toString() === testCase.expectedNext;
    console.log(`  ✓ Next match: ${nextMatch}`);

    console.log(`  Expected prev: ${testCase.expectedPrev}`);
    console.log(`  Generated prev: ${prev.toString()}`);
    const prevMatch = prev.toString() === testCase.expectedPrev;
    console.log(`  ✓ Prev match: ${prevMatch}`);

    const testPassed = nextMatch && prevMatch;
    console.log(`  → Test Result: ${testPassed ? "PASS" : "FAIL"}\n`);

    if (!testPassed) allPassed = false;
  }

  return allPassed;
}

function compareTimestampConversion() {
  console.log("=== TIMESTAMP CONVERSION COMPARISON ===\n");

  const KSUID_EPOCH = 1400000000; // 2014-05-13T16:53:20Z

  const testCases = [
    { ksuidTimestamp: 0, description: "KSUID epoch" },
    { ksuidTimestamp: 95004740, description: "Standard timestamp" },
    { ksuidTimestamp: 4294967295, description: "Maximum timestamp" },
  ];

  let allPassed = true;

  for (const testCase of testCases) {
    console.log(`Testing: ${testCase.description}`);

    const ksuid = KSUID.fromParts(testCase.ksuidTimestamp, Buffer.alloc(16, 0));
    const extractedTimestamp = ksuid.timestamp;
    const unixTimestamp = extractedTimestamp + KSUID_EPOCH;
    const expectedUnixTimestamp = testCase.ksuidTimestamp + KSUID_EPOCH;

    console.log(`  KSUID timestamp: ${testCase.ksuidTimestamp}`);
    console.log(`  Extracted timestamp: ${extractedTimestamp}`);
    console.log(`  Calculated Unix timestamp: ${unixTimestamp}`);
    console.log(`  Expected Unix timestamp: ${expectedUnixTimestamp}`);

    const timestampMatch = extractedTimestamp === testCase.ksuidTimestamp;
    const unixMatch = unixTimestamp === expectedUnixTimestamp;

    console.log(`  ✓ KSUID timestamp match: ${timestampMatch}`);
    console.log(`  ✓ Unix timestamp match: ${unixMatch}`);

    const testPassed = timestampMatch && unixMatch;
    console.log(`  → Test Result: ${testPassed ? "PASS" : "FAIL"}\n`);

    if (!testPassed) allPassed = false;
  }

  return allPassed;
}

function compareSequenceGeneration() {
  console.log("=== SEQUENCE GENERATION COMPARISON ===\n");

  // Go sequence test vectors
  const expectedSequence = [
    "0o5sKzFDBc56T8mbUP8wH1KpSX7",
    "0o5sKzFDBc56T8mbUP8wH1KpSX8",
    "0o5sKzFDBc56T8mbUP8wH1KpSX9",
    "0o5sKzFDBc56T8mbUP8wH1KpSXA",
    "0o5sKzFDBc56T8mbUP8wH1KpSXB",
  ];

  // Generate sequence using next() method
  let current = KSUID.parse(expectedSequence[0]);
  const tsSequence = [current.toString()];

  for (let i = 1; i < expectedSequence.length; i++) {
    current = current.next();
    tsSequence.push(current.toString());
  }

  console.log("Comparing sequence generation:");
  let allPassed = true;

  for (let i = 0; i < expectedSequence.length; i++) {
    const match = tsSequence[i] === expectedSequence[i];
    console.log(
      `  Step ${i}: Expected ${expectedSequence[i]}, Got ${tsSequence[i]} - ${match ? "PASS" : "FAIL"}`
    );
    if (!match) allPassed = false;
  }

  console.log(`  → Sequence Test Result: ${allPassed ? "PASS" : "FAIL"}\n`);

  return allPassed;
}

function compareBinaryFormat() {
  console.log("=== BINARY FORMAT COMPARISON ===\n");

  // Test exact binary format compatibility
  const testKSUID = KSUID.fromParts(
    0x05a9a844,
    Buffer.from("669f7efd7b6fe812278486085878563d", "hex")
  );

  const buffer = testKSUID.toBuffer();

  console.log("Binary format validation:");
  console.log(`  Buffer length: ${buffer.length} bytes (expected: 20)`);
  console.log(
    `  First 4 bytes (timestamp): ${buffer.subarray(0, 4).toString("hex")}`
  );
  console.log(
    `  Next 16 bytes (payload): ${buffer.subarray(4, 20).toString("hex")}`
  );
  console.log(`  Complete buffer: ${buffer.toString("hex")}`);

  const lengthCorrect = buffer.length === 20;
  const timestampCorrect = buffer.readUInt32BE(0) === 0x05a9a844;
  const payloadCorrect =
    buffer.subarray(4, 20).toString("hex") ===
    "669f7efd7b6fe812278486085878563d";
  const completeCorrect =
    buffer.toString("hex") === "05a9a844669f7efd7b6fe812278486085878563d";

  console.log(`  ✓ Length correct: ${lengthCorrect}`);
  console.log(`  ✓ Timestamp correct: ${timestampCorrect}`);
  console.log(`  ✓ Payload correct: ${payloadCorrect}`);
  console.log(`  ✓ Complete buffer correct: ${completeCorrect}`);

  const allPassed =
    lengthCorrect && timestampCorrect && payloadCorrect && completeCorrect;
  console.log(
    `  → Binary Format Test Result: ${allPassed ? "PASS" : "FAIL"}\n`
  );

  return allPassed;
}

function main() {
  console.log("🔍 KSUID Implementation Comparison: Go vs TypeScript\n");
  console.log("This script verifies that the TypeScript @owpz/ksuid library");
  console.log(
    "generates identical results to the Go segmentio/ksuid library.\n"
  );

  const results = [
    compareBasicGeneration(),
    compareNextPrevOperations(),
    compareTimestampConversion(),
    compareSequenceGeneration(),
    compareBinaryFormat(),
  ];

  const allTestsPassed = results.every(result => result);

  console.log("=== FINAL RESULTS ===");
  console.log(`Basic Generation: ${results[0] ? "PASS" : "FAIL"}`);
  console.log(`Next/Prev Operations: ${results[1] ? "PASS" : "FAIL"}`);
  console.log(`Timestamp Conversion: ${results[2] ? "PASS" : "FAIL"}`);
  console.log(`Sequence Generation: ${results[3] ? "PASS" : "FAIL"}`);
  console.log(`Binary Format: ${results[4] ? "PASS" : "FAIL"}`);
  console.log(
    `\n🎯 Overall Result: ${allTestsPassed ? "ALL TESTS PASS" : "SOME TESTS FAILED"}`
  );

  if (allTestsPassed) {
    console.log(
      "\n✅ The TypeScript implementation is fully compatible with the Go implementation!"
    );
    console.log("   - Timestamps match exactly");
    console.log("   - String representations are identical");
    console.log("   - Binary formats are byte-for-byte identical");
    console.log("   - Next/prev operations behave identically");
    console.log("   - All edge cases handled correctly");
  } else {
    console.log(
      "\n❌ There are compatibility issues that need to be addressed."
    );
  }

  process.exit(allTestsPassed ? 0 : 1);
}

if (require.main === module) {
  main();
}
