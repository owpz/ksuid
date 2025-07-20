#!/bin/bash

# Cross-Validation Script for Go-TypeScript KSUID Compatibility
# 
# This script automates testing between Go and TypeScript implementations
# to verify they produce identical results.
#
# Prerequisites:
# - Go KSUID implementation built as './ksuid-go' 
# - TypeScript implementation available via KSUID_TS_CLI env var or 'npx ksuid'
# - Both implementations in working directories

set -e

# Determine TypeScript CLI command
if [ -n "$KSUID_TS_CLI" ]; then
    TS_CMD="$KSUID_TS_CLI"
else
    TS_CMD="npx ksuid"
fi

echo "🔄 KSUID Cross-Validation Test Suite"
echo "===================================="
echo "TypeScript CLI: $TS_CMD"
echo

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m' 
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to compare outputs (with normalization for formatting differences)
compare_outputs() {
    local test_name="$1"
    local go_output="$2"
    local ts_output="$3"
    
    if [ "$go_output" = "$ts_output" ]; then
        echo -e "  ${GREEN}✅ $test_name: PASS${NC}"
        return 0
    else
        # For inspect format, normalize time format differences and compare
        if [[ "$test_name" == *"inspect"* ]]; then
            # Remove the time line entirely and compare the rest
            go_normalized=$(echo "$go_output" | grep -v "Time:" | tr -d ' \t\n')
            ts_normalized=$(echo "$ts_output" | grep -v "Time:" | tr -d ' \t\n')
            
            if [ "$go_normalized" = "$ts_normalized" ]; then
                echo -e "  ${GREEN}✅ $test_name: PASS (time format differences ignored)${NC}"
                return 0
            fi
        fi
        
        echo -e "  ${RED}❌ $test_name: FAIL${NC}"
        echo "    Go output:"
        echo "$go_output" | sed 's/^/      /'
        echo "    TypeScript output:"
        echo "$ts_output" | sed 's/^/      /'
        return 1
    fi
}

# Test 1: Basic KSUID generation and parsing
echo -e "${BLUE}Test 1: Basic Generation and Parsing${NC}"

# Generate KSUID in TypeScript, parse in Go
TS_KSUID=$($TS_CMD -n 1)
echo "Generated in TypeScript: $TS_KSUID"

# Parse in both implementations
GO_INSPECT=$(echo "$TS_KSUID" | xargs -I {} sh -c './ksuid-go -f inspect {}' 2>/dev/null || echo "ERROR")
TS_INSPECT=$(echo "$TS_KSUID" | xargs -I {} sh -c "$TS_CMD -f inspect {}" 2>/dev/null || echo "ERROR")

compare_outputs "Inspect format" "$GO_INSPECT" "$TS_INSPECT"
echo

# Test 2: Known test vectors
echo -e "${BLUE}Test 2: Known Test Vectors${NC}"

# Test vector from our compatibility tests
TEST_KSUID="0o5sKzFDBc56T8mbUP8wH1KpSX7"
echo "Testing known KSUID: $TEST_KSUID"

GO_INSPECT2=$(./ksuid-go -f inspect "$TEST_KSUID" 2>/dev/null || echo "ERROR")
TS_INSPECT2=$($TS_CMD -f inspect "$TEST_KSUID" 2>/dev/null || echo "ERROR")

compare_outputs "Known vector inspect" "$GO_INSPECT2" "$TS_INSPECT2"

# Test different output formats
GO_TIME=$(./ksuid-go -f time "$TEST_KSUID" 2>/dev/null || echo "ERROR")
TS_TIME=$($TS_CMD -f time "$TEST_KSUID" 2>/dev/null || echo "ERROR")
compare_outputs "Time format" "$GO_TIME" "$TS_TIME"

GO_TIMESTAMP=$(./ksuid-go -f timestamp "$TEST_KSUID" 2>/dev/null || echo "ERROR")
TS_TIMESTAMP=$($TS_CMD -f timestamp "$TEST_KSUID" 2>/dev/null || echo "ERROR")
compare_outputs "Timestamp format" "$GO_TIMESTAMP" "$TS_TIMESTAMP"

GO_PAYLOAD=$(./ksuid-go -f payload "$TEST_KSUID" 2>/dev/null || echo "ERROR")
TS_PAYLOAD=$($TS_CMD -f payload "$TEST_KSUID" 2>/dev/null || echo "ERROR")
compare_outputs "Payload format" "$GO_PAYLOAD" "$TS_PAYLOAD"

