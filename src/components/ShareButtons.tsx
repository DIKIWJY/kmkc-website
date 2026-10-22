"use client";

import { useState, useSyncExternalStore } from "react";
import { Link2, Check, Share2 } from "lucide-react";
import { IconWhatsapp } from "@/components/icons/SocialIcons";

const subscribeNever = () => () => {};

const Fb = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.6-1.5h1.5V4.4c-.3 0-1.2-.1-2.2-.1-2.3 0-3.9 1.4-3.9 4v2.2H8v3h2.5V21h3Z" /></svg>
);
const X = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M17.8 3h3.1l-6.8 7.7L22 21h-6.2l-4.9-6.3L5.3 21H2.2l7.2-8.3L1.8 3h6.4l4.4 5.8L17.8 3Zm-1.1 16.2h1.7L7.3 4.7H5.5l11.2 14.5Z" /></svg>
);
const Tg = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M21.5 4.3 2.9 11.5c-.9.4-.9 1.1-.2 1.3l4.7 1.5 1.8 5.6c.2.6.1.8.7.8.5 0 .7-.2 1-.5l2.3-2.2 4.8 3.5c.9.5 1.5.2 1.7-.8L22.9 5.7c.3-1.2-.5-1.7-1.4-1.4ZM9 14.1l9.1-5.7c.4-.3.8-.1.5.2L11 15.8l-.3 3.3L9 14.1Z" /></svg>
);

/** Bar bagikan ala media: ikon bulat tipis, tooltip lewat aria-label. */
export default function ShareButtons({ title, label = true }: { title: string; label?: boolean }) {
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

  const btn = "inline-flex h-11 w-11 items-center justify-center rounded-full text-primary-dark ring-1 ring-black/10 transition hover:bg-primary-dark hover:text-white hover:ring-primary-dark";
  const enc = encodeURIComponent;
  const links = [
    { name: "WhatsApp", href: `https://wa.me/?text=${enc(`${title} — ${url}`)}`, icon: <IconWhatsapp size={18} /> },
    { name: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`, icon: <Fb size={18} /> },
    { name: "X", href: `https://twitter.com/intent/tweet?text=${enc(title)}&url=${enc(url)}`, icon: <X size={17} /> },
    { name: "Telegram", href: `https://t.me/share/url?url=${enc(url)}&text=${enc(title)}`, icon: <Tg size={18} /> },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {label && <span className="mr-2 text-sm font-semibold text-neutral-500">Bagikan</span>}
      {links.map((l) => (
        <a key={l.name} className={btn} target="_blank" rel="noopener noreferrer" href={l.href} aria-label={`Bagikan lewat ${l.name}`} title={l.name}>
          {l.icon}
        </a>
      ))}
      <button type="button" onClick={copy} className={btn} aria-label={copied ? "Tautan tersalin" : "Salin tautan"} title="Salin tautan">
        {copied ? <Check size={18} /> : <Link2 size={18} />}
      </button>
      {canShare && (
        <button type="button" onClick={nativeShare} className={btn} aria-label="Bagikan lewat aplikasi lain" title="Lainnya"><Share2 size={18} /></button>
      )}
    </div>
  );
}
