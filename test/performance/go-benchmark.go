package main

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"runtime"
	"time"

	"github.com/segmentio/ksuid"
)

type BenchmarkResult struct {
	Operation    string  `json:"operation"`
	Iterations   int     `json:"iterations"`
	TotalTimeMs  float64 `json:"totalTimeMs"`
	AvgTimeMs    float64 `json:"avgTimeMs"`
	OpsPerSecond int64   `json:"opsPerSecond"`
	MemoryUsageMB float64 `json:"memoryUsageMB,omitempty"`
}

type BenchmarkSuite struct {
	Results []BenchmarkResult `json:"results"`
}

func (bs *BenchmarkSuite) Run(name string, iterations int, operation func()) BenchmarkResult {
	fmt.Printf("🔥 Running Go benchmark: %s (%d iterations)\n", name, iterations)

	// Warm up
	warmupIterations := min(1000, iterations/10)
	for i := 0; i < warmupIterations; i++ {
		operation()
	}

	// Force garbage collection
	runtime.GC()

	// Memory before
	var memBefore runtime.MemStats
	runtime.ReadMemStats(&memBefore)

	// Run benchmark
	startTime := time.Now()
	
	for i := 0; i < iterations; i++ {
		operation()
	}
	
	endTime := time.Now()

	// Memory after
	var memAfter runtime.MemStats
	runtime.ReadMemStats(&memAfter)

	// Calculate results
	totalTimeMs := float64(endTime.Sub(startTime).Nanoseconds()) / 1e6
	avgTimeMs := totalTimeMs / float64(iterations)
	opsPerSecond := int64(float64(iterations) / (totalTimeMs / 1000))
	memoryUsageMB := float64(memAfter.HeapInuse-memBefore.HeapInuse) / 1024 / 1024

	result := BenchmarkResult{
		Operation:     name,
		Iterations:    iterations,
		TotalTimeMs:   totalTimeMs,
		AvgTimeMs:     avgTimeMs,
		OpsPerSecond:  opsPerSecond,
		MemoryUsageMB: memoryUsageMB,
	}

	bs.Results = append(bs.Results, result)

	fmt.Printf("   ✅ %s: %s ops/sec (%.3fms avg, %.2fMB)\n", 
		name, 
		formatNumber(opsPerSecond), 
		avgTimeMs, 
		memoryUsageMB)

	return result
}

func (bs *BenchmarkSuite) PrintResults() {
	fmt.Println("\n🚀 Go KSUID Performance Benchmark Results")
	fmt.Println("================================================================================")
	fmt.Printf("| %-22s | %-11s | %-14s | %-11s | %-11s |\n", 
		"Operation", "Ops/sec", "Avg Time", "Memory MB", "Iterations")
	fmt.Println("|" + repeat("-", 23) + "|" + repeat("-", 12) + "|" + repeat("-", 15) + "|" + repeat("-", 12) + "|" + repeat("-", 12) + "|")

	for _, result := range bs.Results {
		fmt.Printf("| %-22s | %-11s | %-14s | %-11.2f | %-11s |\n",
			result.Operation,
			formatNumber(result.OpsPerSecond),
			fmt.Sprintf("%.3fms", result.AvgTimeMs),
			result.MemoryUsageMB,
			formatNumber(int64(result.Iterations)))
	}
	fmt.Println("================================================================================")
}

