"use client";

import { useEffect, useState } from "react";
import { decodeClaimFragment, type ClaimData } from "@/lib/uri";
import { FadeUp, FadeIn, ScaleIn, StaggerChildren, StaggerItem, motion } from "@/components/Motion";
import { AnimatePresence } from "framer-motion";

type ClaimStep = "loading" | "error" | "ready" | "checking" | "claiming" | "done" | "failed";

export default function ClaimPage() {
  const [claim, setClaim] = useState<ClaimData | null>(null);
  const [step, setStep] = useState<ClaimStep>("loading");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [txid, setTxid] = useState("");
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) {
      setStep("error");
      setErrorMsg("No claim data in the URL.");
      return;
    }

    const data = decodeClaimFragment(hash);
    if (!data) {
      setStep("error");
      setErrorMsg("Could not parse the claim link. Make sure you have the full URL.");
      return;
    }

    setClaim(data);
    setStep("ready");
  }, []);

  async function handleClaim() {
    if (!claim || !recipientAddress.trim()) return;

    const addr = recipientAddress.trim();
    if (!addr.startsWith("t1") && !addr.startsWith("t3")) {
      setErrorMsg("Please enter a valid Zcash transparent address (starts with t1 or t3).");
      setStep("failed");
      return;
    }

    setStep("claiming");
    setErrorMsg("");

    try {
      const res = await fetch("/api/sweep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          privateKeyWIF: claim.key,
          recipientAddress: addr,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setErrorMsg(data.error || "Sweep failed. Please try again.");
        setStep("failed");
        return;
      }

      setTxid(data.txid);
      setStep("done");
    } catch (err) {
      setErrorMsg("Network error. Check your connection and try again.");
      setStep("failed");
    }
  }

  if (step === "loading") {
    return (
      <div className="text-center py-20">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="inline-block h-6 w-6 rounded-full border-2 border-ink border-t-transparent"
        />
      </div>
    );
  }

  if (step === "error") {
    return (
      <FadeUp>
        <div className="text-center space-y-5 py-16">
          <h1 className="font-serif text-3xl text-ink">Invalid claim link</h1>
          <p className="text-muted">{errorMsg}</p>
          <a
            href="/"
            className="inline-block bg-ink text-gold px-6 py-3 text-sm font-semibold hover:bg-ink/90"
          >
            Create a new claim link
          </a>
        </div>
      </FadeUp>
    );
  }

  return (
    <div className="space-y-10">
      <AnimatePresence mode="wait">
        {/* Ready: show amount and ask for recipient address */}
        {(step === "ready" || step === "failed") && claim && (
          <motion.div
            key="ready"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className="space-y-8"
          >
            {/* Hero */}
            <div className="text-center space-y-4">
              <ScaleIn>
                <div className="inline-flex items-center justify-center h-16 w-16 bg-gold">
                  <span className="text-2xl font-bold text-ink">Z</span>
                </div>
              </ScaleIn>
              <FadeUp delay={0.1}>
                <h1 className="font-serif text-4xl sm:text-5xl text-ink">
                  Someone sent you {claim.amount} ZEC
                </h1>
              </FadeUp>
              {claim.memo && (
                <FadeUp delay={0.2}>
                  <div className="border border-ink/20 px-6 py-4 inline-block">
                    <p className="text-ink italic">&ldquo;{claim.memo}&rdquo;</p>
                  </div>
                </FadeUp>
              )}
            </div>

            {/* Address Input */}
            <FadeUp delay={0.25}>
              <div className="space-y-4">
                <label className="block text-sm font-medium text-ink">
                  Your Zcash address
                </label>
                <input
                  type="text"
                  placeholder="t1..."
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  className="w-full bg-white border border-ink/20 px-4 py-3 text-sm font-mono text-ink placeholder:text-muted/50 focus:outline-none focus:border-ink"
                />
                <p className="text-xs text-muted">
                  Paste your Zcash transparent address from Zodl or any Zcash wallet.
                  The ZEC will be sent directly to this address.
                </p>
              </div>
            </FadeUp>

            {/* Error message */}
            {step === "failed" && errorMsg && (
              <FadeUp>
                <div className="border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
                  {errorMsg}
                </div>
              </FadeUp>
            )}

            {/* Claim button */}
            <FadeUp delay={0.3}>
              <motion.button
                onClick={handleClaim}
                disabled={!recipientAddress.trim()}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-ink text-gold px-6 py-3.5 text-base font-semibold transition-colors hover:bg-ink/90 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Claim {claim.amount} ZEC
              </motion.button>
            </FadeUp>

            {/* How it works */}
            <FadeUp delay={0.4}>
              <div className="border border-ink/20 p-6 sm:p-8 space-y-5">
                <h2 className="text-xs font-semibold text-muted uppercase tracking-wider">
                  How it works
                </h2>
                <StaggerChildren>
                  <ol className="space-y-3">
                    <StaggerItem>
                      <Step n={1}>Paste your Zcash address above</Step>
                    </StaggerItem>
                    <StaggerItem>
                      <Step n={2}>Hit claim. We build and broadcast the transaction.</Step>
                    </StaggerItem>
                    <StaggerItem>
                      <Step n={3}>ZEC arrives in your wallet within minutes</Step>
                    </StaggerItem>
                  </ol>
                </StaggerChildren>
              </div>
            </FadeUp>

            {/* Privacy note */}
            <FadeUp delay={0.5}>
              <div className="border border-ink/10 px-5 py-4 flex items-start gap-3">
                <ShieldIcon />
                <div className="text-sm text-muted space-y-1">
                  <p>
                    This demo uses transparent addresses for the sweep.
                    Shielded claim links need ZIP-324 wallet support, which no wallet
                    ships yet. The architecture is ready for it.
                  </p>
                </div>
              </div>
            </FadeUp>
          </motion.div>
        )}

        {/* Claiming: spinner */}
        {step === "claiming" && (
          <motion.div
            key="claiming"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="text-center py-20 space-y-4"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="inline-block h-8 w-8 rounded-full border-2 border-ink border-t-transparent"
            />
            <p className="text-muted">Sweeping funds to your wallet...</p>
            <p className="text-xs text-muted/60">
              Building transaction, signing, broadcasting
            </p>
          </motion.div>
        )}

        {/* Done: success */}
        {step === "done" && claim && (
          <motion.div
            key="done"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            className="space-y-8"
          >
            <div className="text-center space-y-4">
              <ScaleIn>
                <div className="inline-flex items-center justify-center h-16 w-16 bg-gold">
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                    <path d="M7 14l5 5L21 9" stroke="#231519" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </ScaleIn>
              <FadeUp delay={0.1}>
                <h1 className="font-serif text-4xl sm:text-5xl text-ink">
                  {claim.amount} ZEC claimed
                </h1>
              </FadeUp>
              <FadeUp delay={0.2}>
                <p className="text-muted">
                  The transaction has been broadcast. Your ZEC will arrive shortly.
                </p>
              </FadeUp>
            </div>

            {txid && (
              <FadeUp delay={0.3}>
                <div className="border border-ink/20 p-6 space-y-3">
                  <h2 className="text-xs font-semibold text-muted uppercase tracking-wider">
                    Transaction ID
                  </h2>
                  <p className="break-all bg-ink/5 px-4 py-3 font-mono text-xs text-ink">
                    {txid}
                  </p>
                  <a
                    href={`https://blockchair.com/zcash/transaction/${txid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-sm text-ink underline underline-offset-4 hover:text-gold transition-colors"
                  >
                    View on Blockchair
                  </a>
                </div>
              </FadeUp>
            )}

            <FadeUp delay={0.4}>
              <a
                href="/"
                className="block w-full text-center border border-ink/20 bg-white px-6 py-3 text-sm font-medium text-ink transition-colors hover:bg-ink/5"
              >
                Send ZEC to someone else
              </a>
            </FadeUp>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <FadeIn delay={0.5}>
        <footer className="pt-6 border-t border-ink/10 text-center">
          <p className="text-xs text-muted">
            ZIP-324 Zcash Claim Links
          </p>
        </footer>
      </FadeIn>
    </div>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center bg-gold/20 text-xs font-bold text-ink">
        {n}
      </span>
      <span className="text-sm text-ink pt-0.5">{children}</span>
    </li>
  );
}

function ShieldIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#271219"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mt-0.5 flex-shrink-0 opacity-40"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}
