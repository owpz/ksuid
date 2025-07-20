import { test } from "uvu";
import * as assert from "uvu/assert";
import {
  KSUID,
  Base62,
  Uint128,
  Sequence,
  CompressedSet,
  CompressedSetIter,
  KSUIDError,
  isKSUIDError,
  KSUID_ERROR_CODES,
  sort,
  isSorted,
  compare,
} from "../../src/index";
import type { KSUIDErrorCode } from "../../src/index";
import { Buffer } from "buffer";

/**
 * API Contract Tests
 *
 * These tests ensure the public API contract remains stable.
 * Any breaking change to these contracts requires a MAJOR version bump.
 *
 * What constitutes a breaking change:
 * - Removing or renaming public classes, methods, or properties
 * - Changing method signatures (parameters, return types)
 * - Changing error types or error codes
 * - Removing exported constants or types
 * - Changing the behavior of existing methods in incompatible ways
 */

test("KSUID class API contract", () => {
  // Static methods exist and have correct signatures
  assert.type(KSUID.random, "function");
  assert.type(KSUID.parse, "function");
  assert.type(KSUID.parseOrNil, "function");
  assert.type(KSUID.fromBytes, "function");
  assert.type(KSUID.fromBytesOrNil, "function");
  assert.type(KSUID.fromParts, "function");
  assert.type(KSUID.fromPartsOrNil, "function");

  // KSUID.nil property exists
  assert.type(KSUID.nil, "object");
  assert.ok(KSUID.nil instanceof KSUID);

  // Create a KSUID instance to test instance methods
  const ksuid = KSUID.random();

  // Instance methods exist and have correct signatures
  assert.type(ksuid.toString, "function");
  assert.type(ksuid.toBuffer, "function");
  assert.type(ksuid.next, "function");
  assert.type(ksuid.prev, "function");
  assert.type(ksuid.compare, "function");
  // Note: KSUID doesn't have equals method, use compare() === 0
  assert.type(ksuid.isNil, "function");

  // Properties exist and have correct types
  assert.type(ksuid.timestamp, "number");
  assert.type(ksuid.payload, "object"); // Buffer
  assert.ok(Buffer.isBuffer(ksuid.payload));

  // Method return types are correct
  assert.type(ksuid.toString(), "string");
  assert.ok(Buffer.isBuffer(ksuid.toBuffer()));
  assert.ok(ksuid.next() instanceof KSUID);
  assert.ok(ksuid.prev() instanceof KSUID);
  assert.type(ksuid.compare(KSUID.random()), "number");
  // Note: Use compare() === 0 instead of equals()
  assert.type(ksuid.isNil(), "boolean");

  // String length contract
  assert.is(ksuid.toString().length, 27);

  // Buffer length contract
  assert.is(ksuid.toBuffer().length, 20);
  assert.is(ksuid.payload.length, 16);
});

test("KSUID static method signatures contract", () => {
  // Test parameter types and counts for static methods
  const validKsuidString = "0o5sKzFDBc56T8mbUP8wH1KpSX7";
  const validBuffer = Buffer.alloc(20);
  const validPayload = Buffer.alloc(16);
  const validTimestamp = 123456;

  // KSUID.parse(string): KSUID
  const parsed = KSUID.parse(validKsuidString);
  assert.ok(parsed instanceof KSUID);

  // KSUID.parseOrNil(string): KSUID (never throws)
  const parsedOrNil = KSUID.parseOrNil("invalid");
  assert.ok(parsedOrNil instanceof KSUID);
  assert.ok(parsedOrNil.isNil());

  // KSUID.fromBytes(Buffer): KSUID
  const fromBytes = KSUID.fromBytes(validBuffer);
  assert.ok(fromBytes instanceof KSUID);

  // KSUID.fromBytesOrNil(Buffer): KSUID (never throws)
  const fromBytesOrNil = KSUID.fromBytesOrNil(Buffer.alloc(19));
  assert.ok(fromBytesOrNil instanceof KSUID);
  assert.ok(fromBytesOrNil.isNil());

  // KSUID.fromParts(number, Buffer): KSUID
  const fromParts = KSUID.fromParts(validTimestamp, validPayload);
  assert.ok(fromParts instanceof KSUID);

  // KSUID.fromPartsOrNil(number, Buffer): KSUID (never throws)
  const fromPartsOrNil = KSUID.fromPartsOrNil(-1, validPayload);
  assert.ok(fromPartsOrNil instanceof KSUID);
  assert.ok(fromPartsOrNil.isNil());
});

