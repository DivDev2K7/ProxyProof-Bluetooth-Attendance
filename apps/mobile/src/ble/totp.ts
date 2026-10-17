import { hmac } from "@noble/hashes/hmac";
import { sha256 } from "@noble/hashes/sha256";

function parseSecret(secretHex: string): Uint8Array {
  if (!/^(?:[0-9a-fA-F]{2}){32}$/.test(secretHex)) {
    throw new Error("The session TOTP secret must be 32 bytes encoded as hexadecimal.");
  }
  return Uint8Array.from(secretHex.match(/.{2}/g)!, (byte) => Number.parseInt(byte, 16));
}

export function validateTotpSecret(secretHex: string): void {
  parseSecret(secretHex);
}

export function generateTotp(secretHex: string, counter: number): string {
  if (!Number.isSafeInteger(counter) || counter < 0 || counter > 0xffffffff) {
    throw new Error("The TOTP counter is outside the supported range.");
  }
  const secret = parseSecret(secretHex);
  const message = new Uint8Array(8);
  const view = new DataView(message.buffer);
  view.setUint32(0, Math.floor(counter / 0x1_0000_0000), false);
  view.setUint32(4, counter >>> 0, false);

  const digest = hmac(sha256, secret, message);
  const offset = digest[digest.length - 1] & 0x0f;
  const binaryCode =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);
  return String(binaryCode % 1_000_000).padStart(6, "0");
}

export function encodeTotpManufacturerData(code: string): number[] {
  const numericCode = Number(code);
  if (!/^\d{6}$/.test(code) || !Number.isSafeInteger(numericCode)) {
    throw new Error("Cannot encode an invalid TOTP code.");
  }
  return [(numericCode >>> 16) & 0xff, (numericCode >>> 8) & 0xff, numericCode & 0xff];
}
