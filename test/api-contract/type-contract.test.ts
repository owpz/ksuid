import { test } from "uvu";
import * as assert from "uvu/assert";

/**
 * TypeScript API Contract Tests
 *
 * These tests verify that TypeScript type signatures remain stable.
 * Breaking changes include:
 * - Changing parameter types or return types
 * - Making optional parameters required or vice versa
 * - Changing generic type constraints
 * - Removing or changing exported types
 * - Breaking type inference
 */

// Import all types and verify they exist
import type { KSUIDErrorCode } from "../../src/index";

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

import { Buffer } from "buffer";

test("KSUID type signatures", () => {
  // Static methods type signatures
  const random: KSUID = KSUID.random();
  const parsed: KSUID = KSUID.parse("0o5sKzFDBc56T8mbUP8wH1KpSX7");
  const parseOrNil: KSUID = KSUID.parseOrNil("anything");
  const fromBytes: KSUID = KSUID.fromBytes(Buffer.alloc(20));
  const fromBytesOrNil: KSUID = KSUID.fromBytesOrNil(Buffer.alloc(20));
  const fromParts: KSUID = KSUID.fromParts(123456, Buffer.alloc(16));
  const fromPartsOrNil: KSUID = KSUID.fromPartsOrNil(123456, Buffer.alloc(16));

  // Static property
  const nil: KSUID = KSUID.nil;

  // Instance methods type signatures
  const ksuid = KSUID.random();
  const toString: string = ksuid.toString();
  const toBuffer: Buffer = ksuid.toBuffer();
  const next: KSUID = ksuid.next();
  const prev: KSUID = ksuid.prev();
  const compare: number = ksuid.compare(KSUID.random());
  // Note: KSUID doesn't have equals method, use compare() === 0
  const isNil: boolean = ksuid.isNil();

  // Properties
  const timestamp: number = ksuid.timestamp;
  const payload: Buffer = ksuid.payload;

  // Verify all values are used (prevents unused variable warnings)
  assert.ok(random instanceof KSUID);
  assert.ok(parsed instanceof KSUID);
  assert.ok(parseOrNil instanceof KSUID);
  assert.ok(fromBytes instanceof KSUID);
  assert.ok(fromBytesOrNil instanceof KSUID);
  assert.ok(fromParts instanceof KSUID);
  assert.ok(fromPartsOrNil instanceof KSUID);
  assert.ok(nil instanceof KSUID);
  assert.type(toString, "string");
  assert.ok(Buffer.isBuffer(toBuffer));
  assert.ok(next instanceof KSUID);
  assert.ok(prev instanceof KSUID);
  assert.type(compare, "number");
  // assert.type(equals, "boolean"); // KSUID doesn't have equals method
  assert.type(isNil, "boolean");
  assert.type(timestamp, "number");
  assert.ok(Buffer.isBuffer(payload));
});

test("Base62 type signatures", () => {
  const buffer = Buffer.alloc(20);

  // Static methods
  const encoded: string = Base62.encode(buffer);
  const decoded: Buffer = Base62.decode(encoded);

  assert.type(encoded, "string");
  assert.ok(Buffer.isBuffer(decoded));
});

