import { test } from "uvu";
import * as assert from "uvu/assert";
import { KSUID } from "../../src/ksuid";
import { Buffer } from "buffer";

test("KSUID.parseOrNil with valid KSUID", () => {
  const validKsuid = "0o5sKzFDBc56T8mbUP8wH1KpSX7";
  const result = KSUID.parseOrNil(validKsuid);

  assert.not.ok(result.isNil());
  assert.is(result.toString(), validKsuid);
});

test("KSUID.parseOrNil with invalid KSUID returns nil", () => {
  const invalidInputs = [
    "invalid",
    "toolong" + "0".repeat(25),
    "short",
    "",
    "!@#$%^&*()!@#$%^&*()!@#$%^&", // Actually invalid characters (length 27)
    "contains-invalid-char*123456", // Invalid characters (length 27)
  ];

  for (const invalid of invalidInputs) {
    const result = KSUID.parseOrNil(invalid);
    assert.ok(
      result.isNil(),
      `Expected nil for input: "${invalid}", got: ${result.toString()}`,
    );
  }
});

test("KSUID.fromBytesOrNil with valid buffer", () => {
  const validKsuid = KSUID.random();
  const buffer = validKsuid.toBuffer();

  const result = KSUID.fromBytesOrNil(buffer);
  assert.not.ok(result.isNil());
  assert.ok(result.toBuffer().equals(buffer));
});

test("KSUID.fromBytesOrNil with invalid buffer returns nil", () => {
  const invalidBuffers = [
    Buffer.alloc(19), // Too short
    Buffer.alloc(21), // Too long
    Buffer.alloc(0), // Empty
    Buffer.alloc(50), // Way too long
  ];

  for (const invalid of invalidBuffers) {
    const result = KSUID.fromBytesOrNil(invalid);
    assert.ok(result.isNil());
  }
});

test("KSUID.fromPartsOrNil with valid parts", () => {
  const timestamp = 95004740;
  const payload = Buffer.from("669f7efd7b6fe812278486085878563d", "hex");

  const result = KSUID.fromPartsOrNil(timestamp, payload);
  assert.not.ok(result.isNil());
  assert.is(result.timestamp, timestamp);
  assert.ok(result.payload.equals(payload));
});

test("KSUID.fromPartsOrNil with invalid payload returns nil", () => {
  const timestamp = 95004740;
  const invalidPayloads = [
    Buffer.alloc(15), // Too short
    Buffer.alloc(17), // Too long
    Buffer.alloc(0), // Empty
    Buffer.alloc(50), // Way too long
  ];

  for (const invalid of invalidPayloads) {
    const result = KSUID.fromPartsOrNil(timestamp, invalid);
    assert.ok(result.isNil());
  }
});

test("KSUID.fromBytes error message matches Go", () => {
  assert.throws(
    () => KSUID.fromBytes(Buffer.alloc(19)),
    "Valid KSUIDs are 20 bytes",
  );
});

test("KSUID.parse error message matches Go", () => {
  assert.throws(
    () => KSUID.parse("invalid"),
    "Valid encoded KSUIDs are 27 characters",
  );
});

test("KSUID.fromParts error message matches Go", () => {
  assert.throws(
    () => KSUID.fromParts(123, Buffer.alloc(15)),
    "Valid KSUID payloads are 16 bytes",
  );
});

test("KSUID.fromBytes with exact 20 bytes works", () => {
  const validBuffer = Buffer.alloc(20);
  const result = KSUID.fromBytes(validBuffer);
  // A buffer of all zeros is actually the nil KSUID
  assert.ok(result.isNil()); // This should be nil since it's all zeros
});

test("KSUID.fromBytes round trip", () => {
  const original = KSUID.random();
  const buffer = original.toBuffer();
  const reconstructed = KSUID.fromBytes(buffer);

  assert.is(original.compare(reconstructed), 0);
  assert.ok(original.toBuffer().equals(reconstructed.toBuffer()));
});

test("OrNil methods preserve original behavior on success", () => {
  const timestamp = 95004740;
  const payload = Buffer.from("669f7efd7b6fe812278486085878563d", "hex");
  const validString = "0o5sKzFDBc56T8mbUP8wH1KpSX7";

  // Compare regular methods with OrNil methods on valid input
  const fromParts = KSUID.fromParts(timestamp, payload);
  const fromPartsOrNil = KSUID.fromPartsOrNil(timestamp, payload);
  assert.is(fromParts.compare(fromPartsOrNil), 0);

  const parsed = KSUID.parse(validString);
  const parsedOrNil = KSUID.parseOrNil(validString);
  assert.is(parsed.compare(parsedOrNil), 0);

  const buffer = fromParts.toBuffer();
  const fromBytes = KSUID.fromBytes(buffer);
  const fromBytesOrNil = KSUID.fromBytesOrNil(buffer);
  assert.is(fromBytes.compare(fromBytesOrNil), 0);
});

test.run();