test("Base62 class API contract", () => {
  // Static methods exist
  assert.type(Base62.encode, "function");
  assert.type(Base62.decode, "function");

  // Method signatures are correct
  const buffer = Buffer.alloc(20, 0x42);
  const encoded = Base62.encode(buffer);
  assert.type(encoded, "string");
  assert.is(encoded.length, 27);

  const decoded = Base62.decode(encoded);
  assert.ok(Buffer.isBuffer(decoded));
  assert.is(decoded.length, 20);

  // Round-trip compatibility
  assert.ok(buffer.equals(decoded));
});

test("Uint128 class API contract", () => {
  // Static factory methods exist
  assert.type(Uint128.zero, "function");
  assert.type(Uint128.one, "function");
  assert.type(Uint128.max, "function");
  assert.type(Uint128.makeUint128, "function");
  assert.type(Uint128.makeUint128FromPayload, "function");
  assert.type(Uint128.uint128Payload, "function");
  assert.type(Uint128.fromBuffer, "function");

  const uint128 = Uint128.zero();

  // Instance methods exist
  assert.type(uint128.add, "function");
  assert.type(uint128.sub, "function");
  assert.type(uint128.incr, "function");
  assert.type(uint128.decr, "function");
  assert.type(uint128.compare, "function");
  assert.type(uint128.equals, "function");
  assert.type(uint128.isZero, "function");
  assert.type(uint128.toString, "function");
  assert.type(uint128.bytes, "function");
  assert.type(uint128.toBuffer, "function");
  assert.type(uint128.ksuid, "function");
  assert.type(uint128.getLow, "function");
  assert.type(uint128.getHigh, "function");

  // Return types are correct
  assert.ok(uint128.add(Uint128.one()) instanceof Uint128);
  assert.ok(uint128.sub(Uint128.one()) instanceof Uint128);
  assert.ok(uint128.incr() instanceof Uint128);
  assert.ok(uint128.decr() instanceof Uint128);
  assert.type(uint128.compare(Uint128.one()), "number");
  assert.type(uint128.equals(Uint128.one()), "boolean");
  assert.type(uint128.isZero(), "boolean");
  assert.type(uint128.toString(), "string");
  assert.ok(Buffer.isBuffer(uint128.bytes()));
  assert.ok(Buffer.isBuffer(uint128.toBuffer()));
  assert.ok(Buffer.isBuffer(uint128.ksuid(123456)));
  assert.ok(typeof uint128.getLow() === "bigint");
  assert.ok(typeof uint128.getHigh() === "bigint");

  // Buffer lengths are correct
  assert.is(uint128.bytes().length, 16);
  assert.is(uint128.toBuffer().length, 16);
  assert.is(uint128.ksuid(123456).length, 20);
});

test("Sequence class API contract", () => {
  const seed = KSUID.random();
  const sequence = new Sequence({ seed });

  // Constructor accepts options with seed
  assert.ok(sequence instanceof Sequence);

  // Methods exist and have correct signatures
  assert.type(sequence.next, "function");
  assert.type(sequence.bounds, "function");
  assert.type(sequence.getCount, "function");
  assert.type(sequence.isExhausted, "function");
  assert.type(sequence.reset, "function");

  // Return types are correct
  const next = sequence.next();
  assert.ok(next === null || next instanceof KSUID);

  const bounds = sequence.bounds();
  assert.type(bounds, "object");
  assert.ok(bounds.min instanceof KSUID);
  assert.ok(bounds.max instanceof KSUID);

  assert.type(sequence.getCount(), "number");
  assert.type(sequence.isExhausted(), "boolean");

  // reset() returns void
  const resetResult = sequence.reset();
  assert.is(resetResult, undefined);
});

test("CompressedSet class API contract", () => {
  const ksuids = [KSUID.random(), KSUID.random(), KSUID.random()];

  // Static methods exist
  assert.type(CompressedSet.compress, "function");
  assert.type(CompressedSet.fromBuffer, "function");

  // CompressedSet.compress(...KSUIDs): CompressedSet
  const compressed = CompressedSet.compress(...ksuids);
  assert.ok(compressed instanceof CompressedSet);

  // CompressedSet.fromBuffer(Buffer): CompressedSet
  const buffer = compressed.toBuffer();
  const fromBuffer = CompressedSet.fromBuffer(buffer);
  assert.ok(fromBuffer instanceof CompressedSet);

  // Instance methods exist
  assert.type(compressed.iter, "function");
  assert.type(compressed.toArray, "function");
  assert.type(compressed.toBuffer, "function");

  // Return types are correct
  const iter = compressed.iter();
  assert.ok(iter instanceof CompressedSetIter);

  const array = compressed.toArray();
  assert.ok(Array.isArray(array));
  array.forEach((ksuid) => assert.ok(ksuid instanceof KSUID));

  assert.ok(Buffer.isBuffer(compressed.toBuffer()));
});

