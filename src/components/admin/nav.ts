import {
  LayoutDashboard, FileText, Images, CalendarDays, Briefcase, Users, UserPlus, Inbox, Archive, History, Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Kunci lencana angka di sidebar (diisi layout). */
  badge?: "unread";
}
export interface NavGroup { title?: string; items: NavItem[] }

/** Satu sumber kebenaran untuk sidebar, breadcrumb, dan pencarian cepat. Semua alamat berbahasa Indonesia. */
export const NAV: NavGroup[] = [
  { items: [{ href: "/admin", label: "Ringkasan", icon: LayoutDashboard }] },
  {
    title: "Konten",
    items: [
      { href: "/admin/berita", label: "Berita", icon: FileText },
      { href: "/admin/galeri", label: "Galeri", icon: Images },
      { href: "/admin/agenda", label: "Agenda", icon: CalendarDays },
      { href: "/admin/program-kerja", label: "Program Kerja", icon: Briefcase },
    ],
  },
  {
    title: "Organisasi",
    items: [
      { href: "/admin/kepengurusan", label: "Kepengurusan", icon: Users },
      { href: "/admin/pendaftar", label: "Pendaftar", icon: UserPlus },
    ],
  },
  { title: "Kotak masuk", items: [{ href: "/admin/pesan", label: "Pesan Masuk", icon: Inbox, badge: "unread" }] },
  {
    title: "Sistem",
    items: [
      { href: "/admin/arsip", label: "Arsip & Cadangan", icon: Archive },
      { href: "/admin/aktivitas", label: "Log Aktivitas", icon: History },
      { href: "/admin/pengaturan", label: "Pengaturan", icon: Settings },
    ],
  },
];

export const isActive = (path: string, href: string) =>
  href === "/admin" ? path === "/admin" : path === href || path.startsWith(href + "/");

/** Subhalaman yang bukan menu sidebar, untuk judul di breadcrumb. */
const SUB: Record<string, string> = { laporan: "Laporan", export: "Ekspor" };

/** Breadcrumb dari alamat: [kelompok, halaman, (subhalaman)]. */
export function crumbsOf(path: string): string[] {
  for (const g of NAV) {
    const it = g.items.find((i) => isActive(path, i.href));
    if (it) {
      const out = [...(g.title ? [g.title] : []), it.label];
      const rest = path.slice(it.href.length).split("/").filter(Boolean);
      if (rest[0] && SUB[rest[0]]) out.push(SUB[rest[0]]);
      return out;
    }
  }
  return ["Admin"];
}
