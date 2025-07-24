import { KSUID } from "./ksuid";
import { Uint128 } from "./uint128";
import { sort, isSorted } from "./sort";
import { Buffer } from "buffer";
import { KSUIDError } from "./errors";

// Constants matching Go implementation
const RAW_KSUID = 0;
const TIME_DELTA = 1 << 6;
const PAYLOAD_DELTA = 1 << 7;
const PAYLOAD_RANGE = (1 << 6) | (1 << 7);

/**
 * CompressedSet is an immutable data type which stores a set of KSUIDs
 * using compression techniques to minimize memory usage.
 */
export class CompressedSet {
  private constructor(private readonly content: Buffer) {}

  /**
   * Create a compressed set from an array of KSUIDs.
   */
  static compress(...ids: KSUID[]): CompressedSet {
    // Allocate a generous buffer - Go rule of thumb but with safety margin
    const capacity = Math.max(100, 1 + 20 + Math.floor(ids.length / 5));
    const buffer = Buffer.alloc(capacity * 10); // Much larger buffer for safety
    return new CompressedSet(CompressedSet.appendCompressed(buffer, ids));
  }

  /**
   * Create a compressed set from an existing buffer.
   */
  static fromBuffer(buffer: Buffer): CompressedSet {
    return new CompressedSet(Buffer.from(buffer));
  }

  /**
   * Returns an iterator that produces all KSUIDs in the set.
   */
  iter(): CompressedSetIter {
    return new CompressedSetIter(this.content);
  }

  /**
   * Convert to array of KSUIDs.
   */
  toArray(): KSUID[] {
    const result: KSUID[] = [];
    const iter = this.iter();
    while (iter.next()) {
      result.push(iter.ksuid);
    }
    return result;
  }

  /**
   * String representation showing all KSUIDs.
   */
  toString(): string {
    const ksuids = this.toArray().map(k => `"${k.toString()}"`);
    return `[${ksuids.join(", ")}]`;
  }

  /**
   * Get the raw buffer content.
   */
  toBuffer(): Buffer {
    return Buffer.from(this.content);
  }

  /**
   * Append compressed KSUIDs to a buffer.
   */
  private static appendCompressed(buffer: Buffer, ids: KSUID[]): Buffer {
    if (ids.length === 0) {
      return buffer.subarray(0, 0); // Empty buffer
    }

    // Create a copy and remove duplicates, then sort
    const uniqueIds: KSUID[] = [];
    const seen = new Set<string>();

    for (const id of ids) {
      const key = id.toString();
      if (!seen.has(key)) {
        seen.add(key);
        uniqueIds.push(id);
      }
    }

    if (!isSorted(uniqueIds)) {
      sort(uniqueIds);
    }

    if (uniqueIds.length === 0) {
      return buffer.subarray(0, 0);
    }

    let pos = 0;
    const one = Uint128.one();

    // Write first KSUID as raw
    buffer[pos++] = RAW_KSUID;
    const firstBuffer = uniqueIds[0].toBuffer();
    firstBuffer.copy(buffer, pos);
    pos += 20;

    let timestamp = uniqueIds[0].timestamp;
    let lastValue = Uint128.uint128Payload(uniqueIds[0].toBuffer());

    for (let i = 1; i < uniqueIds.length; i++) {
      const id = uniqueIds[i];

      const t = id.timestamp;
      const v = Uint128.uint128Payload(id.toBuffer());

      if (t !== timestamp) {
        // Timestamp changed - encode time delta
        const delta = t - timestamp;
        const deltaLength = CompressedSet.varintLength32(delta);

        buffer[pos++] = TIME_DELTA | deltaLength;
        CompressedSet.appendVarint32(buffer, pos, delta, deltaLength);
        pos += deltaLength;

        // Copy payload
        const payload = id.payload;
        payload.copy(buffer, pos);
        pos += 16;

        timestamp = t;
      } else {
        // Same timestamp - encode payload delta
        const delta = v.sub(lastValue);

        if (!delta.equals(one)) {
          // Not consecutive - encode delta
          const deltaLength = CompressedSet.varintLength128(delta);

          buffer[pos++] = PAYLOAD_DELTA | deltaLength;
          CompressedSet.appendVarint128(buffer, pos, delta, deltaLength);
          pos += deltaLength;
        } else {
          // Potentially consecutive - check if we have a range worth encoding
          const { length, count } = CompressedSet.rangeLength(
            uniqueIds.slice(i + 1),
            timestamp,
            id,
            v
          );

          if (length > 0) {
            // We have a range of consecutive KSUIDs - encode as range
            const rangeSize = length + 1;
            const rangeSizeLength = CompressedSet.varintLength64(rangeSize);

            buffer[pos++] = PAYLOAD_RANGE | rangeSizeLength;
            CompressedSet.appendVarint64(
              buffer,
              pos,
              rangeSize,
              rangeSizeLength
            );
            pos += rangeSizeLength;

            i += count;
            if (i < uniqueIds.length) {
              const newId = uniqueIds[i];
              lastValue = Uint128.uint128Payload(newId.toBuffer());
            } else {
              break; // We've processed all remaining IDs
            }
          } else {
            // Just one consecutive KSUID - encode as simple delta
            const deltaLength = CompressedSet.varintLength128(delta);

            buffer[pos++] = PAYLOAD_DELTA | deltaLength;
            CompressedSet.appendVarint128(buffer, pos, delta, deltaLength);
            pos += deltaLength;
          }
        }
      }

      // Update state for next iteration
      lastValue = v;
    }

    return buffer.subarray(0, pos);
  }

