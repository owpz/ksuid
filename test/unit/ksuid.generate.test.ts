import { test } from "uvu";
import * as assert from "uvu/assert";
import { KSUID } from "../../src/ksuid";
import { Buffer } from "buffer";

test("KSUID.fromParts() encode/decode diagnostic", () => {
  const timestamp = 95004740;
  const payloadHex = "669f7efd7b6fe812278486085878563d"; // 32 hex chars = 16 bytes
  const payload = Buffer.from(payloadHex, "hex");

  assert.is(payload.length, 16, "Payload must be 16 bytes");

  const ksuid = KSUID.fromParts(timestamp, payload);

  // Log diagnostic info
  console.log("KSUID String:     ", ksuid.toString());
  console.log("Timestamp:        ", ksuid.timestamp);
  console.log("Payload (hex):    ", ksuid.payload.toString("hex"));
  console.log("Raw Buffer (hex): ", ksuid.toBuffer().toString("hex"));

  const roundtrip = KSUID.parse(ksuid.toString());

  // Assert round-trip values
  assert.is(roundtrip.timestamp, timestamp, "timestamp round-trip");
  assert.ok(roundtrip.payload.equals(payload), "payload round-trip");
  assert.ok(roundtrip.toBuffer().equals(ksuid.toBuffer()), "buffer round-trip");
});

test.run();
