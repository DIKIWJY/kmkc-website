"use client";

import { useEffect, useMemo, useState, useRef, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Plus, Search, Pencil, Trash2, X, Loader2, ChevronUp, ChevronDown, ImageIcon, Images, ArrowUpRight, Inbox, ArrowUpDown,
} from "lucide-react";
import { RESOURCES, type Field, type Column } from "@/lib/admin/schema";
import { saveRecord, deleteRecord, moveRecord, setFlag } from "@/lib/admin/actions";
import { uploadImage } from "@/lib/image";
import { slugify } from "@/lib/slug";
import { rupiah } from "@/lib/money";
import Photo from "@/components/ui/Photo";
import ImageField from "./ImageField";
import MarkdownField from "./MarkdownField";
import { PageHeader, Card, Badge, EmptyState } from "./ui";
import { useToast } from "./Toast";
import Pagination from "@/components/ui/Pagination";
import RelTime from "@/components/ui/RelTime";

type Row = Record<string, unknown>;
const str = (v: unknown) => (v === null || v === undefined ? "" : String(v));
const PAGE_SIZE = 12;

const fmtDate = (v: unknown) =>
  v ? new Date(String(v) + (String(v).length === 10 ? "T00:00:00" : "")).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "—";

const badgeTone: Record<string, "gray" | "blue" | "solid" | "red"> = {
  upcoming: "blue", ongoing: "solid", completed: "gray",
  Acara: "blue", Kegiatan: "gray",
  baru: "solid", dihubungi: "blue", diterima: "blue", ditolak: "gray",
};
const badgeLabel: Record<string, string> = {
  upcoming: "Akan datang", ongoing: "Berjalan", completed: "Selesai", baru: "Baru", dihubungi: "Dihubungi", diterima: "Diterima", ditolak: "Ditolak",
};

