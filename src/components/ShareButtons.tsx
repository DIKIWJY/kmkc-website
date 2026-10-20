"use client";

import { useState, useSyncExternalStore } from "react";
import { Link2, Check, Share2 } from "lucide-react";
import { IconWhatsapp } from "@/components/icons/SocialIcons";

const subscribeNever = () => () => {};

export default function ShareButtons({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  // Nilai khusus browser; di server dipakai snapshot kosong sehingga HTML server = HTML klien saat hidrasi.
  const url = useSyncExternalStore(subscribeNever, () => window.location.href, () => "");
  const canShare = useSyncExternalStore(subscribeNever, () => typeof navigator.share === "function", () => false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard diblokir — abaikan */
    }
  }

  async function nativeShare() {
    try {
      await navigator.share({ title, url });
    } catch {
      /* dibatalkan pengguna */
    }
  }

  const btn = "inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold ring-1 ring-border bg-white text-primary hover:bg-primary hover:text-white hover:ring-primary transition";

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <span className="text-sm font-semibold text-neutral-500 mr-1">Bagikan:</span>
      <a className={btn} target="_blank" rel="noopener noreferrer" href={`https://wa.me/?text=${encodeURIComponent(`${title} — ${url}`)}`}>
        <IconWhatsapp size={16} /> WhatsApp
      </a>
      <button type="button" onClick={copy} className={btn}>
        {copied ? <Check size={16} /> : <Link2 size={16} />} {copied ? "Tersalin" : "Salin tautan"}
      </button>
      {canShare && (
        <button type="button" onClick={nativeShare} className={btn}><Share2 size={16} /> Lainnya</button>
      )}
    </div>
  );
}
