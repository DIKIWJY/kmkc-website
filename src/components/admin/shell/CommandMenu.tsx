"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, FileSearch, FileText, Search, type LucideIcon } from "lucide-react";
import { searchAdmin, type SearchHit } from "@/lib/admin/actions";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { NAV } from "../nav";

interface Entry { key: string; icon: LucideIcon; label: string; sub?: string; href: string; external?: boolean }

const PAGES: Entry[] = [
  ...NAV.flatMap((g) => g.items.map((i) => ({ key: i.href, icon: i.icon, label: i.label, sub: g.title ?? "Halaman", href: i.href }))),
  { key: "/admin/pendaftar/laporan", icon: FileText, label: "Laporan pendaftar (PDF)", sub: "Saring dan cetak laporan khusus pendaftar", href: "/admin/pendaftar/laporan" },
  { key: "/", icon: ExternalLink, label: "Lihat website", sub: "Buka di tab baru", href: "/", external: true },
];

/** Ctrl/⌘+K: lompat ke halaman mana pun atau cari pengurus, berita, agenda, pesan, dst. */
export default function CommandMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const reqId = useRef(0);

  const onOpenChange = useCallback((o: boolean) => {
    setOpen(o);
    if (!o) { setQ(""); setHits([]); }
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Pencarian konten di server (ditunda 220 ms). Hasil lama diabaikan bila kata kunci < 2 huruf (lihat `shownHits`).
  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) return;
    const id = ++reqId.current;
    const t = setTimeout(async () => {
      try {
        const r = await searchAdmin(term);
        if (id === reqId.current) setHits(r);
      } catch {
        /* sesi habis dsb. — abaikan */
      }
    }, 220);
    return () => clearTimeout(t);
  }, [q]);

  const term = q.trim().toLowerCase();
  const shownHits = term.length < 2 ? [] : hits;
  const pages = useMemo(() => PAGES.filter((p) => !term || p.label.toLowerCase().includes(term)), [term]);

  function go(e: Entry | SearchHit) {
    onOpenChange(false);
    if ("external" in e && e.external) window.open(e.href, "_blank", "noopener");
    else router.push(e.href);
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        data-testid="palette-open"
        className="hidden h-9 w-60 justify-start gap-2 px-3 font-normal text-muted-foreground lg:inline-flex"
      >
        <Search /> <span className="flex-1 text-left">Cari apa saja…</span>
        <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[11px] font-medium">Ctrl K</kbd>
      </Button>
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)} className="lg:hidden" aria-label="Cari"><Search /></Button>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogHeader className="sr-only">
          <DialogTitle>Pencarian cepat</DialogTitle>
          <DialogDescription>Cari konten atau lompat ke halaman admin.</DialogDescription>
        </DialogHeader>
        <DialogContent className="top-[22%] translate-y-0 overflow-hidden p-0 sm:max-w-xl" showCloseButton={false}>
          <Command shouldFilter={false} className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium">
            <CommandInput value={q} onValueChange={setQ} placeholder="Cari pengurus, berita, agenda, pesan, atau halaman" />
            <CommandList className="max-h-[52vh]">
              <CommandEmpty>Tidak ada hasil.</CommandEmpty>
              {shownHits.length > 0 && (
                <CommandGroup heading="Hasil pencarian">
                  {shownHits.map((h, i) => (
                    <CommandItem key={`h-${i}`} value={`h-${i}`} onSelect={() => go(h)}>
                      <FileSearch className="text-primary" />
                      <span className="min-w-0 flex-1 truncate">{h.label}</span>
                      <span className="max-w-[40%] truncate text-xs text-muted-foreground">{h.type} · {h.sub}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {pages.length > 0 && (
                <CommandGroup heading="Halaman">
                  {pages.map((p) => (
                    <CommandItem key={p.key} value={p.key} onSelect={() => go(p)}>
                      <p.icon className="text-primary" />
                      <span className="min-w-0 flex-1 truncate">{p.label}</span>
                      {p.sub && <span className="max-w-[45%] truncate text-xs text-muted-foreground">{p.sub}</span>}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
}
