# Go Compatibility Report

Status as of September 29, 2025: Verified compatible with the reference Go implementation (segmentio/ksuid) for all covered behaviors in this repository’s test suite.

## What Was Verified

- Cross‑language test vectors from the Go implementation (commit d33724947fcfba7949906c2b1821e96a1c8d06e7) covering:
  - Encoding/decoding equivalence (string ↔ bytes ↔ parts)
  - Timestamp math relative to KSUID epoch (1400000000)
  - `next()`/`prev()` operational semantics, including nil and max payload cases
  - Sorting/ordering equivalence (lexicographic/chronological)
  - Compressed set round‑trip behavior

## Test Evidence

- Command: `npm ci && npm test`
- Outcome: 180 passed, 0 failed
- Duration: ~114 seconds (local CI run)

Key suites (all green):

- `test/integration/go-compatibility.test.ts` — Go test vectors and equivalence
- `test/integration/go-interop.test.ts` — Interop behaviors (next/prev, sorting, compressed set)
- `test/unit/*` — Constructors, Base62, `Uint128`, `Sequence`, sorting
- `test/api-contract/*` — Public API and CLI contract

## Known Differences vs. Go

- Non‑canonical Base62 inputs: This implementation’s parser will accept any 27‑char Base62 string and truncate if it decodes above 160 bits (`src/base62.ts:86`). The Go behavior for such out‑of‑range strings is not asserted here; for strict parity, consider rejecting non‑canonical values. See `docs/ksuid-issues.md`.
- CLI templating: The `template` formatter implements simple placeholder substitution (`src/cli.ts:118`) rather than full Go templating.

## Reproducing Locally

1) Node.js 16+ required. In repo root:

```
npm ci
npm test
```

2) To focus on interop only:

```
npm run test:integration
```

3) Inspect sample vector from Go:

```
node -r ts-node/register -e "const {KSUID}=require('./src');const p=Buffer.from('669f7efd7b6fe812278486085878563d','hex');console.log(KSUID.fromParts(95004740,p).toString());"
```

