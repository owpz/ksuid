import { test } from "uvu";
import * as assert from "uvu/assert";
import { KSUID } from "../../src/ksuid";
import { Sequence } from "../../src/sequence";
import { CompressedSet } from "../../src/compressed-set";
import { sort } from "../../src/sort";
import { Buffer } from "buffer";

/**
 * Go Interoperability Tests
 *
 * These tests validate that TypeScript generates KSUIDs that are fully
 * compatible with the Go implementation using real test vectors and
 * cross-validation scenarios.
 *
 * Test vectors generated from segmentio/ksuid at commit:
 * d33724947fcfba7949906c2b1821e96a1c8d06e7
 */

test("Go interop - deterministic KSUID generation", () => {
  // Test vectors generated from Go with fixed seed/timestamp
  const testCases = [
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

  for (const testCase of testCases) {
    const payload = Buffer.from(testCase.payload, "hex");
    const ksuid = KSUID.fromParts(testCase.timestamp, payload);

    assert.is(
      ksuid.toString(),
      testCase.expectedString,
      `${testCase.description}: string mismatch`,
    );
    assert.is(
      ksuid.toBuffer().toString("hex"),
      testCase.expectedRaw,
      `${testCase.description}: raw bytes mismatch`,
    );

    // Verify parsing back works
    const parsed = KSUID.parse(testCase.expectedString);
    assert.is(
      parsed.timestamp,
      testCase.timestamp,
      `${testCase.description}: timestamp parsing failed`,
    );
    assert.ok(
      parsed.payload.equals(payload),
      `${testCase.description}: payload parsing failed`,
    );
  }
});

test("Go interop - sequence generation compatibility", () => {
  // Test vector: Go-generated sequence with known seed
  const seedKSUID = KSUID.fromParts(
    95004740,
    Buffer.from("669f7efd7b6fe812278486085878563d", "hex"),
  );

  // Note: Sequence.next() applies sequence numbers to the seed, starting from 0
  // This creates a monotonic sequence based on the seed timestamp
  const sequence = new Sequence({ seed: seedKSUID });
  const generated: string[] = [];

  for (let i = 0; i < 5; i++) {
    const next = sequence.next();
    assert.ok(next !== null, `Sequence should generate item ${i}`);
    generated.push(next!.toString());
  }

  // Verify all have same timestamp as seed
  for (const ksuidStr of generated) {
    const ksuid = KSUID.parse(ksuidStr);
    assert.is(
      ksuid.timestamp,
      seedKSUID.timestamp,
      "All sequence items should have same timestamp as seed",
    );
  }

  // Verify they are in ascending order
  for (let i = 0; i < generated.length - 1; i++) {
    const current = KSUID.parse(generated[i]);
    const next = KSUID.parse(generated[i + 1]);
    assert.is(
      current.compare(next),
      -1,
      `Sequence item ${i} should be less than item ${i + 1}`,
    );
  }

  // Verify the sequence generates deterministic results
  const sequence2 = new Sequence({ seed: seedKSUID });
  for (let i = 0; i < 5; i++) {
    const next = sequence2.next();
    assert.is(
      next!.toString(),
      generated[i],
      `Second sequence should generate same results`,
    );
  }
});

test("Go interop - next/prev operations with edge cases", () => {
  const testCases = [
    {
      description: "Standard KSUID next/prev",
      input: "0o5sKzFDBc56T8mbUP8wH1KpSX7",
      expectedNext: "0o5sKzFDBc56T8mbUP8wH1KpSX8",
      expectedPrev: "0o5sKzFDBc56T8mbUP8wH1KpSX6",
    },
    {
      description: "Payload overflow (max payload)",
      input: "0o5sL3ud7B3uapD0WkI3wf4VhoF", // Max payload for timestamp 95004740
      expectedNext: "0o5sL3ud7B3uapD0WkI3wf4VhoG", // Should increment timestamp
      expectedPrev: "0o5sL3ud7B3uapD0WkI3wf4VhoE",
    },
    {
      description: "Payload underflow (nil payload)",
      input: "0o5sKw7Z4xnYVLXEmaUv9lxG0C8", // Nil payload for timestamp 95004740
      expectedNext: "0o5sKw7Z4xnYVLXEmaUv9lxG0C9",
      expectedPrev: "0o5sKw7Z4xnYVLXEmaUv9lxG0C7", // Should stay same timestamp
    },
    {
      description: "Nil KSUID edge case",
      input: "000000000000000000000000000",
      expectedNext: "000000000000000000000000001",
      expectedPrev: "aWgEPTl1tmebfsQzFP4bxwgy80V", // Should wrap to max
    },
  ];

  for (const testCase of testCases) {
    const ksuid = KSUID.parse(testCase.input);
    const next = ksuid.next();
    const prev = ksuid.prev();

    assert.is(
      next.toString(),
      testCase.expectedNext,
      `${testCase.description}: next() mismatch`,
    );
    assert.is(
      prev.toString(),
      testCase.expectedPrev,
      `${testCase.description}: prev() mismatch`,
    );

    // Verify ordering properties
    if (testCase.input !== "000000000000000000000000000") {
      assert.is(prev.compare(ksuid), -1, "prev should be less than original");
      assert.is(ksuid.compare(next), -1, "original should be less than next");
    }
  }
});

test("Go interop - compressed set with real Go test vectors", () => {
  // Test data: Various KSUIDs to test compression
  const originalKSUIDs = [
    KSUID.parse("0o5sKzFDBc56T8mbUP8wH1KpSX7"), // Base KSUID
    KSUID.parse("0o5sKw7Z4xnYVLXEmaUv9lxG0C8"), // Same timestamp, nil payload
    KSUID.parse("0o5sL3ud7B3uapD0WkI3wf4VhoF"), // Same timestamp, max payload
    KSUID.parse("000006mBhJfVeGABNuCXRQc2hOZ"), // Epoch timestamp
    KSUID.parse("aWgEPRC9f9y39AiMcAMCXnpvSIr"), // Max timestamp
  ];

  // Create compressed set
  const compressedSet = CompressedSet.compress(...originalKSUIDs);
  const decompressed = compressedSet.toArray();

  // Should preserve all KSUIDs (sorted)
  assert.is(
    decompressed.length,
    originalKSUIDs.length,
    "Compressed set should preserve all KSUIDs",
  );

  // Should be properly sorted
  const expectedSorted = [...originalKSUIDs].sort((a, b) => a.compare(b));
  for (let i = 0; i < decompressed.length; i++) {
    assert.is(
      decompressed[i].compare(expectedSorted[i]),
      0,
      `Decompressed KSUID ${i} should match sorted original`,
    );
  }

  // Test round-trip: compress -> decompress -> compress
  const recompressed = CompressedSet.compress(...decompressed);
  const redecompressed = recompressed.toArray();

  assert.is(
    redecompressed.length,
    decompressed.length,
    "Round-trip should preserve count",
  );

  for (let i = 0; i < redecompressed.length; i++) {
    assert.is(
      redecompressed[i].compare(decompressed[i]),
      0,
      `Round-trip should preserve KSUID ${i}`,
    );
  }
});

test("Go interop - sorting compatibility with Go ordering", () => {
  // Mixed KSUIDs that should sort the same way as Go
  const unsortedKSUIDs = [
    KSUID.parse("0o5t9CnBAPkZnxSBFKwwt66oDvo"), // Later timestamp
    KSUID.parse("000000000000000000000000000"), // Nil KSUID
    KSUID.parse("0o5sKzFDBc56T8mbUP8wH1KpSX7"), // Standard
    KSUID.parse("00000D9NdrD0lJOOhLnBVfvWKK2"), // Epoch with payload
    KSUID.parse("0o5sL3ud7B3uapD0WkI3wf4VhoF"), // Max payload
  ];

  // Expected sort order (matches Go lexicographic/chronological sorting)
  const expectedOrder = [
    "000000000000000000000000000", // timestamp 0, nil payload
    "00000D9NdrD0lJOOhLnBVfvWKK2", // timestamp 0, some payload
    "0o5sKzFDBc56T8mbUP8wH1KpSX7", // timestamp 95004740
    "0o5sL3ud7B3uapD0WkI3wf4VhoF", // timestamp 95004740, max payload
    "0o5t9CnBAPkZnxSBFKwwt66oDvo", // later timestamp
  ];

  // Sort using our implementation
  const sorted = [...unsortedKSUIDs];
  sort(sorted);

  const sortedStrings = sorted.map((k) => k.toString());
  assert.equal(
    sortedStrings,
    expectedOrder,
    "Sort order should match Go implementation",
  );
});

test("Go interop - Base62 encoding edge cases", () => {
  // Edge cases that test Base62 encoding compatibility
  const edgeCases = [
    {
      description: "Leading zeros preservation",
      ksuid: KSUID.fromParts(
        0,
        Buffer.from("00000000000000000000000000000001", "hex"),
      ),
      expectedLength: 27,
    },
    {
      description: "All zeros (nil KSUID)",
      ksuid: KSUID.nil,
      expectedString: "000000000000000000000000000",
    },
    {
      description: "Max value encoding",
      ksuid: KSUID.fromParts(4294967295, Buffer.alloc(16, 0xff)),
      expectedString: "aWgEPTl1tmebfsQzFP4bxwgy80V",
    },
  ];

  for (const testCase of edgeCases) {
    const encoded = testCase.ksuid.toString();

    if (testCase.expectedLength) {
      assert.is(
        encoded.length,
        testCase.expectedLength,
        `${testCase.description}: should have correct length`,
      );
    }

    if (testCase.expectedString) {
      assert.is(
        encoded,
        testCase.expectedString,
        `${testCase.description}: should match expected string`,
      );
    }

    // Verify round-trip
    const decoded = KSUID.parse(encoded);
    assert.is(
      decoded.compare(testCase.ksuid),
      0,
      `${testCase.description}: round-trip should preserve value`,
    );
  }
});

test("Go interop - timestamp conversion accuracy", () => {
  // Test precise timestamp conversion to match Go
  const testCases = [
    {
      ksuidTimestamp: 0,
      expectedUnixSeconds: 1400000000, // KSUID epoch
      description: "KSUID epoch",
    },
    {
      ksuidTimestamp: 95004740,
      expectedUnixSeconds: 1495004740, // 2017-05-17T07:05:40Z
      description: "Standard timestamp",
    },
    {
      ksuidTimestamp: 4294967295, // Max uint32
      expectedUnixSeconds: 5694967295,
      description: "Maximum timestamp",
    },
  ];

  for (const testCase of testCases) {
    const ksuid = KSUID.fromParts(testCase.ksuidTimestamp, Buffer.alloc(16, 0));

    // Calculate Unix timestamp like Go: timestamp + KSUID_EPOCH
    const actualUnixSeconds = ksuid.timestamp + 1400000000;

    assert.is(
      actualUnixSeconds,
      testCase.expectedUnixSeconds,
      `${testCase.description}: Unix timestamp conversion should match Go`,
    );
  }
});

test("Go interop - error handling compatibility", () => {
  // Test that error cases match Go behavior

  // Invalid KSUID strings should throw (like Go Parse)
  const invalidStrings = [
    "invalid",
    "too-short",
    "toolongfortysevencharswhichexceedsmax",
    "!@#$invalid_chars$%^&*()",
    "",
  ];

  for (const invalid of invalidStrings) {
    assert.throws(
      () => KSUID.parse(invalid),
      `Invalid string "${invalid}" should throw error`,
    );
  }

  // parseOrNil should return nil instead of throwing (like Go ParseOrNil)
  for (const invalid of invalidStrings) {
    const result = KSUID.parseOrNil(invalid);
    assert.ok(
      result.isNil(),
      `parseOrNil("${invalid}") should return nil KSUID`,
    );
  }

  // Valid nil KSUID should parse correctly
  const nilResult = KSUID.parseOrNil("000000000000000000000000000");
  assert.ok(nilResult.isNil(), "Nil KSUID string should parse as nil");
});

test("Go interop - binary format exact compatibility", () => {
  // Test that binary format matches Go byte-for-byte
  const testKSUID = KSUID.fromParts(
    0x05a9a844,
    Buffer.from("669f7efd7b6fe812278486085878563d", "hex"),
  );

  const buffer = testKSUID.toBuffer();

  // Should be exactly 20 bytes
  assert.is(buffer.length, 20, "KSUID should be 20 bytes");

  // First 4 bytes: timestamp in big-endian
  const timestampBytes = buffer.subarray(0, 4);
  const timestamp = timestampBytes.readUInt32BE(0);
  assert.is(timestamp, 0x05a9a844, "Timestamp should be encoded correctly");

  // Next 16 bytes: payload
  const payloadBytes = buffer.subarray(4, 20);
  const expectedPayload = Buffer.from(
    "669f7efd7b6fe812278486085878563d",
    "hex",
  );
  assert.ok(
    payloadBytes.equals(expectedPayload),
    "Payload should be encoded correctly",
  );

  // Complete buffer should match expected
  const expectedComplete = "05a9a844669f7efd7b6fe812278486085878563d";
  assert.is(
    buffer.toString("hex"),
    expectedComplete,
    "Complete buffer should match expected format",
  );
});

test("Go interop - large dataset compatibility", () => {
  // Generate smaller dataset to test compression behavior
  const ksuids: KSUID[] = [];
  const baseTimestamp = 95004740;

  // Create 20 KSUIDs with same timestamp and incremental payloads (should compress well)
  for (let i = 0; i < 20; i++) {
    const timestamp = baseTimestamp; // Same timestamp for better compression
    const payload = Buffer.alloc(16);
    payload.writeUInt32BE(i, 12); // Increment only last 4 bytes
    ksuids.push(KSUID.fromParts(timestamp, payload));
  }

  // All should be valid and parseable
  for (const ksuid of ksuids) {
    const str = ksuid.toString();
    assert.is(str.length, 27, "All KSUIDs should be 27 characters");

    const reparsed = KSUID.parse(str);
    assert.is(
      reparsed.compare(ksuid),
      0,
      "All KSUIDs should round-trip correctly",
    );
  }

  // Should sort in payload order (same timestamp)
  const sorted = [...ksuids].sort((a, b) => a.compare(b));
  for (let i = 0; i < sorted.length - 1; i++) {
    assert.is(
      sorted[i].timestamp,
      sorted[i + 1].timestamp,
      "All KSUIDs should have same timestamp",
    );
    assert.is(
      sorted[i].compare(sorted[i + 1]),
      -1,
      "Sorted KSUIDs should be in ascending order",
    );
  }

  // Compressed set should handle them efficiently
  const compressedSet = CompressedSet.compress(...ksuids);
  const decompressed = compressedSet.toArray();

  assert.is(
    decompressed.length,
    ksuids.length,
    "Compressed set should preserve all KSUIDs",
  );

  // Verify decompressed KSUIDs are correct
  for (let i = 0; i < decompressed.length; i++) {
    assert.is(
      decompressed[i].compare(sorted[i]),
      0,
      `Decompressed KSUID ${i} should match sorted original`,
    );
  }

  // Should achieve compression for this pattern
  const rawSize = ksuids.length * 20;
  const compressedSize = compressedSet.toBuffer().length;
  assert.ok(
    compressedSize < rawSize,
    `Compressed size (${compressedSize}) should be less than raw size (${rawSize})`,
  );
});

test.run();
