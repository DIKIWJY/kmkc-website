import { getAllArticles, getSiteData } from "@/lib/data";
import { SITE_URL } from "@/lib/supabase/env";

export const revalidate = 600;

const esc = (s: string) => s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]!);

/** Feed RSS 2.0 — memudahkan pembaca berlangganan berita KMKC. */
export async function GET() {
  const [articles, { settings }] = await Promise.all([getAllArticles(), getSiteData()]);
  const items = articles
    .slice(0, 30)
    .map((a) => {
      const link = `${SITE_URL}/berita/${a.slug}`;
      const pub = a.published_at ? new Date(`${a.published_at.slice(0, 10)}T00:00:00Z`).toUTCString() : "";
      return `<item><title>${esc(a.title)}</title><link>${link}</link><guid>${link}</guid>${pub ? `<pubDate>${pub}</pubDate>` : ""}<category>${esc(a.category)}</category><description>${esc(a.excerpt)}</description></item>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${esc(settings.name)} — Berita</title><link>${SITE_URL}</link><description>${esc(settings.full_name)}</description><language>id</language>${items}</channel></rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
