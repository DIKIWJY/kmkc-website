"use client";

import { useState } from "react";
import Link from "next/link";
import Logo from "@/components/ui/Logo";
import { Menu, X } from "lucide-react";

const mainLinks = [
  { href: "#about", label: "Tentang Kami" },
  { href: "#program", label: "Program" },
  { href: "#gallery", label: "Galeri" },
  { href: "#kepengurusan", label: "Struktur" },
  { href: "#kontak", label: "Kontak" },
];

const allLinks = [
  { href: "#about", label: "Tentang Kami" },
  { href: "#sejarah", label: "Sejarah" },
  { href: "#visi-misi", label: "Visi & Misi" },
  { href: "#kepengurusan", label: "Kepengurusan" },
  { href: "#program", label: "Program Kerja" },
  { href: "#agenda", label: "Agenda" },
  { href: "#gallery", label: "Galeri Kegiatan" },
  { href: "#berita", label: "Berita & Artikel" },
  { href: "#kontak", label: "Hubungi Kami" },
  { href: "/daftar", label: "Daftar Anggota" },
];

export default function Navbar({ name = "KMKC", home = false }: { name?: string; home?: boolean }) {
  const prefix = home ? "/" : "";
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 pt-4">
      {/* big floating white pill */}
      <div className="max-w-6xl mx-auto rounded-full bg-white/95 backdrop-blur-xl shadow-[0_12px_40px_-12px_rgba(15,42,92,0.35)] ring-1 ring-black/5">
        <div className="flex items-center justify-between h-16 lg:h-[72px] pl-6 pr-4 lg:pl-10 lg:pr-8">
          <Link href="/" prefetch={false} className="shrink-0 -my-1 transition-transform hover:scale-105" aria-label={`${name} — beranda`}>
            <Logo size={64} priority alt="" className="w-12 h-12 lg:w-[60px] lg:h-[60px]" />
          </Link>

          <div className="hidden lg:flex items-center gap-9">
            {mainLinks.map((l) => (
              <a
                key={l.href}
                href={l.href.startsWith("/") ? l.href : prefix + l.href}
                className="relative text-[15px] font-medium text-neutral-800 hover:text-accent transition-colors after:absolute after:left-0 after:-bottom-1 after:h-0.5 after:w-0 after:bg-accent after:transition-all hover:after:w-full"
              >
                {l.label}
              </a>
            ))}
          </div>

          <div className="flex items-center">
          <Link href="/daftar" prefetch={false} className="hidden sm:inline-flex mr-2 h-10 items-center rounded-full bg-primary-dark px-5 text-sm font-semibold text-white hover:bg-primary transition-colors">
            Gabung
          </Link>
          <button
            onClick={() => setOpen(!open)}
            aria-label="Menu"
            className="w-11 h-11 rounded-full flex items-center justify-center text-primary-dark hover:bg-surface transition-colors"
          >
            {open ? <X size={26} /> : <Menu size={26} />}
          </button>
          </div>
        </div>
      </div>

      {open && (
        <div className="max-w-6xl mx-auto mt-3 rounded-3xl bg-white shadow-2xl ring-1 ring-black/5 animate-fade-in overflow-hidden">
          <div className="grid sm:grid-cols-2 gap-1 p-3">
            {allLinks.map((l) => (
              <a
                key={l.href}
                href={l.href.startsWith("/") ? l.href : prefix + l.href}
                onClick={() => setOpen(false)}
                className="px-5 py-3.5 rounded-2xl text-[15px] font-medium text-neutral-800 hover:bg-surface hover:text-accent transition-colors"
              >
                {l.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
