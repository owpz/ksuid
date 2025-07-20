#!/usr/bin/env node

/**
 * Performance benchmarking suite for @owpz/ksuid
 *
 * This suite benchmarks the core operations and compares them with the
 * Go implementation claims to validate performance assertions.
 */

import { performance } from "perf_hooks";
import { KSUID, Sequence, sort, compare } from "../../src/index";

interface BenchmarkResult {
  operation: string;
  iterations: number;
  totalTimeMs: number;
  avgTimeMs: number;
  opsPerSecond: number;
  memoryUsageMB?: number;
}

class Benchmark {
  private results: BenchmarkResult[] = [];

  /**
   * Run a benchmark for a specific operation
   */
  async run(
    name: string,
    iterations: number,
    operation: () => void | Promise<void>,
  ): Promise<BenchmarkResult> {
    // Warm up
    for (let i = 0; i < Math.min(1000, iterations / 10); i++) {
      await operation();
    }

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    const memBefore = process.memoryUsage().heapUsed / 1024 / 1024;
    const startTime = performance.now();

    // Run benchmark
    for (let i = 0; i < iterations; i++) {
      await operation();
    }

    const endTime = performance.now();
    const memAfter = process.memoryUsage().heapUsed / 1024 / 1024;

    const totalTimeMs = endTime - startTime;
    const avgTimeMs = totalTimeMs / iterations;
    const opsPerSecond = Math.round(1000 / avgTimeMs);
    const memoryUsageMB = memAfter - memBefore;

    const result: BenchmarkResult = {
      operation: name,
      iterations,
      totalTimeMs: Math.round(totalTimeMs * 100) / 100,
      avgTimeMs: Math.round(avgTimeMs * 1000000) / 1000000, // microseconds precision
      opsPerSecond,
      memoryUsageMB: Math.round(memoryUsageMB * 100) / 100,
    };

    this.results.push(result);
    return result;
  }

  /**
   * Print results in a formatted table
   */
  printResults(): void {
    console.log("\n🚀 @owpz/ksuid Performance Benchmark Results");
    console.log("=".repeat(80));
    console.log(
      "| Operation".padEnd(25) +
        "| Ops/sec".padEnd(12) +
        "| Avg Time".padEnd(15) +
        "| Memory MB".padEnd(12) +
        "| Iterations".padEnd(12) +
        "|",
    );
    console.log(
      "|" +
        "-".repeat(24) +
        "|" +
        "-".repeat(11) +
        "|" +
        "-".repeat(14) +
        "|" +
        "-".repeat(11) +
        "|" +
        "-".repeat(11) +
        "|",
    );

    for (const result of this.results) {
      const opsFormatted = result.opsPerSecond.toLocaleString().padEnd(11);
      const avgFormatted = `${result.avgTimeMs.toFixed(3)}ms`.padEnd(14);
      const memFormatted = result.memoryUsageMB
        ? result.memoryUsageMB.toFixed(2).padEnd(11)
        : "N/A".padEnd(11);
      const iterFormatted = result.iterations.toLocaleString().padEnd(11);

      console.log(
        `| ${result.operation.padEnd(23)} | ${opsFormatted} | ${avgFormatted} | ${memFormatted} | ${iterFormatted} |`,
      );
    }
    console.log("=".repeat(80));
  }

  /**
   * Get results as JSON for CI/automation
   */
  getResults(): BenchmarkResult[] {
    return this.results;
  }
}

/**
 * Main benchmarking function
 */
