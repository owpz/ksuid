import { test } from "uvu";
import * as assert from "uvu/assert";
import { Uint128 } from "../../src/uint128";
import { Buffer } from "buffer";

test("Uint128 zero constant", () => {
  const zero = Uint128.zero();
  assert.is(zero.isZero(), true);
  assert.ok(zero.toBuffer().equals(Buffer.alloc(16, 0)));
});

test("Uint128 one constant", () => {
  const one = Uint128.one();
  assert.is(one.isZero(), false);
  const buffer = Buffer.alloc(16, 0);
  buffer.writeUInt8(1, 15); // Little-endian byte order, last byte is 1
  assert.ok(one.bytes().equals(buffer));
});

test("Uint128 max constant", () => {
  const max = Uint128.max();
  assert.is(max.isZero(), false);
  assert.ok(max.bytes().equals(Buffer.alloc(16, 0xff)));
});

test("Uint128 increment operations", () => {
  const zero = Uint128.zero();
  const one = zero.incr();

  assert.is(one.compare(Uint128.one()), 0);
  assert.is(zero.compare(one), -1);
  assert.is(one.compare(zero), 1);
});

test("Uint128 increment overflow", () => {
  const max = Uint128.max();
  const overflowed = max.incr();

  // Should wrap to zero
  assert.is(overflowed.isZero(), true);
  assert.is(overflowed.compare(Uint128.zero()), 0);
});

test("Uint128 decrement operations", () => {
  const one = Uint128.one();
  const zero = one.decr();

  assert.is(zero.compare(Uint128.zero()), 0);
  assert.is(zero.isZero(), true);
});

test("Uint128 decrement underflow", () => {
  const zero = Uint128.zero();
  const underflowed = zero.decr();

  // Should wrap to max value
  assert.is(underflowed.compare(Uint128.max()), 0);
});

test("Uint128 addition operations", () => {
  const a = Uint128.makeUint128FromPayload(
    Buffer.from("00000000000000000000000000000005", "hex"),
  );
  const b = Uint128.makeUint128FromPayload(
    Buffer.from("00000000000000000000000000000003", "hex"),
  );
  const result = a.add(b);
  const expected = Uint128.makeUint128FromPayload(
    Buffer.from("00000000000000000000000000000008", "hex"),
  );

  assert.is(result.compare(expected), 0);
});

test("Uint128 addition with carry", () => {
  // Test carry propagation across 64-bit boundary
  const a = Uint128.makeUint128FromPayload(
    Buffer.from("00000000000000000000000000000000", "hex"),
  );
  const b = Uint128.makeUint128FromPayload(
    Buffer.from("FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF", "hex"),
  );
  const one = Uint128.one();

  const result = b.add(one);

  // Should wrap to zero
  assert.is(result.compare(Uint128.zero()), 0);
});

test("Uint128 subtraction operations", () => {
  const a = Uint128.makeUint128FromPayload(
    Buffer.from("00000000000000000000000000000008", "hex"),
  );
  const b = Uint128.makeUint128FromPayload(
    Buffer.from("00000000000000000000000000000003", "hex"),
  );
  const result = a.sub(b);
  const expected = Uint128.makeUint128FromPayload(
    Buffer.from("00000000000000000000000000000005", "hex"),
  );

  assert.is(result.compare(expected), 0);
});

test("Uint128 subtraction with borrow", () => {
  const zero = Uint128.zero();
  const one = Uint128.one();
  const result = zero.sub(one);
  const expected = Uint128.max();

  assert.is(result.compare(expected), 0);
});

test("Uint128 comparison operations", () => {
  const zero = Uint128.zero();
  const one = Uint128.one();
  const max = Uint128.max();

  // Zero comparisons
  assert.is(zero.compare(zero), 0);
  assert.is(zero.compare(one), -1);
  assert.is(zero.compare(max), -1);

  // One comparisons
  assert.is(one.compare(zero), 1);
  assert.is(one.compare(one), 0);
  assert.is(one.compare(max), -1);

  // Max comparisons
  assert.is(max.compare(zero), 1);
  assert.is(max.compare(one), 1);
  assert.is(max.compare(max), 0);
});

