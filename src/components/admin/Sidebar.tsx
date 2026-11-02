"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, Images, FileText, Briefcase, Inbox, Settings, LogOut, Menu, X, ArrowUpRight, History, CalendarDays, UserPlus, Archive, ChevronRight,
} from "lucide-react";
import { signOut } from "@/lib/admin/actions";
import CommandPalette from "./CommandPalette";
import Logo from "@/components/ui/Logo";

type Item = { href: string; icon: React.ElementType; label: string };
const groups: { title?: string; items: Item[] }[] = [
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

const isActive = (path: string, href: string) => (href === "/admin" ? path === "/admin" : path === href || path.startsWith(href + "/"));

/** Judul halaman untuk remah roti di bilah atas (kelompok › halaman). */
function crumbOf(path: string): { group?: string; label: string } {
  for (const g of groups) {
    const it = g.items.find((i) => isActive(path, i.href));
    if (it) return { group: g.title, label: it.label };
  }
  return { label: "Admin" };
}

export default function Sidebar({ email, unread, regOpen, children }: { email: string; unread: number; regOpen: boolean; children: React.ReactNode }) {
  const path = usePathname();
  // Laci seluler terikat ke halaman: pindah halaman otomatis menutupnya.
  const [openAt, setOpenAt] = useState<string | null>(null);
  const open = openAt === path;
  const crumb = crumbOf(path);

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
      {open && <div className="fixed inset-0 z-40 bg-[#050c20]/50 backdrop-blur-[3px] lg:hidden" style={{ animation: "ad-fade .2s both" }} onClick={() => setOpenAt(null)} aria-hidden />}

      <aside
        className={`ad-sidebar fixed inset-y-0 left-0 z-50 w-[280px] lg:w-[256px] lg:sticky lg:top-0 lg:h-dvh shrink-0 flex flex-col transition-transform duration-300 [transition-timing-function:var(--ad-ease)] lg:translate-x-0 ${
          open ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
        aria-label="Menu admin"
      >
        <div className="h-[68px] shrink-0 flex items-center justify-between pl-5 pr-3">
          <Link href="/admin" className="ad-brand" aria-label="KMKC Admin, ke Ringkasan">
            <span className="ad-brand-mark"><Logo size={38} alt="" className="rounded-full" /></span>
            <span className="min-w-0">
              <b>KMKC</b>
              <small>Panel Admin</small>
            </span>
          </Link>
          <button onClick={() => setOpenAt(null)} className="ad-icon-btn lg:hidden" aria-label="Tutup menu"><X size={18} /></button>
        </div>

        <nav className="flex-1 overflow-y-auto pb-4" aria-label="Navigasi admin">
          {groups.map((g, i) => (
            <div key={i}>
              {g.title && <p className="ad-nav-group">{g.title}</p>}
              {g.items.map(({ href, icon: Icon, label }) => (
                <Link key={href} href={href} className="ad-nav" aria-current={isActive(path, href) ? "page" : undefined}>
                  <Icon size={18} strokeWidth={1.75} />
                  <span className="truncate">{label}</span>
                  {href === "/admin/pesan" && unread > 0 && <span className="ad-nav-count tnum">{unread > 99 ? "99+" : unread}</span>}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <div className="ad-side-foot shrink-0">
          <Link href="/admin/settings" className="ad-side-card" aria-label={`Pendaftaran anggota ${regOpen ? "dibuka" : "ditutup"}, buka pengaturan`}>
            <span className={`ad-pulse ${regOpen ? "" : "off"}`} aria-hidden />
            <span className="min-w-0 flex-1">
              <small>Pendaftaran anggota</small>
              <b>{regOpen ? "Sedang dibuka" : "Ditutup"}</b>
            </span>
            <ChevronRight size={16} className="text-white/40" />
          </Link>
          <div className="mx-3 flex items-center gap-2.5 rounded-xl px-1.5 py-1">
            <span className="ad-avatar" aria-hidden>{(email[0] ?? "A").toUpperCase()}</span>
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block truncate text-[13px] font-medium text-white/90" title={email}>{email.split("@")[0]}</span>
              <span className="block truncate text-[11.5px] text-white/45" title={email}>{email}</span>
            </span>
            <form action={signOut}>
              <button className="ad-icon-btn" aria-label="Keluar" title="Keluar"><LogOut size={17} /></button>
            </form>
          </div>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="ad-topbar sticky top-0 z-30 h-[56px] flex items-center gap-3 px-3 sm:px-6 lg:px-10">
          <button onClick={() => setOpenAt(path)} className="ad-icon-btn lg:hidden -ml-1" aria-label="Buka menu"><Menu size={20} /></button>
          <div className="ad-crumb flex-1" aria-label="Lokasi">
            {crumb.group && <><span className="hidden sm:inline">{crumb.group}</span><i className="hidden sm:inline">/</i></>}
            <b className="truncate">{crumb.label}</b>
          </div>
          <CommandPalette />
          <Link href="/" target="_blank" className="ad-top-link hidden md:inline-flex">
            Lihat website <ArrowUpRight size={15} />
          </Link>
        </header>
        <main id="konten" className="flex-1 w-full min-w-0 max-w-[1240px] px-4 sm:px-6 lg:px-10 pt-6 pb-24 lg:pt-9 lg:pb-16">{children}</main>
      </div>
    </div>
  );
}
