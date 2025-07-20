import { test } from "uvu";
import * as assert from "uvu/assert";
import { KSUID } from "../../src/ksuid";
import { Buffer } from "buffer";

/**
 * Cross-compatibility tests with Go implementation
 * These test vectors are generated from the reference Go implementation
 * to ensure 100% compatibility between Go and TypeScript versions.
 */

test("Go compatibility - known test vectors", () => {
  // Test vectors generated from Go segmentio/ksuid implementation
  const testVectors = [
    {
      description: "Standard KSUID with mixed payload",
      timestamp: 95004740,
      payload: "669f7efd7b6fe812278486085878563d",
      expectedString: "0o5sKzFDBc56T8mbUP8wH1KpSX7",
      expectedRaw: "05a9a844669f7efd7b6fe812278486085878563d",
    },
    {
      description: "KSUID with nil (zero) payload",
      timestamp: 95004740,
      payload: "00000000000000000000000000000000",
      expectedString: "0o5sKw7Z4xnYVLXEmaUv9lxG0C8",
      expectedRaw: "05a9a84400000000000000000000000000000000",
    },
    {
      description: "KSUID with max payload",
      timestamp: 95004740,
      payload: "ffffffffffffffffffffffffffffffff",
      expectedString: "0o5sL3ud7B3uapD0WkI3wf4VhoF",
      expectedRaw: "05a9a844ffffffffffffffffffffffffffffffff",
    },
    {
      description: "KSUID with timestamp at epoch",
      timestamp: 0,
      payload: "0123456789abcdef0123456789abcdef",
      expectedString: "000000296tiiBb3U904RIpygpjj",
      expectedRaw: "000000000123456789abcdef0123456789abcdef",
    },
    {
      description: "KSUID with large timestamp",
      timestamp: 2147483647, // Max int32
      payload: "deadbeefdeadbeefdeadbeefdeadbeef",
      expectedString: "IGL7CirdbzjSOihuGRwhdVqH3mh",
      expectedRaw: "7fffffffdeadbeefdeadbeefdeadbeefdeadbeef",
    },
  ];

  for (const vector of testVectors) {
    // Test KSUID generation from parts
    const payload = Buffer.from(vector.payload, "hex");
    const ksuid = KSUID.fromParts(vector.timestamp, payload);

    assert.is(
      ksuid.toString(),
      vector.expectedString,
      `${vector.description}: string encoding mismatch`,
    );
    assert.is(
      ksuid.toBuffer().toString("hex"),
      vector.expectedRaw,
      `${vector.description}: raw bytes mismatch`,
    );
    assert.is(
      ksuid.timestamp,
      vector.timestamp,
      `${vector.description}: timestamp extraction mismatch`,
    );
    assert.ok(
      ksuid.payload.equals(payload),
      `${vector.description}: payload extraction mismatch`,
    );

    // Test round-trip parsing
    const parsed = KSUID.parse(vector.expectedString);
    assert.is(
      parsed.toString(),
      vector.expectedString,
      `${vector.description}: round-trip string mismatch`,
    );
    assert.is(
      parsed.toBuffer().toString("hex"),
      vector.expectedRaw,
      `${vector.description}: round-trip raw bytes mismatch`,
    );
    assert.is(
      parsed.timestamp,
      vector.timestamp,
      `${vector.description}: round-trip timestamp mismatch`,
    );
    assert.ok(
      parsed.payload.equals(payload),
      `${vector.description}: round-trip payload mismatch`,
    );
  }
});