  private static rangeLength(
    ids: KSUID[],
    timestamp: number,
    lastKSUID: KSUID,
    lastValue: Uint128
  ): { length: number; count: number } {
    const one = Uint128.one();
    let length = 0;
    let count = 0;
    let currentValue = lastValue;

    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];

      // Skip duplicates (though we deduplicated already)
      if (id.toString() === lastKSUID.toString()) {
        count++;
        continue;
      }

      if (id.timestamp !== timestamp) {
        break;
      }

      const v = Uint128.uint128Payload(id.toBuffer());
      const expectedNext = currentValue.add(one);

      if (!v.equals(expectedNext)) {
        break;
      }

      lastKSUID = id;
      currentValue = v;
      length++;
      count++;
    }

    return { length, count };
  }

  // Varint encoding utilities
  private static varintLength128(v: Uint128): number {
    const high = v.getHigh();
    if (high !== 0n) {
      return 8 + CompressedSet.varintLength64BigInt(high);
    }
    return CompressedSet.varintLength64BigInt(v.getLow());
  }

  private static varintLength64(v: number): number {
    if ((v & 0xffffffffffffff00) === 0) return 1;
    if ((v & 0xffffffffffff0000) === 0) return 2;
    if ((v & 0xffffffffff000000) === 0) return 3;
    if ((v & 0xffffffff00000000) === 0) return 4;
    if ((v & 0xffffff0000000000) === 0) return 5;
    if ((v & 0xffff000000000000) === 0) return 6;
    if ((v & 0xff00000000000000) === 0) return 7;
    return 8;
  }

  private static varintLength64BigInt(v: bigint): number {
    if ((v & 0xffffffffffffff00n) === 0n) return 1;
    if ((v & 0xffffffffffff0000n) === 0n) return 2;
    if ((v & 0xffffffffff000000n) === 0n) return 3;
    if ((v & 0xffffffff00000000n) === 0n) return 4;
    if ((v & 0xffffff0000000000n) === 0n) return 5;
    if ((v & 0xffff000000000000n) === 0n) return 6;
    if ((v & 0xff00000000000000n) === 0n) return 7;
    return 8;
  }

  private static varintLength32(v: number): number {
    if ((v & 0xffffff00) === 0) return 1;
    if ((v & 0xffff0000) === 0) return 2;
    if ((v & 0xff000000) === 0) return 3;
    return 4;
  }

  private static appendVarint128(
    buffer: Buffer,
    offset: number,
    v: Uint128,
    length: number
  ): void {
    const bytes = v.bytes();
    bytes.subarray(16 - length).copy(buffer, offset);
  }

  private static appendVarint64(
    buffer: Buffer,
    offset: number,
    v: number,
    length: number
  ): void {
    const temp = Buffer.alloc(8);
    temp.writeBigUInt64BE(BigInt(v), 0);
    temp.subarray(8 - length).copy(buffer, offset);
  }

  private static appendVarint32(
    buffer: Buffer,
    offset: number,
    v: number,
    length: number
  ): void {
    const temp = Buffer.alloc(4);
    temp.writeUInt32BE(v, 0);
    temp.subarray(4 - length).copy(buffer, offset);
  }
}

