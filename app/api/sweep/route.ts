import { NextRequest, NextResponse } from "next/server";
import { sweep, fetchUTXOs } from "@/lib/sweep";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { privateKeyWIF, recipientAddress } = body;

    if (!privateKeyWIF || !recipientAddress) {
      return NextResponse.json(
        { error: "Missing privateKeyWIF or recipientAddress" },
        { status: 400 }
      );
    }

    // Basic address validation: must start with t1 or t3
    if (!recipientAddress.startsWith("t1") && !recipientAddress.startsWith("t3")) {
      return NextResponse.json(
        { error: "Recipient must be a Zcash transparent address (t1 or t3)" },
        { status: 400 }
      );
    }

    const result = await sweep(privateKeyWIF, recipientAddress);

    return NextResponse.json({
      success: true,
      txid: result.txid,
      sent: result.sent / 1e8,
      fee: result.fee / 1e8,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Sweep error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Check balance of the ephemeral address */
export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address");
  if (!address) {
    return NextResponse.json({ error: "Missing address param" }, { status: 400 });
  }

  try {
    const utxos = await fetchUTXOs(address);
    const balance = utxos.reduce((sum, u) => sum + u.value, 0);
    return NextResponse.json({
      address,
      balance: balance / 1e8,
      utxoCount: utxos.length,
      funded: utxos.length > 0,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
