"use client";

import { useEffect, useState } from "react";
import { generateQRDataURL } from "@/lib/qr";

interface QRCodeProps {
  data: string;
  size?: number;
}

export default function QRCodeDisplay({ data, size = 200 }: QRCodeProps) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    generateQRDataURL(data).then(setSrc);
  }, [data]);

  if (!src) {
    return (
      <div
        className="animate-pulse bg-ink/5"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <img
      src={src}
      alt="QR code for deposit address"
      width={size}
      height={size}
    />
  );
}
