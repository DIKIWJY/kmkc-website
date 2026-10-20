import { createPublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegram|headless|lighthouse|pingdom|uptime|curl|wget|python|go-http|java\//i;

function deviceOf(ua: string): "mobile" | "tablet" | "desktop" {
  if (/ipad|tablet|playbook|silk/i.test(ua) || (/android/i.test(ua) && !/mobile/i.test(ua))) return "tablet";
  if (/mobi|iphone|ipod|android/i.test(ua)) return "mobile";
  return "desktop";
}

function sourceOf(host: string, utm: string): string {
  const h = `${utm} ${host}`.toLowerCase();
  if (!h.trim()) return "langsung";
  if (/instagram|ig\.me/.test(h)) return "instagram";
  if (/whatsapp|wa\.me/.test(h)) return "whatsapp";
  if (/google/.test(h)) return "google";
  if (/facebook|fb\.com|fb\.me/.test(h)) return "facebook";
  if (/tiktok/.test(h)) return "tiktok";
  if (/youtube|youtu\.be/.test(h)) return "youtube";
  return "lainnya";
}

/** Penghitung kunjungan: tanpa IP, tanpa cookie pelacak — hanya agregat harian di tabel daily_stats. */
export async function POST(req: Request) {
  const done = () => new Response(null, { status: 204 });
  if (!isSupabaseConfigured) return done();
  const ua = req.headers.get("user-agent") ?? "";
  if (!ua || BOT.test(ua)) return done();

  let body: { path?: unknown; ref?: unknown; utm?: unknown; fresh?: unknown };
  try {
    body = await req.json();
  } catch {
    return done();
  }
  const raw = typeof body.path === "string" ? body.path.split(/[?#]/)[0].slice(0, 200) : "";
  const path = raw.length > 1 ? raw.replace(/\/+$/, "") : raw;
  if (!path.startsWith("/")) return done();

  const ref = typeof body.ref === "string" ? body.ref.slice(0, 120) : "";
  const utm = typeof body.utm === "string" ? body.utm.slice(0, 40) : "";
  try {
    await createPublicClient().rpc("track_view", {
      p_path: path,
      p_device: deviceOf(ua),
      p_source: sourceOf(ref, utm),
      p_new_visitor: body.fresh === true,
    });
  } catch {
    /* statistik bersifat opsional — jangan pernah mengganggu pengunjung */
  }
  return done();
}