test("CompressedSetIter class API contract", () => {
  const ksuids = [KSUID.random(), KSUID.random()];
  const compressed = CompressedSet.compress(...ksuids);
  const iter = compressed.iter();

  // Methods exist
  assert.type(iter.next, "function");

  // Properties exist (accessed after next() call)
  iter.next();
  assert.type(iter.ksuid, "object");
  assert.ok(iter.ksuid instanceof KSUID);

  // next() returns boolean
  const hasNext = iter.next();
  assert.type(hasNext, "boolean");
});

test("KSUIDError class API contract", () => {
  // KSUIDError extends Error
  assert.ok(KSUIDError.prototype instanceof Error);

  // Static factory methods exist
  assert.type(KSUIDError.invalidStringLength, "function");
  assert.type(KSUIDError.invalidBufferLength, "function");
  assert.type(KSUIDError.invalidCharacter, "function");
  assert.type(KSUIDError.invalidTimestamp, "function");
  assert.type(KSUIDError.invalidInput, "function");
  assert.type(KSUIDError.malformedData, "function");

  // Create an error instance to test properties
  const error = KSUIDError.invalidStringLength("test", 27);

  // Properties exist and have correct types
  assert.type(error.code, "string");
  assert.type(error.message, "string");
  assert.type(error.name, "string");
  assert.is(error.name, "KSUIDError");

  // Optional properties
  assert.type(error.input, "string");
  assert.type(error.expected, "string");
  assert.type(error.actual, "string");

  // Error has stack trace
  assert.type(error.stack, "string");
});

test("Error codes contract", () => {
  // All error codes exist as constants
  assert.type(KSUID_ERROR_CODES.INVALID_LENGTH, "string");
  assert.type(KSUID_ERROR_CODES.INVALID_CHARACTER, "string");
  assert.type(KSUID_ERROR_CODES.INVALID_BUFFER_SIZE, "string");
  assert.type(KSUID_ERROR_CODES.INVALID_TIMESTAMP, "string");
  assert.type(KSUID_ERROR_CODES.INVALID_INPUT, "string");
  assert.type(KSUID_ERROR_CODES.MALFORMED_DATA, "string");
  assert.type(KSUID_ERROR_CODES.CORRUPTION_DETECTED, "string");
  assert.type(KSUID_ERROR_CODES.SEQUENCE_EXHAUSTED, "string");
  assert.type(KSUID_ERROR_CODES.OPERATION_FAILED, "string");

  // Error code values are stable
  assert.is(KSUID_ERROR_CODES.INVALID_LENGTH, "INVALID_LENGTH");
  assert.is(KSUID_ERROR_CODES.INVALID_CHARACTER, "INVALID_CHARACTER");
  assert.is(KSUID_ERROR_CODES.INVALID_BUFFER_SIZE, "INVALID_BUFFER_SIZE");
  assert.is(KSUID_ERROR_CODES.INVALID_TIMESTAMP, "INVALID_TIMESTAMP");
  assert.is(KSUID_ERROR_CODES.INVALID_INPUT, "INVALID_INPUT");
  assert.is(KSUID_ERROR_CODES.MALFORMED_DATA, "MALFORMED_DATA");
  assert.is(KSUID_ERROR_CODES.CORRUPTION_DETECTED, "CORRUPTION_DETECTED");
  assert.is(KSUID_ERROR_CODES.SEQUENCE_EXHAUSTED, "SEQUENCE_EXHAUSTED");
  assert.is(KSUID_ERROR_CODES.OPERATION_FAILED, "OPERATION_FAILED");
});

test("Error type guard contract", () => {
  // isKSUIDError function exists and works correctly
  assert.type(isKSUIDError, "function");

  const ksuidError = new KSUIDError("test", KSUID_ERROR_CODES.INVALID_LENGTH);
  const regularError = new Error("test");
  const notAnError = { message: "fake error" };

  assert.ok(isKSUIDError(ksuidError) === true);
  assert.ok(isKSUIDError(regularError) === false);
  assert.ok(isKSUIDError(notAnError) === false);
  assert.ok(isKSUIDError(null) === false);
  assert.ok(isKSUIDError(undefined) === false);
});

test("Sorting functions API contract", () => {
  // Functions exist
  assert.type(sort, "function");
  assert.type(isSorted, "function");
  assert.type(compare, "function");

  const ksuids = [KSUID.random(), KSUID.random(), KSUID.random()];

  // sort(KSUID[]): void (sorts in place)
  const ksuidsToSort = [...ksuids]; // make a copy
  const sortResult = sort(ksuidsToSort);
  assert.is(sortResult, undefined); // sort returns void
  assert.is(ksuidsToSort.length, ksuids.length);
  ksuidsToSort.forEach((ksuid) => assert.ok(ksuid instanceof KSUID));

  // isSorted(KSUID[]): boolean
  assert.type(isSorted(ksuids), "boolean");
  assert.type(isSorted(ksuidsToSort), "boolean");

  // compare(KSUID, KSUID): number
  const result = compare(ksuids[0], ksuids[1]);
  assert.type(result, "number");
  assert.ok(result === -1 || result === 0 || result === 1);
});