test("Go compatibility - next/prev operations", () => {
  // Test vectors for next/prev operations generated from Go implementation
  const nextPrevTests = [
    {
      original: "0o5sKzFDBc56T8mbUP8wH1KpSX7",
      expectedNext: "0o5sKzFDBc56T8mbUP8wH1KpSX8",
      expectedPrev: "0o5sKzFDBc56T8mbUP8wH1KpSX6",
    },
    {
      // Test payload overflow (max payload should increment timestamp)
      original: "0o5sL3ud7B3uapD0WkI3wf4VhoF", // max payload
      expectedNext: "0o5sL3ud7B3uapD0WkI3wf4VhoG", // next should have incremented timestamp
      expectedPrev: "0o5sL3ud7B3uapD0WkI3wf4VhoE",
    },
    {
      // Test nil KSUID next/prev
      original: "000000000000000000000000000",
      expectedNext: "000000000000000000000000001",
      expectedPrev: "aWgEPTl1tmebfsQzFP4bxwgy80V", // Should wrap to max
    },
  ];

  for (const test of nextPrevTests) {
    const original = KSUID.parse(test.original);
    const next = original.next();
    const prev = original.prev();

    assert.is(
      next.toString(),
      test.expectedNext,
      `Next operation mismatch for ${test.original}`,
    );
    assert.is(
      prev.toString(),
      test.expectedPrev,
      `Prev operation mismatch for ${test.original}`,
    );

    // Verify ordering (skip for nil case which has special underflow behavior)
    if (test.original !== "000000000000000000000000000") {
      assert.is(
        prev.compare(original),
        -1,
        "Prev should be less than original",
      );
      assert.is(
        original.compare(next),
        -1,
        "Original should be less than next",
      );
    } else {
      // Special case: nil KSUID prev wraps to max value
      assert.is(
        prev.compare(original),
        1,
        "Prev of nil should be max KSUID (greater)",
      );
      assert.is(
        original.compare(next),
        -1,
        "Original should be less than next",
      );
    }
  }
});

test("Go compatibility - edge cases", () => {
  // Test edge cases that are important for Go compatibility

  // Min KSUID (nil)
  const nil = KSUID.nil;
  assert.is(nil.toString(), "000000000000000000000000000");
  assert.is(nil.timestamp, 0);
  assert.ok(nil.payload.equals(Buffer.alloc(16, 0)));
  assert.ok(nil.isNil());

  // Parse nil KSUID
  const parsedNil = KSUID.parse("000000000000000000000000000");
  assert.ok(parsedNil.isNil());

  // Max theoretical KSUID string (all 'z' in base62)
  // This is the highest possible KSUID value
  const maxString = "aWgEPTl1tmebfsQzFP4bxwgy80V";
  const maxKSUID = KSUID.parse(maxString);
  assert.is(maxKSUID.toString(), maxString);
  assert.is(maxKSUID.timestamp, 4294967295); // Max uint32
  assert.ok(maxKSUID.payload.equals(Buffer.alloc(16, 0xff)));
});

test("Go compatibility - time conversion", () => {
  // Test time conversion matches Go exactly
  const testCases = [
    {
      timestamp: 0,
      expectedUnixTime: 1400000000, // KSUID epoch
    },
    {
      timestamp: 95004740,
      expectedUnixTime: 1495004740, // 2017-05-17T07:05:40Z
    },
    {
      timestamp: 4294967295, // Max uint32
      expectedUnixTime: 5694967295,
    },
  ];

  for (const testCase of testCases) {
    const payload = Buffer.alloc(16, 0);
    const ksuid = KSUID.fromParts(testCase.timestamp, payload);

    // Calculate time like Go does: (timestamp + epoch) * 1000 for JavaScript Date
    const expectedJSTime = testCase.expectedUnixTime * 1000;
    const actualJSTime = (ksuid.timestamp + 1400000000) * 1000;

    assert.is(
      actualJSTime,
      expectedJSTime,
      `Time conversion mismatch for timestamp ${testCase.timestamp}`,
    );
  }
});

test("Go compatibility - Base62 encoding edge cases", () => {
  // Test Base62 encoding for edge cases to ensure Go compatibility

  // Test leading zeros preservation
  const smallValue = KSUID.fromParts(
    0,
    Buffer.from("00000000000000000000000000000001", "hex"),
  );
  const smallString = smallValue.toString();
  assert.is(
    smallString.length,
    27,
    "KSUID strings must always be 27 characters",
  );
  assert.ok(
    smallString.startsWith("000000"),
    "Small values should have leading zeros",
  );

  // Test that we can parse it back
  const reparsed = KSUID.parse(smallString);
  assert.is(
    reparsed.compare(smallValue),
    0,
    "Round-trip should preserve value",
  );
});

