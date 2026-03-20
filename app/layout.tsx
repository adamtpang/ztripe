import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "zipzapzop.link / Send Zcash to anyone",
  description:
    "Send ZEC to anyone via a link. No wallet address needed.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <header className="border-b border-ink/10">
          <div className="mx-auto max-w-2xl px-6 py-5 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2.5">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gold">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <text x="50%" y="55%" dominantBaseline="central" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#231519">Z</text>
                </svg>
              </span>
              <span className="font-serif text-lg text-ink">zipzapzop</span>
            </a>
            <span className="text-xs text-muted tracking-wide uppercase">Zcash Claim Links</span>
          </div>
        </header>
        <main className="mx-auto max-w-2xl px-6 py-10 sm:py-16">{children}</main>
      </body>
    </html>
  );
}
