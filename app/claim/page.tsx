"use client";

import { useEffect, useState } from "react";
import { decodeClaimFragment, type ClaimData } from "@/lib/uri";
import ZodlButton, { AppStoreLinks } from "@/components/ZodlButton";
import { FadeUp, FadeIn, ScaleIn, StaggerChildren, StaggerItem, motion } from "@/components/Motion";
import { AnimatePresence } from "framer-motion";

export default function ClaimPage() {
  const [claim, setClaim] = useState<ClaimData | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) {
      setError(true);
      setLoading(false);
      return;
    }

    const data = decodeClaimFragment(hash);
    if (!data) {
      setError(true);
      setLoading(false);
      return;
    }

    setClaim(data);
    setLoading(false);
  }, []);

  if (loading) {
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

  if (error || !claim) {
    return (
      <FadeUp>
        <div className="text-center space-y-5 py-16">
          <h1 className="font-serif text-3xl text-ink">
            Invalid claim link
          </h1>
          <p className="text-muted">
            This link is missing data. Make sure you have the full URL,
            including everything after the # symbol.
          </p>
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

  const fullClaimURI =
    typeof window !== "undefined" ? window.location.href : "";

  return (
    <div className="space-y-10">
      {/* Hero */}
      <div className="text-center space-y-4">
        <ScaleIn>
          <div className="inline-flex items-center justify-center h-16 w-16 bg-gold">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <text x="50%" y="55%" dominantBaseline="central" textAnchor="middle" fontSize="22" fontWeight="bold" fill="#231519">Z</text>
            </svg>
          </div>
        </ScaleIn>
        <FadeUp delay={0.1}>
          <h1 className="font-serif text-4xl sm:text-5xl text-ink">
            You got {claim.amount} ZEC
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

      {/* Actions */}
      <FadeUp delay={0.25}>
        <div className="space-y-4">
          <ZodlButton uri={fullClaimURI} variant="primary">
            Claim with Zodl
          </ZodlButton>

          <div className="relative flex items-center gap-4 py-1">
            <div className="flex-1 border-t border-ink/10" />
            <span className="text-xs text-muted uppercase tracking-wider">or</span>
            <div className="flex-1 border-t border-ink/10" />
          </div>

          <p className="text-center text-sm text-muted">
            Need Zodl? Grab it here:
          </p>
          <AppStoreLinks />
        </div>
      </FadeUp>

      {/* How it works */}
      <FadeUp delay={0.35}>
        <div className="border border-ink/20 p-6 sm:p-8 space-y-5">
          <h2 className="text-xs font-semibold text-muted uppercase tracking-wider">
            How it works
          </h2>
          <StaggerChildren>
            <ol className="space-y-3">
              <StaggerItem><Step n={1}>Open or install Zodl</Step></StaggerItem>
              <StaggerItem><Step n={2}>Tap &ldquo;Claim with Zodl&rdquo; above</Step></StaggerItem>
              <StaggerItem><Step n={3}>Zodl sweeps the ZEC into your wallet</Step></StaggerItem>
            </ol>
          </StaggerChildren>
        </div>
      </FadeUp>

      {/* Privacy */}
      <FadeUp delay={0.45}>
        <div className="border border-ink/10 px-5 py-4 flex items-start gap-3">
          <ShieldIcon />
          <p className="text-sm text-muted">
            Your funds stay private. This page can&apos;t see your wallet.
            The claim key never leaves your browser.
          </p>
        </div>
      </FadeUp>

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