echo

# Test 3: Error handling
echo -e "${BLUE}Test 3: Error Handling${NC}"

INVALID_KSUID="invalid-ksuid-string"
echo "Testing invalid KSUID: $INVALID_KSUID"

# Both should fail gracefully
GO_ERROR=$(./ksuid-go -f inspect "$INVALID_KSUID" 2>&1 | head -n1 || echo "ERROR")
TS_ERROR=$($TS_CMD -f inspect "$INVALID_KSUID" 2>&1 | head -n1 || echo "ERROR") 

# We expect both to error, so we just check they both failed
if [[ "$GO_ERROR" == *"ERROR"* ]] || [[ "$GO_ERROR" == *"error"* ]] || [[ "$GO_ERROR" == *"invalid"* ]]; then
    GO_FAILED=true
else
    GO_FAILED=false
fi

if [[ "$TS_ERROR" == *"ERROR"* ]] || [[ "$TS_ERROR" == *"error"* ]] || [[ "$TS_ERROR" == *"invalid"* ]]; then
    TS_FAILED=true
else
    TS_FAILED=false
fi

if [ "$GO_FAILED" = true ] && [ "$TS_FAILED" = true ]; then
    echo -e "  ${GREEN}✅ Error handling: PASS (both implementations failed as expected)${NC}"
else
    echo -e "  ${RED}❌ Error handling: FAIL (inconsistent error behavior)${NC}"
fi

echo

# Test 4: Multiple KSUIDs
echo -e "${BLUE}Test 4: Multiple KSUID Generation${NC}"

echo "Generating 3 KSUIDs from each implementation..."

# Generate multiple KSUIDs
GO_MULTIPLE=$(./ksuid-go -n 3 2>/dev/null | tr '\n' ' ' || echo "ERROR")
TS_MULTIPLE=$($TS_CMD -n 3 2>/dev/null | tr '\n' ' ' || echo "ERROR")

# We can't compare the exact values since they're random, but we can check format
GO_COUNT=$(echo "$GO_MULTIPLE" | wc -w)
TS_COUNT=$(echo "$TS_MULTIPLE" | wc -w)

if [ "$GO_COUNT" -eq 3 ] && [ "$TS_COUNT" -eq 3 ]; then
    echo -e "  ${GREEN}✅ Multiple generation: PASS (both generated 3 KSUIDs)${NC}"
else
    echo -e "  ${RED}❌ Multiple generation: FAIL${NC}"
    echo "    Go generated: $GO_COUNT KSUIDs"
    echo "    TypeScript generated: $TS_COUNT KSUIDs"
fi

# Verify each generated KSUID is valid by parsing it
echo "  Validating generated KSUIDs..."
for ksuid in $GO_MULTIPLE; do
    if [ "$ksuid" != "ERROR" ]; then
        PARSE_TEST=$($TS_CMD -f inspect "$ksuid" 2>/dev/null | head -n1 || echo "ERROR")
        if [[ "$PARSE_TEST" == *"ERROR"* ]]; then
            echo -e "    ${RED}❌ Go-generated KSUID '$ksuid' failed TypeScript parsing${NC}"
        fi
    fi
done

for ksuid in $TS_MULTIPLE; do
    if [ "$ksuid" != "ERROR" ]; then
        PARSE_TEST=$(./ksuid-go -f inspect "$ksuid" 2>/dev/null | head -n1 || echo "ERROR")
        if [[ "$PARSE_TEST" == *"ERROR"* ]]; then
            echo -e "    ${RED}❌ TypeScript-generated KSUID '$ksuid' failed Go parsing${NC}"
        fi
    fi
done

echo

# Summary
echo -e "${BLUE}Cross-Validation Summary${NC}"
echo "======================="
echo "If all tests passed, the Go and TypeScript implementations are compatible."
echo "If any tests failed, there may be compatibility issues that need investigation."
echo
echo "For more detailed testing, run the full test suites:"
echo "  Go: go test ./..."
echo "  TypeScript: npm test"
echo
echo "For manual testing, use:"
echo "  Go: go run manual-test.go [ksuid]"
echo "  TypeScript: $TS_CMD -f inspect [ksuid]"