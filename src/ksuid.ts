import { Buffer } from "buffer";
import * as crypto from "crypto";
import { Base62 } from "./base62";
import { Uint128 } from "./uint128";
import { KSUIDError } from "./errors";

const EPOCH = 1400000000; // 2014-05-13T16:53:20Z
const TIMESTAMP_LENGTH = 4;
const PAYLOAD_LENGTH = 16;
const KSUID_LENGTH = TIMESTAMP_LENGTH + PAYLOAD_LENGTH;

export class KSUID {
  private constructor(private readonly buffer: Buffer) {
    if (buffer.length !== KSUID_LENGTH) {
      throw KSUIDError.invalidBufferLength(buffer, KSUID_LENGTH, "KSUID");
    }
  }

  static random(): KSUID {
    const now = Math.floor(Date.now() / 1000 - EPOCH);
    const payload = crypto.randomBytes(PAYLOAD_LENGTH);
    return KSUID.fromParts(now, payload);
  }

  static fromParts(timestamp: number, payload: Buffer): KSUID {
    // Validate timestamp
    if (
      timestamp == null ||
      !Number.isInteger(timestamp) ||
      timestamp < 0 ||
      timestamp > 0xffffffff
    ) {
      throw KSUIDError.invalidTimestamp(timestamp);
    }

    // Validate payload
    if (payload == null) {
      throw KSUIDError.invalidInput(payload, "payload");
    }

    if (payload.length !== PAYLOAD_LENGTH) {
      throw KSUIDError.invalidBufferLength(
        payload,
        PAYLOAD_LENGTH,
        "KSUID payload"
      );
    }

    const buffer = Buffer.alloc(KSUID_LENGTH);
    buffer.writeUInt32BE(timestamp, 0);
    payload.copy(buffer, TIMESTAMP_LENGTH);
    return new KSUID(buffer);
  }

  static parse(s: string): KSUID {
    if (s == null) {
      throw KSUIDError.invalidInput(s, "string");
    }

    if (s.length !== 27) {
      throw KSUIDError.invalidStringLength(s, 27);
    }

    const buffer = Base62.decode(s);
    return new KSUID(buffer);
  }

  static fromBytes(buffer: Buffer): KSUID {
    if (buffer == null) {
      throw KSUIDError.invalidInput(buffer, "buffer");
    }

    if (buffer.length !== KSUID_LENGTH) {
      throw KSUIDError.invalidBufferLength(buffer, KSUID_LENGTH, "KSUID");
    }

    return new KSUID(Buffer.from(buffer));
  }

  static parseOrNil(s: string): KSUID {
    try {
      return KSUID.parse(s);
    } catch {
      return KSUID.nil;
    }
  }

  static fromPartsOrNil(timestamp: number, payload: Buffer): KSUID {
    try {
      return KSUID.fromParts(timestamp, payload);
    } catch {
      return KSUID.nil;
    }
  }

  static fromBytesOrNil(buffer: Buffer): KSUID {
    try {
      return KSUID.fromBytes(buffer);
    } catch {
      return KSUID.nil;
    }
  }

  static get nil(): KSUID {
    return new KSUID(Buffer.alloc(KSUID_LENGTH));
  }

  get timestamp(): number {
    return this.buffer.readUInt32BE(0);
  }

  get payload(): Buffer {
    return this.buffer.subarray(TIMESTAMP_LENGTH);
  }

  toString(): string {
    return Base62.encode(this.buffer);
  }

  toBuffer(): Buffer {
    return this.buffer;
  }

  isNil(): boolean {
    return this.buffer.equals(KSUID.nil.buffer);
  }

  compare(other: KSUID): number {
    return this.buffer.compare(other.buffer);
  }

  // Next returns the next KSUID after this one
  next(): KSUID {
    const timestamp = this.timestamp;
    const payload = Uint128.uint128Payload(this.buffer);
    const nextPayload = payload.add(Uint128.one());

    // Check for payload overflow - if it wrapped to zero, increment timestamp
    if (nextPayload.isZero()) {
      const nextTimestamp = timestamp + 1;
      return KSUID.fromBytes(nextPayload.ksuid(nextTimestamp));
    } else {
      return KSUID.fromBytes(nextPayload.ksuid(timestamp));
    }
  }

  // Prev returns the previous KSUID before this one
  prev(): KSUID {
    const timestamp = this.timestamp;
    const payload = Uint128.uint128Payload(this.buffer);
    const prevPayload = payload.sub(Uint128.one());

    // Check for payload underflow - if it wrapped to max, decrement timestamp
    if (prevPayload.equals(Uint128.max())) {
      const prevTimestamp = timestamp - 1;
      // Handle timestamp underflow (can't go below 0)
      if (prevTimestamp < 0) {
        return KSUID.fromBytes(prevPayload.ksuid(0xffffffff));
      }
      return KSUID.fromBytes(prevPayload.ksuid(prevTimestamp));
    } else {
      return KSUID.fromBytes(prevPayload.ksuid(timestamp));
    }
  }
}
