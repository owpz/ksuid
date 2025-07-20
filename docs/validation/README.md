# Go-TypeScript Compatibility Validation

This directory contains tools to validate compatibility between the Go and TypeScript KSUID implementations.

## Test Vector Generator

### Prerequisites

To run the Go validation tools, you need:

1. Go 1.13+ installed
2. The segmentio/ksuid Go module

### Setup

```bash
# Clone the reference Go implementation
git clone https://github.com/segmentio/ksuid.git go-ksuid
cd go-ksuid

# Checkout the exact commit used for test vector generation
git checkout d33724947fcfba7949906c2b1821e96a1c8d06e7

# Initialize Go module (if needed)
go mod tidy
```

### Generate Test Vectors

```bash
# Copy the test vector generator
cp ../path/to/@owpz/ksuid/docs/validation/generate-interop-vectors.go .

# Run the generator
go run generate-interop-vectors.go
```

### Sample Output

The generator produces output like:

```
// Go-generated test vectors for TypeScript interop testing
Test 1 - Fixed timestamp:
  timestamp: 95004740
  payload: '669f7efd7b6fe812278486085878563d'
  expectedString: '0o5sKzFDBc56T8mbUP8wH1KpSX7'
  expectedRaw: '05a9a844669f7efd7b6fe812278486085878563d'

Test 2 - Epoch timestamp:
  timestamp: 0
  payload: 'deadbeefdeadbeefdeadbeefdeadbeef'
  expectedString: '000006mBhJfVeGABNuCXRQc2hOZ'
  expectedRaw: '00000000deadbeefdeadbeefdeadbeefdeadbeef'
...
```

## Manual Cross-Validation

### Testing TypeScript Against Go

1. **Generate KSUID in Go:**

   ```bash
   cd go-ksuid
   go run cmd/ksuid/main.go -n 1
   # Output: 2BkGO1FdP9vGtRxoFz37UjMqcTh
   ```

2. **Parse in TypeScript:**

   ```bash
   cd @owpz/ksuid
   npx ksuid -f inspect 2BkGO1FdP9vGtRxoFz37UjMqcTh
   ```

3. **Compare outputs** - they should be identical.

### Testing TypeScript Against Go

1. **Generate KSUID in TypeScript:**

   ```bash
   cd @owpz/ksuid
   npx ksuid -n 1
   # Output: 2BkGO1FdP9vGtRxoFz37UjMqcTh
   ```

2. **Parse in Go:**

   ```bash
   cd go-ksuid
   go run cmd/ksuid/main.go -f inspect 2BkGO1FdP9vGtRxoFz37UjMqcTh
   ```

3. **Compare outputs** - they should be identical.

## Automated Validation

The TypeScript test suite includes comprehensive compatibility tests in:

- `src/go-compatibility.test.ts` - Original compatibility tests
- `src/go-interop.test.ts` - Extended interoperability tests with real Go vectors

Run with:

```bash
npm test
```

## Validation Checklist

To verify compatibility between implementations:

- [ ] **String encoding**: Same KSUID → same Base62 string
- [ ] **String parsing**: Same Base62 string → same KSUID components
- [ ] **Binary format**: Same raw bytes for identical KSUIDs
- [ ] **Next operations**: `ksuid.Next()` produces identical results
- [ ] **Prev operations**: `ksuid.Prev()` produces identical results
- [ ] **Sequence generation**: Same seed produces same sequence
- [ ] **Sorting**: Same sort order for KSUID arrays
- [ ] **CLI output**: All format flags produce identical output
- [ ] **Edge cases**: Nil, max values, overflows handled identically
- [ ] **Error cases**: Invalid inputs produce same error behavior

## Reference Implementation

All test vectors were generated using the Go reference implementation at:

- **Repository**: https://github.com/segmentio/ksuid
- **Commit**: `d33724947fcfba7949906c2b1821e96a1c8d06e7`
- **Date**: Latest as of 2025-07-20

This ensures that the TypeScript implementation is validated against the canonical Go implementation.

## Contributing

If you find any compatibility issues:

1. Create test vectors using the Go implementation
2. Add test cases to the TypeScript test suite
3. Submit an issue with both Go and TypeScript outputs
4. Include specific KSUID values that demonstrate the issue

For questions about compatibility validation, please refer to the main README.md file or open an issue on the project repository.
