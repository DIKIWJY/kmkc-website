"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/components/ui/Logo";
import { Menu, X } from "lucide-react";
import { MAIN_NAV, MORE_NAV } from "@/lib/routes";

const isActive = (path: string, href: string) => (href === "/" ? path === "/" : path === href || path.startsWith(href + "/"));

export default function Navbar({ name = "KMKC" }: { name?: string }) {
  const path = usePathname();
  // Menu seluler terikat ke halaman tempat ia dibuka: berpindah halaman otomatis menutupnya.
  const [openAt, setOpenAt] = useState<string | null>(null);
  const open = openAt === path;
  const setOpen = (v: boolean) => setOpenAt(v ? path : null);
  const close = () => setOpenAt(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenAt(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-3 sm:px-6 pt-3 sm:pt-4" aria-label="Navigasi utama">
      <div className="max-w-6xl mx-auto rounded-full bg-white/90 backdrop-blur-xl shadow-[0_10px_34px_-14px_rgba(15,42,92,0.35)] ring-1 ring-black/5">
        <div className="flex items-center justify-between h-14 sm:h-16 lg:h-[68px] pl-4 pr-2.5 sm:pl-6 sm:pr-3 lg:pl-8 lg:pr-4">
          <Link href="/" className="shrink-0 -my-1 transition-transform hover:scale-105" aria-label={`${name} — beranda`}>
            <Logo size={56} priority alt="" className="w-10 h-10 sm:w-12 sm:h-12 lg:w-[54px] lg:h-[54px]" />
          </Link>

          <ul className="hidden xl:flex items-center gap-1">
            {MAIN_NAV.map((l) => {
              const on = isActive(path, l.href);
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    aria-current={on ? "page" : undefined}
                    className={`relative inline-flex h-10 items-center px-3.5 rounded-full text-[14.5px] font-medium transition-colors ${
                      on ? "text-primary bg-primary/[0.07]" : "text-neutral-700 hover:text-primary hover:bg-black/[0.04]"
                    }`}
                  >
                    {l.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center gap-1.5">
            <Link
              href="/daftar"
              data-magnetic
              className="hidden sm:inline-flex h-10 items-center rounded-full bg-primary-dark px-5 text-sm font-semibold text-white hover:bg-primary transition-colors"
            >
              Gabung
            </Link>
            <button
              onClick={() => setOpen(!open)}
              aria-label={open ? "Tutup menu" : "Buka menu"}
              aria-expanded={open}
              aria-controls="menu-situs"
              className="xl:hidden w-11 h-11 rounded-full flex items-center justify-center text-primary-dark hover:bg-black/[0.05] transition-colors"
            >
              {open ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {open && (
        <>
          <button className="fixed inset-0 -z-10 bg-black/20 xl:hidden" aria-label="Tutup menu" onClick={close} tabIndex={-1} />
          <div id="menu-situs" className="max-w-6xl mx-auto mt-2 rounded-3xl bg-white shadow-2xl ring-1 ring-black/5 animate-fade-in overflow-hidden max-h-[calc(100dvh-5.5rem)] overflow-y-auto overscroll-contain xl:hidden">
            <ul className="grid sm:grid-cols-2 gap-0.5 p-2.5">
              {[...MAIN_NAV, ...MORE_NAV].map((l) => {
                const on = isActive(path, l.href);
                return (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      aria-current={on ? "page" : undefined}
                      className={`flex items-center h-12 px-4 rounded-2xl text-[15px] font-medium transition-colors ${
                        on ? "bg-primary/[0.07] text-primary" : "text-neutral-800 hover:bg-black/[0.04]"
                      }`}
                    >
                      {l.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
            <div className="p-2.5 pt-0 sm:hidden">
              <Link href="/daftar" className="flex h-12 items-center justify-center rounded-2xl bg-primary-dark text-white text-[15px] font-semibold">
                Gabung jadi anggota
              </Link>
            </div>
          </div>
        </>
      )}
    </nav>
  );
}
