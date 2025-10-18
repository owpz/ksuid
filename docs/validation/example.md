# Validation Example

This example shows how to use the validation tools to verify Go-TypeScript compatibility.

## Step 1: Setup Go Environment

```bash
# Clone the Go KSUID repository
git clone https://github.com/segmentio/ksuid.git go-ksuid
cd go-ksuid

# Checkout the exact commit we tested against
git checkout d33724947fcfba7949906c2b1821e96a1c8d06e7

# Build the Go CLI tool
go build -o ksuid-go ./cmd/ksuid

# Test the Go implementation
./ksuid-go -n 1
# Output: 2BkGPEgZCVAoqDtcGaGr6u0zVPi (example)
```

## Step 2: Test Cross-Compatibility

### Generate in Go, Parse in TypeScript

```bash
# Generate KSUID with Go
GO_KSUID=$(./ksuid-go -n 1)
echo "Go generated: $GO_KSUID"

# Parse with TypeScript
cd /path/to/@owpz/ksuid
npx ksuid -f inspect $GO_KSUID
```

### Generate in TypeScript, Parse in Go

```bash
# Generate KSUID with TypeScript
TS_KSUID=$(npx ksuid -n 1)
echo "TypeScript generated: $TS_KSUID"

# Parse with Go
cd /path/to/go-ksuid
./ksuid-go -f inspect $TS_KSUID
```

Both should produce identical output for the same KSUID string.

## Step 3: Test Specific Operations

### Next/Prev Operations

```bash
# Test a known KSUID
TEST_KSUID="0o5sKzFDBc56T8mbUP8wH1KpSX7"

# Get next in Go
GO_NEXT=$(echo $TEST_KSUID | python3 -c "
import subprocess
import sys
ksuid = sys.stdin.read().strip()
# Go doesn't have direct next in CLI, so we use our manual test
result = subprocess.run(['go', 'run', 'manual-test.go', ksuid],
                       capture_output=True, text=True)
# Extract next value from output
for line in result.stdout.split('\n'):
    if 'Next:' in line:
        print(line.split('Next: ')[1].strip())
        break
")

# Get next in TypeScript
TS_NEXT=$(node -e "
const { KSUID } = require('./dist/index.js');
const ksuid = KSUID.parse('$TEST_KSUID');
console.log(ksuid.next().toString());
")

echo "Go next():        $GO_NEXT"
echo "TypeScript next(): $TS_NEXT"

# They should be identical
if [ "$GO_NEXT" = "$TS_NEXT" ]; then
    echo " Next operations match!"
else
    echo " Next operations differ!"
fi
```

### Sequence Generation

```bash
# Test sequence generation
TEST_SEED="0o5sKzFDBc56T8mbUP8wH1KpSX7"

# TypeScript sequence
node -e "
const { KSUID, Sequence } = require('./dist/index.js');
const seed = KSUID.parse('$TEST_SEED');
const seq = new Sequence({ seed });
for (let i = 0; i < 3; i++) {
  console.log(seq.next().toString());
}
"

# Compare with Go sequence implementation
# (Go sequence would need to be implemented in manual-test.go)
```

## Step 4: Automated Validation

Use the provided script for comprehensive testing:

```bash
cd docs/validation
./cross-validate.sh
```

This will run multiple test scenarios and report any compatibility issues.

## Expected Results

When compatibility is perfect, you should see:

-  Identical inspect output format
-  Identical timestamp values
-  Identical payload hex strings
-  Identical next/prev operation results
-  Identical sorting behavior
-  Identical error handling for invalid inputs

## Troubleshooting

### Common Issues

1. **Go module not found**

   ```bash
   cd go-ksuid
   go mod tidy
   ```

2. **TypeScript build needed**

   ```bash
   cd @owpz/ksuid
   npm run build
   ```

3. **Path issues**
   - Ensure both `ksuid-go` and `npx ksuid` are available in PATH
   - Use absolute paths if needed

### Reporting Issues

If you find compatibility issues:

1. Note the exact KSUID string that fails
2. Include output from both Go and TypeScript
3. Specify which operation differs (parse, next, prev, etc.)
4. Include the commit hashes of both implementations