test("Uint128 type signatures", () => {
  // Static factory methods
  const zero: Uint128 = Uint128.zero();
  const one: Uint128 = Uint128.one();
  const max: Uint128 = Uint128.max();
  const makeUint128: Uint128 = Uint128.makeUint128(0n, 0n);
  const fromPayload: Uint128 = Uint128.makeUint128FromPayload(Buffer.alloc(16));
  const fromKsuidBuffer: Uint128 = Uint128.uint128Payload(Buffer.alloc(20));
  const fromBuffer: Uint128 = Uint128.fromBuffer(Buffer.alloc(16));

  // Instance methods
  const uint128 = Uint128.zero();
  const added: Uint128 = uint128.add(Uint128.one());
  const subtracted: Uint128 = uint128.sub(Uint128.one());
  const incremented: Uint128 = uint128.incr();
  const decremented: Uint128 = uint128.decr();
  const compared: number = uint128.compare(Uint128.one());
  const equal: boolean = uint128.equals(Uint128.one());
  const isZero: boolean = uint128.isZero();
  const string: string = uint128.toString();
  const bytes: Buffer = uint128.bytes();
  const buffer: Buffer = uint128.toBuffer();
  const ksuidBuffer: Buffer = uint128.ksuid(123456);
  const low: bigint = uint128.getLow();
  const high: bigint = uint128.getHigh();

  // Verify types
  assert.ok(zero instanceof Uint128);
  assert.ok(one instanceof Uint128);
  assert.ok(max instanceof Uint128);
  assert.ok(makeUint128 instanceof Uint128);
  assert.ok(fromPayload instanceof Uint128);
  assert.ok(fromKsuidBuffer instanceof Uint128);
  assert.ok(fromBuffer instanceof Uint128);
  assert.ok(added instanceof Uint128);
  assert.ok(subtracted instanceof Uint128);
  assert.ok(incremented instanceof Uint128);
  assert.ok(decremented instanceof Uint128);
  assert.type(compared, "number");
  assert.type(equal, "boolean");
  assert.type(isZero, "boolean");
  assert.type(string, "string");
  assert.ok(Buffer.isBuffer(bytes));
  assert.ok(Buffer.isBuffer(buffer));
  assert.ok(Buffer.isBuffer(ksuidBuffer));
  assert.ok(typeof low === "bigint");
  assert.ok(typeof high === "bigint");
});

test("Sequence type signatures", () => {
  // Constructor requires options with seed
  const options: { seed: KSUID } = { seed: KSUID.random() };
  const sequence = new Sequence(options);

  // Methods
  const next: KSUID | null = sequence.next();
  const bounds: { min: KSUID; max: KSUID } = sequence.bounds();
  const count: number = sequence.getCount();
  const exhausted: boolean = sequence.isExhausted();
  const reset: void = sequence.reset();

  assert.ok(sequence instanceof Sequence);
  assert.ok(next === null || next instanceof KSUID);
  assert.ok(bounds.min instanceof KSUID);
  assert.ok(bounds.max instanceof KSUID);
  assert.type(count, "number");
  assert.type(exhausted, "boolean");
  assert.is(reset, undefined);
});

test("CompressedSet type signatures", () => {
  const ksuids = [KSUID.random(), KSUID.random()];

  // Static methods
  const compressed: CompressedSet = CompressedSet.compress(...ksuids);
  const fromBuffer: CompressedSet = CompressedSet.fromBuffer(Buffer.alloc(10));

  // Instance methods
  const iter: CompressedSetIter = compressed.iter();
  const array: KSUID[] = compressed.toArray();
  const buffer: Buffer = compressed.toBuffer();

  assert.ok(compressed instanceof CompressedSet);
  assert.ok(fromBuffer instanceof CompressedSet);
  assert.ok(iter instanceof CompressedSetIter);
  assert.ok(Array.isArray(array));
  array.forEach(k => assert.ok(k instanceof KSUID));
  assert.ok(Buffer.isBuffer(buffer));
});

test("CompressedSetIter type signatures", () => {
  const compressed = CompressedSet.compress(KSUID.random());
  const iter = compressed.iter();

  // Methods and properties
  const hasNext: boolean = iter.next();

  // ksuid property is only available after next() returns true
  if (hasNext) {
    const ksuid: KSUID = iter.ksuid;
    assert.ok(ksuid instanceof KSUID);
  }

  assert.type(hasNext, "boolean");
});

