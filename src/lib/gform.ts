/** Hanya tautan Google Form resmi yang boleh dipakai (mencegah tautan sembarang ditanam di halaman daftar). */
export function isGoogleFormUrl(v: string): boolean {
  try {
    const u = new URL(v);
    if (u.protocol !== "https:") return false;
    return (u.hostname === "docs.google.com" && u.pathname.startsWith("/forms/")) || u.hostname === "forms.gle" || u.hostname === "forms.google.com";
  } catch {
    return false;
  }
}

/** URL untuk <iframe>. forms.gle (tautan pendek) tidak bisa di-embed, jadi hanya docs.google.com/forms/…/viewform. */
export function gformEmbedUrl(v: string): string | null {
  if (!isGoogleFormUrl(v)) return null;
  const u = new URL(v);
  if (u.hostname !== "docs.google.com" || !/\/viewform\/?$/.test(u.pathname)) return null;
  u.searchParams.set("embedded", "true");
  return u.toString();
}
