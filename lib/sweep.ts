/**
 * Sweep: fetch UTXOs for an ephemeral t-address, build a transaction
 * sending all funds to the recipient, sign it, and broadcast.
 *
 * Uses Blockchair API for UTXO lookup and broadcast.
 * Uses @bitgo/utxo-lib for Zcash transaction construction.
 */

// This file runs server-side only (Next.js API route)
import * as utxolib from "@bitgo/utxo-lib";
import { sha256 } from "@noble/hashes/sha256";

const ZCASH_NETWORK = utxolib.networks.zcash;
const BLOCKCHAIR_BASE = "https://api.blockchair.com/zcash";
const FEE_SATOSHIS = 10_000; // 0.0001 ZEC — standard relay fee
const ZAT_PER_ZEC = 1e8;

// ECPair.fromWIF expects single-byte pubKeyHash but Zcash uses 2-byte (0x1CB8).
// WIF version byte 0x80 is the same for Bitcoin and Zcash, so we decode
// with the default (Bitcoin) network, which works for private key extraction.
const WIF_DECODE_NETWORK = utxolib.networks.bitcoin;

interface UTXO {
  transaction_hash: string;
  index: number;
  value: number; // satoshis
  script_hex: string;
}

interface SweepResult {
  txid: string;
  hex: string;
  totalInput: number;
  fee: number;
  sent: number;
}

/**
 * Decode a Zcash base58check address into its 20-byte pubkey hash.
 * Zcash t1-addresses use a 2-byte version prefix (0x1C, 0xB8).
 */
function addressToPubkeyHash(address: string): Buffer {
  const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  const bytes: number[] = [];
  for (const char of address) {
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
  for (const char of address) {
    if (char !== ALPHABET[0]) break;
    bytes.push(0);
  }
  const decoded = Buffer.from(bytes.reverse());
  // [version(2)] [hash(20)] [checksum(4)]
  return decoded.slice(2, 22);
}

/** Build a P2PKH output script from a 20-byte pubkey hash */
function p2pkhScript(pubkeyHash: Buffer): Buffer {
  return utxolib.script.compile([
    utxolib.opcodes.OP_DUP,
    utxolib.opcodes.OP_HASH160,
    pubkeyHash,
    utxolib.opcodes.OP_EQUALVERIFY,
    utxolib.opcodes.OP_CHECKSIG,
  ]);
}

/** Fetch UTXOs for a transparent Zcash address via Blockchair */
export async function fetchUTXOs(address: string): Promise<UTXO[]> {
  const url = `${BLOCKCHAIR_BASE}/dashboards/address/${address}?limit=0`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Blockchair API error: ${res.status} ${res.statusText}`);
  }
  const json = await res.json();

  const addrData = json?.data?.[address];
  if (!addrData) {
    throw new Error("Address not found on Blockchair");
  }

  const utxos: UTXO[] = (addrData.utxo || []).map(
    (u: { transaction_hash: string; index: number; value: number; script_hex?: string }) => ({
      transaction_hash: u.transaction_hash,
      index: u.index,
      value: u.value,
      script_hex: u.script_hex || "",
    })
  );

  return utxos;
}

/** Broadcast a signed raw transaction via Blockchair */
export async function broadcastTransaction(hex: string): Promise<string> {
  const url = `${BLOCKCHAIR_BASE}/push/transaction`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: hex }),
  });

  const json = await res.json();

  if (!res.ok || json?.context?.error) {
    const errMsg = json?.context?.error || json?.error || "Broadcast failed";
    throw new Error(`Broadcast error: ${errMsg}`);
  }

  return json?.data?.transaction_hash || "unknown";
}

/**
 * Sweep all funds from an ephemeral private key to a recipient address.
 *
 * @param privateKeyWIF - The ephemeral private key in WIF format
 * @param recipientAddress - The recipient's Zcash t-address
 */
export async function sweep(
  privateKeyWIF: string,
  recipientAddress: string
): Promise<SweepResult> {
  // 1. Derive the ephemeral address from the private key
  // Decode WIF using Bitcoin network (same 0x80 version byte) to avoid
  // Zcash 2-byte pubKeyHash validation error in ECPair
  const keyPair = utxolib.ECPair.fromWIF(privateKeyWIF, WIF_DECODE_NETWORK);
  const pubkeyHashBuf = utxolib.crypto.hash160(keyPair.publicKey);

  // Derive the source address for UTXO lookup
  // Zcash t1 address: base58check with 2-byte version 0x1CB8
  const sourceAddress = encodeZcashAddress(pubkeyHashBuf);

  // 2. Fetch UTXOs
  const utxos = await fetchUTXOs(sourceAddress);
  if (utxos.length === 0) {
    throw new Error("No funds found at the ephemeral address. The sender may not have deposited yet.");
  }

  const totalInput = utxos.reduce((sum, u) => sum + u.value, 0);
  if (totalInput <= FEE_SATOSHIS) {
    throw new Error(`Balance too low to cover the fee. Found ${totalInput / ZAT_PER_ZEC} ZEC, need at least ${FEE_SATOSHIS / ZAT_PER_ZEC} ZEC for the fee.`);
  }

  const sendAmount = totalInput - FEE_SATOSHIS;

  // 3. Build the transaction
  const txb = utxolib.bitgo.createTransactionBuilderForNetwork(ZCASH_NETWORK);

  // Add all UTXOs as inputs
  for (const utxo of utxos) {
    txb.addInput(utxo.transaction_hash, utxo.index, 0xfffffffe);
  }

  // Add output to recipient
  const recipientHash = addressToPubkeyHash(recipientAddress);
  const outputScript = p2pkhScript(recipientHash);
  txb.addOutput(outputScript, sendAmount);

  // 4. Sign all inputs
  for (let i = 0; i < utxos.length; i++) {
    txb.sign(
      i,
      keyPair,
      undefined,
      utxolib.Transaction.SIGHASH_ALL,
      utxos[i].value
    );
  }

  // 5. Build and serialize
  const tx = txb.build();
  const hex = tx.toBuffer().toString("hex");
  const txid = tx.getHash().reverse().toString("hex");

  // 6. Broadcast
  const broadcastTxid = await broadcastTransaction(hex);

  return {
    txid: broadcastTxid || txid,
    hex,
    totalInput,
    fee: FEE_SATOSHIS,
    sent: sendAmount,
  };
}

/** Encode a 20-byte hash as a Zcash t1 address (base58check with 2-byte version) */
function encodeZcashAddress(hash: Buffer): string {
  const version = Buffer.from([0x1c, 0xb8]);
  const payload = Buffer.concat([version, hash]);
  const checkHash = sha256(sha256(new Uint8Array(payload)));
  const checksum = Buffer.from(checkHash.slice(0, 4));
  const full = Buffer.concat([payload, checksum]);

  const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  const digits = [0];
  for (const byte of full) {
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
  let leadingZeros = "";
  for (const byte of full) {
    if (byte !== 0) break;
    leadingZeros += ALPHABET[0];
  }
  return leadingZeros + digits.reverse().map((d) => ALPHABET[d]).join("");
}