/** Cegah halaman di belakang ikut bergulir saat lembar/dialog terbuka. */
function useLockScroll() {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);
}

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
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={`${c.label}: ${str(r[res.labelField])}`}
        onClick={() => onFlag(id, c.key, !on)}
        className="inline-flex items-center gap-2.5 text-[13px] text-[var(--ad-ink-2)]"
      >
        <span className="ad-switch" aria-hidden data-on={on} />
        <span>{on ? c.boolLabels?.[0] : c.boolLabels?.[1]}</span>
      </button>
    );
  };

  const actions = (r: Row, id: string) => (
    <div className="flex justify-end items-center gap-0.5">
      {resourceKey === "articles" && !!r.published && (
        <a href={`/berita/${str(r.slug)}`} target="_blank" rel="noreferrer" className="ad-icon-btn" aria-label="Lihat di website"><ArrowUpRight size={17} /></a>
      )}
      <button onClick={() => setEditing(r)} className="ad-icon-btn" aria-label={`Edit ${str(r[res.labelField])}`}><Pencil size={16} /></button>
      <button onClick={() => setToDelete(r)} disabled={busyId === id} className="ad-icon-btn danger" aria-label={`Hapus ${str(r[res.labelField])}`}><Trash2 size={16} /></button>
    </div>
  );

  const reorder = (id: string, globalIdx: number) => (
    <div className="flex flex-col">
      <button disabled={busyId === id || globalIdx === 0} onClick={() => onMove(id, "up")} className="ad-icon-btn !h-5 !w-7 !rounded-md" aria-label="Naikkan"><ChevronUp size={16} /></button>
      <button disabled={busyId === id || globalIdx === filtered.length - 1} onClick={() => onMove(id, "down")} className="ad-icon-btn !h-5 !w-7 !rounded-md" aria-label="Turunkan"><ChevronDown size={16} /></button>
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
            <button onClick={() => bulkInput.current?.click()} disabled={!!bulk} className="ad-btn">
              {bulk ? <Loader2 size={16} className="animate-spin" /> : <Images size={16} />}
              {bulk ? `Mengunggah ${bulk.done}/${bulk.total}` : "Unggah banyak"}
            </button>
          </>
        )}
        <button onClick={() => setEditing("new")} className="ad-btn ad-btn-primary">
          <Plus size={16} strokeWidth={2.4} /> Tambah {res.singular}
        </button>
      </PageHeader>

      <Card className="overflow-hidden">
        <div className="flex items-center gap-3 p-3 sm:p-4 border-b border-[var(--ad-line)]">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--ad-faint)] pointer-events-none" />
            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
              placeholder={`Cari ${res.singular.toLowerCase()}`}
              aria-label={`Cari ${res.singular.toLowerCase()}`}
              className="ad-input ad-input-search"
            />
          </div>
          <span className="ml-auto hidden text-[13px] text-[var(--ad-mute)] tnum whitespace-nowrap sm:inline">{filtered.length} data</span>
          <label className="relative inline-flex items-center">
            <ArrowUpDown size={14} className="pointer-events-none absolute left-3 text-[var(--ad-mute)]" aria-hidden />
            <span className="sr-only">Urutkan</span>
            <select
              value={sortValue}
              onChange={(e) => { chooseSort(e.target.value); setPage(1); }}
              className="ad-input !h-[38px] !w-auto !pl-8 !pr-9 !text-[13.5px] !font-medium"
              aria-label="Urutkan"
            >
              <option value="default">{res.reorder ? "Urutan tampil" : "Urutan bawaan"}</option>
              <option value="new">Terbaru</option>
              <option value="old">Terlama</option>
              <option value="az">Nama A–Z</option>
              <option value="za">Nama Z–A</option>
            </select>
          </label>
          {pending && <Loader2 size={16} className="animate-spin text-[var(--ad-blue)]" aria-label="Memuat" />}
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
            <div className="hidden md:block overflow-x-auto">
              <table className="ad-table">
                <thead>
                  <tr>
                    {canReorder && <th className="w-14" aria-label="Urutan" />}
                    {res.columns.map((c) => {
                      const can = c.key === dateKey || c.key === nameKey;
                      if (!can) return <th key={c.key}>{c.label}</th>;
                      const on = sort?.key === c.key;
                      return (
                        <th key={c.key} aria-sort={on ? (sort!.dir === "asc" ? "ascending" : "descending") : undefined}>
                          <button type="button" onClick={() => toggleSort(c.key)} className={`inline-flex items-center gap-1 font-medium transition-colors hover:text-[var(--ad-ink)] ${on ? "text-[var(--ad-blue-ink)]" : ""}`}>
                            {c.label}
                            {on ? (sort!.dir === "asc" ? <ChevronUp size={13} /> : <ChevronDown size={13} />) : <ArrowUpDown size={12} className="opacity-40" />}
                          </button>
                        </th>
                      );
                    })}
                    <th className="text-right w-px"><span className="sr-only">Aksi</span></th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((r, idx) => {
                    const id = str(r.id);
                    const globalIdx = (cur - 1) * PAGE_SIZE + idx;
                    return (
                      <tr key={id}>
                        {canReorder && <td className="!pr-0">{reorder(id, globalIdx)}</td>}
                        {res.columns.map((c) => (
                          <td key={c.key}>{c.quickToggle ? toggleCell(c, r, id) : renderCell(c, r)}</td>
                        ))}
                        <td className="whitespace-nowrap">{actions(r, id)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ---------- Seluler: daftar kartu ---------- */}
            <ul className="md:hidden ad-divide">
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
                      <div className="flex items-center gap-1 -mr-1.5 shrink-0">
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
          text={`“${str(toDelete[res.labelField])}” akan dihapus permanen${res.imageFields.length ? ", termasuk file fotonya" : ""}. Tindakan ini tidak bisa dibatalkan.`}
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
    <span className="relative shrink-0 overflow-hidden rounded-[10px] bg-[var(--ad-fill)] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)]" style={{ width: size, height: size }}>
      {src ? <Photo src={src} alt="" sizes={`${size * 2}px`} /> : <span className="absolute inset-0 flex items-center justify-center text-[var(--ad-faint)]"><ImageIcon size={18} strokeWidth={1.6} /></span>}
    </span>
  );
}

function renderCell(c: Column, r: Row, compact = false) {
  const v = r[c.key];
  switch (c.type) {
    case "image":
      return <Thumb src={str(v)} />;
    case "badge":
      return str(v) ? <Badge tone={badgeTone[str(v)] ?? "gray"}>{badgeLabel[str(v)] ?? str(v)}</Badge> : <span className="text-[var(--ad-faint)]">—</span>;
    case "date":
      if (c.key.endsWith("_at") && v) return <RelTime iso={str(v)} className="text-[var(--ad-mute)] whitespace-nowrap tnum text-[13px]" />;
      return <span className="text-[var(--ad-mute)] whitespace-nowrap tnum text-[13px]">{fmtDate(v)}</span>;
    case "money":
      return Number(v) > 0 ? <span className="whitespace-nowrap tnum text-[13px] text-[var(--ad-ink-2)]">{rupiah(Number(v))}</span> : <span className="text-[var(--ad-faint)] text-[13px]">—</span>;
    case "bool":
      if (compact && !v && c.boolLabels) return <span className="text-[var(--ad-faint)] text-[13px] whitespace-nowrap">{c.label}: {c.boolLabels[1].toLowerCase()}</span>;
      return v ? (
        <Badge tone="blue">{c.boolLabels?.[0] ?? "Terbit"}</Badge>
      ) : c.boolLabels ? (
        <span className="text-[var(--ad-faint)] text-[13px]">{c.boolLabels[1]}</span>
      ) : (
        <Badge>Draft</Badge>
      );
    default:
      if (compact) {
        const t = [str(v), c.sub ? str(r[c.sub]) : ""].filter(Boolean).join(" · ");
        return t ? <span className="text-[13px] text-[var(--ad-mute)]">{t}</span> : null;
      }
      return (
        <div className="min-w-[8rem] max-w-[22rem]">
          <p className="font-medium text-[var(--ad-ink)] truncate">{str(v) || "—"}</p>
          {c.sub && str(r[c.sub]) && <p className="text-[13px] text-[var(--ad-mute)] truncate">{str(r[c.sub])}</p>}
        </div>
      );
  }
}

/* -------------------------------------------------------- dialog konfirmasi */

export function ConfirmDialog({ title, text, confirmLabel, busy, onConfirm, onCancel }: {
  title: string; text: string; confirmLabel: string; busy?: boolean; onConfirm: () => void; onCancel: () => void;
}) {
  useLockScroll();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !busy && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onCancel]);
  return (
    <div className="ad-backdrop !items-center !p-5" onClick={() => !busy && onCancel()}>
      <div role="alertdialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()} className="w-full max-w-[340px] rounded-[20px] bg-white p-6 text-center shadow-[0_30px_80px_rgba(0,0,0,0.3)]" style={{ animation: "ad-pop .24s var(--ad-ease) both" }}>
        <h2 className="text-[17px] font-semibold tracking-tight">{title}</h2>
        <p className="mt-2 text-[14px] leading-snug text-[var(--ad-mute)] break-words">{text}</p>
        <div className="mt-6 grid gap-2">
          <button onClick={onConfirm} disabled={busy} className="ad-btn ad-btn-danger-solid ad-btn-lg w-full">
            {busy && <Loader2 size={16} className="animate-spin" />} {confirmLabel}
          </button>
          <button onClick={onCancel} disabled={busy} className="ad-btn ad-btn-lg w-full" autoFocus>Batal</button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- form */

const inputCls = "ad-input";

function RecordForm({ resourceKey, record, onClose, onSaved }: { resourceKey: string; record: Row | null; onClose: () => void; onSaved: () => void }) {
  const res = RESOURCES[resourceKey];
  const toast = useToast();
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

  useLockScroll();
  const tryClose = () => (dirty && !saving ? setConfirmClose(true) : onClose());
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !confirmClose && !saving && tryClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

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
    onSaved();
  }

  const title = `${record ? "Edit" : "Tambah"} ${res.singular}`;
  return (
    <div className="ad-backdrop" onMouseDown={(e) => e.target === e.currentTarget && tryClose()}>
      <form onSubmit={submit} className="ad-sheet" role="dialog" aria-modal="true" aria-label={title}>
        <div className="ad-sheet-head">
          <h2 className="text-[19px] font-semibold tracking-tight">{title}</h2>
          <button type="button" onClick={tryClose} className="ad-icon-btn !bg-[var(--ad-fill)]" aria-label="Tutup"><X size={17} /></button>
        </div>

        <div className="ad-sheet-body">
          <div className="grid grid-cols-2 gap-x-4 gap-y-5">
            {res.fields.map((f) => (
              <div key={f.name} className={f.half ? "col-span-2 sm:col-span-1" : "col-span-2"}>
                {f.type !== "toggle" && (
                  <label className="ad-label" htmlFor={`f-${f.name}`}>
                    {f.label} {f.required && <span className="text-[var(--ad-red)]" aria-hidden>*</span>}
                  </label>
                )}
                {renderInput(f, values[f.name], (v) => (f.type === "slug" ? (setSlugTouched(true), set(f.name, v)) : onFieldChange(f, v)))}
                {f.help && <p className="ad-help">{f.help}</p>}
              </div>
            ))}
          </div>
          {error && <p role="alert" className="mt-5 rounded-[10px] bg-[var(--ad-red-soft)] px-3.5 py-2.5 text-[14px] text-[var(--ad-red)]">{error}</p>}
        </div>

        <div className="ad-sheet-foot">
          <button type="button" onClick={tryClose} className="ad-btn">Batal</button>
          <button type="submit" disabled={saving} className="ad-btn ad-btn-primary min-w-[96px]">
            {saving && <Loader2 size={15} className="animate-spin" />} Simpan
          </button>
        </div>
      </form>

      {confirmClose && (
        <ConfirmDialog
          title="Buang perubahan?"
          text="Perubahan yang belum disimpan akan hilang."
          confirmLabel="Buang perubahan"
          onConfirm={onClose}
          onCancel={() => setConfirmClose(false)}
        />
      )}
    </div>
  );
}

