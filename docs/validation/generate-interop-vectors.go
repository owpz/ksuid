package main

import (
	"fmt"
	"time"

	"github.com/segmentio/ksuid"
)

func main() {
	fmt.Println("// Go-generated test vectors for TypeScript interop testing")
	
	// Test case 1: Fixed timestamp with known payload
	timestamp1 := uint32(95004740)
	payload1 := []byte{0x66, 0x9f, 0x7e, 0xfd, 0x7b, 0x6f, 0xe8, 0x12, 0x27, 0x84, 0x86, 0x08, 0x58, 0x78, 0x56, 0x3d}
	ksuid1, _ := ksuid.FromParts(time.Unix(int64(timestamp1)+1400000000, 0), payload1)
	fmt.Printf("Test 1 - Fixed timestamp:\n")
	fmt.Printf("  timestamp: %d\n", timestamp1)
	fmt.Printf("  payload: '%x'\n", payload1)
	fmt.Printf("  expectedString: '%s'\n", ksuid1.String())
	fmt.Printf("  expectedRaw: '%x'\n", ksuid1.Bytes())
	fmt.Println()

	// Test case 2: Epoch timestamp
	timestamp2 := uint32(0)
	payload2 := []byte{0xde, 0xad, 0xbe, 0xef, 0xde, 0xad, 0xbe, 0xef, 0xde, 0xad, 0xbe, 0xef, 0xde, 0xad, 0xbe, 0xef}
	ksuid2, _ := ksuid.FromParts(time.Unix(int64(timestamp2)+1400000000, 0), payload2)
	fmt.Printf("Test 2 - Epoch timestamp:\n")
	fmt.Printf("  timestamp: %d\n", timestamp2)
	fmt.Printf("  payload: '%x'\n", payload2)
	fmt.Printf("  expectedString: '%s'\n", ksuid2.String())
	fmt.Printf("  expectedRaw: '%x'\n", ksuid2.Bytes())
	fmt.Println()

	// Test case 3: Max timestamp
	timestamp3 := uint32(4294967295)
	payload3 := []byte{0xab, 0xcd, 0xef, 0x01, 0x23, 0x45, 0x67, 0x89, 0xab, 0xcd, 0xef, 0x01, 0x23, 0x45, 0x67, 0x89}
	ksuid3, _ := ksuid.FromParts(time.Unix(int64(timestamp3)+1400000000, 0), payload3)
	fmt.Printf("Test 3 - Max timestamp:\n")
	fmt.Printf("  timestamp: %d\n", timestamp3)
	fmt.Printf("  payload: '%x'\n", payload3)
	fmt.Printf("  expectedString: '%s'\n", ksuid3.String())
	fmt.Printf("  expectedRaw: '%x'\n", ksuid3.Bytes())
	fmt.Println()

	// Generate sequence test vectors
	fmt.Printf("Sequence test vectors:\n")
	seedKSUID := ksuid1
	fmt.Printf("  seed: '%s'\n", seedKSUID.String())
	
	current := seedKSUID
	for i := 0; i < 5; i++ {
		fmt.Printf("  step_%d: '%s'\n", i, current.String())
		if i < 4 {
			current = current.Next()
		}
	}
	fmt.Println()

	// Next/Prev test vectors
	fmt.Printf("Next/Prev test vectors:\n")
	
	// Standard case
	base := ksuid1
	fmt.Printf("  standard_base: '%s'\n", base.String())
	fmt.Printf("  standard_next: '%s'\n", base.Next().String())
	fmt.Printf("  standard_prev: '%s'\n", base.Prev().String())
	
	// Max payload case (should cause timestamp increment on next)
	maxPayload := []byte{0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff}
	maxKSUID, _ := ksuid.FromParts(time.Unix(int64(timestamp1)+1400000000, 0), maxPayload)
	fmt.Printf("  max_payload_base: '%s'\n", maxKSUID.String())
	fmt.Printf("  max_payload_next: '%s'\n", maxKSUID.Next().String())
	fmt.Printf("  max_payload_prev: '%s'\n", maxKSUID.Prev().String())
	
	// Nil payload case
	nilPayload := []byte{0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00}
	nilKSUID, _ := ksuid.FromParts(time.Unix(int64(timestamp1)+1400000000, 0), nilPayload)
	fmt.Printf("  nil_payload_base: '%s'\n", nilKSUID.String())
	fmt.Printf("  nil_payload_next: '%s'\n", nilKSUID.Next().String())
	fmt.Printf("  nil_payload_prev: '%s'\n", nilKSUID.Prev().String())
	
	// Nil KSUID edge case
	nilKSUID2 := ksuid.Nil
	fmt.Printf("  nil_ksuid_base: '%s'\n", nilKSUID2.String())
	fmt.Printf("  nil_ksuid_next: '%s'\n", nilKSUID2.Next().String())
	fmt.Printf("  nil_ksuid_prev: '%s'\n", nilKSUID2.Prev().String())
}