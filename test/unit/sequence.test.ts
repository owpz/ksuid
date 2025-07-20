import { test } from "uvu";
import * as assert from "uvu/assert";
import { Sequence } from "../../src/sequence";
import { KSUID } from "../../src/ksuid";
import { Buffer } from "buffer";

test("Sequence basic functionality", () => {
  const seed = KSUID.random();
  const seq = new Sequence({ seed });

  const first = seq.next();
  const second = seq.next();

  assert.ok(first !== null);
  assert.ok(second !== null);

  // Should be different KSUIDs
  assert.not.equal(first.toString(), second.toString());

  // Should be ordered (first < second)
  assert.is(first.compare(second), -1);

  // Should share the same timestamp as seed
  assert.is(first.timestamp, seed.timestamp);
  assert.is(second.timestamp, seed.timestamp);
});

test("Sequence exhaustion", () => {
  const seed = KSUID.random();
  const seq = new Sequence({ seed });

  // Generate maximum number of IDs (65536)
  let count = 0;
  let id = seq.next();
  while (id !== null && count < 70000) {
    // Safety limit to prevent infinite loop
    id = seq.next();
    count++;
  }

  // Should have generated exactly 65536 + 1 (the last call returns null)
  assert.is(count, 65536);
  assert.is(id, null);
  assert.ok(seq.isExhausted());
});

test("Sequence bounds", () => {
  const seed = KSUID.random();
  const seq = new Sequence({ seed });

  const { min, max } = seq.bounds();

  // Min should be the first ID that would be generated
  assert.is(min.timestamp, seed.timestamp);

  // Max should be the last possible ID
  assert.is(max.timestamp, seed.timestamp);

  // Min should be less than max
  assert.is(min.compare(max), -1);
});

test("Sequence bounds after some generation", () => {
  const seed = KSUID.random();
  const seq = new Sequence({ seed });

  // Generate some IDs
  seq.next();
  seq.next();
  seq.next();

  const { min, max } = seq.bounds();

  // Min should now be the 4th ID (index 3)
  // Max should still be the maximum possible ID
  assert.is(min.compare(max), -1);
});

test("Sequence reset functionality", () => {
  const seed = KSUID.random();
  const seq = new Sequence({ seed });

  const first = seq.next();
  const second = seq.next();

  assert.ok(first !== null);
  assert.ok(second !== null);

  assert.is(seq.getCount(), 2);

  seq.reset();
  assert.is(seq.getCount(), 0);
  assert.not.ok(seq.isExhausted());

  // Should generate the same sequence again
  const firstAgain = seq.next();
  const secondAgain = seq.next();

  assert.ok(firstAgain !== null);
  assert.ok(secondAgain !== null);

  assert.is(first.toString(), firstAgain.toString());
  assert.is(second.toString(), secondAgain.toString());
});

test("Sequence with deterministic seed", () => {
  // Create a deterministic seed for reproducible tests
  const timestamp = 95004740;
  const payload = Buffer.from("669f7efd7b6fe812278486085878563d", "hex");
  const seed = KSUID.fromParts(timestamp, payload);

  const seq = new Sequence({ seed });

  const first = seq.next();
  const second = seq.next();

  assert.ok(first !== null);
  assert.ok(second !== null);

  // Both should have same timestamp as seed
  assert.is(first.timestamp, timestamp);
  assert.is(second.timestamp, timestamp);

  // Should be ordered
  assert.is(first.compare(second), -1);

  // The payloads should differ only in the last 2 bytes (sequence number)
  const firstPayload = first.payload;
  const secondPayload = second.payload;

  // First 14 bytes should be identical
  assert.ok(firstPayload.subarray(0, 14).equals(secondPayload.subarray(0, 14)));

  // Last 2 bytes should be different (sequence numbers 0 and 1)
  assert.not.equal(
    firstPayload.readUInt16BE(14),
    secondPayload.readUInt16BE(14),
  );
  assert.is(firstPayload.readUInt16BE(14), 0); // First sequence number
  assert.is(secondPayload.readUInt16BE(14), 1); // Second sequence number
});

test("Sequence ordering maintains lexicographic order", () => {
  const seed = KSUID.random();
  const seq = new Sequence({ seed });

  const ids: KSUID[] = [];
  for (let i = 0; i < 10; i++) {
    const id = seq.next();
    if (id) ids.push(id);
  }

  // Should be in ascending order
  for (let i = 0; i < ids.length - 1; i++) {
    assert.is(ids[i].compare(ids[i + 1]), -1);
  }

  // String representations should also be in order
  const strings = ids.map((id) => id.toString());
  const sorted = [...strings].sort();
  assert.equal(strings, sorted);
});

test.run();
