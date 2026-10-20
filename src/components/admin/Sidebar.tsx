"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Images, FileText, Briefcase, Inbox, Settings, LogOut, Menu, X, ExternalLink, History, CalendarDays, UserPlus } from "lucide-react";
import { signOut } from "@/lib/admin/actions";
import CommandPalette from "./CommandPalette";
import Logo from "@/components/ui/Logo";

const links = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/kepengurusan", icon: Users, label: "Kepengurusan" },
  { href: "/admin/program", icon: Briefcase, label: "Program Kerja" },
  { href: "/admin/agenda", icon: CalendarDays, label: "Agenda" },
  { href: "/admin/gallery", icon: Images, label: "Galeri" },
  { href: "/admin/berita", icon: FileText, label: "Berita" },
  { href: "/admin/pendaftar", icon: UserPlus, label: "Pendaftar" },
  { href: "/admin/pesan", icon: Inbox, label: "Pesan Masuk" },
  { href: "/admin/aktivitas", icon: History, label: "Log Aktivitas" },
  { href: "/admin/settings", icon: Settings, label: "Pengaturan" },
];

export default function Sidebar({ email, unread, children }: { email: string; unread: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const active = (href: string) => (href === "/admin" ? path === "/admin" : path.startsWith(href));

  return (
    <div className="min-h-screen bg-[#f4f7fc] flex">
      {open && <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setOpen(false)} />}

      <aside className={`fixed lg:sticky top-0 h-screen inset-y-0 left-0 z-50 w-64 shrink-0 bg-primary-dark text-white flex flex-col transition-transform lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="h-16 flex items-center justify-between px-5 border-b border-white/10">
          <Link href="/admin" className="flex items-center gap-2.5">
            <Logo size={36} alt="" />
            <span className="font-extrabold tracking-tight">KMKC <span className="text-white/50 font-medium">Admin</span></span>
          </Link>
          <button onClick={() => setOpen(false)} className="lg:hidden text-white/60" aria-label="Tutup menu"><X size={20} /></button>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {links.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                active(href) ? "bg-white/12 text-white shadow-inner" : "text-white/60 hover:bg-white/8 hover:text-white"
              }`}
            >
              <Icon size={18} className={active(href) ? "text-sky-300" : ""} />
              {label}
              {href === "/admin/pesan" && unread > 0 && (
                <span className="ml-auto text-[11px] font-bold bg-sky-400 text-primary-dark rounded-full px-2 py-0.5">{unread > 99 ? "99+" : unread}</span>
              )}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-white/10 space-y-1">
          <Link href="/" prefetch={false} target="_blank" className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm text-white/60 hover:bg-white/8 hover:text-white">
            <ExternalLink size={18} /> Lihat website
          </Link>
          <form action={signOut}>
            <button className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm text-red-300 hover:bg-red-500/15 w-full">
              <LogOut size={18} /> Keluar
            </button>
          </form>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white/80 backdrop-blur border-b border-border flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
          <button onClick={() => setOpen(true)} className="lg:hidden text-neutral-600" aria-label="Buka menu"><Menu size={22} /></button>
          <CommandPalette />
          <div className="flex items-center gap-3 ml-auto">
            <span className="text-sm text-neutral-500 hidden sm:block">{email}</span>
            <span className="w-9 h-9 rounded-full bg-brand-gradient text-white flex items-center justify-center text-sm font-bold">{(email[0] ?? "A").toUpperCase()}</span>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-8 max-w-[1400px] w-full">{children}</main>
      </div>
    </div>
  );
}
