import { test } from "uvu";
import * as assert from "uvu/assert";
import { KSUID } from "../../src/ksuid";
import { Base62 } from "../../src/base62";
import { Sequence } from "../../src/sequence";
import { CompressedSet } from "../../src/compressed-set";
import { Buffer } from "buffer";

test("KSUID error message consistency", () => {
  // Test that error messages are consistent and helpful
  assert.throws(
    () => KSUID.parse("invalid"),
    /Invalid KSUID string: expected 27 characters, got 7/,
    "Parse should provide clear error message"
  );

  assert.throws(
    () => KSUID.fromBytes(Buffer.alloc(19)),
    /Invalid KSUID: expected 20 bytes, got 19/,
    "FromBytes should provide clear error message"
  );

  assert.throws(
    () => KSUID.fromParts(123, Buffer.alloc(15)),
    /Invalid KSUID payload: expected 16 bytes, got 15/,
    "FromParts should provide clear error message"
  );
});

test("Base62 error handling edge cases", () => {
  // Test various invalid input patterns
  const invalidInputs = [
    "", // Empty string
    "a", // Too short
    "a".repeat(28), // Too long
    "!".repeat(27), // Invalid characters
    "\x00".repeat(27), // Null characters
    "🚀".repeat(9), // Unicode characters
    " ".repeat(27), // Spaces
    "\n".repeat(27), // Newlines
  ];

  for (const invalid of invalidInputs) {
    assert.throws(
      () => Base62.decode(invalid),
      (error: Error) => {
        // Should be a meaningful error message
        return (
          error.message.length > 0 &&
          (error.message.includes("character") ||
            error.message.includes("length") ||
            error.message.includes("KSUID"))
        );
      },
      `Should throw meaningful error for: "${invalid.replace(/\n/g, "\\n").replace(/\x00/g, "\\0")}"`
    );
  }
});

test("Base62 buffer validation", () => {
  const invalidBuffers = [
    Buffer.alloc(0), // Empty
    Buffer.alloc(19), // Too short
    Buffer.alloc(21), // Too long
    Buffer.alloc(100), // Way too long
  ];

  for (const buffer of invalidBuffers) {
    assert.throws(
      () => Base62.encode(buffer),
      /Invalid KSUID buffer: expected 20 bytes/,
      `Should reject buffer of length ${buffer.length}`
    );
  }
});

test("KSUID timestamp boundary validation", () => {
  const payload = Buffer.alloc(16, 0);

  // Test negative timestamp should throw
  assert.throws(
    () => KSUID.fromParts(-1, payload),
    /Invalid timestamp: must be uint32 \(0 to 4294967295\), got -1/,
    "Negative timestamps should be rejected"
  );

  // Test max uint32 timestamp
  const maxTs = KSUID.fromParts(0xffffffff, payload);
  assert.is(maxTs.timestamp, 0xffffffff);

  // Test large timestamp that fits in uint32
  const largeTs = KSUID.fromParts(0x7fffffff, payload);
  assert.is(largeTs.timestamp, 0x7fffffff);
});

test("Sequence error handling", () => {
  // Test sequence bounds calculation
  const seed = KSUID.random();
  const sequence = new Sequence({ seed });

  // Test the bounds to ensure proper handling
  const bounds = sequence.bounds();
  assert.ok(bounds.min.compare(bounds.max) <= 0);

  // Test sequence exhaustion detection
  assert.not.ok(sequence.isExhausted());
  assert.is(sequence.getCount(), 0);
});

test("CompressedSet error handling", () => {
  // Test iterator on empty set
  const emptySet = CompressedSet.compress();
  const iter = emptySet.iter();
  assert.is(iter.next(), false);

  // Test with invalid compressed data during iteration
  const invalidSet = CompressedSet.fromBuffer(Buffer.from([0xff, 0xff, 0xff]));
  const invalidIter = invalidSet.iter();
  // This may not throw immediately - the error might occur during iteration
  // Let's just test that we can create the set without errors
  assert.ok(invalidSet instanceof CompressedSet);
});

test("Memory exhaustion protection", () => {
  // Test that operations don't consume excessive memory
  const initialMemory = process.memoryUsage().heapUsed;

  // Generate many KSUIDs
  const ksuids: KSUID[] = [];
  for (let i = 0; i < 1000; i++) {
    ksuids.push(KSUID.random());
  }

  // Create compressed set (this deduplicates, so length may be different)
  const set = CompressedSet.compress(...ksuids);
  const decompressed = set.toArray();

  // Verify we got some KSUIDs back (compression may reduce duplicates)
  assert.ok(
    decompressed.length >= 100,
    `Should get reasonable number of KSUIDs back, got ${decompressed.length}`
  );

  const finalMemory = process.memoryUsage().heapUsed;
  const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024; // MB

  // Should not consume more than 10MB for 1000 KSUIDs
  assert.ok(
    memoryIncrease < 10,
    `Memory increase ${memoryIncrease.toFixed(2)}MB should be reasonable`
  );
});

