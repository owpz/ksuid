# KSUID Implementation: Potential Issues and Edge Cases

This document captures potential pitfalls, edge cases, and subtle differences to be aware of in this TypeScript implementation. File references point to the starting line of the relevant code.

## Summary

- Core encoding, decoding, ordering, and constructors match the Go reference for valid inputs and typical operations.
- A few edge behaviors are either permissive or rely on JavaScript/Node semantics (BigInt, 32‑bit bitwise ops, Buffer mutability) that can surprise consumers on uncommon inputs.

## Correctness and Parsing

- Base62 overflow acceptance and non‑canonical round‑trips
  - `Base62.decode` accepts any 27‑char Base62 string and converts it to a BigInt. If the numeric value exceeds 160 bits (20 bytes), the implementation truncates to the lower 20 bytes instead of rejecting the input. See `src/base62.ts:60` and the truncation branch at `src/base62.ts:86`.
  - Consequence: Parsing a non‑canonical 27‑char string can succeed but re‑encoding returns a different string (violates parse→string identity for such inputs). Example: parsing `"zzzzzzzzzzzzzzzzzzzzzzzzzzz"` yields a different string when re‑encoded.
  - Mitigation: Consider rejecting inputs whose decoded BigInt exceeds 160 bits, or add an explicit canonicality check (`KSUID.parse(s).toString() === s`).

- Input length and alphabet validation
  - Length is strictly enforced at 27 characters (`src/ksuid.ts:60`, `src/base62.ts:65`).
  - Allowed alphabet matches the Go implementation: `0‑9 A‑Z a‑z` (`src/base62.ts:4`). Any other character is rejected with a structured error (`src/base62.ts:73`).

## Arithmetic and Boundary Behavior

- `next()` overflow from the absolute maximum KSUID
  - For the maximum value (timestamp `0xffffffff`, payload all `0xff`), `next()` increments timestamp to `0x100000000` which wraps when written to a 32‑bit field, effectively producing the nil timestamp (`0x00000000`) with zero payload. See `src/ksuid.ts:132`.
  - This wrap‑around is consistent with modulo 2¹⁶⁰ arithmetic but is not explicitly tested; users relying on sentinel behavior may want to guard against this case.

- `prev()` underflow from the absolute minimum KSUID
  - `prev()` for the nil KSUID returns the maximum KSUID (explicitly handled). See `src/ksuid.ts:147`.

- Timestamp before KSUID epoch in `random()`
  - `random()` computes `Math.floor(Date.now() / 1000) - 1400000000` (`src/ksuid.ts:19`). On systems with a clock earlier than 2014‑05‑13T16:53:20Z, `fromParts` rejects the negative timestamp (`src/ksuid.ts:25`). In practice this is rare but differs from a “clamp to zero” strategy.

## Buffer and Immutability

- Exposing internal buffers
  - `KSUID.toBuffer()` returns the internal `Buffer` view (`src/ksuid.ts:120`), and `payload` returns a `subarray` over the internal buffer (`src/ksuid.ts:112`). Callers can mutate these and thereby alter the KSUID instance.
  - Mitigation: Return copies (`Buffer.from`) from `toBuffer()` and `payload` to preserve immutability (with a small performance cost), or document the mutability explicitly (current behavior).

## Varint Helpers (Compressed Set)

- 64‑bit bitwise checks on JavaScript `number`s
  - `varintLength64(v: number)` uses 64‑bit masks with JS bitwise operators (`&`), which are defined on 32‑bit integers. Masks above 32 bits are truncated, causing the function to always return ≤ 4 for large values. See `src/compressed-set.ts:240`.
  - Today this is benign because the only caller uses relatively small `rangeSize` values, but it is incorrect for very large ranges and could mis‑size varints. Prefer a BigInt version for all 64‑bit cases (like `varintLength64BigInt`).

- Potential precision loss when reading 64‑bit varints
  - `readVarint64` converts a 64‑bit value to a JS `number` (`src/compressed-set.ts:397` and `src/compressed-set.ts:402`). Values above `Number.MAX_SAFE_INTEGER` will lose precision. Current callers only expect moderate counts, so this is low risk; switching to BigInt end‑to‑end would be safer if very large ranges are required.

## CLI Template Parity

- The `template` format supports simple `{{ Field }}` / `{{ .Field }}` replacements (`src/cli.ts:118`) but does not implement full Go template features (conditions, loops, functions). If strict parity with the Go CLI’s templating is required, this is a known limitation.

## Environment Assumptions

- Node.js ≥ 16 is required (BigInt 64‑bit buffer operations). Browser builds are not supported without polyfills for `Buffer`/`crypto`.
- `crypto.randomBytes` quality and availability follow the host runtime; environments without a proper CSPRNG cannot use `KSUID.random()`.
- `Sequence` is not safe for concurrent use from multiple threads (matches Go’s guidance).

## Non‑Issues (Confirmed Compatible)

- Epoch and endianness match Go (timestamp big‑endian, then 16‑byte payload). See `src/ksuid.ts:49`.
- Base62 alphabet and fixed 27‑char string length match Go (`src/base62.ts:4`, `src/base62.ts:51`).
- Ordering via `Buffer.compare` matches chronological ordering (`src/ksuid.ts:128`).
- `Sequence` applies a 16‑bit big‑endian counter to the last two payload bytes, like Go (`src/sequence.ts:61`).
