/**
 * Encode and decode claim URIs.
 *
 * Format: https://domain/claim#key=<WIF>&amount=<ZEC>&memo=<message>
 *
 * Everything after # is the fragment, never sent to the server.
 */

export interface ClaimData {
  key: string;    // WIF private key
  amount: string; // ZEC amount as string
  memo?: string;  // optional message
}

export function encodeClaimFragment(data: ClaimData): string {
  const params = new URLSearchParams();
  params.set("key", data.key);
  params.set("amount", data.amount);
  if (data.memo) {
    params.set("memo", data.memo);
  }
  return params.toString();
}

export function decodeClaimFragment(fragment: string): ClaimData | null {
  try {
    // Strip leading # if present
    const clean = fragment.startsWith("#") ? fragment.slice(1) : fragment;
    const params = new URLSearchParams(clean);

    const key = params.get("key");
    const amount = params.get("amount");

    if (!key || !amount) return null;

    return {
      key,
      amount,
      memo: params.get("memo") || undefined,
    };
  } catch {
    return null;
  }
}

export function buildClaimURL(
  baseURL: string,
  data: ClaimData
): string {
  const fragment = encodeClaimFragment(data);
  return `${baseURL}/claim#${fragment}`;
}
