import { test } from "uvu";
import * as assert from "uvu/assert";
import { KSUID } from "../../src/ksuid";
import { Buffer } from "buffer";

test("KSUID.next() basic functionality", () => {
  // Create a KSUID with a known payload
  const timestamp = 95004740;
  const payload = Buffer.from("669f7efd7b6fe812278486085878563d", "hex");
  const ksuid = KSUID.fromParts(timestamp, payload);

  const next = ksuid.next();

  // Should have same timestamp
  assert.is(next.timestamp, timestamp);

  // Should be greater when compared
  assert.is(ksuid.compare(next), -1);
  assert.is(next.compare(ksuid), 1);
});

test("KSUID.prev() basic functionality", () => {
  // Create a KSUID with a known payload (not all zeros)
  const timestamp = 95004740;
  const payload = Buffer.from("669f7efd7b6fe812278486085878563e", "hex"); // last byte is 3e, not 3d
  const ksuid = KSUID.fromParts(timestamp, payload);

  const prev = ksuid.prev();

  // Should have same timestamp
  assert.is(prev.timestamp, timestamp);

  // Should be less when compared
  assert.is(ksuid.compare(prev), 1);
  assert.is(prev.compare(ksuid), -1);
});

test("KSUID.next() with payload overflow", () => {
  // Create a KSUID with maximum payload (all 0xFF)
  const timestamp = 95004740;
  const payload = Buffer.alloc(16, 0xff);
  const ksuid = KSUID.fromParts(timestamp, payload);

  const next = ksuid.next();

  // Should increment timestamp due to payload overflow
  assert.is(next.timestamp, timestamp + 1);

  // Payload should wrap to all zeros
  const expectedPayload = Buffer.alloc(16, 0x00);
  assert.ok(next.payload.equals(expectedPayload));
});

test("KSUID.prev() with payload underflow", () => {
  // Create a KSUID with zero payload
  const timestamp = 95004740;
  const payload = Buffer.alloc(16, 0x00);
  const ksuid = KSUID.fromParts(timestamp, payload);

  const prev = ksuid.prev();

  // Should decrement timestamp due to payload underflow
  assert.is(prev.timestamp, timestamp - 1);

  // Payload should wrap to all 0xFF
  const expectedPayload = Buffer.alloc(16, 0xff);
  assert.ok(prev.payload.equals(expectedPayload));
});

test("KSUID.next().prev() round trip", () => {
  const original = KSUID.random();
  const roundTrip = original.next().prev();

  // Should return to original
  assert.is(original.compare(roundTrip), 0);
  assert.ok(original.toBuffer().equals(roundTrip.toBuffer()));
});

test("KSUID.prev().next() round trip", () => {
  // Use a KSUID that won't underflow
  const timestamp = 95004740;
  const payload = Buffer.from("669f7efd7b6fe812278486085878563d", "hex");
  const original = KSUID.fromParts(timestamp, payload);

  const roundTrip = original.prev().next();

  // Should return to original
  assert.is(original.compare(roundTrip), 0);
  assert.ok(original.toBuffer().equals(roundTrip.toBuffer()));
});

test("KSUID ordering with next/prev", () => {
  const base = KSUID.random();
  const prev = base.prev();
  const next = base.next();

  // Should maintain ordering: prev < base < next
  assert.is(prev.compare(base), -1);
  assert.is(base.compare(next), -1);
  assert.is(prev.compare(next), -1);
});

test.run();
