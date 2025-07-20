import { test } from "uvu";
import * as assert from "uvu/assert";
import { Base62 } from "../../src/base62";
import { Buffer } from "buffer";

test("Base62 round-trip for all-zero buffer", () => {
  const zeroBuf = Buffer.alloc(20, 0x00);
  const encoded = Base62.encode(zeroBuf);
  const decoded = Base62.decode(encoded);

  console.log("All-zero KSUID encoding:", encoded);
  assert.is(encoded.length, 27, "Encoded length must be 27 characters");
  assert.ok(zeroBuf.equals(decoded), "Decoded buffer must match original");
});

test("Base62 round-trip for leading-zero-prefixed buffer", () => {
  const buf = Buffer.from("000000000000000000000000000000000000abcd", "hex");
  const encoded = Base62.encode(buf);
  const decoded = Base62.decode(encoded);

  console.log("Leading-zero KSUID encoding:", encoded);
  assert.is(encoded.length, 27);
  assert.ok(buf.equals(decoded));
});

test("Base62 round-trip for max buffer", () => {
  const maxBuf = Buffer.alloc(20, 0xff);
  const encoded = Base62.encode(maxBuf);
  const decoded = Base62.decode(encoded);

  console.log("Max KSUID encoding:", encoded);
  assert.is(encoded.length, 27);
  assert.ok(maxBuf.equals(decoded));
});

test("Base62 round-trip for random buffer", () => {
  const original = Buffer.from(
    "05a9a844669f7efd7b6fe812278486085878563d",
    "hex"
  );
  assert.is(original.length, 20);
  const encoded = Base62.encode(original);
  const decoded = Base62.decode(encoded);

  console.log("KSUID (randomish):", encoded);
  assert.is(encoded.length, 27);
  assert.ok(original.equals(decoded));
});

test("Base62.encode() throws for non-20-byte buffer", () => {
  const badBuf = Buffer.alloc(19);
  assert.throws(
    () => Base62.encode(badBuf),
    /Invalid KSUID buffer: expected 20 bytes, got 19/
  );

  const tooLong = Buffer.alloc(21);
  assert.throws(
    () => Base62.encode(tooLong),
    /Invalid KSUID buffer: expected 20 bytes, got 21/
  );
});

test("Base62.decode() throws for non-27-character string", () => {
  assert.throws(
    () => Base62.decode("short"),
    /Invalid KSUID string: expected 27 characters, got 5/
  );
  assert.throws(
    () => Base62.decode("a".repeat(28)),
    /Invalid KSUID string: expected 27 characters, got 28/
  );
});

test("Base62.decode() throws for invalid character", () => {
  assert.throws(
    () => Base62.decode("!".repeat(27)),
    /Invalid KSUID string: invalid character '!' at position 0/
  );
});

test.run();