test("KSUIDError type signatures", () => {
  // Constructor
  const error = new KSUIDError("message", KSUID_ERROR_CODES.INVALID_LENGTH, {
    input: "test",
    expected: "expected",
    actual: "actual",
    cause: new Error("cause"),
  });

  // Properties
  const code: KSUIDErrorCode = error.code;
  const message: string = error.message;
  const name: string = error.name;
  const input: unknown = error.input;
  const expected: string | undefined = error.expected;
  const actual: string | undefined = error.actual;
  const cause: Error | undefined = error.cause;
  const stack: string | undefined = error.stack;

  // Static factory methods
  const stringLengthError: KSUIDError = KSUIDError.invalidStringLength(
    "test",
    27
  );
  const bufferLengthError: KSUIDError = KSUIDError.invalidBufferLength(
    Buffer.alloc(10),
    20
  );
  const characterError: KSUIDError = KSUIDError.invalidCharacter("!", 0);
  const timestampError: KSUIDError = KSUIDError.invalidTimestamp(-1);
  const inputError: KSUIDError = KSUIDError.invalidInput(null, "param");
  const dataError: KSUIDError = KSUIDError.malformedData("context");

  assert.ok(error instanceof KSUIDError);
  assert.type(code, "string");
  assert.type(message, "string");
  assert.type(name, "string");
  assert.ok(input !== undefined);
  assert.ok(expected === undefined || typeof expected === "string");
  assert.ok(actual === undefined || typeof actual === "string");
  assert.ok(cause === undefined || cause instanceof Error);
  assert.ok(stack === undefined || typeof stack === "string");
  assert.ok(stringLengthError instanceof KSUIDError);
  assert.ok(bufferLengthError instanceof KSUIDError);
  assert.ok(characterError instanceof KSUIDError);
  assert.ok(timestampError instanceof KSUIDError);
  assert.ok(inputError instanceof KSUIDError);
  assert.ok(dataError instanceof KSUIDError);
});

test("Error codes type signatures", () => {
  // All error codes should be assignable to KSUIDErrorCode
  const invalidLength: KSUIDErrorCode = KSUID_ERROR_CODES.INVALID_LENGTH;
  const invalidChar: KSUIDErrorCode = KSUID_ERROR_CODES.INVALID_CHARACTER;
  const invalidBuffer: KSUIDErrorCode = KSUID_ERROR_CODES.INVALID_BUFFER_SIZE;
  const invalidTimestamp: KSUIDErrorCode = KSUID_ERROR_CODES.INVALID_TIMESTAMP;
  const invalidInput: KSUIDErrorCode = KSUID_ERROR_CODES.INVALID_INPUT;
  const malformed: KSUIDErrorCode = KSUID_ERROR_CODES.MALFORMED_DATA;
  const corruption: KSUIDErrorCode = KSUID_ERROR_CODES.CORRUPTION_DETECTED;
  const exhausted: KSUIDErrorCode = KSUID_ERROR_CODES.SEQUENCE_EXHAUSTED;
  const failed: KSUIDErrorCode = KSUID_ERROR_CODES.OPERATION_FAILED;

  assert.type(invalidLength, "string");
  assert.type(invalidChar, "string");
  assert.type(invalidBuffer, "string");
  assert.type(invalidTimestamp, "string");
  assert.type(invalidInput, "string");
  assert.type(malformed, "string");
  assert.type(corruption, "string");
  assert.type(exhausted, "string");
  assert.type(failed, "string");
});

test("Type guard signatures", () => {
  // isKSUIDError type guard
  const typeGuard: (error: unknown) => error is KSUIDError = isKSUIDError;

  const error = new KSUIDError("test", KSUID_ERROR_CODES.INVALID_LENGTH);
  const regularError = new Error("test");

  const isKsuidError1: boolean = isKSUIDError(error);
  const isKsuidError2: boolean = isKSUIDError(regularError);

  // Type narrowing should work
  if (isKSUIDError(error)) {
    const code: KSUIDErrorCode = error.code; // Should be properly typed
    assert.type(code, "string");
  }

  assert.type(typeGuard, "function");
  assert.type(isKsuidError1, "boolean");
  assert.type(isKsuidError2, "boolean");
});

test("Sorting function signatures", () => {
  const ksuids = [KSUID.random(), KSUID.random()];

  // Function signatures
  const sortFn: (ksuids: KSUID[]) => void = sort;
  const isSortedFn: (ksuids: KSUID[]) => boolean = isSorted;
  const compareFn: (a: KSUID, b: KSUID) => number = compare;

  // Usage
  const ksuidsToSort = [...ksuids];
  sort(ksuidsToSort); // sort returns void
  const checkSorted: boolean = isSorted(ksuids);
  const comparison: number = compare(ksuids[0], ksuids[1]);

  assert.type(sortFn, "function");
  assert.type(isSortedFn, "function");
  assert.type(compareFn, "function");
  assert.type(checkSorted, "boolean");
  assert.type(comparison, "number");
});

