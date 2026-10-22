/**
 * Tautan WhatsApp dari isian Pengaturan. Menerima dua bentuk:
 *  - nomor (62812…): dibuat menjadi https://wa.me/<nomor>?text=<pesan>
 *  - tautan resmi WhatsApp (wa.me/qr/…, wa.me/<nomor>, api.whatsapp.com, chat.whatsapp.com): dipakai apa adanya
 */
const HOSTS = new Set(["wa.me", "api.whatsapp.com", "chat.whatsapp.com", "whatsapp.com", "www.whatsapp.com"]);

/** Kembalikan tautan https WhatsApp yang valid, atau "" bila bukan tautan WhatsApp. */
export function cleanWaUrl(v: string): string {
  try {
    const u = new URL(v.trim());
    return u.protocol === "https:" && HOSTS.has(u.hostname.toLowerCase()) ? u.toString() : "";
  } catch {
    return "";
  }
}

export function waHref(value: string | undefined, text?: string): string {
  const v = (value ?? "").trim();
  if (!v) return "";
  if (/^https?:\/\//i.test(v)) return cleanWaUrl(v);
  const n = v.replace(/\D/g, "");
  if (n.length < 8) return "";
  return `https://wa.me/${n}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}