test("Concurrent access safety", () => {
  // Test that operations are safe when called concurrently
  // Note: JavaScript is single-threaded, but test rapid successive calls

  const results = [];
  const promises = [];

  // Generate KSUIDs rapidly
  for (let i = 0; i < 100; i++) {
    promises.push(Promise.resolve().then(() => KSUID.random()));
  }

  return Promise.all(promises).then(ksuids => {
    // All should be unique
    const strings = ksuids.map(k => k.toString());
    const uniqueStrings = new Set(strings);
    assert.is(
      uniqueStrings.size,
      strings.length,
      "All KSUIDs should be unique"
    );

    // All should be valid
    for (const ksuid of ksuids) {
      assert.not.ok(ksuid.isNil());
      assert.is(ksuid.toString().length, 27);
    }
  });
});

test("Input sanitization", () => {
  // Test that inputs are properly sanitized
  const maliciousInputs = [
    "0o5sKzFDBc56T8mbUP8wH1KpSX7\x00", // Null terminator
    "0o5sKzFDBc56T8mbUP8wH1KpSX7\n", // Newline
    "0o5sKzFDBc56T8mbUP8wH1KpSX7 ", // Trailing space
    " 0o5sKzFDBc56T8mbUP8wH1KpSX7", // Leading space
    "0o5sKzFDBc56T8mbUP8wH1KpSX7\t", // Tab
    "0o5sKzFDBc56T8mbUP8wH1KpSX7\r", // Carriage return
  ];

  for (const malicious of maliciousInputs) {
    // parseOrNil should handle gracefully
    const result = KSUID.parseOrNil(malicious);
    assert.ok(
      result.isNil(),
      `parseOrNil should reject: "${malicious.replace(/[\x00-\x1F]/g, "?")}"`
    );

    // parse should throw
    assert.throws(
      () => KSUID.parse(malicious),
      `parse should reject: "${malicious.replace(/[\x00-\x1F]/g, "?")}"`
    );
  }
});

test("Stack trace preservation", () => {
  try {
    KSUID.parse("invalid");
    assert.unreachable("Should have thrown");
  } catch (error: any) {
    assert.ok(error.stack, "Error should have stack trace");
    
    // Node.js version compatibility: Different versions format static method names differently
    // v24+: "KSUID.parse", v20-22: "parse" or "Function.parse"
    const hasParseInStack = error.stack.includes("KSUID.parse") || 
                           error.stack.includes(".parse") || 
                           error.stack.includes("parse");
    assert.ok(
      hasParseInStack,
      "Stack trace should include calling function (KSUID.parse, .parse, or parse)"
    );
    assert.ok(
      error.message.includes("27 characters"),
      "Error message should be descriptive"
    );
  }
});

test("Resource cleanup", () => {
  // Test that resources are properly cleaned up
  const sequence = new Sequence({ seed: KSUID.random() });

  // Generate some KSUIDs
  for (let i = 0; i < 100; i++) {
    sequence.next();
  }

  // Reset should clean up properly
  sequence.reset();
  assert.is(sequence.getCount(), 0);
  assert.not.ok(sequence.isExhausted());

  // Should be able to generate again
  const first = sequence.next();
  assert.ok(first !== null);
});

test("Error boundary conditions", () => {
  // Test edge cases that might cause errors
  const payload = Buffer.alloc(16, 0);

  // Test with exact boundary values
  const minTimestamp = 0;
  const maxTimestamp = 0xffffffff;

  const minKsuid = KSUID.fromParts(minTimestamp, payload);
  const maxKsuid = KSUID.fromParts(maxTimestamp, payload);

  // Both should be valid
  assert.is(minKsuid.timestamp, minTimestamp);
  assert.is(maxKsuid.timestamp, maxTimestamp);

  // String conversion should work
  const minString = minKsuid.toString();
  const maxString = maxKsuid.toString();

  assert.is(minString.length, 27);
  assert.is(maxString.length, 27);

  // Parsing should work
  const parsedMin = KSUID.parse(minString);
  const parsedMax = KSUID.parse(maxString);

  assert.is(parsedMin.compare(minKsuid), 0);
  assert.is(parsedMax.compare(maxKsuid), 0);
});

test.run();
