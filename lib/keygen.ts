/**
 * Generates an ephemeral Zcash transparent keypair in the browser.
 *
 * For the hackathon MVP we use transparent (t-addr) keys since
 * shielded key generation in WASM is not yet production-ready.
 * The next step is to integrate with the Zodl SDK for shielded support.
 *
 * Zcash transparent addresses are essentially Bitcoin addresses
 * with a different version prefix:
 *   mainnet t1-addr: version bytes 0x1C, 0xB8 (base58check)
 */

import { sha256 } from "@noble/hashes/sha256";
import { ripemd160 } from "@noble/hashes/ripemd160";

// Zcash mainnet transparent address version bytes
const T_ADDR_VERSION = new Uint8Array([0x1c, 0xb8]);
// Zcash mainnet private key prefix (same as Bitcoin but with Zcash WIF)
const PRIVATE_KEY_VERSION = new Uint8Array([0x80]);

function base58checkEncode(version: Uint8Array, payload: Uint8Array): string {
  const data = new Uint8Array(version.length + payload.length);
  data.set(version, 0);
  data.set(payload, version.length);

  const checksum = sha256(sha256(data)).slice(0, 4);

  const full = new Uint8Array(data.length + 4);
  full.set(data, 0);
  full.set(checksum, data.length);

  return base58Encode(full);
}

const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

function base58Encode(bytes: Uint8Array): string {
  const digits = [0];
  for (const byte of bytes) {
    let carry = byte;
    for (let j = 0; j < digits.length; j++) {
      carry += digits[j] << 8;
      digits[j] = carry % 58;
      carry = (carry / 58) | 0;
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = (carry / 58) | 0;
    }
  }

  // leading zeros
  let leadingZeros = "";
  for (const byte of bytes) {
    if (byte !== 0) break;
    leadingZeros += ALPHABET[0];
  }

  return leadingZeros + digits.reverse().map((d) => ALPHABET[d]).join("");
}

function base58Decode(str: string): Uint8Array {
  const bytes: number[] = [];
  for (const char of str) {
    const idx = ALPHABET.indexOf(char);
    if (idx === -1) throw new Error("Invalid base58 character");
    let carry = idx;
    for (let j = 0; j < bytes.length; j++) {
      carry += bytes[j] * 58;
      bytes[j] = carry & 0xff;
      carry >>= 8;
    }
    while (carry > 0) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }

  // leading ones (base58 '1' = 0x00)
  for (const char of str) {
    if (char !== ALPHABET[0]) break;
    bytes.push(0);
  }

  return new Uint8Array(bytes.reverse());
}

export function wifToPrivateKeyBytes(wif: string): Uint8Array {
  const decoded = base58Decode(wif);
  // Remove version byte (1), checksum (4), and optional compression flag (1)
  // Format: [version(1)] [key(32)] [compressed_flag(1)?] [checksum(4)]
  if (decoded.length === 38) {
    // compressed WIF
    return decoded.slice(1, 33);
  }
  return decoded.slice(1, 33);
}

export interface EphemeralKeypair {
  /** Zcash transparent address (t1...) */
  address: string;
  /** Private key in WIF format */
  privateKeyWIF: string;
}

export async function generateKeypair(): Promise<EphemeralKeypair> {
  // Generate 32 random bytes for the private key
  const privateKey = crypto.getRandomValues(new Uint8Array(32));

  // Get public key using SubtleCrypto is not available for secp256k1,
  // so we use @noble/secp256k1 indirectly via manual EC math.
  // For the hackathon, we'll use a simpler approach:
  // Import secp256k1 dynamically to keep the bundle small.
  const secp = await import("@noble/secp256k1");
  const publicKey = secp.getPublicKey(privateKey, true); // compressed

  // Hash public key: SHA256 then RIPEMD160
  const pubKeyHash = ripemd160(sha256(publicKey));

  // Encode as Zcash t-address
  const address = base58checkEncode(T_ADDR_VERSION, pubKeyHash);

  // Encode private key as WIF (compressed)
  const wifPayload = new Uint8Array(33);
  wifPayload.set(privateKey, 0);
  wifPayload[32] = 0x01; // compression flag
  const privateKeyWIF = base58checkEncode(PRIVATE_KEY_VERSION, wifPayload);

  return { address, privateKeyWIF };
}
