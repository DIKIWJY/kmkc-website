import type { Metadata } from "next";
import Photo from "@/components/ui/Photo";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, User, ImageIcon, Clock } from "lucide-react";
import { getArticleBySlug, getAllArticleSlugs, getAllArticles, getSiteData } from "@/lib/data";
import { renderMarkdown, readingMinutes } from "@/lib/rich";
import { SITE_URL } from "@/lib/supabase/env";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ShareButtons from "@/components/ShareButtons";
import JsonLd from "@/components/JsonLd";

export const revalidate = 60;

type Params = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const all = await getAllArticleSlugs();
  return all.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const a = await getArticleBySlug(slug);
  if (!a) return { title: "Berita tidak ditemukan" };
  return {
    title: a.title,
    description: a.excerpt || a.content.slice(0, 160),
    alternates: { canonical: `/berita/${a.slug}` },
    openGraph: { type: "article", title: a.title, description: a.excerpt, publishedTime: a.published_at ?? undefined, images: a.cover_image ? [a.cover_image] : undefined },
  };
}

export default async function ArticlePage({ params }: Params) {
  const { slug } = await params;
  const [a, { settings }, all] = await Promise.all([getArticleBySlug(slug), getSiteData(), getAllArticles()]);
  if (!a) notFound();

  const related = [...all.filter((x) => x.slug !== a.slug && x.category === a.category), ...all.filter((x) => x.slug !== a.slug && x.category !== a.category)].slice(0, 2);
  const minutes = readingMinutes(a.content);
  const date = a.published_at ? new Date(a.published_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "";

  return (
    <>
      <Navbar name={settings.name} home />
      <main id="konten" className="pt-32 pb-24">
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "NewsArticle",
            headline: a.title,
            description: a.excerpt,
            datePublished: a.published_at ?? undefined,
            image: a.cover_image ? [a.cover_image] : undefined,
            author: { "@type": "Organization", name: a.author || settings.name },
            publisher: { "@type": "Organization", name: settings.full_name || settings.name },
            mainEntityOfPage: `${SITE_URL}/berita/${a.slug}`,
          }}
        />
        <article className="max-w-3xl mx-auto px-6">
          <Link href="/berita" className="flex w-fit items-center gap-2 text-sm font-medium text-accent hover:underline mb-8">
            <ArrowLeft size={16} /> Semua berita
          </Link>
          <span className="text-xs font-bold uppercase tracking-widest text-accent">{a.category}</span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-neutral-900 leading-tight mt-3 mb-5">{a.title}</h1>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-neutral-500 mb-8">
            {date && <span className="inline-flex items-center gap-1.5"><Calendar size={15} />{date}</span>}
            {a.author && <span className="inline-flex items-center gap-1.5"><User size={15} />{a.author}</span>}
            <span className="inline-flex items-center gap-1.5"><Clock size={15} />{minutes} menit baca</span>
          </div>

          <div className="relative aspect-[16/9] rounded-[1.4rem] overflow-hidden shadow-[0_24px_60px_-24px_rgba(30,79,163,0.45)] mb-10">
            {a.cover_image ? (
              <Photo src={a.cover_image} alt={a.title} sizes="(max-width: 1024px) 100vw, 800px" priority />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-brand-gradient"><ImageIcon size={40} className="text-white/50" /></div>
            )}
          </div>

          {a.excerpt && <p className="text-xl text-neutral-500 leading-relaxed mb-2">{a.excerpt}</p>}
          <div className="text-[17px] leading-[1.85] text-neutral-700">{renderMarkdown(a.content)}</div>

          <div className="mt-14 pt-8 border-t border-border"><ShareButtons title={a.title} /></div>
        </article>

        {related.length > 0 && (
          <section className="max-w-3xl mx-auto px-6 mt-20" aria-labelledby="terkait">
            <h2 id="terkait" className="text-2xl font-extrabold text-primary-dark mb-6">Baca juga</h2>
            <div className="grid sm:grid-cols-2 gap-5">
              {related.map((r) => (
                <Link key={r.id} href={`/berita/${r.slug}`} className="group soft-card p-5 flex flex-col">
                  <span className="text-[11px] font-bold uppercase tracking-wide text-accent">{r.category}</span>
                  <h3 className="mt-2 font-bold text-primary-dark leading-snug group-hover:text-accent transition-colors">{r.title}</h3>
                  {r.excerpt && <p className="mt-2 text-sm text-neutral-500 line-clamp-2">{r.excerpt}</p>}
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer name={settings.name} fullName={settings.full_name} />
    </>
  );
}
