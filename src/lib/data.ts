import { createPublicClient } from "./supabase/public";
import { isSupabaseConfigured } from "./supabase/env";
import {
  sampleSettings, sampleMembers, samplePrograms, sampleGallery, sampleArticles, sampleEvents,
} from "./sample-data";
import { todayWIB } from "./date";
import type { SiteSettings, Member, Program, GalleryItem, Article, EventItem } from "./types";

export interface SiteData {
  settings: SiteSettings;
  members: Member[];
  programs: Program[];
  gallery: GalleryItem[];
  articles: Article[];
  events: EventItem[];
  live: boolean; // true = data dari Supabase, false = mode pratinjau (data contoh)
}

const sample = (): SiteData => ({
  settings: sampleSettings,
  members: sampleMembers,
  programs: samplePrograms,
  gallery: sampleGallery,
  articles: sampleArticles,
  events: sampleEvents(),
  live: false,
});

/** Ambil semua data publik. Jika Supabase belum diisi / error → pakai data contoh. */
export async function getSiteData(): Promise<SiteData> {
  if (!isSupabaseConfigured) return sample();
  try {
    const db = createPublicClient();
    const [s, m, p, g, a, ev] = await Promise.all([
      db.from("site_settings").select("*").eq("id", 1).maybeSingle(),
      db.from("members").select("*").order("order_index", { ascending: true }),
      db.from("programs").select("*").order("created_at", { ascending: false }),
      db.from("gallery").select("*").order("event_date", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false }),
      db.from("articles").select("*").eq("published", true).order("published_at", { ascending: false, nullsFirst: false }).limit(12),
      db.from("events").select("*").gte("event_date", todayWIB()).order("event_date", { ascending: true }).limit(5),
    ]);
    if (s.error || m.error || p.error || g.error || a.error) throw new Error("query gagal");
    return {
      settings: { ...sampleSettings, ...(s.data ?? {}) } as SiteSettings,
      members: (m.data ?? []) as Member[],
      programs: (p.data ?? []) as Program[],
      gallery: ((g.data ?? []) as GalleryItem[]).filter((x) => x.visible !== false),
      articles: (a.data ?? []) as Article[],
      events: (ev.error ? [] : ev.data ?? []) as EventItem[], // tabel opsional: error ≠ gagalkan seluruh halaman
      live: true,
    };
  } catch (e) {
    console.error("[getSiteData]", e);
    return sample();
  }
}

/** Semua artikel terbit (untuk halaman /berita, RSS, dan artikel terkait). */
export async function getAllArticles(): Promise<Article[]> {
  if (!isSupabaseConfigured) return sampleArticles;
  const { data } = await createPublicClient()
    .from("articles").select("*").eq("published", true)
    .order("published_at", { ascending: false, nullsFirst: false }).limit(200);
  return (data ?? []) as Article[];
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  if (!isSupabaseConfigured) return sampleArticles.find((a) => a.slug === slug) ?? null;
  const { data } = await createPublicClient().from("articles").select("*").eq("slug", slug).eq("published", true).maybeSingle();
  return (data as Article) ?? null;
}

export async function getAllArticleSlugs(): Promise<{ slug: string; published_at: string | null }[]> {
  if (!isSupabaseConfigured) return sampleArticles.map((a) => ({ slug: a.slug, published_at: a.published_at }));
  const { data } = await createPublicClient().from("articles").select("slug, published_at").eq("published", true);
  return data ?? [];
}
