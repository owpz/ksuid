import { Buffer } from "buffer";
import { KSUIDError } from "./errors";

const U64_MAX = 0xffffffffffffffffn;

export class Uint128 {
  // Store as [low, high] to match Go's uint128 [2]uint64 layout
  private readonly low: bigint;
  private readonly high: bigint;

  constructor(low: bigint, high: bigint) {
    // Ensure values are within uint64 bounds - explicit BigInt conversion to avoid implicit conversion warnings
    this.low = BigInt(low ?? 0n) & U64_MAX;
    this.high = BigInt(high ?? 0n) & U64_MAX;
  }

  static makeUint128(high: bigint, low: bigint): Uint128 {
    return new Uint128(low, high);
  }

  static makeUint128FromPayload(payload: Buffer): Uint128 {
    if (payload == null) {
      throw KSUIDError.invalidInput(payload, "payload");
    }

    if (payload.length !== 16) {
      throw KSUIDError.invalidBufferLength(payload, 16, "payload");
    }

    // Match Go: binary.BigEndian.Uint64(payload[:8]) for high, payload[8:] for low
    const high = payload.readBigUInt64BE(0);
    const low = payload.readBigUInt64BE(8);
    return new Uint128(low, high);
  }

  static uint128Payload(buffer: Buffer): Uint128 {
    // Extract 16-byte payload from KSUID buffer (skip first 4 bytes timestamp)
    const payload = buffer.subarray(4, 20);
    return Uint128.makeUint128FromPayload(payload);
  }

  static zero(): Uint128 {
    return new Uint128(0n, 0n);
  }

  static one(): Uint128 {
    return new Uint128(1n, 0n);
  }

  static max(): Uint128 {
    return new Uint128(U64_MAX, U64_MAX);
  }

  // Create a KSUID with given timestamp and this as payload
  ksuid(timestamp: number): Buffer {
    const out = Buffer.alloc(20);
    out.writeUInt32BE(timestamp, 0); // timestamp in first 4 bytes
    out.writeBigUInt64BE(this.high, 4); // high 8 bytes
    out.writeBigUInt64BE(this.low, 12); // low 8 bytes
    return out;
  }

  // Convert to 16-byte buffer (payload format)
  bytes(): Buffer {
    const out = Buffer.alloc(16);
    out.writeBigUInt64BE(this.high, 0); // high bytes first
    out.writeBigUInt64BE(this.low, 8); // low bytes second
    return out;
  }

  // Alias for bytes() for backward compatibility
  toBuffer(): Buffer {
    return this.bytes();
  }

  // Static method for creating from buffer
  static fromBuffer(buffer: Buffer): Uint128 {
    return Uint128.makeUint128FromPayload(buffer);
  }

  add(other: Uint128): Uint128 {
    // Add with carry handling
    const lowSum = BigInt(this.low) + BigInt(other.low);
    const carry = lowSum > U64_MAX ? 1n : 0n;
    const newLow = BigInt(lowSum) & U64_MAX;
    const newHigh =
      BigInt(BigInt(this.high) + BigInt(other.high) + carry) & U64_MAX;
    return new Uint128(newLow, newHigh);
  }

  sub(other: Uint128): Uint128 {
    // Subtract with borrow handling
    let newLow = BigInt(this.low) - BigInt(other.low);
    let borrow = 0n;

    if (newLow < 0n) {
      newLow += 1n << 64n;
      borrow = 1n;
    }

    const newHigh =
      BigInt(BigInt(this.high) - BigInt(other.high) - borrow) & U64_MAX;
    return new Uint128(newLow, newHigh);
  }

  incr(): Uint128 {
    const newLow = BigInt(this.low) + 1n;
    const carry = newLow > U64_MAX ? 1n : 0n;
    return new Uint128(
      BigInt(newLow) & U64_MAX,
      BigInt(BigInt(this.high) + carry) & U64_MAX
    );
  }

  decr(): Uint128 {
    let newLow = BigInt(this.low) - 1n;
    let borrow = 0n;

    if (newLow < 0n) {
      newLow += 1n << 64n;
      borrow = 1n;
    }

    const newHigh = BigInt(BigInt(this.high) - borrow) & U64_MAX;
    return new Uint128(newLow, newHigh);
  }

  compare(other: Uint128): number {
    if (BigInt(this.high) < BigInt(other.high)) return -1;
    if (BigInt(this.high) > BigInt(other.high)) return 1;
    if (BigInt(this.low) < BigInt(other.low)) return -1;
    if (BigInt(this.low) > BigInt(other.low)) return 1;
    return 0;
  }

  equals(other: Uint128): boolean {
    return (
      BigInt(this.low) === BigInt(other.low) &&
      BigInt(this.high) === BigInt(other.high)
    );
  }

  isZero(): boolean {
    return BigInt(this.low) === 0n && BigInt(this.high) === 0n;
  }

  toString(): string {
    return `0x${this.high.toString(16).padStart(16, "0")}${this.low.toString(16).padStart(16, "0")}`;
  }

  // Getters for internal values
  getLow(): bigint {
    return this.low;
  }

  getHigh(): bigint {
    return this.high;
  }
}
