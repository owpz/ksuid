/**
 * Error codes for programmatic error handling
 */
export const KSUID_ERROR_CODES = {
  // Input validation errors
  INVALID_LENGTH: "INVALID_LENGTH",
  INVALID_CHARACTER: "INVALID_CHARACTER",
  INVALID_BUFFER_SIZE: "INVALID_BUFFER_SIZE",
  INVALID_TIMESTAMP: "INVALID_TIMESTAMP",
  INVALID_INPUT: "INVALID_INPUT",

  // Data corruption errors
  MALFORMED_DATA: "MALFORMED_DATA",
  CORRUPTION_DETECTED: "CORRUPTION_DETECTED",

  // Operation errors
  SEQUENCE_EXHAUSTED: "SEQUENCE_EXHAUSTED",
  OPERATION_FAILED: "OPERATION_FAILED",
} as const;

export type KSUIDErrorCode =
  (typeof KSUID_ERROR_CODES)[keyof typeof KSUID_ERROR_CODES];

/**
 * Custom error class for KSUID operations
 *
 * Provides structured error information for better error handling
 * and debugging in applications using the KSUID library.
 */
export class KSUIDError extends Error {
  public readonly code: KSUIDErrorCode;
  public readonly input?: unknown;
  public readonly expected?: string;
  public readonly actual?: string;
  public readonly cause?: Error;

  constructor(
    message: string,
    code: KSUIDErrorCode,
    options: {
      input?: unknown;
      expected?: string;
      actual?: string;
      cause?: Error;
    } = {},
  ) {
    super(message);

    this.name = "KSUIDError";
    this.code = code;
    this.input = options.input;
    this.expected = options.expected;
    this.actual = options.actual;

    // Maintain stack trace (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, KSUIDError);
    }

    // Support error chaining (Node.js 16.9.0+)
    if (options.cause) {
      this.cause = options.cause;
    }
  }

  /**
   * Create an error for invalid string length
   */
  static invalidStringLength(input: string, expected: number): KSUIDError {
    return new KSUIDError(
      `Invalid KSUID string: expected ${expected} characters, got ${input.length}`,
      KSUID_ERROR_CODES.INVALID_LENGTH,
      {
        input: input,
        expected: `${expected} characters`,
        actual: `${input.length} characters`,
      },
    );
  }

  /**
   * Create an error for invalid buffer length
   */
  static invalidBufferLength(
    buffer: Buffer,
    expected: number,
    type: string = "KSUID",
  ): KSUIDError {
    return new KSUIDError(
      `Invalid ${type}: expected ${expected} bytes, got ${buffer.length}`,
      KSUID_ERROR_CODES.INVALID_BUFFER_SIZE,
      {
        input: buffer,
        expected: `${expected} bytes`,
        actual: `${buffer.length} bytes`,
      },
    );
  }

  /**
   * Create an error for invalid character in KSUID string
   */
  static invalidCharacter(char: string, position: number): KSUIDError {
    const displayChar =
      char.charCodeAt(0) < 32 || char.charCodeAt(0) > 126
        ? `\\x${char.charCodeAt(0).toString(16).padStart(2, "0")}`
        : char;

    return new KSUIDError(
      `Invalid KSUID string: invalid character '${displayChar}' at position ${position}`,
      KSUID_ERROR_CODES.INVALID_CHARACTER,
      {
        input: char,
        expected: "valid Base62 character",
        actual: `character '${displayChar}'`,
      },
    );
  }

  /**
   * Create an error for invalid timestamp
   */
  static invalidTimestamp(timestamp: unknown): KSUIDError {
    const displayTimestamp =
      typeof timestamp === "number" ? timestamp.toString() : typeof timestamp;

    return new KSUIDError(
      `Invalid timestamp: must be uint32 (0 to 4294967295), got ${displayTimestamp}`,
      KSUID_ERROR_CODES.INVALID_TIMESTAMP,
      {
        input: timestamp,
        expected: "uint32 (0 to 4294967295)",
        actual: displayTimestamp,
      },
    );
  }

  /**
   * Create an error for null/undefined input
   */
  static invalidInput(input: unknown, paramName: string): KSUIDError {
    return new KSUIDError(
      `Invalid ${paramName}: cannot be null or undefined`,
      KSUID_ERROR_CODES.INVALID_INPUT,
      {
        input: input,
        expected: "non-null value",
        actual: String(input),
      },
    );
  }

  /**
   * Create an error for malformed compressed data
   */
  static malformedData(context: string): KSUIDError {
    return new KSUIDError(
      `Malformed data detected: ${context}`,
      KSUID_ERROR_CODES.MALFORMED_DATA,
      {
        expected: "valid compressed data format",
        actual: "corrupted or invalid data",
      },
    );
  }
}

/**
 * Type guard to check if an error is a KSUIDError
 */
export function isKSUIDError(error: unknown): error is KSUIDError {
  return error instanceof KSUIDError;
}

/**
 * Legacy error factory functions for backward compatibility
 * These will be used internally but the new KSUIDError methods are preferred
 */
export const createKSUIDError = {
  invalidStringLength: KSUIDError.invalidStringLength,
  invalidBufferLength: KSUIDError.invalidBufferLength,
  invalidCharacter: KSUIDError.invalidCharacter,
  invalidTimestamp: KSUIDError.invalidTimestamp,
  invalidInput: KSUIDError.invalidInput,
  malformedData: KSUIDError.malformedData,
};
