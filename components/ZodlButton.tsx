"use client";

interface ZodlButtonProps {
  uri?: string;
  variant?: "primary" | "secondary";
  children: React.ReactNode;
}

const ZODL_DEEPLINK = "zodl://";
const ZODL_IOS = "https://apps.apple.com/app/zodl-zcash-wallet/id6504986961";
const ZODL_ANDROID = "https://play.google.com/store/apps/details?id=com.zodl.app";

export default function ZodlButton({
  uri,
  variant = "primary",
  children,
}: ZodlButtonProps) {
  const isPrimary = variant === "primary";

  function handleClick() {
    if (uri) {
      window.location.href = `${ZODL_DEEPLINK}claim?uri=${encodeURIComponent(uri)}`;
    }
  }

  return (
    <button
      onClick={handleClick}
      className={`w-full px-6 py-3.5 text-base font-semibold transition-all active:scale-[0.98] ${
        isPrimary
          ? "bg-ink text-gold hover:bg-ink/90"
          : "border border-ink/20 bg-white text-ink hover:bg-ink/5"
      }`}
    >
      {children}
    </button>
  );
}

export function AppStoreLinks() {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <a
        href={ZODL_IOS}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 flex items-center justify-center gap-2 border border-ink/20 bg-white px-5 py-3 text-sm font-medium text-ink transition-colors hover:bg-ink/5"
      >
        <AppleIcon />
        App Store
      </a>
      <a
        href={ZODL_ANDROID}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 flex items-center justify-center gap-2 border border-ink/20 bg-white px-5 py-3 text-sm font-medium text-ink transition-colors hover:bg-ink/5"
      >
        <PlayIcon />
        Google Play
      </a>
    </div>
  );
}

function AppleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 20.5V3.5C3 2.91 3.34 2.39 3.84 2.15L13.69 12L3.84 21.85C3.34 21.6 3 21.09 3 20.5ZM16.81 15.12L6.05 21.34L14.54 12.85L16.81 15.12ZM20.16 10.81C20.5 11.08 20.75 11.5 20.75 12C20.75 12.5 20.53 12.9 20.18 13.18L17.89 14.5L15.39 12L17.89 9.5L20.16 10.81ZM6.05 2.66L16.81 8.88L14.54 11.15L6.05 2.66Z" />
    </svg>
  );
}