/**
 * Iterator for decompressing and iterating through KSUIDs in a CompressedSet.
 */
export class CompressedSetIter {
  public ksuid: KSUID = KSUID.nil;

  private content: Buffer;
  private offset = 0;
  private seqlength = 0;
  private timestamp = 0;
  private lastValue: Uint128 = Uint128.zero();

  constructor(content: Buffer) {
    this.content = content;
  }

  /**
   * Advance to the next KSUID in the set.
   * Returns true if a KSUID was found, false if at end.
   */
  next(): boolean {
    if (this.seqlength > 0) {
      // We're in a sequence range
      const value = this.lastValue.incr();
      this.ksuid = KSUID.fromBytes(value.ksuid(this.timestamp));
      this.seqlength--;
      this.lastValue = value;
      return true;
    }

    if (this.offset >= this.content.length) {
      return false;
    }

    const b = this.content[this.offset++];
    const mask = RAW_KSUID | TIME_DELTA | PAYLOAD_DELTA | PAYLOAD_RANGE;
    const tag = b & mask;
    const cnt = b & ~mask;

    switch (tag) {
      case RAW_KSUID: {
        // Read raw 20-byte KSUID
        const ksuidBuffer = this.content.subarray(
          this.offset,
          this.offset + 20
        );
        this.ksuid = KSUID.fromBytes(ksuidBuffer);
        this.offset += 20;
        this.timestamp = this.ksuid.timestamp;
        this.lastValue = Uint128.uint128Payload(this.ksuid.toBuffer());
        break;
      }

      case TIME_DELTA: {
        // Read timestamp delta and payload
        const deltaBuffer = this.content.subarray(
          this.offset,
          this.offset + cnt
        );
        const delta = this.readVarint32(deltaBuffer);
        this.offset += cnt;

        this.timestamp += delta;

        const payloadBuffer = this.content.subarray(
          this.offset,
          this.offset + 16
        );
        this.offset += 16;

        const ksuidBuffer = Buffer.alloc(20);
        ksuidBuffer.writeUInt32BE(this.timestamp, 0);
        payloadBuffer.copy(ksuidBuffer, 4);

        this.ksuid = KSUID.fromBytes(ksuidBuffer);
        this.lastValue = Uint128.uint128Payload(this.ksuid.toBuffer());
        break;
      }

      case PAYLOAD_DELTA: {
        // Read payload delta
        const deltaBuffer = this.content.subarray(
          this.offset,
          this.offset + cnt
        );
        const delta = this.readVarint128(deltaBuffer);
        this.offset += cnt;

        const value = this.lastValue.add(delta);
        this.ksuid = KSUID.fromBytes(value.ksuid(this.timestamp));
        this.lastValue = value;
        break;
      }

      case PAYLOAD_RANGE: {
        // Read range length
        const lengthBuffer = this.content.subarray(
          this.offset,
          this.offset + cnt
        );
        const rangeLength = this.readVarint64(lengthBuffer);
        this.offset += cnt;

        const value = this.lastValue.incr();
        this.ksuid = KSUID.fromBytes(value.ksuid(this.timestamp));
        this.seqlength = rangeLength - 1;
        this.lastValue = value;
        break;
      }

      default:
        throw KSUIDError.malformedData(
          "invalid compression flag in KSUID set iterator"
        );
    }

    return true;
  }

  private readVarint32(buffer: Buffer): number {
    const temp = Buffer.alloc(4);
    buffer.copy(temp, 4 - buffer.length);
    return temp.readUInt32BE(0);
  }

  private readVarint64(buffer: Buffer): number {
    const temp = Buffer.alloc(8);
    buffer.copy(temp, 8 - buffer.length);
    return Number(temp.readBigUInt64BE(0));
  }

  private readVarint128(buffer: Buffer): Uint128 {
    const temp = Buffer.alloc(16);
    buffer.copy(temp, 16 - buffer.length);
    return Uint128.makeUint128FromPayload(temp);
  }
}