func (bs *BenchmarkSuite) ExportJSON(filename string) error {
	data, err := json.MarshalIndent(bs, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(filename, data, 0644)
}

func formatNumber(n int64) string {
	str := fmt.Sprintf("%d", n)
	if len(str) <= 3 {
		return str
	}

	result := ""
	for i, digit := range str {
		if i > 0 && (len(str)-i)%3 == 0 {
			result += ","
		}
		result += string(digit)
	}
	return result
}

func repeat(s string, count int) string {
	result := ""
	for i := 0; i < count; i++ {
		result += s
	}
	return result
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

func main() {
	fmt.Println("🔥 Starting Go KSUID performance benchmarks...\n")
	fmt.Printf("Go version: %s\n", runtime.Version())
	fmt.Printf("GOOS: %s, GOARCH: %s\n", runtime.GOOS, runtime.GOARCH)
	fmt.Printf("CPU cores: %d\n\n", runtime.NumCPU())

	suite := &BenchmarkSuite{}

	// Generate test data
	fmt.Println("📊 Generating test data...")
	testKsuids := make([]ksuid.KSUID, 10000)
	testStrings := make([]string, 10000)
	testBytes := make([][]byte, 10000)

	for i := 0; i < 10000; i++ {
		k := ksuid.New()
		testKsuids[i] = k
		testStrings[i] = k.String()
		testBytes[i] = k.Bytes()
	}

	// 1. KSUID Generation Benchmark
	suite.Run("Random Generation", 100000, func() {
		ksuid.New()
	})

	// 2. KSUID Parsing Benchmark
	parseIndex := 0
	suite.Run("String Parsing", 100000, func() {
		ksuid.Parse(testStrings[parseIndex%len(testStrings)])
		parseIndex++
	})

	// 3. KSUID String Encoding Benchmark
	encodeIndex := 0
	suite.Run("String Encoding", 100000, func() {
		testKsuids[encodeIndex%len(testKsuids)].String()
		encodeIndex++
	})

	// 4. Buffer Operations Benchmark
	bufferIndex := 0
	suite.Run("Buffer Conversion", 100000, func() {
		testKsuids[bufferIndex%len(testKsuids)].Bytes()
		bufferIndex++
	})

	// 5. fromBytes Benchmark
	fromBytesIndex := 0
	suite.Run("From Bytes", 100000, func() {
		ksuid.FromBytes(testBytes[fromBytesIndex%len(testBytes)])
		fromBytesIndex++
	})

	// 6. Next/Prev Operations Benchmark
	nextIndex := 0
	suite.Run("Next Operation", 50000, func() {
		k := testKsuids[nextIndex%len(testKsuids)]
		k.Next()
		nextIndex++
	})

	prevIndex := 0
	suite.Run("Prev Operation", 50000, func() {
		k := testKsuids[prevIndex%len(testKsuids)]
		k.Prev()
		prevIndex++
	})

	// 7. Comparison Benchmark
	compareIndex := 0
	suite.Run("Comparison", 100000, func() {
		a := testKsuids[compareIndex%len(testKsuids)]
		b := testKsuids[(compareIndex+1)%len(testKsuids)]
		ksuid.Compare(a, b)
		compareIndex++
	})

	// 8. Sorting Benchmark (smaller dataset)
	suite.Run("Sorting (1K items)", 1000, func() {
		// Copy subset to avoid mutation
		subset := make([]ksuid.KSUID, 1000)
		copy(subset, testKsuids[:1000])
		ksuid.Sort(subset)
	})

	// 9. Component Access Benchmarks
	accessIndex := 0
	suite.Run("Timestamp Access", 100000, func() {
		k := testKsuids[accessIndex%len(testKsuids)]
		k.Time()
		accessIndex++
	})

	payloadIndex := 0
	suite.Run("Payload Access", 100000, func() {
		k := testKsuids[payloadIndex%len(testKsuids)]
		k.Payload()
		payloadIndex++
	})

	// Print results
	suite.PrintResults()

	// Performance analysis
	fmt.Println("\n📈 Go Performance Analysis:")
	
	for _, result := range suite.Results {
		switch result.Operation {
		case "Random Generation":
			fmt.Printf("🎯 Generation: %s KSUIDs/sec\n", formatNumber(result.OpsPerSecond))
			if result.OpsPerSecond > 1000000 {
				fmt.Println("   ✅ Excellent generation performance")
			} else if result.OpsPerSecond > 500000 {
				fmt.Println("   ⚠️  Good generation performance")
			} else {
				fmt.Println("   ❌ Generation performance below expectations")
			}
		case "String Parsing":
			fmt.Printf("🎯 Parsing: %s parses/sec\n", formatNumber(result.OpsPerSecond))
			if result.OpsPerSecond > 2000000 {
				fmt.Println("   ✅ Excellent parsing performance")
			} else if result.OpsPerSecond > 1000000 {
				fmt.Println("   ⚠️  Good parsing performance")
			} else {
				fmt.Println("   ❌ Parsing performance below expectations")
			}
		case "Sorting (1K items)":
			itemsPerSec := result.OpsPerSecond * 1000
			fmt.Printf("🎯 Sorting: %s items/sec\n", formatNumber(itemsPerSec))
		}
	}

	// Export results for comparison
	err := suite.ExportJSON("go-benchmark-results.json")
	if err != nil {
		log.Printf("Warning: Could not export results: %v", err)
	} else {
		fmt.Println("📊 Results exported to go-benchmark-results.json")
	}

	fmt.Println("\n✨ Go benchmark complete!")
}