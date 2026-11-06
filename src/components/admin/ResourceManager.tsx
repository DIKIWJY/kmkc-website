"use client";

import { useEffect, useMemo, useState, useRef, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Plus, Search, Pencil, Trash2, Loader2, ChevronUp, ChevronDown, ImageIcon, Images, ArrowUpRight, Inbox, ArrowUpDown,
} from "lucide-react";
import { RESOURCES, type Field, type Column } from "@/lib/admin/schema";
import { saveRecord, deleteRecord, moveRecord, setFlag } from "@/lib/admin/actions";
import { uploadImage } from "@/lib/image";
import { slugify } from "@/lib/slug";
import { rupiah } from "@/lib/money";
import { cn } from "@/lib/utils";
import Photo from "@/components/ui/Photo";
import Pagination from "@/components/ui/Pagination";
import RelTime from "@/components/ui/RelTime";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import ImageField from "./ImageField";
import MarkdownField from "./MarkdownField";
import { ConfirmDialog } from "./ConfirmDialog";
import { PageHeader, EmptyState } from "./ui";
import { useToast } from "./Toast";

type Row = Record<string, unknown>;
type BadgeVariant = React.ComponentProps<typeof Badge>["variant"];
const str = (v: unknown) => (v === null || v === undefined ? "" : String(v));
const PAGE_SIZE = 12;

const fmtDate = (v: unknown) =>
  v ? new Date(String(v) + (String(v).length === 10 ? "T00:00:00" : "")).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "—";

const badgeVariant: Record<string, BadgeVariant> = {
  upcoming: "info", ongoing: "default", completed: "muted",
  Acara: "info", Kegiatan: "muted",
};
const badgeLabel: Record<string, string> = {
  upcoming: "Akan datang", ongoing: "Berjalan", completed: "Selesai",
};

const SORT_OPTIONS = [
  { value: "new", label: "Terbaru" },
  { value: "old", label: "Terlama" },
  { value: "az", label: "Nama A–Z" },
  { value: "za", label: "Nama Z–A" },
];