function renderInput(f: Field, value: unknown, onChange: (v: unknown) => void) {
  const id = `f-${f.name}`;
  switch (f.type) {
    case "textarea":
      return <textarea id={id} rows={3} value={str(value)} maxLength={f.max} onChange={(e) => onChange(e.target.value)} placeholder={f.placeholder} className={inputCls} />;
    case "markdown":
      return <MarkdownField value={str(value)} onChange={onChange} />;
    case "select":
      return (
        <select id={id} value={str(value)} onChange={(e) => onChange(e.target.value)} className={inputCls}>
          {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      );
    case "date":
      return <input id={id} type="date" value={str(value)} onChange={(e) => onChange(e.target.value)} className={inputCls} />;
    case "image":
      return <ImageField value={str(value)} onChange={onChange} folder={f.folder ?? "uploads"} maxSize={f.maxSize} square={f.folder === "members"} />;
    case "proof":
      return value ? (
        <a href={`/admin/bukti/${str(value)}`} target="_blank" rel="noreferrer" className="block w-fit overflow-hidden rounded-[12px] shadow-[0_0_0_1px_var(--ad-line)]">
          { }
          <img src={`/admin/bukti/${str(value)}`} alt={f.label} loading="lazy" className="max-h-72 w-auto max-w-full object-contain" />
        </a>
      ) : (
        <p className="text-[14px] text-[var(--ad-faint)]">{f.name === "payment_proof" ? "Tidak ada bukti pembayaran (tanpa HTM saat mendaftar)." : "Tidak ada bukti diunggah."}</p>
      );
    case "toggle":
      return (
        <button
          type="button"
          role="switch"
          aria-checked={!!value}
          onClick={() => onChange(!value)}
          className="flex w-full items-center justify-between gap-4 rounded-[10px] border border-[var(--ad-line-strong)] bg-white px-3.5 py-3 text-left"
        >
          <span>
            <span className="block text-[15px] font-medium">{f.label}</span>
            <span className="block text-[13px] text-[var(--ad-mute)]">{value ? (f.toggleLabels?.[0] ?? "Terbit") : (f.toggleLabels?.[1] ?? "Draft")}</span>
          </span>
          <span className="ad-switch" aria-hidden data-on={!!value} />
        </button>
      );
    default:
      return <input id={id} type="text" value={str(value)} maxLength={f.max} onChange={(e) => onChange(e.target.value)} placeholder={f.placeholder} required={f.required} className={inputCls} />;
  }
}