test("Go compatibility - binary format", () => {
  // Test that our binary format exactly matches Go's
  const timestamp = 0x05a9a844; // 95004740 in hex
  const payload = Buffer.from("669f7efd7b6fe812278486085878563d", "hex");
  const ksuid = KSUID.fromParts(timestamp, payload);

  const buffer = ksuid.toBuffer();

  // First 4 bytes should be timestamp in big-endian
  assert.is(buffer.readUInt32BE(0), timestamp);

  // Next 16 bytes should be the payload
  const extractedPayload = buffer.subarray(4, 20);
  assert.ok(extractedPayload.equals(payload));

  // Total length should be 20
  assert.is(buffer.length, 20);
});

test("Go compatibility - parseOrNil behavior", () => {
  // Test parseOrNil matches Go behavior exactly

  // Valid KSUID should parse normally
  const valid = KSUID.parseOrNil("0o5sKzFDBc56T8mbUP8wH1KpSX7");
  assert.not.ok(valid.isNil());

  // Invalid inputs should return nil (not throw)
  const invalidInputs = [
    "invalid",
    "0o5sKzFDBc56T8mbUP8wH1KpSX", // too short
    "0o5sKzFDBc56T8mbUP8wH1KpSX77", // too long
    "!@#$%^&*()!@#$%^&*()!@#$%^&", // invalid characters
    "",
    "null",
    "undefined",
  ];

  for (const invalid of invalidInputs) {
    const result = KSUID.parseOrNil(invalid);
    assert.ok(result.isNil(), `parseOrNil should return nil for "${invalid}"`);
  }
});

test("Go compatibility - sorting behavior", () => {
  // Test that sorting produces the same order as Go
  const unsortedStrings = [
    "0o5sKzFDBc56T8mbUP8wH1KpSX7",
    "0o5sKw7Z4xnYVLXEmaUv9lxG0C8",
    "0o5sL3ud7B3uapD0WkI3wf4VhoF",
    "000000000000000000000000000",
    "00000D9NdrD0lJOOhLnBVfvWKK2",
  ];

  const ksuids = unsortedStrings.map((s) => KSUID.parse(s));

  // Sort using JavaScript's sort with our compare function
  const sorted = [...ksuids].sort((a, b) => a.compare(b));

  // Convert back to strings
  const sortedStrings = sorted.map((k) => k.toString());

  // Should be in lexicographic order (which matches chronological order for KSUIDs)
  const expectedOrder = [
    "000000000000000000000000000", // timestamp 0
    "00000D9NdrD0lJOOhLnBVfvWKK2", // timestamp 0, higher payload
    "0o5sKw7Z4xnYVLXEmaUv9lxG0C8", // timestamp 95004740, nil payload
    "0o5sKzFDBc56T8mbUP8wH1KpSX7", // timestamp 95004740, mid payload
    "0o5sL3ud7B3uapD0WkI3wf4VhoF", // timestamp 95004740, max payload
  ];

  assert.equal(
    sortedStrings,
    expectedOrder,
    "Sorting order should match Go implementation",
  );
});

test("Go compatibility - comprehensive round-trip", () => {
  // Test comprehensive round-trip compatibility with various formats
  const testKSUID = KSUID.parse("0o5sKzFDBc56T8mbUP8wH1KpSX7");

  // String round-trip
  const stringRT = KSUID.parse(testKSUID.toString());
  assert.is(stringRT.compare(testKSUID), 0);

  // Buffer round-trip
  const bufferRT = KSUID.fromBytes(testKSUID.toBuffer());
  assert.is(bufferRT.compare(testKSUID), 0);

  // Parts round-trip
  const partsRT = KSUID.fromParts(testKSUID.timestamp, testKSUID.payload);
  assert.is(partsRT.compare(testKSUID), 0);

  // All should be identical
  assert.is(stringRT.toString(), testKSUID.toString());
  assert.is(bufferRT.toString(), testKSUID.toString());
  assert.is(partsRT.toString(), testKSUID.toString());
});

test.run();
