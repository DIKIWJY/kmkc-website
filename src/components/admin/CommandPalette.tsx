"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, CornerDownLeft, LayoutDashboard, Users, Briefcase, CalendarDays, Images, FileText, Inbox, History, Settings, ExternalLink, FileSearch } from "lucide-react";
import { searchAdmin, type SearchHit } from "@/lib/admin/actions";

interface Item { key: string; icon: React.ElementType; label: string; sub: string; href: string; external?: boolean }

const PAGES: Item[] = [
  { key: "p-dash", icon: LayoutDashboard, label: "Dashboard", sub: "Halaman", href: "/admin" },
  { key: "p-kep", icon: Users, label: "Kepengurusan", sub: "Halaman", href: "/admin/kepengurusan" },
  { key: "p-prog", icon: Briefcase, label: "Program Kerja", sub: "Halaman", href: "/admin/program" },
  { key: "p-agenda", icon: CalendarDays, label: "Agenda", sub: "Halaman", href: "/admin/agenda" },
  { key: "p-gal", icon: Images, label: "Galeri", sub: "Halaman", href: "/admin/gallery" },
  { key: "p-ber", icon: FileText, label: "Berita", sub: "Halaman", href: "/admin/berita" },
  { key: "p-pesan", icon: Inbox, label: "Pesan Masuk", sub: "Halaman", href: "/admin/pesan" },
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
        className="hidden sm:inline-flex items-center gap-2.5 rounded-xl bg-surface ring-1 ring-border text-sm text-neutral-400 hover:text-neutral-600 px-3.5 py-2 w-64"
      >
        <Search size={15} /> <span className="flex-1 text-left">Cari apa saja…</span>
        <kbd className="text-[10px] font-semibold rounded-md bg-white ring-1 ring-border px-1.5 py-0.5">Ctrl K</kbd>
      </button>
      <button type="button" onClick={() => setOpen(true)} className="sm:hidden text-neutral-500" aria-label="Cari"><Search size={20} /></button>

      {open && (
        <div className="fixed inset-0 z-[70] flex items-start justify-center pt-[12vh] px-4" role="dialog" aria-modal="true" aria-label="Pencarian cepat">
          <div className="absolute inset-0 bg-primary-dark/40 backdrop-blur-sm" onClick={close} />
          <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl ring-1 ring-border overflow-hidden animate-fade-in">
            <div className="flex items-center gap-3 px-4 border-b border-border">
              <Search size={18} className="text-neutral-400" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => { setQ(e.target.value); setActive(0); }}
                onKeyDown={onKeyDown}
                placeholder="Cari pengurus, berita, agenda, pesan… atau ketik nama halaman"
                aria-label="Kata kunci"
                className="flex-1 py-4 text-sm outline-none bg-transparent"
              />
              <kbd className="text-[10px] font-semibold rounded-md bg-surface ring-1 ring-border px-1.5 py-0.5 text-neutral-400">Esc</kbd>
            </div>
            <ul className="max-h-[50vh] overflow-y-auto p-2" role="listbox">
              {items.length === 0 && <li className="px-4 py-8 text-center text-sm text-neutral-400">Tidak ada hasil.</li>}
              {items.map((it, i) => (
                <li key={it.key} role="option" aria-selected={i === active}>
                  <button
                    type="button"
                    onMouseEnter={() => setActive(i)}
                    onClick={() => go(it)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition ${i === active ? "bg-primary/8" : ""}`}
                  >
                    <span className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${i === active ? "bg-brand-gradient text-white" : "bg-surface text-primary"}`}><it.icon size={16} /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-neutral-800 truncate">{it.label}</span>
                      <span className="block text-xs text-neutral-400 truncate">{it.sub}</span>
                    </span>
                    {i === active && <CornerDownLeft size={14} className="text-neutral-400" />}
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
