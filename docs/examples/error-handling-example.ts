#!/usr/bin/env node

/**
 * Error Handling Example for @owpz/ksuid
 *
 * This example demonstrates the comprehensive error handling capabilities
 * of the KSUID library, showing how to handle different error scenarios
 * gracefully in production applications.
 */

import {
  KSUID,
  KSUIDError,
  isKSUIDError,
  KSUID_ERROR_CODES,
  type KSUIDErrorCode,
} from "../../src";

// Example 1: Basic error handling with type guards
function demonstrateBasicErrorHandling() {
  console.log("=== Basic Error Handling ===");

  const invalidInputs = [
    "too_short",
    "!@#$%^&*()!@#$%^&*()!@#$%^&", // Invalid characters
    null,
    undefined,
  ];

  for (const input of invalidInputs) {
    try {
      const ksuid = KSUID.parse(input as string);
      console.log("✅ Parsed successfully:", ksuid.toString());
    } catch (error) {
      if (isKSUIDError(error)) {
        console.log(`❌ KSUIDError [${error.code}]: ${error.message}`);
        console.log(`   Expected: ${error.expected}, Got: ${error.actual}`);
      } else {
        console.log("❌ Unexpected error:", error);
      }
    }
  }
  console.log();
}

// Example 2: Specific error code handling
function handleSpecificErrors(input: string): {
  success: boolean;
  reason: string;
  data?: KSUID;
} {
  try {
    const ksuid = KSUID.parse(input);
    return { success: true, reason: "success", data: ksuid };
  } catch (error) {
    if (!isKSUIDError(error)) {
      return { success: false, reason: "unexpected_error" };
    }

    switch (error.code) {
      case KSUID_ERROR_CODES.INVALID_LENGTH:
        return { success: false, reason: "wrong_length" };
      case KSUID_ERROR_CODES.INVALID_CHARACTER:
        return { success: false, reason: "invalid_characters" };
      case KSUID_ERROR_CODES.INVALID_INPUT:
        return { success: false, reason: "null_input" };
      default:
        return { success: false, reason: "unknown_error" };
    }
  }
}

function demonstrateSpecificErrorHandling() {
  console.log("=== Specific Error Code Handling ===");

  const testCases = [
    "short",
    "!@#$%^&*()!@#$%^&*()!@#$%^&",
    "0o5sKzFDBc56T8mbUP8wH1KpSX7", // Valid KSUID
    null as any,
  ];

  for (const input of testCases) {
    const result = handleSpecificErrors(input);
    console.log(`Input: ${String(input)} → Result: ${result.reason}`);
  }
  console.log();
}

// Example 3: User-friendly error messages
function getUserFriendlyMessage(error: KSUIDError): string {
  const friendlyMessages: Record<KSUIDErrorCode, string> = {
    [KSUID_ERROR_CODES.INVALID_LENGTH]:
      "The ID must be exactly 27 characters long.",
    [KSUID_ERROR_CODES.INVALID_CHARACTER]:
      "The ID contains invalid characters. Please use only letters and numbers.",
    [KSUID_ERROR_CODES.INVALID_BUFFER_SIZE]:
      "The data buffer has an incorrect size.",
    [KSUID_ERROR_CODES.INVALID_TIMESTAMP]:
      "The timestamp is outside the valid range.",
    [KSUID_ERROR_CODES.INVALID_INPUT]: "The input cannot be empty or null.",
    [KSUID_ERROR_CODES.MALFORMED_DATA]: "The data appears to be corrupted.",
    [KSUID_ERROR_CODES.CORRUPTION_DETECTED]: "Data corruption was detected.",
    [KSUID_ERROR_CODES.SEQUENCE_EXHAUSTED]:
      "The sequence has reached its maximum capacity.",
    [KSUID_ERROR_CODES.OPERATION_FAILED]:
      "The operation could not be completed.",
  };

  return friendlyMessages[error.code] || "An unknown error occurred.";
}

function demonstrateUserFriendlyErrors() {
  console.log("=== User-Friendly Error Messages ===");

  const inputs = ["abc", "!@#invalid!@#invalid!@#invalid"];

  for (const input of inputs) {
    try {
      KSUID.parse(input);
    } catch (error) {
      if (isKSUIDError(error)) {
        console.log(`Technical: ${error.message}`);
        console.log(`User-friendly: ${getUserFriendlyMessage(error)}`);
        console.log();
      }
    }
  }
}

