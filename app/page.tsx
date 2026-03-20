"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import AmountInput from "@/components/AmountInput";
import QRCodeDisplay from "@/components/QRCode";
import CopyButton from "@/components/CopyButton";
import { FadeUp, ScaleIn, motion } from "@/components/Motion";
import { generateKeypair, type EphemeralKeypair } from "@/lib/keygen";
import { buildClaimURL } from "@/lib/uri";

type Step = "input" | "generating" | "deposit" | "share";

export default function CreatePage() {
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [step, setStep] = useState<Step>("input");
  const [keypair, setKeypair] = useState<EphemeralKeypair | null>(null);
  const [claimURL, setClaimURL] = useState("");

  async function handleGenerate() {
    if (!amount || parseFloat(amount) <= 0) return;
    setStep("generating");
    try {
      const kp = await generateKeypair();
      setKeypair(kp);
      setStep("deposit");
    } catch (err) {
      console.error("Keygen failed:", err);
      setStep("input");
    }
  }

  function handleConfirmSent() {
    if (!keypair) return;
    const baseURL =
      typeof window !== "undefined"
        ? window.location.origin
        : "https://ztripe.link";
    const url = buildClaimURL(baseURL, {
      key: keypair.privateKeyWIF,
      amount,
      memo: memo || undefined,
    });
    setClaimURL(url);
    setStep("share");
  }

  function handleReset() {
    setStep("input");
    setAmount("");
    setMemo("");
    setKeypair(null);
    setClaimURL("");
  }

  return (
    <div className="space-y-10">
      {/* Hero */}
      <div className="space-y-3">
        <FadeUp>
          <h1 className="font-serif text-4xl sm:text-5xl text-ink">
            Send Zcash to anyone
          </h1>
        </FadeUp>
        <FadeUp delay={0.1}>
          <p className="text-muted text-lg">
            Generate a claim link. Share it however you want. They tap it, they
            get the ZEC. No wallet address needed.
          </p>
        </FadeUp>
      </div>

      <AnimatePresence mode="wait">
        {/* Step: Input */}
        {step === "input" && (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className="space-y-6"
          >
            <AmountInput
              amount={amount}
              onChange={setAmount}
              memo={memo}
              onMemoChange={setMemo}
            />
            <motion.button
              onClick={handleGenerate}
              disabled={!amount || parseFloat(amount) <= 0}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-ink text-gold px-6 py-3.5 text-base font-semibold transition-colors hover:bg-ink/90 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Generate Claim Link
            </motion.button>
          </motion.div>
        )}

        {/* Step: Generating */}
        {step === "generating" && (
          <motion.div
            key="generating"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="text-center py-16"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="inline-block h-6 w-6 rounded-full border-2 border-ink border-t-transparent"
            />
            <p className="mt-4 text-muted text-sm">Generating keypair...</p>
          </motion.div>
        )}

        {/* Step: Deposit */}
        {step === "deposit" && keypair && (
          <motion.div
            key="deposit"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            className="space-y-6"
          >
            <div className="border border-ink/20 p-6 sm:p-8 space-y-5">
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center bg-gold text-ink text-sm font-bold">
                  1
                </span>
                <h2 className="font-serif text-xl text-ink">
                  Send {amount} ZEC to this address
                </h2>
              </div>

              <ScaleIn delay={0.15} className="flex justify-center py-2">
                <QRCodeDisplay data={keypair.address} />
              </ScaleIn>

              <FadeUp delay={0.25}>
                <p className="break-all bg-ink/5 px-4 py-3 font-mono text-sm text-ink">
                  {keypair.address}
                </p>
              </FadeUp>

              <FadeUp delay={0.3}>
                <div className="flex gap-3">
                  <CopyButton text={keypair.address} label="Copy address" className="flex-1" />
                  <a
                    href={`zcash:${keypair.address}?amount=${amount}`}
                    className="flex-1 inline-flex items-center justify-center gap-2 bg-ink text-gold px-4 py-2.5 text-sm font-medium transition-colors hover:bg-ink/90"
                  >
                    Open in Zodl
                  </a>
                </div>
              </FadeUp>
            </div>

            <motion.button
              onClick={handleConfirmSent}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-ink text-gold px-6 py-3.5 text-base font-semibold transition-colors hover:bg-ink/90"
            >
              Done, generate my claim link
            </motion.button>

            <button
              onClick={handleReset}
              className="w-full text-sm text-muted hover:text-ink transition-colors"
            >
              Start over
            </button>
          </motion.div>
        )}

        {/* Step: Share */}
        {step === "share" && (
          <motion.div
            key="share"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            className="space-y-6"
          >
            <div className="border border-ink/20 p-6 sm:p-8 space-y-5">
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center bg-gold text-ink text-sm font-bold">
                  2
                </span>
                <h2 className="font-serif text-xl text-ink">
                  Send this link to your recipient
                </h2>
              </div>

              <p className="break-all bg-ink/5 px-4 py-3 font-mono text-xs text-ink max-h-24 overflow-y-auto">
                {claimURL}
              </p>

              <CopyButton text={claimURL} label="Copy claim link" className="w-full" />
            </div>

            <FadeUp delay={0.2}>
              <div className="border border-ink/10 px-5 py-4 flex items-start gap-3">
                <LockIcon />
                <p className="text-sm text-muted">
                  The private key lives in the URL fragment. It never touches a
                  server.
                </p>
              </div>
            </FadeUp>

            <motion.button
              onClick={handleReset}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="w-full border border-ink/20 bg-white px-6 py-3 text-sm font-medium text-ink transition-colors hover:bg-ink/5"
            >
              Create another link
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="pt-6 border-t border-ink/10 text-center">
        <p className="text-xs text-muted">
          ZIP-324 Zcash Claim Links
        </p>
      </footer>
    </div>
  );
}

function LockIcon() {
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
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  );
}
