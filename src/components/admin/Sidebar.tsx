"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, Images, FileText, Briefcase, Inbox, Settings, LogOut, Menu, X, ArrowUpRight, History, CalendarDays, UserPlus, Archive,
} from "lucide-react";
import { signOut } from "@/lib/admin/actions";
import CommandPalette from "./CommandPalette";
import Logo from "@/components/ui/Logo";

const groups: { title?: string; items: { href: string; icon: React.ElementType; label: string }[] }[] = [
  { items: [{ href: "/admin", icon: LayoutDashboard, label: "Ringkasan" }] },
  {
    title: "Konten",
    items: [
      { href: "/admin/berita", icon: FileText, label: "Berita" },
      { href: "/admin/gallery", icon: Images, label: "Galeri" },
      { href: "/admin/agenda", icon: CalendarDays, label: "Agenda" },
      { href: "/admin/program", icon: Briefcase, label: "Program Kerja" },
    ],
  },
  {
    title: "Organisasi",
    items: [
      { href: "/admin/kepengurusan", icon: Users, label: "Kepengurusan" },
      { href: "/admin/pendaftar", icon: UserPlus, label: "Pendaftar" },
    ],
  },
  { title: "Kotak masuk", items: [{ href: "/admin/pesan", icon: Inbox, label: "Pesan Masuk" }] },
  {
    title: "Sistem",
    items: [
      { href: "/admin/arsip", icon: Archive, label: "Arsip & Cadangan" },
      { href: "/admin/aktivitas", icon: History, label: "Log Aktivitas" },
      { href: "/admin/settings", icon: Settings, label: "Pengaturan" },
    ],
  },
];

export default function Sidebar({ email, unread, children }: { email: string; unread: number; children: React.ReactNode }) {
  const path = usePathname();
  // Laci seluler terikat ke halaman: pindah halaman otomatis menutupnya.
  const [openAt, setOpenAt] = useState<string | null>(null);
  const open = openAt === path;
  const active = (href: string) => (href === "/admin" ? path === "/admin" : path === href || path.startsWith(href + "/"));

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenAt(null);
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="lg:flex min-h-dvh">
      {open && <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] lg:hidden" style={{ animation: "ad-fade .2s both" }} onClick={() => setOpenAt(null)} aria-hidden />}

      <aside
        className={`ad-sidebar fixed inset-y-0 left-0 z-50 w-[272px] lg:w-[248px] lg:sticky lg:top-0 lg:h-dvh shrink-0 flex flex-col transition-transform duration-300 [transition-timing-function:var(--ad-ease)] lg:translate-x-0 ${
          open ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
        aria-label="Menu admin"
      >
        <div className="h-[60px] shrink-0 flex items-center justify-between pl-5 pr-3">
          <Link href="/admin" className="flex items-center gap-2.5">
            <Logo size={28} alt="" />
            <span className="text-[15px] font-semibold tracking-tight">KMKC<span className="ml-1.5 font-normal text-[var(--ad-faint)]">Admin</span></span>
          </Link>
          <button onClick={() => setOpenAt(null)} className="ad-icon-btn lg:hidden" aria-label="Tutup menu"><X size={18} /></button>
        </div>

        <nav className="flex-1 overflow-y-auto pb-4" aria-label="Navigasi admin">
          {groups.map((g, i) => (
            <div key={i}>
              {g.title && <p className="ad-nav-group">{g.title}</p>}
              {g.items.map(({ href, icon: Icon, label }) => (
                <Link key={href} href={href} className="ad-nav" aria-current={active(href) ? "page" : undefined}>
                  <Icon size={18} strokeWidth={1.9} />
                  <span className="truncate">{label}</span>
                  {href === "/admin/pesan" && unread > 0 && (
                    <span className="ml-auto min-w-[20px] h-5 px-1.5 rounded-full bg-[var(--ad-blue)] text-white text-[11px] font-semibold flex items-center justify-center tnum">{unread > 99 ? "99+" : unread}</span>
                  )}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <div className="shrink-0 border-t border-[var(--ad-line)] p-2.5">
          <Link href="/" target="_blank" className="ad-nav !mx-0 !text-[13.5px]">
            <ArrowUpRight size={17} strokeWidth={1.9} /> Lihat website
          </Link>
          <div className="mt-1 flex items-center gap-2.5 rounded-xl px-2 py-1.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--ad-fill-hover)] text-[13px] font-semibold text-[var(--ad-ink-2)]" aria-hidden>
              {(email[0] ?? "A").toUpperCase()}
            </span>
            <span className="min-w-0 flex-1 truncate text-[13px] text-[var(--ad-ink-2)]" title={email}>{email}</span>
            <form action={signOut}>
              <button className="ad-icon-btn" aria-label="Keluar" title="Keluar"><LogOut size={17} /></button>
            </form>
          </div>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="ad-topbar sticky top-0 z-30 h-[52px] flex items-center gap-3 px-3 sm:px-6 lg:px-10">
          <button onClick={() => setOpenAt(path)} className="ad-icon-btn lg:hidden -ml-1" aria-label="Buka menu"><Menu size={20} /></button>
          <CommandPalette />
        </header>
        <main id="konten" className="flex-1 w-full max-w-[1160px] mx-auto px-4 sm:px-6 lg:px-10 pt-6 pb-24 lg:pt-9 lg:pb-16">{children}</main>
      </div>
    </div>
  );
}
