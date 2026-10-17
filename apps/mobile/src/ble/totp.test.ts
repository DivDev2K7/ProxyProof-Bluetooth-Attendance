import assert from "node:assert/strict";
import test from "node:test";
import { encodeTotpManufacturerData, generateTotp } from "./totp";

test("generates a 6-digit HMAC-SHA256 HOTP value", () => {
  const secret = "3132333435363738393031323334353637383930313233343536373839303132";
  assert.equal(generateTotp(secret, 1), "119246");
});

test("encodes a six-digit token as three big-endian bytes", () => {
  assert.deepEqual(encodeTotpManufacturerData("119246"), [0x01, 0xd1, 0xce]);
});

test("rejects malformed secrets and counters", () => {
  assert.throws(() => generateTotp("not-a-secret", 1), /32 bytes/);
  assert.throws(() => generateTotp("00".repeat(32), -1), /counter/);
  assert.throws(() => encodeTotpManufacturerData("12345"), /invalid TOTP/);
});
