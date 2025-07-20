import { test } from "uvu";
import * as assert from "uvu/assert";
import { sort, isSorted, compare } from "../../src/sort";
import { KSUID } from "../../src/ksuid";
import { Buffer } from "buffer";

test("sort() empty array", () => {
  const ids: KSUID[] = [];
  sort(ids);
  assert.is(ids.length, 0);
});

test("sort() single element", () => {
  const ids = [KSUID.random()];
  const original = ids[0].toString();
  sort(ids);
  assert.is(ids.length, 1);
  assert.is(ids[0].toString(), original);
});

test("sort() multiple KSUIDs", () => {
  // Generate several KSUIDs with different timestamps to ensure variety
  const ids: KSUID[] = [];
  for (let i = 0; i < 10; i++) {
    // Create KSUIDs with incrementing timestamps and random payloads
    const timestamp = 95004740 + i * 100; // Different timestamps
    const payload = Buffer.alloc(16);
    // Fill with random bytes
    for (let j = 0; j < 16; j++) {
      payload[j] = Math.floor(Math.random() * 256);
    }
    ids.push(KSUID.fromParts(timestamp, payload));
  }

  // Shuffle the array
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }

  // Ensure it's not already sorted
  assert.not.ok(isSorted(ids));

  // Sort it
  sort(ids);

  // Should now be sorted
  assert.ok(isSorted(ids));

  // Verify ordering
  for (let i = 0; i < ids.length - 1; i++) {
    assert.ok(ids[i].compare(ids[i + 1]) <= 0);
  }
});

test("isSorted() empty array returns true", () => {
  assert.ok(isSorted([]));
});

test("isSorted() single element returns true", () => {
  assert.ok(isSorted([KSUID.random()]));
});

test("isSorted() with sorted array returns true", () => {
  const ids = [
    KSUID.fromParts(
      95004740,
      Buffer.from("669f7efd7b6fe812278486085878563d", "hex"),
    ),
    KSUID.fromParts(
      95004741,
      Buffer.from("669f7efd7b6fe812278486085878563d", "hex"),
    ),
    KSUID.fromParts(
      95004742,
      Buffer.from("669f7efd7b6fe812278486085878563d", "hex"),
    ),
  ];

  assert.ok(isSorted(ids));
});

test("isSorted() with unsorted array returns false", () => {
  const ids = [
    KSUID.fromParts(
      95004742,
      Buffer.from("669f7efd7b6fe812278486085878563d", "hex"),
    ),
    KSUID.fromParts(
      95004740,
      Buffer.from("669f7efd7b6fe812278486085878563d", "hex"),
    ), // Out of order
    KSUID.fromParts(
      95004741,
      Buffer.from("669f7efd7b6fe812278486085878563d", "hex"),
    ),
  ];

  assert.not.ok(isSorted(ids));
});

test("compare() function works correctly", () => {
  const a = KSUID.fromParts(
    95004740,
    Buffer.from("669f7efd7b6fe812278486085878563d", "hex"),
  );
  const b = KSUID.fromParts(
    95004741,
    Buffer.from("669f7efd7b6fe812278486085878563d", "hex"),
  );
  const c = KSUID.fromParts(
    95004740,
    Buffer.from("669f7efd7b6fe812278486085878563d", "hex"),
  );

  assert.is(compare(a, b), -1); // a < b
  assert.is(compare(b, a), 1); // b > a
  assert.is(compare(a, c), 0); // a == c
});

test("sort() maintains stability for equal elements", () => {
  // Create multiple KSUIDs with same timestamp but different payloads
  const timestamp = 95004740;
  const ids = [
    KSUID.fromParts(
      timestamp,
      Buffer.from("669f7efd7b6fe812278486085878563d", "hex"),
    ),
    KSUID.fromParts(
      timestamp,
      Buffer.from("669f7efd7b6fe812278486085878563e", "hex"),
    ),
    KSUID.fromParts(
      timestamp,
      Buffer.from("669f7efd7b6fe812278486085878563f", "hex"),
    ),
  ];

  // These should already be sorted (same timestamp, different payloads in ascending order)
  assert.ok(isSorted(ids));

  // Reverse them
  ids.reverse();
  assert.not.ok(isSorted(ids));

  // Sort and verify they're back in order
  sort(ids);
  assert.ok(isSorted(ids));
});

test("sort() handles duplicate KSUIDs", () => {
  const ksuid = KSUID.fromParts(
    95004740,
    Buffer.from("669f7efd7b6fe812278486085878563d", "hex"),
  );
  const ids = [ksuid, ksuid, ksuid, ksuid, ksuid];

  sort(ids);
  assert.ok(isSorted(ids));
  assert.is(ids.length, 5);

  // All should be identical
  for (let i = 1; i < ids.length; i++) {
    assert.is(ids[i].compare(ids[0]), 0);
  }
});

test("sort() preserves array length", () => {
  const originalIds = [];
  for (let i = 0; i < 20; i++) {
    originalIds.push(KSUID.random());
  }

  const ids = [...originalIds]; // Copy
  const originalLength = ids.length;

  sort(ids);

  assert.is(ids.length, originalLength);
  assert.ok(isSorted(ids));
});

test("sort() performance with large array", () => {
  // Generate a large array of random KSUIDs
  const ids: KSUID[] = [];
  for (let i = 0; i < 1000; i++) {
    ids.push(KSUID.random());
  }

  const start = Date.now();
  sort(ids);
  const end = Date.now();

  assert.ok(isSorted(ids));
  // Should complete within reasonable time (generous limit for CI)
  assert.ok(
    end - start < 1000,
    `Sorting took ${end - start}ms, expected < 1000ms`,
  );
});

test.run();
