---
name: 🔄 Go Compatibility Issue
about: Report incompatibility with Go KSUID implementation
title: "[COMPATIBILITY] "
labels: ["go-compatibility", "bug", "high-priority"]
assignees: ""
---

## 🔄 Compatibility Issue

**What behavior differs between Go and TypeScript?** Clear description of the incompatibility.

## 📊 Comparison

**Go behavior:**

```bash
# Show Go KSUID output/behavior
./ksuid-go [command]
# Output: ...
```

**TypeScript behavior:**

```bash
# Show TypeScript KSUID output/behavior
npx ksuid [command]
# Output: ...
```

## 🧪 Test Case

**Reproducible test case:**

```typescript
// Code that demonstrates the incompatibility
import { KSUID } from "@owpz/ksuid";

const testVector = {
  timestamp: 12345,
  payload: Buffer.from("..."),
  expectedGo: "...",
  actualTypeScript: "...",
};
```

## 🔧 Go Reference

**Go implementation details:**

- Repository: `segmentio/ksuid`
- Commit: [commit hash if known]
- File: `path/to/relevant/file.go`
- Function: `FunctionName()`

## 📋 Impact Assessment

**What operations are affected?**

- [ ] String encoding/decoding
- [ ] Binary format
- [ ] Next/Prev operations
- [ ] Sorting
- [ ] CLI output
- [ ] Timestamp handling
- [ ] Payload generation
- [ ] Other: \***\*\_\_\_\*\***

**Severity:**

- [ ] Critical - data corruption possible
- [ ] High - core functionality broken
- [ ] Medium - edge cases fail
- [ ] Low - minor behavioral differences

## 🧪 Validation Results

**Cross-validation test status:**

```bash
cd docs/validation
./cross-validate.sh

# Results:
# ✅ String encoding: PASS
# ❌ Binary format: FAIL
# etc.
```

## 💻 Environment

- **@owpz/ksuid version:** [version]
- **Go version:** [go version]
- **segmentio/ksuid version:** [version]
- **Node.js version:** [version]
- **Operating System:** [OS]

## 📚 Additional Context

**How was this discovered?**

- [ ] Cross-validation tests
- [ ] Production use
- [ ] Manual testing
- [ ] User report

**When did this start happening?**

- [ ] Always been broken
- [ ] Started after recent changes
- [ ] Started after Go library update
- [ ] Unknown

**Any workarounds?** Describe any temporary solutions.

## 🎯 Expected Fix

**What should the correct behavior be?** Describe what the TypeScript implementation should do to
match Go.

**References:**

- Go documentation: [link]
- KSUID specification: [link]
- Related issues: #[number]
