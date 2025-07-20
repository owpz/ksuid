// Manual Cross-Validation Test for Go-TypeScript KSUID Compatibility
//
// This program allows manual testing of specific KSUID values to verify
// compatibility between Go and TypeScript implementations.
//
// Usage:
//   go run manual-test.go [ksuid-string]
//
// If no KSUID is provided, generates a new one and shows its properties.
// If a KSUID string is provided, parses it and shows all details.
//
// Compare the output with the TypeScript CLI:
//   npx ksuid -f inspect [same-ksuid-string]

package main

import (
	"fmt"
	"os"
	"time"

	"github.com/segmentio/ksuid"
)

func main() {
	if len(os.Args) > 1 {
		// Parse provided KSUID
		ksuidStr := os.Args[1]
		testParseKSUID(ksuidStr)
	} else {
		// Generate new KSUID and show details
		testGenerateKSUID()
	}
}

func testParseKSUID(ksuidStr string) {
	fmt.Printf("Go KSUID Parser - Manual Cross-Validation Test\n")
	fmt.Printf("==============================================\n")
	fmt.Printf("Input KSUID: %s\n\n", ksuidStr)

	parsed, err := ksuid.Parse(ksuidStr)
	if err != nil {
		fmt.Printf("Error parsing KSUID: %v\n", err)
		fmt.Printf("\nExpected TypeScript behavior:\n")
		fmt.Printf("  KSUID.parse('%s') should throw error\n", ksuidStr)
		fmt.Printf("  KSUID.parseOrNil('%s') should return nil KSUID\n", ksuidStr)
		return
	}

	fmt.Printf("Parsed successfully!\n")
	fmt.Printf("String: %s\n", parsed.String())
	fmt.Printf("Raw: %X\n", parsed.Bytes())
	fmt.Printf("Time: %s\n", parsed.Time().Format(time.RFC3339))
	fmt.Printf("Timestamp: %d\n", parsed.Timestamp())
	fmt.Printf("Payload: %X\n", parsed.Payload())

	// Test next/prev operations
	next := parsed.Next()
	prev := parsed.Prev()
	fmt.Printf("\nNavigation:\n")
	fmt.Printf("Next: %s\n", next.String())
	fmt.Printf("Prev: %s\n", prev.String())

	fmt.Printf("\nExpected TypeScript output:\n")
	fmt.Printf("  KSUID.parse('%s').toString() === '%s'\n", ksuidStr, parsed.String())
	fmt.Printf("  KSUID.parse('%s').timestamp === %d\n", ksuidStr, parsed.Timestamp())
	fmt.Printf("  KSUID.parse('%s').payload.toString('hex') === '%x'\n", ksuidStr, parsed.Payload())
	fmt.Printf("  KSUID.parse('%s').next().toString() === '%s'\n", ksuidStr, next.String())
	fmt.Printf("  KSUID.parse('%s').prev().toString() === '%s'\n", ksuidStr, prev.String())
	fmt.Printf("\nCLI Validation:\n")
	fmt.Printf("  npx ksuid -f inspect %s\n", ksuidStr)
}

func testGenerateKSUID() {
	fmt.Printf("Go KSUID Generator - Manual Cross-Validation Test\n")
	fmt.Printf("===============================================\n")

	// Generate new KSUID
	newKSUID := ksuid.New()

	fmt.Printf("Generated KSUID: %s\n\n", newKSUID.String())
	fmt.Printf("String: %s\n", newKSUID.String())
	fmt.Printf("Raw: %X\n", newKSUID.Bytes())
	fmt.Printf("Time: %s\n", newKSUID.Time().Format(time.RFC3339))
	fmt.Printf("Timestamp: %d\n", newKSUID.Timestamp())
	fmt.Printf("Payload: %X\n", newKSUID.Payload())

	// Test next/prev operations
	next := newKSUID.Next()
	prev := newKSUID.Prev()
	fmt.Printf("\nNavigation:\n")
	fmt.Printf("Next: %s\n", next.String())
	fmt.Printf("Prev: %s\n", prev.String())

	fmt.Printf("\nTo test TypeScript compatibility:\n")
	fmt.Printf("  npx ksuid -f inspect %s\n", newKSUID.String())
	fmt.Printf("\nCompare the following values:\n")
	fmt.Printf("  TypeScript timestamp should equal: %d\n", newKSUID.Timestamp())
	fmt.Printf("  TypeScript payload.toString('hex') should equal: '%x'\n", newKSUID.Payload())
	fmt.Printf("  TypeScript next().toString() should equal: '%s'\n", next.String())
	fmt.Printf("  TypeScript prev().toString() should equal: '%s'\n", prev.String())

	fmt.Printf("\nTest sequence generation:\n")
	fmt.Printf("  Go: Create sequence from this KSUID and generate 5 items\n")
	fmt.Printf("  TypeScript: new Sequence({ seed: KSUID.parse('%s') })\n", newKSUID.String())

	// Show deterministic test case
	fmt.Printf("\nDeterministic Test Case:\n")
	testTimestamp := uint32(95004740)
	testPayload := []byte{0x66, 0x9f, 0x7e, 0xfd, 0x7b, 0x6f, 0xe8, 0x12, 0x27, 0x84, 0x86, 0x08, 0x58, 0x78, 0x56, 0x3d}
	testKSUID, _ := ksuid.FromParts(time.Unix(int64(testTimestamp)+1400000000, 0), testPayload)
	fmt.Printf("  KSUID.fromParts(%d, Buffer.from('%x', 'hex'))\n", testTimestamp, testPayload)
	fmt.Printf("  Should produce: '%s'\n", testKSUID.String())
	fmt.Printf("  Raw bytes: %X\n", testKSUID.Bytes())
}