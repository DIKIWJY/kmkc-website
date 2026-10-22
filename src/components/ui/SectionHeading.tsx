import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Split from "@/components/ui/Split";

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  dark?: boolean;
  className?: string;
  /** true di halaman sendiri (judul utama halaman = h1), false di beranda (h2) */
  page?: boolean;
  /** Tautan "lihat semua" di sisi kanan (hanya di beranda) */
  href?: string;
  hrefLabel?: string;
}

/* Batang vertikal biru tebal + judul besar: ciri khas judul bagian. */
export default function SectionHeading({ title, subtitle, dark = false, className = "", page = false, href, hrefLabel = "Lihat semua" }: SectionHeadingProps) {
  const Tag = page ? "h1" : "h2";
  return (
    <div className={`flex flex-wrap items-end justify-between gap-x-8 gap-y-4 ${className}`}>
      <div className="min-w-0">
        <div data-a="bar" className={`section-accent-bar ${dark ? "on-dark" : ""}`}>
          <Split
            as={Tag}
            text={title}
            className={`text-4xl sm:text-5xl font-extrabold leading-[1.15] tracking-tight py-1 ${dark ? "text-white" : "grad-words"}`}
          />
        </div>
        {subtitle && <p data-a="up" data-d="250" className={`mt-4 max-w-2xl ${dark ? "text-white/70" : "text-muted"}`}>{subtitle}</p>}
      </div>
      {href && !page && (
        <Link
          href={href}
          data-a="fade"
          data-d="450"
          className={`group inline-flex items-center gap-2 text-sm font-semibold ${dark ? "text-white/85 hover:text-white" : "text-accent hover:text-primary"} transition-colors`}
        >
          {hrefLabel}
          <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  );
}