test("Exported types contract", () => {
  // Type exports should be available (this tests compilation)
  const errorCode: KSUIDErrorCode = KSUID_ERROR_CODES.INVALID_LENGTH;
  assert.type(errorCode, "string");
});

test("Error message format contract", () => {
  // Test that error messages follow consistent format
  try {
    KSUID.parse("invalid");
    assert.unreachable("Should have thrown");
  } catch (error) {
    assert.ok(isKSUIDError(error));
    // Error message should contain expected information
    assert.ok(error.message.includes("Invalid KSUID string"));
    assert.ok(error.message.includes("expected 27 characters"));
    assert.ok(error.message.includes("got 7"));
    assert.is(error.code, KSUID_ERROR_CODES.INVALID_LENGTH);
  }

  try {
    KSUID.fromBytes(Buffer.alloc(19));
    assert.unreachable("Should have thrown");
  } catch (error) {
    assert.ok(isKSUIDError(error));
    assert.ok(error.message.includes("Invalid KSUID"));
    assert.ok(error.message.includes("expected 20 bytes"));
    assert.ok(error.message.includes("got 19"));
    assert.is(error.code, KSUID_ERROR_CODES.INVALID_BUFFER_SIZE);
  }

  try {
    KSUID.fromParts(-1, Buffer.alloc(16));
    assert.unreachable("Should have thrown");
  } catch (error) {
    assert.ok(isKSUIDError(error));
    assert.ok(error.message.includes("Invalid timestamp"));
    assert.ok(error.message.includes("must be uint32"));
    assert.ok(error.message.includes("got -1"));
    assert.is(error.code, KSUID_ERROR_CODES.INVALID_TIMESTAMP);
  }
});

test("KSUID value constraints contract", () => {
  const ksuid = KSUID.random();

  // String representation is always 27 characters
  assert.is(ksuid.toString().length, 27);

  // Buffer representation is always 20 bytes
  assert.is(ksuid.toBuffer().length, 20);

  // Payload is always 16 bytes
  assert.is(ksuid.payload.length, 16);

  // Timestamp is always a number
  assert.type(ksuid.timestamp, "number");
  assert.ok(ksuid.timestamp >= 0);
  assert.ok(Number.isInteger(ksuid.timestamp));

  // Nil KSUID has specific properties
  assert.ok(KSUID.nil.isNil());
  assert.is(KSUID.nil.toString(), "000000000000000000000000000");
  assert.is(KSUID.nil.timestamp, 0);
  assert.ok(KSUID.nil.payload.equals(Buffer.alloc(16, 0)));
});

test("Method immutability contract", () => {
  const original = KSUID.random();
  const originalString = original.toString();
  const originalBuffer = original.toBuffer();

  // next() and prev() return new instances
  const next = original.next();
  const prev = original.prev();

  assert.ok(next !== original);
  assert.ok(prev !== original);
  assert.ok(next instanceof KSUID);
  assert.ok(prev instanceof KSUID);

  // Original KSUID is unchanged
  assert.is(original.toString(), originalString);
  assert.ok(original.toBuffer().equals(originalBuffer));

  // Uint128 operations return new instances
  const uint128 = Uint128.zero();
  const incremented = uint128.incr();
  const added = uint128.add(Uint128.one());

  assert.ok(incremented !== uint128);
  assert.ok(added !== uint128);
  assert.ok(incremented instanceof Uint128);
  assert.ok(added instanceof Uint128);

  // Original Uint128 is unchanged
  assert.ok(uint128.isZero());
});

test("Constants stability contract", () => {
  // KSUID.nil should always have the same value
  assert.is(KSUID.nil.compare(KSUID.nil), 0);
  assert.is(KSUID.nil.toString(), KSUID.nil.toString());

  // Constants should have stable values
  assert.is(Uint128.zero().toString(), Uint128.zero().toString());
  assert.is(Uint128.one().toString(), Uint128.one().toString());
  assert.is(Uint128.max().toString(), Uint128.max().toString());

  // Error codes should be immutable
  const originalCodes = { ...KSUID_ERROR_CODES };
  // Compare each property individually since object comparison might fail
  for (const [key, value] of Object.entries(originalCodes)) {
    assert.is(KSUID_ERROR_CODES[key as keyof typeof KSUID_ERROR_CODES], value);
  }
});

test.run();
