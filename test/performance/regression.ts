#!/usr/bin/env node

/**
 * Performance regression testing for CI
 *
 * This runs a lightweight performance check to catch major regressions.
 * Full benchmarks are too resource-intensive for CI.
 */

import { KSUID } from "../../src/index";
import { performance } from "perf_hooks";

interface RegressionTest {
  name: string;
  minOpsPerSec: number;
  iterations: number;
  operation: () => void;
}

const REGRESSION_TESTS: RegressionTest[] = [
  {
    name: "KSUID Generation",
    minOpsPerSec: 400000, // Conservative threshold (60% of benchmark)
    iterations: 50000,
    operation: () => KSUID.random(),
  },
  {
    name: "KSUID Parsing",
    minOpsPerSec: 500000, // Conservative threshold (60% of benchmark)
    iterations: 50000,
    operation: (() => {
      const testStrings = Array.from({ length: 1000 }, () =>
        KSUID.random().toString()
      );
      let index = 0;
      return () => KSUID.parse(testStrings[index++ % testStrings.length]);
    })(),
  },
  {
    name: "String Encoding",
    minOpsPerSec: 400000, // Conservative threshold
    iterations: 50000,
    operation: (() => {
      const testKsuids = Array.from({ length: 1000 }, () => KSUID.random());
      let index = 0;
      return () => testKsuids[index++ % testKsuids.length].toString();
    })(),
  },
];

async function runRegressionTest(test: RegressionTest): Promise<boolean> {
  console.log(`🧪 Testing ${test.name}...`);

  // Warm up
  for (let i = 0; i < 1000; i++) {
    test.operation();
  }

  // Force GC if available
  if (global.gc) {
    global.gc();
  }

  const startTime = performance.now();

  for (let i = 0; i < test.iterations; i++) {
    test.operation();
  }

  const endTime = performance.now();
  const duration = (endTime - startTime) / 1000; // Convert to seconds
  const opsPerSec = Math.round(test.iterations / duration);

  const passed = opsPerSec >= test.minOpsPerSec;
  const status = passed ? "✅ PASS" : "❌ FAIL";
  const percentage = Math.round((opsPerSec / test.minOpsPerSec) * 100);

  console.log(
    `   ${status} ${opsPerSec.toLocaleString()} ops/sec (${percentage}% of minimum)`
  );

  if (!passed) {
    console.error(
      `   ❌ Performance regression detected! Expected ≥${test.minOpsPerSec.toLocaleString()} ops/sec`
    );
  }

  return passed;
}

async function main(): Promise<void> {
  console.log("🚀 Running KSUID Performance Regression Tests\n");

  let allPassed = true;

  for (const test of REGRESSION_TESTS) {
    const passed = await runRegressionTest(test);
    allPassed = allPassed && passed;

    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log("\n📊 Regression Test Summary:");

  if (allPassed) {
    console.log("✅ All performance regression tests passed!");
    console.log("🎯 Performance is within acceptable thresholds");
  } else {
    console.log("❌ Some performance regression tests failed!");
    console.log("⚠️  Performance has degraded below acceptable thresholds");
    process.exit(1);
  }

  // Memory usage check
  const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024;
  console.log(`💾 Memory usage: ${memoryUsage.toFixed(1)} MB`);

  if (memoryUsage > 50) {
    console.warn(
      "⚠️  Memory usage is higher than expected for regression tests"
    );
  }

  console.log("\n✨ Regression testing complete!");
}

if (require.main === module) {
  main().catch(console.error);
}

export { runRegressionTest, REGRESSION_TESTS };