async function runBenchmarks(): Promise<void> {
  const benchmark = new Benchmark();

  console.log("🔥 Starting @owpz/ksuid performance benchmarks...\n");

  // Generate test data
  const testKsuids: KSUID[] = [];
  const testStrings: string[] = [];
  const testBuffers: Buffer[] = [];

  console.log("📊 Generating test data...");
  for (let i = 0; i < 10000; i++) {
    const ksuid = KSUID.random();
    testKsuids.push(ksuid);
    testStrings.push(ksuid.toString());
    testBuffers.push(ksuid.toBuffer());
  }

  // 1. KSUID Generation Benchmark
  await benchmark.run("Random Generation", 100000, () => {
    KSUID.random();
  });

  // 2. KSUID Parsing Benchmark
  let parseIndex = 0;
  await benchmark.run("String Parsing", 100000, () => {
    KSUID.parse(testStrings[parseIndex++ % testStrings.length]);
  });

  // 3. KSUID String Encoding Benchmark
  let encodeIndex = 0;
  await benchmark.run("String Encoding", 100000, () => {
    testKsuids[encodeIndex++ % testKsuids.length].toString();
  });

  // 4. Buffer Operations Benchmark
  let bufferIndex = 0;
  await benchmark.run("Buffer Conversion", 100000, () => {
    testKsuids[bufferIndex++ % testKsuids.length].toBuffer();
  });

  // 5. fromBytes Benchmark
  let fromBytesIndex = 0;
  await benchmark.run("From Bytes", 100000, () => {
    KSUID.fromBytes(testBuffers[fromBytesIndex++ % testBuffers.length]);
  });

  // 6. Next/Prev Operations Benchmark
  let nextPrevIndex = 0;
  await benchmark.run("Next Operation", 50000, () => {
    const ksuid = testKsuids[nextPrevIndex++ % testKsuids.length];
    ksuid.next();
  });

  let prevIndex = 0;
  await benchmark.run("Prev Operation", 50000, () => {
    const ksuid = testKsuids[prevIndex++ % testKsuids.length];
    ksuid.prev();
  });

  // 7. Comparison Benchmark
  let compareIndex = 0;
  await benchmark.run("Comparison", 100000, () => {
    const a = testKsuids[compareIndex % testKsuids.length];
    const b = testKsuids[(compareIndex + 1) % testKsuids.length];
    compareIndex++;
    compare(a, b);
  });

  // 8. Sorting Benchmark (smaller dataset)
  await benchmark.run("Sorting (1K items)", 1000, () => {
    const subset = testKsuids.slice(0, 1000).map((k) => k); // Copy to avoid mutation
    sort(subset);
  });

  // 9. Sequence Generation Benchmark
  await benchmark.run("Sequence Generation", 10000, () => {
    const sequence = new Sequence({ seed: KSUID.random() });
    const results = [];
    for (let i = 0; i < 100; i++) {
      const next = sequence.next();
      if (next) results.push(next);
    }
  });

  // 10. Component Access Benchmark
  let accessIndex = 0;
  await benchmark.run("Timestamp Access", 100000, () => {
    const ksuid = testKsuids[accessIndex++ % testKsuids.length];
    ksuid.timestamp;
  });

  let payloadIndex = 0;
  await benchmark.run("Payload Access", 100000, () => {
    const ksuid = testKsuids[payloadIndex++ % testKsuids.length];
    ksuid.payload;
  });

  // Print results
  benchmark.printResults();

  // Performance analysis and recommendations
  console.log("\n📈 Performance Analysis:");
  const results = benchmark.getResults();

  const generation = results.find((r) => r.operation === "Random Generation");
  const parsing = results.find((r) => r.operation === "String Parsing");
  const sorting = results.find((r) => r.operation === "Sorting (1K items)");

  if (generation) {
    console.log(
      `🎯 Generation: ${generation.opsPerSecond.toLocaleString()} KSUIDs/sec`,
    );
    if (generation.opsPerSecond > 80000) {
      console.log("   ✅ Excellent generation performance");
    } else if (generation.opsPerSecond > 50000) {
      console.log("   ⚠️  Good generation performance");
    } else {
      console.log("   ❌ Generation performance below expectations");
    }
  }

  if (parsing) {
    console.log(
      `🎯 Parsing: ${parsing.opsPerSecond.toLocaleString()} parses/sec`,
    );
    if (parsing.opsPerSecond > 150000) {
      console.log("   ✅ Excellent parsing performance");
    } else if (parsing.opsPerSecond > 100000) {
      console.log("   ⚠️  Good parsing performance");
    } else {
      console.log("   ❌ Parsing performance below expectations");
    }
  }

  if (sorting) {
    const itemsPerSec = sorting.opsPerSecond * 1000; // 1K items per operation
    console.log(`🎯 Sorting: ${itemsPerSec.toLocaleString()} items/sec`);
  }

  // Memory usage analysis
  const totalMemory = results.reduce(
    (sum, r) => sum + (r.memoryUsageMB || 0),
    0,
  );
  console.log(`💾 Total memory overhead: ${totalMemory.toFixed(2)} MB`);

  // Export results for CI
  if (process.env.CI) {
    const resultsJson = JSON.stringify(results, null, 2);
    require("fs").writeFileSync("benchmark-results.json", resultsJson);
    console.log("📊 Results exported to benchmark-results.json");
  }

  console.log("\n✨ Benchmark complete!");
}

// Run benchmarks
if (require.main === module) {
  runBenchmarks().catch(console.error);
}

export { runBenchmarks, Benchmark };