// Example 4: Graceful degradation with OrNil methods
function demonstrateGracefulDegradation() {
  console.log("=== Graceful Degradation with OrNil Methods ===");

  const inputs = ["invalid", "0o5sKzFDBc56T8mbUP8wH1KpSX7", null as any];

  for (const input of inputs) {
    // Using OrNil methods - never throws
    const ksuid = KSUID.parseOrNil(input);

    if (ksuid.isNil()) {
      console.log(
        `❌ Failed to parse "${String(input)}", using default behavior`,
      );
    } else {
      console.log(`✅ Successfully parsed: ${ksuid.toString()}`);
    }
  }
  console.log();
}

// Example 5: Buffer and timestamp validation
function demonstrateAdvancedValidation() {
  console.log("=== Advanced Validation Examples ===");

  // Invalid buffer sizes
  try {
    KSUID.fromBytes(Buffer.alloc(15)); // Too small
  } catch (error) {
    if (isKSUIDError(error)) {
      console.log(`Buffer validation: ${error.message}`);
    }
  }

  // Invalid timestamp
  try {
    KSUID.fromParts(-1, Buffer.alloc(16)); // Negative timestamp
  } catch (error) {
    if (isKSUIDError(error)) {
      console.log(`Timestamp validation: ${error.message}`);
    }
  }

  // Invalid payload size
  try {
    KSUID.fromParts(123456, Buffer.alloc(10)); // Wrong payload size
  } catch (error) {
    if (isKSUIDError(error)) {
      console.log(`Payload validation: ${error.message}`);
    }
  }
  console.log();
}

// Example 6: Custom application error wrapping
class ApplicationError extends Error {
  constructor(
    message: string,
    public readonly context: string,
    public readonly originalError: KSUIDError,
  ) {
    super(message);
    this.name = "ApplicationError";
  }
}

function processUserID(userInput: string, context: string): KSUID {
  try {
    return KSUID.parse(userInput);
  } catch (error) {
    if (isKSUIDError(error)) {
      throw new ApplicationError(
        `Failed to process user ID in ${context}: ${getUserFriendlyMessage(error)}`,
        context,
        error,
      );
    }
    throw error; // Re-throw non-KSUID errors
  }
}

function demonstrateCustomErrorWrapping() {
  console.log("=== Custom Error Wrapping ===");

  try {
    const ksuid = processUserID("invalid", "user registration");
    console.log("Processed:", ksuid.toString());
  } catch (error) {
    if (error instanceof ApplicationError) {
      console.log(`Application Error: ${error.message}`);
      console.log(`Context: ${error.context}`);
      console.log(`Original Error Code: ${error.originalError.code}`);
    }
  }
  console.log();
}

// Example 7: Structured logging
interface LogEntry {
  timestamp: string;
  level: "error" | "warn" | "info";
  message: string;
  error?: {
    code: string;
    message: string;
    input?: unknown;
    expected?: string;
    actual?: string;
  };
}

function logKSUIDError(error: KSUIDError, context: string): LogEntry {
  return {
    timestamp: new Date().toISOString(),
    level: "error",
    message: `KSUID error in ${context}`,
    error: {
      code: error.code,
      message: error.message,
      input: error.input,
      expected: error.expected,
      actual: error.actual,
    },
  };
}

function demonstrateStructuredLogging() {
  console.log("=== Structured Logging ===");

  try {
    KSUID.parse("malformed");
  } catch (error) {
    if (isKSUIDError(error)) {
      const logEntry = logKSUIDError(error, "user input validation");
      console.log("Log entry:", JSON.stringify(logEntry, null, 2));
    }
  }
  console.log();
}

// Run all examples
function main() {
  console.log("🔍 KSUID Error Handling Examples\n");
  console.log(
    "This demonstrates comprehensive error handling for production applications.\n",
  );

  demonstrateBasicErrorHandling();
  demonstrateSpecificErrorHandling();
  demonstrateUserFriendlyErrors();
  demonstrateGracefulDegradation();
  demonstrateAdvancedValidation();
  demonstrateCustomErrorWrapping();
  demonstrateStructuredLogging();

  console.log("✨ All examples completed!");
  console.log("\n💡 Key takeaways:");
  console.log("   • Always use isKSUIDError() type guard");
  console.log("   • Handle specific error codes for better UX");
  console.log("   • Use OrNil methods for optional operations");
  console.log("   • Provide user-friendly error messages");
  console.log("   • Structure errors for logging and monitoring");
}

// Run examples if this file is executed directly
if (require.main === module) {
  main();
}
