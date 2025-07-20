import { Buffer } from "buffer";
import { KSUIDError } from "./errors";

const BASE62_ALPHABET =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const BASE = BigInt(62);
const KSUID_BYTE_LENGTH = 20;
const ENCODED_STRING_LENGTH = 27;

// Pre-compute a map for character-to-value lookups for efficient decoding.
const CHAR_MAP: Map<string, bigint> = new Map();
for (let i = 0; i < BASE62_ALPHABET.length; i++) {
  CHAR_MAP.set(BASE62_ALPHABET[i], BigInt(i));
}

export class Base62 {
  /**
   * Encodes a 20-byte buffer into a 27-character Base62 string.
   * @param buffer The 20-byte buffer to encode.
   * @returns The Base62 encoded string.
   */
  static encode(buffer: Buffer): string {
    if (buffer == null) {
      throw KSUIDError.invalidInput(buffer, "buffer");
    }

    if (buffer.length !== KSUID_BYTE_LENGTH) {
      throw KSUIDError.invalidBufferLength(
        buffer,
        KSUID_BYTE_LENGTH,
        "KSUID buffer"
      );
    }

    // Convert the 20-byte buffer to a single large integer (BigInt).
    let num = BigInt("0x" + buffer.toString("hex"));

    // Handle the special case of a zero buffer (KSUID.nil).
    if (num === 0n) {
      return "0".repeat(ENCODED_STRING_LENGTH);
    }

    let encoded = "";
    // Repeatedly take the number modulo 62 to get the character for each position.
    while (num > 0n) {
      const remainder = num % BASE;
      num = num / BASE;
      encoded = BASE62_ALPHABET[Number(remainder)] + encoded;
    }

    // Pad the result with the zero-character ('0') to ensure a fixed length of 27.
    return encoded.padStart(ENCODED_STRING_LENGTH, "0");
  }

  /**
   * Decodes a Base62 string into a 20-byte buffer.
   * @param str The Base62 string to decode.
   * @returns A 20-byte buffer.
   */
  static decode(str: string): Buffer {
    if (str == null) {
      throw KSUIDError.invalidInput(str, "string");
    }

    if (str.length !== ENCODED_STRING_LENGTH) {
      throw KSUIDError.invalidStringLength(str, ENCODED_STRING_LENGTH);
    }

    let num = 0n;
    // Iterate through the string to build up the BigInt value.
    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      const value = CHAR_MAP.get(char);
      if (value === undefined) {
        throw KSUIDError.invalidCharacter(char, i);
      }
      // This is the core of base conversion: num = (num * base) + digit_value
      num = num * BASE + value;
    }

    // Convert the BigInt back to a hex string.
    const hex = num.toString(16).padStart(KSUID_BYTE_LENGTH * 2, "0");

    const decodedBuffer = Buffer.from(hex, "hex");

    if (decodedBuffer.length > KSUID_BYTE_LENGTH) {
      // This should be unreachable due to the padStart, but as a safeguard.
      return decodedBuffer.subarray(decodedBuffer.length - KSUID_BYTE_LENGTH);
    }

    return decodedBuffer;
  }
}
