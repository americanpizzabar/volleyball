"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

/** Renders the given text as a QR code image (PNG data URL). */
export default function QRCodeImage({
  value,
  size = 180,
  className = "",
}: {
  value: string;
  size?: number;
  className?: string;
}) {
  const [src, setSrc] = useState("");

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(value, { width: size, margin: 1 })
      .then((url) => {
        if (active) setSrc(url);
      })
      .catch(() => {
        if (active) setSrc("");
      });
    return () => {
      active = false;
    };
  }, [value, size]);

  if (!src) {
    return (
      <div
        className={`grid place-items-center rounded-lg bg-slate-100 ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="参加用QRコード" width={size} height={size} className={`rounded-lg ${className}`} />;
}
