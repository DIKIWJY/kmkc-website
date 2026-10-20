"use client";

import { useMemo, useState, useRef, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Plus, Search, Pencil, Trash2, X, Loader2, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, ImageIcon, Images, ExternalLink,
} from "lucide-react";
import { RESOURCES, type Field, type Column } from "@/lib/admin/schema";
import { saveRecord, deleteRecord, moveRecord, setFlag } from "@/lib/admin/actions";
import { uploadImage } from "@/lib/image";
import { slugify } from "@/lib/slug";
import ImageField from "./ImageField";
import MarkdownField from "./MarkdownField";
import { useToast } from "./Toast";

type Row = Record<string, unknown>;
const str = (v: unknown) => (v === null || v === undefined ? "" : String(v));
const PAGE_SIZE = 10;

const fmtDate = (v: unknown) =>
  v ? new Date(String(v) + (String(v).length === 10 ? "T00:00:00" : "")).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "—";

const badgeStyle: Record<string, string> = {
  upcoming: "bg-sky-50 text-sky-700", ongoing: "bg-blue-50 text-blue-700", completed: "bg-slate-100 text-slate-600",
  Acara: "bg-blue-50 text-blue-700", Kegiatan: "bg-cyan-50 text-cyan-700",
  baru: "bg-amber-50 text-amber-700", dihubungi: "bg-sky-50 text-sky-700", diterima: "bg-blue-50 text-blue-800", ditolak: "bg-slate-100 text-slate-500",
};
const badgeLabel: Record<string, string> = { upcoming: "Akan datang", ongoing: "Berjalan", completed: "Selesai", baru: "Baru", dihubungi: "Dihubungi", diterima: "Diterima", ditolak: "Ditolak" };

