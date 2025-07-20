import { test } from "uvu";
import * as assert from "uvu/assert";
import { CompressedSet } from "../../src/compressed-set";
import { KSUID } from "../../src/ksuid";
import { Buffer } from "buffer";

test("CompressedSet empty set", () => {
  const set = CompressedSet.compress();
  const ksuids = set.toArray();

  assert.is(ksuids.length, 0);
  assert.is(set.toString(), "[]");
});

test("CompressedSet single KSUID", () => {
  const ksuid = KSUID.random();
  const set = CompressedSet.compress(ksuid);
  const ksuids = set.toArray();

  assert.is(ksuids.length, 1);
  assert.is(ksuids[0].compare(ksuid), 0);
});

test("CompressedSet multiple KSUIDs", () => {
  const ksuids = [KSUID.random(), KSUID.random(), KSUID.random()];

  const set = CompressedSet.compress(...ksuids);
  const result = set.toArray();

  assert.is(result.length, 3);

  // Should be sorted
  for (let i = 0; i < result.length - 1; i++) {
    assert.ok(result[i].compare(result[i + 1]) <= 0);
  }
});

test("CompressedSet removes duplicates", () => {
  const ksuid = KSUID.random();
  const set = CompressedSet.compress(ksuid, ksuid, ksuid);
  const result = set.toArray();

  assert.is(result.length, 1);
  assert.is(result[0].compare(ksuid), 0);
});

test("CompressedSet with sequence of consecutive KSUIDs", () => {
  const base = KSUID.random();
  const ksuids = [base];

  // Create consecutive KSUIDs using next()
  for (let i = 0; i < 5; i++) {
    ksuids.push(ksuids[ksuids.length - 1].next());
  }

  const set = CompressedSet.compress(...ksuids);
  const result = set.toArray();

  assert.is(result.length, 6);

  // Verify they're still consecutive
  for (let i = 0; i < result.length - 1; i++) {
    const expected = result[i].next();
    assert.is(expected.compare(result[i + 1]), 0);
  }
});

test("CompressedSet iterator basic functionality", () => {
  const ksuids = [
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

  const set = CompressedSet.compress(...ksuids);
  const iter = set.iter();

  const result: KSUID[] = [];
  while (iter.next()) {
    result.push(iter.ksuid);
  }

  assert.is(result.length, 3);
  for (let i = 0; i < 3; i++) {
    assert.is(result[i].compare(ksuids[i]), 0);
  }
});

test("CompressedSet preserves ordering", () => {
  const ksuids: KSUID[] = [];

  // Create KSUIDs with different timestamps
  for (let i = 0; i < 10; i++) {
    const timestamp = 95004740 + i * 100;
    const payload = Buffer.alloc(16);
    payload.fill(i); // Different payload for each
    ksuids.push(KSUID.fromParts(timestamp, payload));
  }

  // Shuffle them
  const shuffled = [...ksuids];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const set = CompressedSet.compress(...shuffled);
  const result = set.toArray();

  // Debug the issue
  console.log("Expected length:", 10, "Actual length:", result.length);
  console.log(
    "Original KSUIDs:",
    ksuids.map((k) => k.toString()),
  );
  console.log(
    "Result KSUIDs:",
    result.map((k) => k.toString()),
  );

  // Should be back in original order (sorted)
  assert.is(result.length, 10);
  for (let i = 0; i < 10; i++) {
    assert.is(result[i].compare(ksuids[i]), 0);
  }
});

test("CompressedSet round trip", () => {
  const original = [
    KSUID.random(),
    KSUID.random(),
    KSUID.random(),
    KSUID.random(),
    KSUID.random(),
  ];

  const set = CompressedSet.compress(...original);
  const buffer = set.toBuffer();
  const restored = CompressedSet.fromBuffer(buffer);
  const result = restored.toArray();

  // Should have same KSUIDs (sorted)
  assert.is(result.length, original.length);

  const sortedOriginal = [...original].sort((a, b) => a.compare(b));

  for (let i = 0; i < result.length; i++) {
    assert.is(result[i].compare(sortedOriginal[i]), 0);
  }
});

test("CompressedSet compression efficiency", () => {
  // Create many KSUIDs with same timestamp (should compress well)
  const timestamp = 95004740;
  const ksuids: KSUID[] = [];

  for (let i = 0; i < 100; i++) {
    const payload = Buffer.alloc(16);
    payload.writeUInt32BE(i, 12); // Varying only last 4 bytes
    ksuids.push(KSUID.fromParts(timestamp, payload));
  }

  const set = CompressedSet.compress(...ksuids);
  const compressed = set.toBuffer();
  const uncompressed = Buffer.alloc(ksuids.length * 20); // 20 bytes per KSUID

  // Should be significantly smaller than uncompressed
  assert.ok(compressed.length < uncompressed.length);

  // But should still decompress to all KSUIDs
  const result = set.toArray();
  assert.is(result.length, 100);
});

test("CompressedSet handles mixed timestamp patterns", () => {
  const ksuids: KSUID[] = [];

  // Mix of same timestamp and different timestamps
  const baseTimestamp = 95004740;

  // Same timestamp, consecutive payloads
  for (let i = 0; i < 5; i++) {
    const payload = Buffer.alloc(16);
    payload.writeUInt32BE(i, 12);
    ksuids.push(KSUID.fromParts(baseTimestamp, payload));
  }

  // Different timestamp
  const payload2 = Buffer.alloc(16);
  ksuids.push(KSUID.fromParts(baseTimestamp + 100, payload2));

  // Back to original timestamp
  const payload3 = Buffer.alloc(16);
  payload3.writeUInt32BE(1000, 12);
  ksuids.push(KSUID.fromParts(baseTimestamp, payload3));

  const set = CompressedSet.compress(...ksuids);
  const result = set.toArray();

  // Should preserve all KSUIDs
  assert.is(result.length, 7);

  // Should be properly sorted
  for (let i = 0; i < result.length - 1; i++) {
    assert.ok(result[i].compare(result[i + 1]) <= 0);
  }
});

test("CompressedSet toString format", () => {
  const ksuid1 = KSUID.fromParts(
    95004740,
    Buffer.from("669f7efd7b6fe812278486085878563d", "hex"),
  );
  const ksuid2 = KSUID.fromParts(
    95004741,
    Buffer.from("669f7efd7b6fe812278486085878563d", "hex"),
  );

  const set = CompressedSet.compress(ksuid1, ksuid2);
  const str = set.toString();

  assert.ok(str.startsWith("["));
  assert.ok(str.endsWith("]"));
  assert.ok(str.includes(ksuid1.toString()));
  assert.ok(str.includes(ksuid2.toString()));
  assert.ok(str.includes('"'));
});

test.run();