test("Parameter type constraints", () => {
  // These should compile without errors, testing parameter types

  // KSUID.parse only accepts string
  KSUID.parse("0o5sKzFDBc56T8mbUP8wH1KpSX7");
  // KSUID.parse(123); // Should cause TypeScript error

  // KSUID.fromBytes only accepts Buffer
  KSUID.fromBytes(Buffer.alloc(20));
  // KSUID.fromBytes("string"); // Should cause TypeScript error

  // KSUID.fromParts accepts number and Buffer
  KSUID.fromParts(123456, Buffer.alloc(16));
  // KSUID.fromParts("string", Buffer.alloc(16)); // Should cause TypeScript error

  // Uint128.makeUint128 accepts two bigints
  Uint128.makeUint128(0n, 0n);
  // Uint128.makeUint128(0, 0); // Should cause TypeScript error (number vs bigint)

  // KSUIDError constructor requires specific parameters
  new KSUIDError("message", KSUID_ERROR_CODES.INVALID_LENGTH);
  new KSUIDError("message", KSUID_ERROR_CODES.INVALID_LENGTH, {
    input: "test",
  });
  // new KSUIDError("message"); // Should cause TypeScript error (missing code)

  assert.ok(true); // If we get here, types compiled correctly
});

test("Return type constraints", () => {
  // These test that return types are properly typed

  const ksuid: KSUID = KSUID.random();
  const string: string = ksuid.toString();
  const buffer: Buffer = ksuid.toBuffer();
  const number: number = ksuid.timestamp;
  const boolean: boolean = ksuid.isNil();

  // Array return types
  const array: KSUID[] = CompressedSet.compress().toArray();
  const ksuidsForSort = [KSUID.random()];
  sort(ksuidsForSort); // sorts in place, returns void

  // Union return types
  const nextKsuid: KSUID | null = new Sequence({ seed: KSUID.random() }).next();

  // Verify types (prevents unused variable warnings)
  assert.ok(ksuid instanceof KSUID);
  assert.type(string, "string");
  assert.ok(Buffer.isBuffer(buffer));
  assert.type(number, "number");
  assert.type(boolean, "boolean");
  assert.ok(Array.isArray(array));
  assert.ok(nextKsuid === null || nextKsuid instanceof KSUID);
});

test("Generic type constraints", () => {
  // Test that generic types work correctly

  // Error codes should be constrained to valid values
  const validCode: KSUIDErrorCode = KSUID_ERROR_CODES.INVALID_LENGTH;
  // const invalidCode: KSUIDErrorCode = "NOT_A_REAL_CODE"; // Should cause TypeScript error

  // Optional parameters in constructors
  const errorWithOptions = new KSUIDError(
    "message",
    KSUID_ERROR_CODES.INVALID_LENGTH,
    {
      input: "test",
      expected: "expected",
      // actual and cause are optional
    }
  );

  const errorMinimal = new KSUIDError(
    "message",
    KSUID_ERROR_CODES.INVALID_LENGTH
  );

  assert.type(validCode, "string");
  assert.ok(errorWithOptions instanceof KSUIDError);
  assert.ok(errorMinimal instanceof KSUIDError);
});

test("Interface compatibility", () => {
  // Test that objects can be used where interfaces are expected

  // Sequence constructor options
  const options: { seed: KSUID } = { seed: KSUID.random() };
  const sequence = new Sequence(options);

  // Sequence bounds return type
  const bounds: { min: KSUID; max: KSUID } = sequence.bounds();

  assert.ok(sequence instanceof Sequence);
  assert.ok(bounds.min instanceof KSUID);
  assert.ok(bounds.max instanceof KSUID);
});

test("Module export types", () => {
  // Test that all expected exports are available and properly typed

  // Classes
  assert.type(KSUID, "function");
  assert.type(Base62, "function");
  assert.type(Uint128, "function");
  assert.type(Sequence, "function");
  assert.type(CompressedSet, "function");
  assert.type(CompressedSetIter, "function");
  assert.type(KSUIDError, "function");

  // Functions
  assert.type(isKSUIDError, "function");
  assert.type(sort, "function");
  assert.type(isSorted, "function");
  assert.type(compare, "function");

  // Constants
  assert.type(KSUID_ERROR_CODES, "object");

  // Type imports should work (tested by successful import at top of file)
  const errorCode: KSUIDErrorCode = KSUID_ERROR_CODES.INVALID_LENGTH;
  assert.type(errorCode, "string");
});

test.run();
