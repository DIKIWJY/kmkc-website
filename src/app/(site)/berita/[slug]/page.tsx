import type { Metadata } from "next";
import Photo from "@/components/ui/Photo";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { getArticleBySlug, getAllArticleSlugs, getAllArticles, getSiteData } from "@/lib/data";
import { renderMarkdown, readingMinutes } from "@/lib/rich";
import { SITE_URL } from "@/lib/supabase/env";
import ShareButtons from "@/components/ShareButtons";
import JsonLd from "@/components/JsonLd";
import Logo from "@/components/ui/Logo";
import NewsRow, { fmtDate } from "@/components/news/NewsRow";

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

  const idx = all.findIndex((x) => x.slug === a.slug);
  const newer = idx > 0 ? all[idx - 1] : undefined; // daftar berurut terbaru → lama
  const older = idx >= 0 ? all[idx + 1] : undefined;
  const others = all.filter((x) => x.slug !== a.slug);
  const related = [...others.filter((x) => x.category === a.category), ...others.filter((x) => x.category !== a.category)].slice(0, 4);
  const minutes = readingMinutes(a.content);
  const date = fmtDate(a.published_at);

  return (
    <div className="pb-24 pt-28 sm:pt-36">
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

      <article>
        <header className="mx-auto max-w-5xl px-5 sm:px-10">
          <nav aria-label="Jejak halaman" className="flex items-center gap-2 text-[13px] text-neutral-500">
            <Link href="/" className="hover:text-primary">Beranda</Link>
            <span aria-hidden>/</span>
            <Link href="/berita" className="hover:text-primary">Berita</Link>
          </nav>
          {a.category && <p className="mt-6 text-[13px] font-bold uppercase tracking-[0.18em] text-accent">{a.category}</p>}
          <h1 className="mt-3 max-w-4xl text-balance text-[2rem] font-extrabold leading-[1.1] tracking-tight text-primary-dark sm:text-5xl lg:text-[3.4rem]">{a.title}</h1>
          {a.excerpt && <p className="mt-5 max-w-3xl text-pretty text-lg leading-relaxed text-neutral-500 sm:text-xl">{a.excerpt}</p>}

          <div className="mt-8 flex items-center gap-3.5">
            <Logo size={44} alt="" className="h-11 w-11" />
            <div className="text-[14px] leading-snug">
              <p className="font-semibold text-primary-dark">{a.author || `Redaksi ${settings.name}`}</p>
              <p className="text-neutral-500">
                {date && <time dateTime={a.published_at ?? undefined}>{date}</time>}
                {date && " · "}
                {minutes} menit baca
              </p>
            </div>
          </div>
        </header>

        <div className="mx-auto mt-8 max-w-5xl px-5 sm:mt-10 sm:px-10">
          <div className="relative aspect-[16/10] overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-accent-dark via-accent to-accent-light sm:aspect-[16/9] sm:rounded-[2rem]">
            {a.cover_image && <Photo src={a.cover_image} alt={a.title} sizes="(max-width: 1024px) 100vw, 1000px" priority />}
          </div>
        </div>

        <div className="mx-auto mt-10 grid max-w-[60rem] gap-x-10 px-5 sm:mt-14 sm:px-10 lg:grid-cols-[3rem_minmax(0,43rem)] lg:justify-center">
          <aside className="hidden lg:block" aria-label="Bagikan">
            <div className="sticky top-28 flex flex-col gap-2.5">
              <ShareButtons title={a.title} label={false} />
            </div>
          </aside>
          <div>
            <div className="article-body">{renderMarkdown(a.content)}</div>

            <div className="mt-12 border-t border-black/10 pt-8 lg:hidden">
              <ShareButtons title={a.title} />
            </div>

            {(newer || older) && (
              <nav aria-label="Berita lain" className="mt-12 grid gap-px overflow-hidden rounded-2xl bg-black/10 sm:grid-cols-2">
                {older ? (
                  <Link href={`/berita/${older.slug}`} className="group bg-white p-5 transition-colors hover:bg-surface sm:p-6">
                    <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold uppercase tracking-wider text-neutral-400"><ArrowLeft size={14} /> Sebelumnya</span>
                    <span className="mt-2 block font-bold leading-snug text-primary-dark group-hover:text-accent">{older.title}</span>
                  </Link>
                ) : <span className="hidden bg-white sm:block" />}
                {newer ? (
                  <Link href={`/berita/${newer.slug}`} className="group bg-white p-5 text-left transition-colors hover:bg-surface sm:p-6 sm:text-right">
                    <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold uppercase tracking-wider text-neutral-400">Selanjutnya <ArrowRight size={14} /></span>
                    <span className="mt-2 block font-bold leading-snug text-primary-dark group-hover:text-accent">{newer.title}</span>
                  </Link>
                ) : <span className="hidden bg-white sm:block" />}
              </nav>
            )}
          </div>
        </div>
      </article>

      {related.length > 0 && (
        <section className="mx-auto mt-20 max-w-5xl px-5 sm:px-10" aria-labelledby="terkait">
          <div className="flex items-end justify-between border-b border-black/10 pb-4">
            <h2 id="terkait" className="text-2xl font-extrabold tracking-tight text-primary-dark sm:text-3xl">Berita lainnya</h2>
            <Link href="/berita" className="text-sm font-semibold text-accent hover:underline">Semua berita</Link>
          </div>
          <ul className="grid lg:grid-cols-2 lg:gap-x-14">
            {related.map((r) => (
              <li key={r.id} className="border-b border-black/10"><NewsRow a={r} showExcerpt={false} /></li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
