# Error Handling Guide

The @owpz/ksuid library provides comprehensive error handling with structured error information to
help developers build robust applications.

## Error Types

### KSUIDError Class

All errors thrown by the library are instances of `KSUIDError`, which extends the native `Error`
class with additional structured information:

```typescript
import { KSUIDError, isKSUIDError, KSUID_ERROR_CODES } from "@owpz/ksuid";

try {
  const ksuid = KSUID.parse("invalid");
} catch (error) {
  if (isKSUIDError(error)) {
    console.log("Error Code:", error.code); // 'INVALID_LENGTH'
    console.log("Message:", error.message); // 'Invalid KSUID string: expected 27 characters, got 7'
    console.log("Expected:", error.expected); // '27 characters'
    console.log("Actual:", error.actual); // '7 characters'
    console.log("Input:", error.input); // 'invalid'
  }
}
```

### Error Properties

Each `KSUIDError` includes:

- **`code`**: Machine-readable error code for programmatic handling
- **`message`**: Human-readable error description
- **`input`**: The invalid input that caused the error (when available)
- **`expected`**: What was expected
- **`actual`**: What was actually received
- **`cause`**: Optional underlying error for error chaining

## Error Codes

All error codes are available via the `KSUID_ERROR_CODES` constant:

```typescript
import { KSUID_ERROR_CODES } from "@owpz/ksuid";

// Input validation errors
KSUID_ERROR_CODES.INVALID_LENGTH; // Wrong string/buffer length
KSUID_ERROR_CODES.INVALID_CHARACTER; // Invalid character in KSUID string
KSUID_ERROR_CODES.INVALID_BUFFER_SIZE; // Buffer size mismatch
KSUID_ERROR_CODES.INVALID_TIMESTAMP; // Invalid timestamp value
KSUID_ERROR_CODES.INVALID_INPUT; // Null/undefined input

// Data corruption errors
KSUID_ERROR_CODES.MALFORMED_DATA; // Corrupted compressed data
KSUID_ERROR_CODES.CORRUPTION_DETECTED; // Data integrity failure

// Operation errors
KSUID_ERROR_CODES.SEQUENCE_EXHAUSTED; // Sequence capacity exceeded
KSUID_ERROR_CODES.OPERATION_FAILED; // General operation failure
```

## Common Error Scenarios

### Invalid KSUID String Format

```typescript
import { KSUID, isKSUIDError } from "@owpz/ksuid";

// Too short
try {
  KSUID.parse("abc");
} catch (error) {
  if (isKSUIDError(error)) {
    console.log(error.code); // 'INVALID_LENGTH'
    console.log(error.message); // 'Invalid KSUID string: expected 27 characters, got 3'
  }
}

// Invalid characters
try {
  KSUID.parse("!@#$%^&*()!@#$%^&*()!@#$%^&");
} catch (error) {
  if (isKSUIDError(error)) {
    console.log(error.code); // 'INVALID_CHARACTER'
    console.log(error.message); // 'Invalid KSUID string: invalid character '!' at position 0'
  }
}
```

### Invalid Buffer Operations

```typescript
// Wrong buffer size
try {
  KSUID.fromBytes(Buffer.alloc(19));
} catch (error) {
  if (isKSUIDError(error)) {
    console.log(error.code); // 'INVALID_BUFFER_SIZE'
    console.log(error.message); // 'Invalid KSUID: expected 20 bytes, got 19'
  }
}

// Invalid payload size
try {
  KSUID.fromParts(123456, Buffer.alloc(15));
} catch (error) {
  if (isKSUIDError(error)) {
    console.log(error.code); // 'INVALID_BUFFER_SIZE'
    console.log(error.message); // 'Invalid KSUID payload: expected 16 bytes, got 15'
  }
}
```

### Invalid Timestamp Values

```typescript
// Negative timestamp
try {
  KSUID.fromParts(-1, Buffer.alloc(16));
} catch (error) {
  if (isKSUIDError(error)) {
    console.log(error.code); // 'INVALID_TIMESTAMP'
    console.log(error.message); // 'Invalid timestamp: must be uint32 (0 to 4294967295), got -1'
  }
}

// Timestamp too large
try {
  KSUID.fromParts(2 ** 40, Buffer.alloc(16));
} catch (error) {
  if (isKSUIDError(error)) {
    console.log(error.code); // 'INVALID_TIMESTAMP'
    console.log(error.message); // 'Invalid timestamp: must be uint32 (0 to 4294967295), got 1099511627776'
  }
}
```

### Null/Undefined Inputs

```typescript
// Null string
try {
  KSUID.parse(null as any);
} catch (error) {
  if (isKSUIDError(error)) {
    console.log(error.code); // 'INVALID_INPUT'
    console.log(error.message); // 'Invalid string: cannot be null or undefined'
  }
}

// Undefined buffer
try {
  KSUID.fromBytes(undefined as any);
} catch (error) {
  if (isKSUIDError(error)) {
    console.log(error.code); // 'INVALID_INPUT'
    console.log(error.message); // 'Invalid buffer: cannot be null or undefined'
  }
}
```

