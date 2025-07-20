# API Versioning and Breaking Changes Policy

This document defines what constitutes breaking changes requiring major version bumps for the @owpz/ksuid library, following [Semantic Versioning (SemVer)](https://semver.org/) principles.

## Version Format

The library follows SemVer: `MAJOR.MINOR.PATCH`

- **MAJOR**: Breaking changes that require code changes in consuming applications
- **MINOR**: New features that are backward compatible
- **PATCH**: Bug fixes and internal improvements without API changes

## API Contract Tests

The API contract is protected by comprehensive tests in `test/api-contract/` that will fail if breaking changes are introduced:

- **`api-contract.test.ts`**: Core API surface (classes, methods, properties)
- **`cli-contract.test.ts`**: Command-line interface stability
- **`type-contract.test.ts`**: TypeScript type signatures and constraints

## What Constitutes a Breaking Change (Major Version)

### 1. Core API Changes

#### Class and Method Removal/Renaming

```typescript
// ❌ BREAKING: Removing or renaming public classes
export class KSUID {} // → export class KSUID_NEW { }

// ❌ BREAKING: Removing or renaming public methods
class KSUID {
  toString(): string {} // → toStr(): string { }
}

// ❌ BREAKING: Removing static methods
KSUID.random(); // → KSUID.generate()
```

#### Method Signature Changes

```typescript
// ❌ BREAKING: Changing parameter types
KSUID.parse(s: string) // → KSUID.parse(s: Buffer)

// ❌ BREAKING: Adding required parameters
KSUID.fromParts(timestamp: number, payload: Buffer)
// → KSUID.fromParts(timestamp: number, payload: Buffer, required: boolean)

// ❌ BREAKING: Making optional parameters required
new Sequence(options?: { seed: KSUID })
// → new Sequence(options: { seed: KSUID })

// ❌ BREAKING: Changing return types
toString(): string // → toString(): Buffer
```

#### Property Changes

```typescript
// ❌ BREAKING: Removing or renaming properties
ksuid.timestamp; // → ksuid.ts
ksuid.payload; // → ksuid.data

// ❌ BREAKING: Changing property types
timestamp: number; // → timestamp: bigint
```

#### Constant Changes

```typescript
// ❌ BREAKING: Removing or renaming constants
KSUID.nil; // → KSUID.NULL

// ❌ BREAKING: Changing constant values
KSUID.nil.toString(); // "000000000000000000000000000" → "nil"
```

### 2. Error Handling Changes

#### Error Type Changes

```typescript
// ❌ BREAKING: Changing error types thrown
KSUID.parse("invalid"); // throws Error → throws TypeError

// ❌ BREAKING: Removing error codes
KSUID_ERROR_CODES.INVALID_LENGTH; // → undefined

// ❌ BREAKING: Changing error code values
KSUID_ERROR_CODES.INVALID_LENGTH; // "INVALID_LENGTH" → "LENGTH_ERROR"
```

#### Error Structure Changes

```typescript
// ❌ BREAKING: Removing error properties
error.code; // → undefined
error.expected; // → undefined

// ❌ BREAKING: Changing error message format significantly
// (if applications parse error messages)
("Invalid KSUID: expected 20 bytes, got 15");
// → "Buffer size mismatch"
```

### 3. Behavior Changes

#### Method Behavior

```typescript
// ❌ BREAKING: Changing fundamental behavior
KSUID.parseOrNil("invalid"); // returns nil → throws error

// ❌ BREAKING: Changing output format
ksuid.toString(); // Base62 → Base64

// ❌ BREAKING: Changing side effects
KSUID.random(); // no side effects → logs to console
```

#### Value Constraints

```typescript
// ❌ BREAKING: Tightening validation
KSUID.fromParts(-1, payload); // worked → now throws

// ❌ BREAKING: Changing value ranges
ksuid.timestamp; // uint32 → int32 (loses range)
```

### 4. CLI Interface Changes

#### Command Line Arguments

```bash
# ❌ BREAKING: Removing or renaming options
ksuid -f inspect    # → ksuid --format inspect
ksuid -n 5          # → ksuid --count 5

# ❌ BREAKING: Changing option behavior
ksuid -f timestamp  # outputs seconds → outputs milliseconds

# ❌ BREAKING: Changing output format
ksuid -f inspect    # structured output → JSON output
```

#### Exit Codes

```bash
# ❌ BREAKING: Changing exit codes
ksuid invalid   # exits 1 → exits 2
```

### 5. TypeScript Type Changes

#### Type Definitions

```typescript
// ❌ BREAKING: Narrowing types (more restrictive)
parse(s: string | Buffer) // → parse(s: string)

// ❌ BREAKING: Changing generic constraints
class Sequence<T extends KSUID> // → class Sequence<T extends Buffer>

// ❌ BREAKING: Removing exported types
export type KSUIDErrorCode // → removed from exports
```

#### Type Inference Changes

```typescript
// ❌ BREAKING: Breaking type inference
const ksuid = KSUID.random(); // inferred as KSUID → any
```

## What Is NOT a Breaking Change (Minor/Patch)

### ✅ Safe Changes

#### Adding New Functionality

```typescript
// ✅ SAFE: Adding new methods
class KSUID {
  // existing methods...
  validate(): boolean { } // NEW
}

// ✅ SAFE: Adding new static methods
KSUID.fromTimestamp(ts: number): KSUID { } // NEW

// ✅ SAFE: Adding optional parameters
KSUID.fromParts(timestamp: number, payload: Buffer, options?: ParseOptions)
```

#### Expanding Types (Less Restrictive)

```typescript
// ✅ SAFE: Widening parameter types
parse(s: string) // → parse(s: string | Buffer)

// ✅ SAFE: Making required parameters optional
new Sequence(options: { seed: KSUID })
// → new Sequence(options?: { seed?: KSUID })
```

#### Adding Error Information

```typescript
// ✅ SAFE: Adding new error properties
class KSUIDError {
  code: string;
  // existing properties...
  context?: string; // NEW optional property
}

// ✅ SAFE: Adding new error codes
KSUID_ERROR_CODES.NEW_ERROR_TYPE = "NEW_ERROR_TYPE";
```

#### Performance Improvements

```typescript
// ✅ SAFE: Internal optimizations that don't change behavior
KSUID.random(); // faster implementation, same output
```

#### Bug Fixes

```typescript
// ✅ SAFE: Fixing incorrect behavior to match documentation
ksuid.compare(other); // was returning wrong values, now correct
```

#### CLI Enhancements

```bash
# ✅ SAFE: Adding new options
ksuid --validate input.txt  # NEW option

# ✅ SAFE: Adding new output formats
ksuid -f json               # NEW format
```

## Migration Path for Breaking Changes

When breaking changes are necessary, we provide:

1. **Deprecation Warnings**: Mark old APIs as deprecated in minor releases
2. **Migration Guide**: Document how to update code
3. **Codemods**: Automated migration tools when possible
4. **Parallel APIs**: Keep old API alongside new one temporarily

### Example Migration Process

```typescript
// v1.x.x: Original API
KSUID.parse(s: string): KSUID

// v1.5.0: Add new API with deprecation warning
KSUID.parse(s: string): KSUID           // deprecated, warns
KSUID.parseString(s: string): KSUID     // new preferred method

// v2.0.0: Remove deprecated API
// KSUID.parse removed
KSUID.parseString(s: string): KSUID     // only method available
```

## Testing Strategy

### API Contract Tests

Run API contract tests before every release:

```bash
# Test core API stability
npm test test/api-contract/api-contract.test.ts

# Test CLI interface stability
npm test test/api-contract/cli-contract.test.ts

# Test TypeScript type stability
npm test test/api-contract/type-contract.test.ts
```

### Automated Checking

API contract tests run in CI/CD and will fail the build if breaking changes are detected without a major version bump.

### Manual Review Checklist

Before releasing, verify:

- [ ] All API contract tests pass
- [ ] No removal of public APIs
- [ ] No changes to method signatures
- [ ] No changes to error codes or types
- [ ] No changes to CLI interface
- [ ] TypeScript compilation succeeds for existing code patterns

## Version Planning

### Patch Release (1.0.1)

- Bug fixes
- Performance improvements
- Documentation updates
- Internal refactoring

### Minor Release (1.1.0)

- New methods/properties (backward compatible)
- New CLI options
- New error codes (additions only)
- Expanded type constraints
- Deprecation warnings

### Major Release (2.0.0)

- Any breaking change from the list above
- Removal of deprecated APIs
- Modernization requiring code changes
- Architecture changes affecting public API

## Exceptions and Special Cases

### Security Fixes

Security vulnerabilities may require breaking changes in patch releases. These will be:

1. Clearly documented as security fixes
2. Accompanied by migration guidance
3. Communicated prominently in release notes

### Dependency Updates

Major dependency updates that change behavior are treated as breaking changes even if the API surface remains the same.

### Documentation Clarifications

If documentation clarification reveals that current behavior doesn't match intended behavior, fixing the behavior may be a breaking change requiring a major version bump.

## Release Communication

### Release Notes Template

**Breaking Changes:** (Major only)

- API changes requiring code updates
- CLI changes requiring script updates
- Migration guide links

**New Features:** (Minor)

- New APIs and functionality
- New CLI options

**Bug Fixes:** (Patch)

- Issues resolved
- Performance improvements

**Deprecations:** (Minor)

- APIs marked for removal
- Timeline for removal

### Migration Guides

Major releases include migration guides with:

- List of all breaking changes
- Before/after code examples
- Automated migration tools
- Timeline for completing migration

This policy ensures that users can depend on API stability while allowing the library to evolve responsibly.
