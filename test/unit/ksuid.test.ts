import { test } from "uvu";
import * as assert from "uvu/assert";
import { KSUID } from "../../src/ksuid";
import { Buffer } from "buffer";

const EPOCH = 1400000000;

test("KSUID.random()", () => {
  const ksuid = KSUID.random();
  assert.instance(ksuid, KSUID);
  const now = Math.floor(Date.now() / 1000);
  const timestamp = ksuid.timestamp;
  assert.ok(timestamp + EPOCH <= now);
  assert.ok(now - (timestamp + EPOCH) < 5);
});

test("KSUID.parse() with valid ksuid", () => {
  const ksuidString = "0o5sKzFDBc56T8mbUP8wH1KpSX7";
  const ksuid = KSUID.parse(ksuidString);
  assert.is(ksuid.toString(), ksuidString);
  assert.is(ksuid.timestamp, 95004740);

  const expectedPayload = Buffer.from(
    "669f7efd7b6fe812278486085878563d",
    "hex",
  );

  assert.is(expectedPayload.length, 16);
  assert.ok(ksuid.payload.equals(expectedPayload));
});

test("KSUID.parse() with invalid ksuid", () => {
  assert.throws(() => KSUID.parse("not a ksuid"));
  assert.throws(() => KSUID.parse("short"));
  assert.throws(() => KSUID.parse("toolongtoolongtoolongtoolongtoolong"));
});

test("KSUID.fromParts()", () => {
  const timestamp = 95004740;
  const payload = Buffer.from("669f7efd7b6fe812278486085878563d", "hex");
  assert.is(payload.length, 16);
  const ksuid = KSUID.fromParts(timestamp, payload);
  assert.is(ksuid.toString(), "0o5sKzFDBc56T8mbUP8wH1KpSX7"); // from your generator output
});

test("KSUID.fromParts() with invalid parts", () => {
  const timestamp = 107608047;
  const payload = Buffer.from("short", "hex");
  assert.throws(() => KSUID.fromParts(timestamp, payload));
});

test("KSUID.nil", () => {
  assert.is(KSUID.nil.toString(), "000000000000000000000000000");
  assert.ok(KSUID.nil.isNil());
});

test("ksuid.isNil()", () => {
  const ksuid = KSUID.parse("0o5sKyVqJR4sM8e9rJ8sP9Q3c2s");
  assert.not.ok(ksuid.isNil());
});

test("ksuid.compare()", () => {
  const ksuid1 = KSUID.parse("0o5sKyVqJR4sM8e9rJ8sP9Q3c2s");
  const ksuid2 = KSUID.parse("0o5sKyVqJR4sM8e9rJ8sP9Q3c2s");
  const ksuid3 = KSUID.parse("0o5sL0VqJR4sM8e9rJ8sP9Q3c2t");
  assert.is(ksuid1.compare(ksuid2), 0);
  assert.is(ksuid1.compare(ksuid3), -1);
  assert.is(ksuid3.compare(ksuid1), 1);
});

test("sorting", () => {
  const ksuids = Array.from({ length: 5 }, () => KSUID.random());
  const sorted = [...ksuids].sort((a, b) => a.compare(b));
  for (let i = 0; i < sorted.length - 1; i++) {
    assert.ok(sorted[i].compare(sorted[i + 1]) <= 0);
  }
});

test("KSUID.nil() is 20 zero bytes and encodes to 27 zeros", () => {
  const nil = KSUID.nil;
  assert.ok(nil.toBuffer().equals(Buffer.alloc(20)));
  assert.is(nil.toString(), "000000000000000000000000000");
});

test("KSUID.compare() is consistent with buffer compare", () => {
  const a = KSUID.random();
  const b = KSUID.random();
  const result = a.compare(b);
  const expected = a.toBuffer().compare(b.toBuffer());
  assert.is(result, expected);
});

test("KSUID.isNil() returns true only for all-zero buffer", () => {
  const nil = KSUID.nil;
  assert.ok(nil.isNil());

  const nonNil = KSUID.random();
  assert.not.ok(nonNil.isNil());
});

test("KSUID.toBuffer() round-trip matches parse().toBuffer()", () => {
  const ksuid = KSUID.random();
  const parsed = KSUID.parse(ksuid.toString());
  assert.ok(parsed.toBuffer().equals(ksuid.toBuffer()));
});

test.run();
