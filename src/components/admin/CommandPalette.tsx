"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, CornerDownLeft, LayoutDashboard, Users, Briefcase, CalendarDays, Images, FileText, Inbox, History, Settings, ExternalLink, FileSearch, UserPlus, Archive } from "lucide-react";
import { searchAdmin, type SearchHit } from "@/lib/admin/actions";

interface Item { key: string; icon: React.ElementType; label: string; sub: string; href: string; external?: boolean }

const PAGES: Item[] = [
  { key: "p-dash", icon: LayoutDashboard, label: "Ringkasan", sub: "Halaman", href: "/admin" },
  { key: "p-kep", icon: Users, label: "Kepengurusan", sub: "Halaman", href: "/admin/kepengurusan" },
  { key: "p-prog", icon: Briefcase, label: "Program Kerja", sub: "Halaman", href: "/admin/program" },
  { key: "p-agenda", icon: CalendarDays, label: "Agenda", sub: "Halaman", href: "/admin/agenda" },
  { key: "p-gal", icon: Images, label: "Galeri", sub: "Halaman", href: "/admin/gallery" },
  { key: "p-ber", icon: FileText, label: "Berita", sub: "Halaman", href: "/admin/berita" },
  { key: "p-daftar", icon: UserPlus, label: "Pendaftar", sub: "Halaman", href: "/admin/pendaftar" },
  { key: "p-lapdaftar", icon: FileText, label: "Laporan pendaftar (PDF)", sub: "Saring dan cetak laporan khusus pendaftar", href: "/admin/pendaftar/laporan" },
  { key: "p-pesan", icon: Inbox, label: "Pesan Masuk", sub: "Halaman", href: "/admin/pesan" },
  { key: "p-arsip", icon: Archive, label: "Arsip & Cadangan", sub: "Laporan PDF, pemakaian penyimpanan", href: "/admin/arsip" },
  { key: "p-log", icon: History, label: "Log Aktivitas", sub: "Halaman", href: "/admin/aktivitas" },
  { key: "p-set", icon: Settings, label: "Pengaturan", sub: "Halaman", href: "/admin/settings" },
  { key: "p-web", icon: ExternalLink, label: "Lihat website", sub: "Buka di tab baru", href: "/", external: true },
];

/** Ctrl/⌘+K: lompat ke halaman mana pun atau cari pengurus, berita, agenda, pesan, dst. */
export default function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const reqId = useRef(0);

  const close = useCallback(() => {
    setOpen(false);
    setQ("");
    setHits([]);
    setActive(0);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (open) close();
        else setOpen(true);
      } else if (e.key === "Escape" && open) close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // pencarian konten (debounce). Hasil lama dibuang lewat `shownHits` bila kata kunci < 2 huruf.
  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) return;
    const id = ++reqId.current;
    const t = setTimeout(async () => {
      try {
        const r = await searchAdmin(term);
        if (id === reqId.current) {
          setHits(r);
          setActive(0);
        }
      } catch {
        /* sesi habis dsb — abaikan */
      }
    }, 220);
    return () => clearTimeout(t);
  }, [q]);

  const items: Item[] = useMemo(() => {
    const term = q.trim().toLowerCase();
    const pages = PAGES.filter((p) => !term || p.label.toLowerCase().includes(term));
    const content: Item[] = (term.length < 2 ? [] : hits).map((h, i) => ({ key: `h-${i}`, icon: FileSearch, label: h.label, sub: `${h.type} · ${h.sub}`, href: h.href }));
    return [...content, ...pages];
  }, [q, hits]);

  function go(it: Item) {
    close();
    if (it.external) window.open(it.href, "_blank", "noopener");
    else router.push(it.href);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(items.length - 1, a + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
    else if (e.key === "Enter" && items[active]) { e.preventDefault(); go(items[active]); }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        data-testid="palette-open"
        className="hidden sm:inline-flex items-center gap-2.5 h-9 w-72 rounded-[10px] bg-[var(--ad-fill)] hover:bg-[var(--ad-fill-hover)] px-3 text-[14px] text-[var(--ad-faint)] transition-colors"
      >
        <Search size={15} /> <span className="flex-1 text-left">Cari</span>
        <kbd className="text-[11px] font-medium rounded-md bg-white/80 px-1.5 py-0.5 text-[var(--ad-mute)] shadow-[0_0_0_0.5px_rgba(0,0,0,0.12)]">Ctrl K</kbd>
      </button>
      <button type="button" onClick={() => setOpen(true)} className="ad-icon-btn sm:hidden ml-auto" aria-label="Cari"><Search size={19} /></button>

      {open && (
        <div className="fixed inset-0 z-[80] flex items-start justify-center px-3 pt-[9vh] sm:pt-[13vh]" role="dialog" aria-modal="true" aria-label="Pencarian cepat">
          <div className="absolute inset-0 bg-black/25 backdrop-blur-[6px]" style={{ animation: "ad-fade .18s both" }} onClick={close} />
          <div className="relative w-full max-w-[620px] overflow-hidden rounded-2xl bg-white/95 shadow-[0_30px_90px_rgba(0,0,0,0.32),0_0_0_1px_rgba(0,0,0,0.06)] backdrop-blur-2xl" style={{ animation: "ad-pop .24s var(--ad-ease) both" }}>
            <div className="flex items-center gap-3 px-4 border-b border-[var(--ad-line)]">
              <Search size={19} className="text-[var(--ad-faint)] shrink-0" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => { setQ(e.target.value); setActive(0); }}
                onKeyDown={onKeyDown}
                placeholder="Cari pengurus, berita, agenda, pesan, atau halaman"
                aria-label="Kata kunci"
                className="flex-1 h-14 bg-transparent text-[17px] outline-none placeholder:text-[#a1a1a6]"
              />
              <kbd className="hidden sm:block text-[11px] font-medium rounded-md bg-[var(--ad-fill)] px-1.5 py-0.5 text-[var(--ad-mute)]">Esc</kbd>
            </div>
            <ul className="max-h-[52vh] overflow-y-auto p-2" role="listbox">
              {items.length === 0 && <li className="px-4 py-10 text-center text-[var(--ad-mute)]">Tidak ada hasil.</li>}
              {items.map((it, i) => (
                <li key={it.key} role="option" aria-selected={i === active}>
                  <button
                    type="button"
                    onMouseEnter={() => setActive(i)}
                    onClick={() => go(it)}
                    className={`w-full flex items-center gap-3 px-3 h-12 rounded-[10px] text-left transition-colors ${i === active ? "bg-[var(--ad-blue)] text-white" : ""}`}
                  >
                    <it.icon size={18} strokeWidth={1.8} className={i === active ? "text-white" : "text-[var(--ad-blue)]"} />
                    <span className="min-w-0 flex-1 truncate text-[15px] font-medium">{it.label}</span>
                    <span className={`truncate max-w-[40%] text-[12.5px] ${i === active ? "text-white/75" : "text-[var(--ad-faint)]"}`}>{it.sub}</span>
                    {i === active && <CornerDownLeft size={14} className="text-white/80 shrink-0" />}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