const inputCls =
  "w-full px-3.5 py-2.5 rounded-xl bg-white border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent transition";

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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => res.searchFields.some((f) => str(r[f]).toLowerCase().includes(q)));
  }, [rows, query, res.searchFields]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const cur = Math.min(page, pages);
  const visible = filtered.slice((cur - 1) * PAGE_SIZE, cur * PAGE_SIZE);
  const canReorder = res.reorder && !query.trim();

  function refresh() {
    startTransition(() => router.refresh());
  }

  // Saklar cepat di tabel (mis. sembunyikan foto / jadikan sorotan) — langsung tersimpan, tampilan diperbarui seketika.
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

  return (
    <div className="space-y-5">
      {/* header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary-dark">{res.title}</h1>
          <p className="text-neutral-500 text-sm mt-1 max-w-2xl">{res.description}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          {headerExtra}
          {res.bulkImage && (
            <>
              <input ref={bulkInput} type="file" accept="image/*" multiple className="hidden" onChange={(e) => bulkUpload(e.target.files)} />
              <button
                onClick={() => bulkInput.current?.click()}
                disabled={!!bulk}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white ring-1 ring-border text-sm font-semibold text-primary hover:ring-accent/50 disabled:opacity-60"
              >
                {bulk ? <Loader2 size={16} className="animate-spin" /> : <Images size={16} />}
                {bulk ? `Mengunggah ${bulk.done}/${bulk.total}` : "Unggah banyak foto"}
              </button>
            </>
          )}
          <button
            onClick={() => setEditing("new")}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-gradient text-white text-sm font-semibold shadow-md shadow-blue-500/25 hover:scale-[1.02] transition"
          >
            <Plus size={16} /> Tambah {res.singular}
          </button>
        </div>
      </div>

      {/* table card */}
      <div className="bg-white rounded-2xl ring-1 ring-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
              placeholder={`Cari ${res.singular.toLowerCase()}…`}
              className={`${inputCls} pl-10`}
            />
          </div>
          <span className="text-xs text-neutral-400 ml-auto">{filtered.length} data</span>
          {pending && <Loader2 size={16} className="animate-spin text-accent" />}
        </div>

        {visible.length === 0 ? (
          <div className="py-16 text-center text-neutral-400">
            <ImageIcon size={32} className="mx-auto mb-3 opacity-50" />
            <p className="text-sm">{query ? "Tidak ada hasil yang cocok." : `Belum ada ${res.singular.toLowerCase()}. Klik “Tambah ${res.singular}”.`}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-neutral-400 bg-surface/60">
                  {canReorder && <th className="px-4 py-3 w-20">Urut</th>}
                  {res.columns.map((c) => <th key={c.key} className="px-4 py-3 font-semibold">{c.label}</th>)}
                  <th className="px-4 py-3 w-28 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {visible.map((r, idx) => {
                  const id = str(r.id);
                  const globalIdx = (cur - 1) * PAGE_SIZE + idx;
                  return (
                    <tr key={id} className="hover:bg-surface/50 transition-colors">
                      {canReorder && (
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <button disabled={busyId === id || globalIdx === 0} onClick={() => onMove(id, "up")} className="w-7 h-7 rounded-lg ring-1 ring-border flex items-center justify-center text-neutral-500 hover:text-primary disabled:opacity-30" aria-label="Naikkan"><ArrowUp size={14} /></button>
                            <button disabled={busyId === id || globalIdx === filtered.length - 1} onClick={() => onMove(id, "down")} className="w-7 h-7 rounded-lg ring-1 ring-border flex items-center justify-center text-neutral-500 hover:text-primary disabled:opacity-30" aria-label="Turunkan"><ArrowDown size={14} /></button>
                          </div>
                        </td>
                      )}
                      {res.columns.map((c) => {
                        if (c.quickToggle) {
                          const on = flags[`${id}:${c.key}`] ?? !!r[c.key];
                          return (
                            <td key={c.key} className="px-4 py-3 align-middle">
                              <button
                                type="button"
                                role="switch"
                                aria-checked={on}
                                aria-label={`${c.label}: ${str(r[res.labelField])}`}
                                onClick={() => onFlag(id, c.key, !on)}
                                className="group inline-flex items-center gap-2 text-xs font-semibold"
                              >
                                <span className={`relative w-9 h-5 rounded-full transition-colors ${on ? "bg-accent" : "bg-neutral-300"}`}>
                                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${on ? "left-[1.1rem]" : "left-0.5"}`} />
                                </span>
                                <span className={on ? "text-primary" : "text-neutral-400"}>{on ? c.boolLabels?.[0] : c.boolLabels?.[1]}</span>
                              </button>
                            </td>
                          );
                        }
                        return <td key={c.key} className="px-4 py-3 align-middle">{renderCell(c, r)}</td>;
                      })}
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1.5">
                          {resourceKey === "articles" && !!r.published && (
                            <a href={`/berita/${str(r.slug)}`} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg ring-1 ring-border flex items-center justify-center text-neutral-500 hover:text-accent" aria-label="Lihat"><ExternalLink size={14} /></a>
                          )}
                          <button onClick={() => setEditing(r)} className="w-8 h-8 rounded-lg ring-1 ring-border flex items-center justify-center text-neutral-500 hover:text-primary hover:ring-accent/50" aria-label="Edit"><Pencil size={14} /></button>
                          <button onClick={() => setToDelete(r)} className="w-8 h-8 rounded-lg ring-1 ring-border flex items-center justify-center text-neutral-500 hover:text-red-600 hover:ring-red-200" aria-label="Hapus"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border text-sm text-neutral-500">
            <span>Halaman {cur} dari {pages}</span>
            <div className="flex gap-1.5">
              <button disabled={cur === 1} onClick={() => setPage(cur - 1)} className="w-8 h-8 rounded-lg ring-1 ring-border flex items-center justify-center disabled:opacity-30"><ChevronLeft size={16} /></button>
              <button disabled={cur === pages} onClick={() => setPage(cur + 1)} className="w-8 h-8 rounded-lg ring-1 ring-border flex items-center justify-center disabled:opacity-30"><ChevronRight size={16} /></button>
            </div>
          </div>
        )}
      </div>

      {editing && (
        <RecordForm
          resourceKey={resourceKey}
          record={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); refresh(); }}
        />
      )}

      {toDelete && (
        <div className="fixed inset-0 z-[70] bg-black/45 flex items-center justify-center p-4" onClick={() => setToDelete(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-4"><Trash2 size={22} /></div>
            <h3 className="text-lg font-bold text-neutral-900">Hapus {res.singular.toLowerCase()} ini?</h3>
            <p className="text-sm text-neutral-500 mt-1.5">“{str(toDelete[res.labelField])}” akan dihapus permanen{res.imageFields.length ? ", termasuk file fotonya" : ""}.</p>
            <div className="flex gap-2 mt-6 justify-end">
              <button onClick={() => setToDelete(null)} className="px-4 py-2.5 rounded-xl text-sm font-medium text-neutral-600 hover:bg-surface">Batal</button>
              <button onClick={confirmDelete} disabled={busyId === str(toDelete.id)} className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-red-500 text-white hover:bg-red-600 inline-flex items-center gap-2 disabled:opacity-60">
                {busyId === str(toDelete.id) && <Loader2 size={14} className="animate-spin" />} Ya, hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function renderCell(c: Column, r: Row) {
  const v = r[c.key];
  switch (c.type) {
    case "image":
      return v ? (
        <img src={str(v)} alt="" className="w-12 h-12 rounded-lg object-cover ring-1 ring-border" />
      ) : (
        <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary/50 flex items-center justify-center"><ImageIcon size={18} /></div>
      );
    case "badge":
      return str(v) ? (
        <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${badgeStyle[str(v)] ?? "bg-surface-alt text-neutral-600"}`}>
          {badgeLabel[str(v)] ?? str(v)}
        </span>
      ) : "—";
    case "date":
      return <span className="text-neutral-600 whitespace-nowrap">{fmtDate(v)}</span>;
    case "bool":
      return v ? (
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-sky-50 text-sky-700">{c.boolLabels?.[0] ?? "Terbit"}</span>
      ) : c.boolLabels ? (
        <span className="text-neutral-300">{c.boolLabels[1]}</span>
      ) : (
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700">Draft</span>
      );
    default:
      return (
        <div className="min-w-[8rem] max-w-xs">
          <p className="font-semibold text-neutral-900 truncate">{str(v) || "—"}</p>
          {c.sub && <p className="text-xs text-neutral-400 truncate">{str(r[c.sub])}</p>}
        </div>
      );
  }
}

/* ---------------------------------------------------------------- form */

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

  const set = (name: string, v: unknown) => setValues((s) => ({ ...s, [name]: v }));

  function onFieldChange(f: Field, v: unknown) {
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

  return (
    <div className="fixed inset-0 z-[70] bg-black/45 flex items-start sm:items-center justify-center p-0 sm:p-6 overflow-y-auto" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="bg-white w-full sm:max-w-2xl sm:rounded-2xl shadow-2xl min-h-screen sm:min-h-0 flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-white sm:rounded-t-2xl z-10">
          <h2 className="text-lg font-bold text-primary-dark">{record ? "Edit" : "Tambah"} {res.singular}</h2>
          <button type="button" onClick={onClose} className="w-9 h-9 rounded-full hover:bg-surface flex items-center justify-center text-neutral-500" aria-label="Tutup"><X size={20} /></button>
        </div>

        <div className="p-6 grid grid-cols-2 gap-x-4 gap-y-5">
          {res.fields.map((f) => (
            <div key={f.name} className={f.half ? "col-span-2 sm:col-span-1" : "col-span-2"}>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                {f.label} {f.required && <span className="text-red-500">*</span>}
              </label>
              {renderInput(f, values[f.name], (v) => (f.type === "slug" ? (setSlugTouched(true), set(f.name, v)) : onFieldChange(f, v)))}
              {f.help && <p className="text-xs text-neutral-400 mt-1.5">{f.help}</p>}
            </div>
          ))}
        </div>

        {error && <p className="mx-6 mb-2 text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2.5">{error}</p>}

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-border mt-auto sticky bottom-0 bg-white sm:rounded-b-2xl">
          <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-medium text-neutral-600 hover:bg-surface">Batal</button>
          <button type="submit" disabled={saving} className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-brand-gradient text-white shadow-md shadow-blue-500/25 inline-flex items-center gap-2 disabled:opacity-60">
            {saving && <Loader2 size={15} className="animate-spin" />} Simpan
          </button>
        </div>
      </form>
    </div>
  );
}

function renderInput(f: Field, value: unknown, onChange: (v: unknown) => void) {
  switch (f.type) {
    case "textarea":
      return <textarea rows={3} value={str(value)} maxLength={f.max} onChange={(e) => onChange(e.target.value)} placeholder={f.placeholder} className={`${inputCls} resize-y`} />;
    case "markdown":
      return <MarkdownField value={str(value)} onChange={onChange} />;
    case "select":
      return (
        <select value={str(value)} onChange={(e) => onChange(e.target.value)} className={inputCls}>
          {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      );
    case "date":
      return <input type="date" value={str(value)} onChange={(e) => onChange(e.target.value)} className={inputCls} />;
    case "image":
      return <ImageField value={str(value)} onChange={onChange} folder={f.folder ?? "uploads"} maxSize={f.maxSize} square={f.folder === "members"} />;
    case "toggle":
      return (
        <button type="button" role="switch" aria-checked={!!value} onClick={() => onChange(!value)} className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl ring-1 w-full transition ${value ? "ring-sky-300 bg-sky-50" : "ring-border bg-white"}`}>
          <span className={`relative w-10 h-6 rounded-full transition ${value ? "bg-sky-500" : "bg-neutral-300"}`}>
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${value ? "left-[1.1rem]" : "left-0.5"}`} />
          </span>
          <span className="text-sm font-medium text-neutral-700">{value ? (f.toggleLabels?.[0] ?? "Terbit") : (f.toggleLabels?.[1] ?? "Draft")}</span>
        </button>
      );
    default:
      return <input type="text" value={str(value)} maxLength={f.max} onChange={(e) => onChange(e.target.value)} placeholder={f.placeholder} required={f.required} className={inputCls} />;
  }
}