test("Uint128 buffer round-trip", () => {
  const testCases = [
    Buffer.alloc(16, 0),
    Buffer.alloc(16, 0xff),
    Buffer.from("0123456789ABCDEF0123456789ABCDEF", "hex"),
    Buffer.from("DEADBEEFDEADBEEFDEADBEEFDEADBEEF", "hex"),
  ];

  for (const buffer of testCases) {
    const uint128 = Uint128.makeUint128FromPayload(buffer);
    const roundTrip = uint128.bytes();
    assert.ok(
      buffer.equals(roundTrip),
      `Buffer round-trip failed for ${buffer.toString("hex")}`,
    );
  }
});

test("Uint128 invalid buffer length", () => {
  const invalidBuffers = [
    Buffer.alloc(15), // Too short
    Buffer.alloc(17), // Too long
    Buffer.alloc(0), // Empty
    Buffer.alloc(32), // Too long
  ];

  for (const buffer of invalidBuffers) {
    assert.throws(
      () => Uint128.makeUint128FromPayload(buffer),
      `Should throw for buffer length ${buffer.length}`,
    );
  }
});

test("Uint128 KSUID payload conversion", () => {
  const testBuffer = Buffer.from("0123456789ABCDEF0123456789ABCDEF", "hex");

  // Test static method
  const uint128 = Uint128.uint128Payload(
    Buffer.concat([Buffer.alloc(4), testBuffer]),
  );
  assert.ok(uint128.bytes().equals(testBuffer));
});

test("Uint128 KSUID generation", () => {
  const uint128 = Uint128.makeUint128FromPayload(
    Buffer.from("0123456789ABCDEF0123456789ABCDEF", "hex"),
  );
  const timestamp = 0x12345678;

  const ksuidBuffer = uint128.ksuid(timestamp);

  assert.is(ksuidBuffer.length, 20);
  assert.is(ksuidBuffer.readUInt32BE(0), timestamp);
  assert.ok(ksuidBuffer.subarray(4).equals(uint128.bytes()));
});

test("Uint128 high precision arithmetic", () => {
  // Test arithmetic with high-precision values
  const highValue = Uint128.makeUint128FromPayload(
    Buffer.from("FFFFFFFFFFFFFFF000000000000000FF", "hex"),
  );
  const increment = Uint128.makeUint128FromPayload(
    Buffer.from("00000000000000000000000000000001", "hex"),
  );

  const result = highValue.add(increment);
  const expected = Uint128.makeUint128FromPayload(
    Buffer.from("FFFFFFFFFFFFFFF00000000000000100", "hex"),
  );

  assert.is(result.compare(expected), 0);
});

test("Uint128 carry propagation edge cases", () => {
  // Test multiple carry propagations
  const nearCarry = Uint128.makeUint128FromPayload(
    Buffer.from("000000000000000FFFFFFFFFFFFFFFFF", "hex"),
  );
  const one = Uint128.one();

  const result = nearCarry.add(one);
  const expected = Uint128.makeUint128FromPayload(
    Buffer.from("00000000000000100000000000000000", "hex"),
  );

  assert.is(result.compare(expected), 0);
});

test("Uint128 performance with large operations", () => {
  // Test that operations complete in reasonable time
  const start = Date.now();

  let value = Uint128.zero();
  for (let i = 0; i < 10000; i++) {
    value = value.incr();
  }

  const end = Date.now();
  assert.ok(
    end - start < 100,
    "10k increment operations should complete within 100ms",
  );

  const expected = Uint128.makeUint128FromPayload(
    Buffer.from("00000000000000000000000000002710", "hex"),
  );
  assert.is(value.compare(expected), 0);
});

test.run();