## Error Handling Patterns

### Basic Error Handling

```typescript
import { KSUID, isKSUIDError, KSUID_ERROR_CODES } from "@owpz/ksuid";

function parseKSUID(input: string): KSUID | null {
  try {
    return KSUID.parse(input);
  } catch (error) {
    if (isKSUIDError(error)) {
      // Log structured error information
      console.error("KSUID Parse Error:", {
        code: error.code,
        message: error.message,
        input: error.input,
        expected: error.expected,
        actual: error.actual,
      });
    } else {
      // Handle unexpected errors
      console.error("Unexpected error:", error);
    }
    return null;
  }
}
```

### Specific Error Code Handling

```typescript
function handleKSUIDError(error: unknown) {
  if (!isKSUIDError(error)) {
    throw error; // Re-throw non-KSUID errors
  }

  switch (error.code) {
    case KSUID_ERROR_CODES.INVALID_LENGTH:
      return { success: false, reason: "incorrect_length" };

    case KSUID_ERROR_CODES.INVALID_CHARACTER:
      return { success: false, reason: "invalid_character" };

    case KSUID_ERROR_CODES.INVALID_TIMESTAMP:
      return { success: false, reason: "timestamp_out_of_range" };

    default:
      return { success: false, reason: "unknown_error" };
  }
}
```

### Graceful Degradation with OrNil Methods

For non-critical operations, use the `OrNil` variants that return a nil KSUID instead of throwing:

```typescript
// These methods never throw - they return KSUID.nil on error
const ksuid1 = KSUID.parseOrNil("invalid_input"); // Returns KSUID.nil
const ksuid2 = KSUID.fromBytesOrNil(Buffer.alloc(19)); // Returns KSUID.nil
const ksuid3 = KSUID.fromPartsOrNil(-1, Buffer.alloc(16)); // Returns KSUID.nil

if (ksuid1.isNil()) {
  console.log("Failed to parse KSUID, using default");
}
```

### Custom Error Wrapping

```typescript
class ApplicationError extends Error {
  constructor(
    message: string,
    public readonly originalError: KSUIDError
  ) {
    super(message);
    this.name = "ApplicationError";
  }
}

function processUserInput(userInput: string): KSUID {
  try {
    return KSUID.parse(userInput);
  } catch (error) {
    if (isKSUIDError(error)) {
      throw new ApplicationError(`Invalid user input: ${error.message}`, error);
    }
    throw error;
  }
}
```

## Best Practices

### 1. Always Use Type Guards

```typescript
// ✅ Good: Use isKSUIDError type guard
if (isKSUIDError(error)) {
  console.log(error.code, error.message);
}

// ❌ Bad: Assumes error type
console.log((error as KSUIDError).code);
```

### 2. Handle Specific Error Codes

```typescript
// ✅ Good: Handle specific error types
if (error.code === KSUID_ERROR_CODES.INVALID_LENGTH) {
  return "Please provide a 27-character KSUID string";
}

// ❌ Bad: Parse error message strings
if (error.message.includes("27 characters")) {
  return "Wrong length";
}
```

### 3. Provide User-Friendly Messages

```typescript
// ✅ Good: Convert technical errors to user-friendly messages
function getUserFriendlyError(error: KSUIDError): string {
  switch (error.code) {
    case KSUID_ERROR_CODES.INVALID_LENGTH:
      return "The ID format is incorrect. Please check the length.";
    case KSUID_ERROR_CODES.INVALID_CHARACTER:
      return "The ID contains invalid characters. Please use only letters and numbers.";
    case KSUID_ERROR_CODES.INVALID_TIMESTAMP:
      return "The timestamp is out of valid range.";
    default:
      return "The ID format is invalid. Please try again.";
  }
}
```

### 4. Use OrNil for Optional Operations

```typescript
// ✅ Good: Use OrNil when failure is acceptable
const optionalKSUID = KSUID.parseOrNil(userInput);
if (!optionalKSUID.isNil()) {
  processKSUID(optionalKSUID);
}

// ❌ Bad: Catch exceptions for optional operations
try {
  const ksuid = KSUID.parse(userInput);
  processKSUID(ksuid);
} catch {
  // Empty catch for optional operation
}
```

## CLI Error Handling

The CLI tool provides enhanced error reporting when using the new error system:

```bash
$ npx ksuid -f inspect "invalid"
Error: Invalid KSUID string: expected 27 characters, got 7
  Expected: 27 characters
  Received: 7 characters
  Error Code: INVALID_LENGTH

Usage: ksuid [options] [KSUIDs...]
...
```

This structured error information helps users understand exactly what went wrong and how to fix it.