export default function ResourceManager({ resourceKey, rows, headerExtra }: { resourceKey: string; rows: Row[]; headerExtra?: React.ReactNode }) {
  const res = RESOURCES[resourceKey];
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();

  const [query, setQuery] = useState(useSearchParams().get("q") ?? ""); // ?q= dari pencarian global
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Row | "new" | null>(null);
  const [toDelete, setToDelete] = useState<Row | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [bulk, setBulk] = useState<{ done: number; total: number } | null>(null);
  const bulkInput = useRef<HTMLInputElement>(null);

  // Urutan: kolom tanggal utama (mis. "Masuk" pada pendaftar) dan kolom nama bisa diurutkan lewat menu atau klik judul kolom.
  const dateKey = res.order.col === "order_index" ? "created_at" : res.order.col;
  const nameKey = res.columns.find((c) => !c.type || c.type === "text")?.key ?? res.labelField;
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(null);
  const sortValue = !sort ? "default" : sort.key === dateKey ? (sort.dir === "desc" ? "new" : "old") : sort.key === nameKey ? (sort.dir === "asc" ? "az" : "za") : "default";
  const chooseSort = (v: string) =>
    setSort(v === "new" ? { key: dateKey, dir: "desc" } : v === "old" ? { key: dateKey, dir: "asc" } : v === "az" ? { key: nameKey, dir: "asc" } : v === "za" ? { key: nameKey, dir: "desc" } : null);
  /** Klik judul kolom: menurun → menaik → urutan bawaan. */
  const toggleSort = (key: string) =>
    setSort((cur) => (!cur || cur.key !== key ? { key, dir: key === nameKey ? "asc" : "desc" } : (key === nameKey ? cur.dir === "asc" : cur.dir === "desc") ? { key, dir: cur.dir === "asc" ? "desc" : "asc" } : null));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = !q ? rows : rows.filter((r) => res.searchFields.some((f) => str(r[f]).toLowerCase().includes(q)));
    if (!sort) return base;
    const m = sort.dir === "asc" ? 1 : -1;
    return [...base].sort((a, b) => {
      const x = str(a[sort.key]), y = str(b[sort.key]);
      const c = sort.key === nameKey ? x.localeCompare(y, "id", { sensitivity: "base" }) : x < y ? -1 : x > y ? 1 : 0;
      return c !== 0 ? c * m : (str(a.created_at) < str(b.created_at) ? -1 : str(a.created_at) > str(b.created_at) ? 1 : 0) * m;
    });
  }, [rows, query, res.searchFields, sort, nameKey]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const cur = Math.min(page, pages);
  const visible = filtered.slice((cur - 1) * PAGE_SIZE, cur * PAGE_SIZE);
  const canReorder = !!res.reorder && !query.trim() && !sort;

  function refresh() {
    startTransition(() => router.refresh());
  }

  // Sakelar cepat di tabel (mis. sembunyikan foto / jadikan sorotan): tersimpan langsung, tampilan berubah seketika.
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  async function onFlag(id: string, field: string, next: boolean) {
    const k = `${id}:${field}`;
    setFlags((f) => ({ ...f, [k]: next }));
    const r = await setFlag(resourceKey, id, field, next);
    if (!r.ok) {
      setFlags((f) => ({ ...f, [k]: !next }));
      toast("error", r.error);
    } else refresh();
  }

  async function onMove(id: string, dir: "up" | "down") {
    setBusyId(id);
    const r = await moveRecord(resourceKey, id, dir);
    setBusyId(null);
    if (!r.ok) toast("error", r.error);
    else refresh();
  }

  async function confirmDelete() {
    if (!toDelete) return;
    const id = str(toDelete.id);
    setBusyId(id);
    const r = await deleteRecord(resourceKey, id);
    setBusyId(null);
    if (!r.ok) return toast("error", r.error);
    toast("success", `${res.singular} dihapus.`);
    setToDelete(null);
    refresh();
  }

  async function bulkUpload(files: FileList | null) {
    if (!files?.length || !res.bulkImage) return;
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!list.length) return toast("error", "Pilih file gambar.");
    setBulk({ done: 0, total: list.length });
    let ok = 0;
    for (const file of list) {
      try {
        const url = await uploadImage(file, res.fields.find((f) => f.name === res.bulkImage!.field)?.folder ?? "uploads", 1920);
        const title = file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim() || "Foto kegiatan";
        const r = await saveRecord(resourceKey, null, {
          ...res.defaults,
          [res.bulkImage.field]: url,
          [res.bulkImage.titleField]: title.charAt(0).toUpperCase() + title.slice(1),
          event_date: new Date().toISOString().slice(0, 10),
        });
        if (r.ok) ok++;
        else toast("error", `${file.name}: ${r.error}`);
      } catch (e) {
        toast("error", `${file.name}: ${e instanceof Error ? e.message : "gagal"}`);
      }
      setBulk((b) => (b ? { ...b, done: b.done + 1 } : b));
    }
    setBulk(null);
    if (bulkInput.current) bulkInput.current.value = "";
    if (ok) toast("success", `${ok} foto ditambahkan. Edit judulnya agar lebih deskriptif.`);
    refresh();
  }

  const toggleCell = (c: Column, r: Row, id: string) => {
    const on = flags[`${id}:${c.key}`] ?? !!r[c.key];
    return (
      <label className="inline-flex cursor-pointer items-center gap-2.5 text-[13px] text-muted-foreground">
        <Switch checked={on} onCheckedChange={(v) => onFlag(id, c.key, v)} aria-label={`${c.label}: ${str(r[res.labelField])}`} />
        <span>{on ? c.boolLabels?.[0] : c.boolLabels?.[1]}</span>
      </label>
    );
  };

  const actions = (r: Row, id: string) => (
    <div className="flex items-center justify-end gap-0.5">
      {resourceKey === "articles" && !!r.published && (
        <Button asChild variant="ghost" size="icon" className="size-8 text-muted-foreground">
          <a href={`/berita/${str(r.slug)}`} target="_blank" rel="noreferrer" aria-label="Lihat di website" title="Lihat di website"><ArrowUpRight /></a>
        </Button>
      )}
      <Button variant="ghost" size="icon" className="size-8 text-muted-foreground" onClick={() => setEditing(r)} aria-label={`Edit ${str(r[res.labelField])}`} title="Edit"><Pencil /></Button>
      <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" onClick={() => setToDelete(r)} disabled={busyId === id} aria-label={`Hapus ${str(r[res.labelField])}`} title="Hapus"><Trash2 /></Button>
    </div>
  );

  const reorder = (id: string, globalIdx: number) => (
    <div className="flex flex-col">
      <Button variant="ghost" size="icon" className="h-5 w-7 text-muted-foreground" disabled={busyId === id || globalIdx === 0} onClick={() => onMove(id, "up")} aria-label="Naikkan"><ChevronUp /></Button>
      <Button variant="ghost" size="icon" className="h-5 w-7 text-muted-foreground" disabled={busyId === id || globalIdx === filtered.length - 1} onClick={() => onMove(id, "down")} aria-label="Turunkan"><ChevronDown /></Button>
    </div>
  );

  // Kolom untuk tampilan seluler: gambar → thumbnail, kolom teks pertama → judul, sisanya → baris keterangan.
  const imgCol = res.columns.find((c) => c.type === "image");
  const titleCol = res.columns.find((c) => !c.type || c.type === "text");
  const metaCols = res.columns.filter((c) => c !== imgCol && c !== titleCol);

  return (
    <div>
      <PageHeader title={res.title} subtitle={res.description}>
        {headerExtra}
        {res.bulkImage && (
          <>
            <input ref={bulkInput} type="file" accept="image/*" multiple className="hidden" onChange={(e) => bulkUpload(e.target.files)} />
            <Button variant="outline" onClick={() => bulkInput.current?.click()} disabled={!!bulk}>
              {bulk ? <Loader2 className="animate-spin" /> : <Images />}
              {bulk ? `Mengunggah ${bulk.done}/${bulk.total}` : "Unggah banyak"}
            </Button>
          </>
        )}
        <Button onClick={() => setEditing("new")}>
          <Plus /> Tambah {res.singular}
        </Button>
      </PageHeader>

      <Card className="gap-0 overflow-hidden py-0">
        <div className="flex flex-wrap items-center gap-3 border-b p-3 sm:p-4">
          <div className="relative min-w-[12rem] flex-1 sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              type="search"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
              placeholder={`Cari ${res.singular.toLowerCase()}`}
              aria-label={`Cari ${res.singular.toLowerCase()}`}
              className="pl-9"
            />
          </div>
          <span className="ml-auto hidden whitespace-nowrap text-[13px] tabular-nums text-muted-foreground sm:inline">{filtered.length} data</span>
          {pending && <Loader2 className="size-4 animate-spin text-primary" aria-label="Memuat" />}
          <Select value={sortValue} onValueChange={(v) => { chooseSort(v); setPage(1); }}>
            <SelectTrigger className="w-[9.5rem]" aria-label="Urutkan">
              <ArrowUpDown className="text-muted-foreground" aria-hidden />
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="default">{res.reorder ? "Urutan tampil" : "Urutan bawaan"}</SelectItem>
              {SORT_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {visible.length === 0 ? (
          <EmptyState
            icon={query ? Search : Inbox}
            title={query ? "Tidak ada hasil" : `Belum ada ${res.singular.toLowerCase()}`}
            text={query ? "Coba kata kunci lain." : `Klik “Tambah ${res.singular}” untuk membuat yang pertama.`}
          />
        ) : (
          <>
            {/* ---------- Desktop / tablet: tabel ---------- */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    {canReorder && <TableHead className="w-14"><span className="sr-only">Urutan</span></TableHead>}
                    {res.columns.map((c) => {
                      const can = c.key === dateKey || c.key === nameKey;
                      if (!can) return <TableHead key={c.key}>{c.label}</TableHead>;
                      const on = sort?.key === c.key;
                      return (
                        <TableHead key={c.key} aria-sort={on ? (sort!.dir === "asc" ? "ascending" : "descending") : undefined}>
                          <button
                            type="button"
                            onClick={() => toggleSort(c.key)}
                            className={cn("-mx-1 inline-flex items-center gap-1 rounded px-1 py-0.5 font-medium transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none", on && "text-primary")}
                          >
                            {c.label}
                            {on ? (sort!.dir === "asc" ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />) : <ArrowUpDown className="size-3 opacity-40" />}
                          </button>
                        </TableHead>
                      );
                    })}
                    <TableHead className="w-px text-right"><span className="sr-only">Aksi</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((r, idx) => {
                    const id = str(r.id);
                    const globalIdx = (cur - 1) * PAGE_SIZE + idx;
                    return (
                      <TableRow key={id}>
                        {canReorder && <TableCell className="pr-0">{reorder(id, globalIdx)}</TableCell>}
                        {res.columns.map((c) => (
                          <TableCell key={c.key}>{c.quickToggle ? toggleCell(c, r, id) : renderCell(c, r)}</TableCell>
                        ))}
                        <TableCell className="whitespace-nowrap">{actions(r, id)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* ---------- Seluler: daftar kartu ---------- */}
            <ul className="divide-y md:hidden">
              {visible.map((r, idx) => {
                const id = str(r.id);
                const globalIdx = (cur - 1) * PAGE_SIZE + idx;
                return (
                  <li key={id} className="p-4">
                    <div className="flex items-start gap-3">
                      {imgCol && <Thumb src={str(r[imgCol.key])} />}
                      <div className="min-w-0 flex-1">
                        {titleCol && renderCell(titleCol, r)}
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                          {metaCols.filter((c) => !c.quickToggle).map((c) => {
                            const cell = renderCell(c, r, true);
                            return cell ? <span key={c.key} className="inline-flex">{cell}</span> : null;
                          })}
                        </div>
                        {metaCols.some((c) => c.quickToggle) && (
                          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
                            {metaCols.filter((c) => c.quickToggle).map((c) => <span key={c.key}>{toggleCell(c, r, id)}</span>)}
                          </div>
                        )}
                      </div>
                      <div className="-mr-1.5 flex shrink-0 items-center gap-1">
                        {canReorder && reorder(id, globalIdx)}
                        {actions(r, id)}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}

        <Pagination variant="admin" page={cur} pages={pages} total={filtered.length} size={PAGE_SIZE} onChange={(n) => { setPage(n); window.scrollTo({ top: 0, behavior: "smooth" }); }} noun="data" />
      </Card>

      {editing && (
        <RecordForm
          resourceKey={resourceKey}
          record={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); refresh(); }}
        />
      )}

      {toDelete && (
        <ConfirmDialog
          title={`Hapus ${res.singular.toLowerCase()} ini?`}
          text={`“${str(toDelete[res.labelField])}” akan dihapus permanen${res.imageFields.length ? ", termasuk file fotonya" : res.key === "registrations" ? ", termasuk bukti follow dan bukti bayarnya. Jumlah anggota per desa di beranda ikut berkurang" : ""}. Tindakan ini tidak bisa dibatalkan.`}
          confirmLabel="Hapus"
          busy={busyId === str(toDelete.id)}
          onConfirm={confirmDelete}
          onCancel={() => setToDelete(null)}
        />
      )}
    </div>
  );
}

function Thumb({ src, size = 48 }: { src: string; size?: number }) {
  return (
    <span className="relative shrink-0 overflow-hidden rounded-lg bg-muted ring-1 ring-inset ring-border" style={{ width: size, height: size }}>
      {src ? <Photo src={src} alt="" sizes={`${size * 2}px`} /> : <span className="absolute inset-0 flex items-center justify-center text-muted-foreground/60"><ImageIcon className="size-[18px]" strokeWidth={1.6} /></span>}
    </span>
  );
}

function renderCell(c: Column, r: Row, compact = false) {
  const v = r[c.key];
  switch (c.type) {
    case "image":
      return <Thumb src={str(v)} />;
    case "badge":
      return str(v) ? <Badge variant={badgeVariant[str(v)] ?? "muted"}>{badgeLabel[str(v)] ?? str(v)}</Badge> : <span className="text-muted-foreground/60">—</span>;
    case "date":
      if (c.key.endsWith("_at") && v) return <RelTime iso={str(v)} className="whitespace-nowrap text-[13px] tabular-nums text-muted-foreground" />;
      return <span className="whitespace-nowrap text-[13px] tabular-nums text-muted-foreground">{fmtDate(v)}</span>;
    case "money":
      return Number(v) > 0 ? <span className="whitespace-nowrap text-[13px] tabular-nums">{rupiah(Number(v))}</span> : <span className="text-[13px] text-muted-foreground/60">—</span>;
    case "bool":
      if (compact && !v && c.boolLabels) return <span className="whitespace-nowrap text-[13px] text-muted-foreground">{c.label}: {c.boolLabels[1].toLowerCase()}</span>;
      return v ? (
        <Badge variant="info">{c.boolLabels?.[0] ?? "Terbit"}</Badge>
      ) : c.boolLabels ? (
        <span className="text-[13px] text-muted-foreground">{c.boolLabels[1]}</span>
      ) : (
        <Badge variant="muted">Draft</Badge>
      );
    default:
      if (compact) {
        const t = [str(v), c.sub ? str(r[c.sub]) : ""].filter(Boolean).join(" · ");
        return t ? <span className="text-[13px] text-muted-foreground">{t}</span> : null;
      }
      return (
        <div className="min-w-[8rem] max-w-[22rem]">
          <p className="truncate font-medium">{str(v) || "—"}</p>
          {c.sub && str(r[c.sub]) && <p className="truncate text-[13px] text-muted-foreground">{str(r[c.sub])}</p>}
        </div>
      );
  }
}

/* ---------------------------------------------------------------- form */

function RecordForm({ resourceKey, record, onClose, onSaved }: { resourceKey: string; record: Row | null; onClose: () => void; onSaved: () => void }) {
  const res = RESOURCES[resourceKey];
  const toast = useToast();
  const [open, setOpen] = useState(true);
  const [saving, setSaving] = useState(false);
  const [slugTouched, setSlugTouched] = useState(!!record);
  const [values, setValues] = useState<Row>(() => {
    const init: Row = {};
    for (const f of res.fields) {
      const v = record ? record[f.name] : res.defaults[f.name];
      init[f.name] = f.type === "toggle" ? !!v : f.type === "date" ? str(v).slice(0, 10) : str(v);
    }
    return init;
  });
  const [error, setError] = useState("");
  const [dirty, setDirty] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);

  // Tutup dengan animasi: lembar meluncur keluar dulu, baru komponen dilepas.
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const leave = (after: () => void) => {
    setOpen(false);
    timer.current = setTimeout(after, 280);
  };
  const tryClose = () => (dirty && !saving ? setConfirmClose(true) : leave(onClose));

  const set = (name: string, v: unknown) => { setDirty(true); setValues((s) => ({ ...s, [name]: v })); };

  function onFieldChange(f: Field, v: unknown) {
    setDirty(true);
    setValues((s) => {
      const next = { ...s, [f.name]: v };
      const slugField = res.fields.find((x) => x.type === "slug" && x.slugFrom === f.name);
      if (slugField && !slugTouched) next[slugField.name] = slugify(String(v));
      return next;
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const r = await saveRecord(resourceKey, record ? str(record.id) : null, values);
    setSaving(false);
    if (!r.ok) return setError(r.error);
    toast("success", record ? "Perubahan disimpan." : `${res.singular} ditambahkan.`);
    leave(onSaved);
  }

  const title = `${record ? "Edit" : "Tambah"} ${res.singular}`;
  return (
    <>
      <Sheet open={open} onOpenChange={(o) => { if (!o && !saving) tryClose(); }}>
        <SheetContent className="w-full gap-0 p-0 sm:max-w-xl" aria-describedby="sheet-desc">
          <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
            <SheetHeader className="border-b px-6 py-5 pr-14">
              <SheetTitle className="text-lg">{title}</SheetTitle>
              <SheetDescription id="sheet-desc">
                {record ? `Ubah data ${res.singular.toLowerCase()} lalu simpan.` : `Isi data ${res.singular.toLowerCase()} baru.`} Kolom bertanda <span className="text-destructive">*</span> wajib diisi.
              </SheetDescription>
            </SheetHeader>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
              <div className="grid grid-cols-2 gap-x-4 gap-y-5">
                {res.fields.map((f) => (
                  <div key={f.name} className={f.half ? "col-span-2 sm:col-span-1" : "col-span-2"}>
                    {f.type !== "toggle" && (
                      <Label className="mb-2" htmlFor={`f-${f.name}`}>
                        {f.label} {f.required && <span className="text-destructive" aria-hidden>*</span>}
                      </Label>
                    )}
                    {renderInput(f, values[f.name], (v) => (f.type === "slug" ? (setSlugTouched(true), set(f.name, v)) : onFieldChange(f, v)))}
                    {f.help && <p className="mt-1.5 text-xs text-muted-foreground">{f.help}</p>}
                  </div>
                ))}
              </div>
              {error && (
                <Alert variant="destructive" role="alert" className="mt-5">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>

            <SheetFooter className="mt-0 flex-row items-center justify-end gap-2 border-t bg-card px-6 py-4">
              <Button type="button" variant="outline" onClick={tryClose} disabled={saving}>Batal</Button>
              <Button type="submit" disabled={saving} className="min-w-24">
                {saving && <Loader2 className="animate-spin" />} Simpan
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      {confirmClose && (
        <ConfirmDialog
          title="Buang perubahan?"
          text="Perubahan yang belum disimpan akan hilang."
          confirmLabel="Buang perubahan"
          onConfirm={() => { setConfirmClose(false); leave(onClose); }}
          onCancel={() => setConfirmClose(false)}
        />
      )}
    </>
  );
}

function renderInput(f: Field, value: unknown, onChange: (v: unknown) => void) {
  const id = `f-${f.name}`;
  switch (f.type) {
    case "textarea":
      return <Textarea id={id} rows={3} value={str(value)} maxLength={f.max} onChange={(e) => onChange(e.target.value)} placeholder={f.placeholder} />;
    case "markdown":
      return <MarkdownField value={str(value)} onChange={onChange} />;
    case "select":
      return (
        <Select value={str(value)} onValueChange={(v) => onChange(v)}>
          <SelectTrigger id={id} className="w-full">
            <SelectValue placeholder="Pilih…" />
          </SelectTrigger>
          <SelectContent>
            {f.options?.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      );
    case "date":
      return <Input id={id} type="date" value={str(value)} onChange={(e) => onChange(e.target.value)} />;
    case "image":
      return <ImageField value={str(value)} onChange={onChange} folder={f.folder ?? "uploads"} maxSize={f.maxSize} square={f.folder === "members"} />;
    case "proof":
      return value ? (
        <a href={`/api/admin/bukti/${str(value)}`} target="_blank" rel="noreferrer" className="block w-fit overflow-hidden rounded-lg ring-1 ring-border">
          { }
          <img src={`/api/admin/bukti/${str(value)}`} alt={f.label} loading="lazy" className="max-h-72 w-auto max-w-full object-contain" />
        </a>
      ) : (
        <p className="text-sm text-muted-foreground">{f.name === "payment_proof" ? "Tidak ada bukti pembayaran (tanpa HTM saat mendaftar)." : "Tidak ada bukti diunggah."}</p>
      );
    case "toggle":
      return (
        <div className="flex items-center justify-between gap-4 rounded-lg border px-3.5 py-3">
          <Label htmlFor={id} className="flex-col items-start gap-0.5">
            <span className="text-sm font-medium">{f.label}</span>
            <span className="text-[13px] font-normal text-muted-foreground">{value ? (f.toggleLabels?.[0] ?? "Terbit") : (f.toggleLabels?.[1] ?? "Draft")}</span>
          </Label>
          <Switch id={id} checked={!!value} onCheckedChange={(v) => onChange(v)} />
        </div>
      );
    default:
      return <Input id={id} type="text" value={str(value)} maxLength={f.max} onChange={(e) => onChange(e.target.value)} placeholder={f.placeholder} required={f.required} />;
  }
}
