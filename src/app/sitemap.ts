import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/supabase/env";
import { getAllArticleSlugs } from "@/lib/data";
import { MAIN_NAV } from "@/lib/routes";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const articles = await getAllArticleSlugs();
  return [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    ...MAIN_NAV.map((n) => ({ url: `${SITE_URL}${n.href}`, changeFrequency: "weekly" as const, priority: n.href === "/berita" ? 0.8 : 0.7 })),
    { url: `${SITE_URL}/daftar`, changeFrequency: "monthly", priority: 0.7 },
    ...articles.map((a) => ({
      url: `${SITE_URL}/berita/${a.slug}`,
      lastModified: a.published_at ?? undefined,
      priority: 0.6,
    })),
  ];
}
