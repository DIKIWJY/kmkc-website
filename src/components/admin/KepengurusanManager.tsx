"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Pencil, Trash2, X, Loader2, ChevronUp, ChevronDown, Search, User, Star, Check, Users } from "lucide-react";
import {
  createPeriod, renamePeriod, setCurrentPeriod, deletePeriod, saveDivision, deleteDivision, moveDivision, saveMember, deleteMember, moveMember,
} from "@/lib/admin/org-actions";
import { ORG_PRESETS, positionSuggestions } from "@/lib/org";
import type { Division, Member, Period } from "@/lib/types";
import Photo from "@/components/ui/Photo";
import ImageField from "./ImageField";
import { PageHeader, Card, Badge, EmptyState } from "./ui";
import { ConfirmDialog } from "./ResourceManager";
import { useToast } from "./Toast";

type Dlg =
  | { t: "period-new" }
  | { t: "period-rename" }
  | { t: "period-delete" }
  | { t: "division"; div: Division | null }
  | { t: "division-delete"; div: Division }
  | { t: "member"; member: Member | null; division: string }
  | { t: "member-delete"; member: Member };

function useLockScroll() {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);
}

/** Lembar formulir ala Apple (sama dengan formulir data lain di admin). */
function FormSheet({ title, onClose, onSubmit, saving, error, submitLabel = "Simpan", children, small }: {
  title: string; onClose: () => void; onSubmit: () => void; saving: boolean; error: string; submitLabel?: string; children: React.ReactNode; small?: boolean;
}) {
  useLockScroll();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !saving && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [saving, onClose]);
  return (
    <div className="ad-backdrop" onMouseDown={(e) => e.target === e.currentTarget && !saving && onClose()}>
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className={`ad-sheet ${small ? "!max-w-[460px]" : ""}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="ad-sheet-head">
          <h2 className="text-[19px] font-semibold tracking-tight">{title}</h2>
          <button type="button" onClick={onClose} className="ad-icon-btn !bg-[var(--ad-fill)]" aria-label="Tutup"><X size={17} /></button>
        </div>
        <div className="ad-sheet-body space-y-5">
          {children}
          {error && <p role="alert" className="rounded-[10px] bg-[var(--ad-red-soft)] px-3.5 py-2.5 text-[14px] text-[var(--ad-red)]">{error}</p>}
        </div>
        <div className="ad-sheet-foot">
          <button type="button" onClick={onClose} disabled={saving} className="ad-btn">Batal</button>
          <button type="submit" disabled={saving} className="ad-btn ad-btn-primary">
            {saving && <Loader2 size={16} className="animate-spin" />} {submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}

function Avatar({ src, size = 44 }: { src: string; size?: number }) {
  return (
    <span className="relative shrink-0 overflow-hidden rounded-full bg-[var(--ad-fill)] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)]" style={{ width: size, height: size }}>
      {src ? <Photo src={src} alt="" sizes={`${size * 2}px`} /> : <span className="absolute inset-0 flex items-center justify-center text-[var(--ad-faint)]"><User size={size * 0.46} strokeWidth={1.7} /></span>}
    </span>
  );
}

function Mover({ onUp, onDown, upOff, downOff, label }: { onUp: () => void; onDown: () => void; upOff: boolean; downOff: boolean; label: string }) {
  return (
    <div className="flex flex-col">
      <button disabled={upOff} onClick={onUp} className="ad-icon-btn !h-5 !w-7 !rounded-md" aria-label={`Naikkan ${label}`.trim()}><ChevronUp size={16} /></button>
      <button disabled={downOff} onClick={onDown} className="ad-icon-btn !h-5 !w-7 !rounded-md" aria-label={`Turunkan ${label}`.trim()}><ChevronDown size={16} /></button>
    </div>
  );
}

export default function KepengurusanManager({ periods, divisions, members }: { periods: Period[]; divisions: Division[]; members: Member[] }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const refresh = () => startTransition(() => router.refresh());

  const sortedPeriods = useMemo(() => [...periods].sort((a, b) => b.label.localeCompare(a.label, "id", { numeric: true })), [periods]);
  const [chosen, setChosen] = useState<string | null>(null);
  const sel = sortedPeriods.find((p) => p.label === chosen) ?? sortedPeriods.find((p) => p.is_current) ?? sortedPeriods[0] ?? null;

  const [query, setQuery] = useState(useSearchParams().get("q") ?? "");
  const [dlg, setDlg] = useState<Dlg | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const divs = useMemo(() => divisions.filter((d) => d.period === sel?.label).sort((a, b) => a.order_index - b.order_index), [divisions, sel]);
  const byDiv = useMemo(() => {
    const map = new Map<string, Member[]>();
    for (const m of members.filter((x) => x.period === sel?.label).sort((a, b) => a.order_index - b.order_index || a.created_at.localeCompare(b.created_at))) {
      (map.get(m.division) ?? map.set(m.division, []).get(m.division)!).push(m);
    }
    return map;
  }, [members, sel]);
  const total = divs.reduce((n, d) => n + (byDiv.get(d.name)?.length ?? 0), 0);
  const q = query.trim().toLowerCase();
  const match = (m: Member) => !q || m.name.toLowerCase().includes(q) || m.position.toLowerCase().includes(q);

  async function run(key: string, fn: () => Promise<{ ok: true } | { ok: false; error: string }>, okMsg?: string) {
    setBusy(key);
    const r = await fn();
    setBusy(null);
    if (!r.ok) { toast("error", r.error); return false; }
    if (okMsg) toast("success", okMsg);
    refresh();
    return true;
  }

  if (!sel) {
    return (
      <div>
        <PageHeader title="Kepengurusan" subtitle="Susun kepengurusan per periode: bidang/departemen bisa ditambah, dan tiap bidang berisi pengurus dengan jabatan bebas." />
        <Card><EmptyState icon={Users} title="Belum ada periode kepengurusan" text="Mulai dengan membuat periode, mis. 2025/2026. Susunan KMKC (Presidium + 6 departemen) bisa langsung dipakai." /></Card>
        <div className="mt-5 flex justify-center"><button className="ad-btn ad-btn-primary ad-btn-lg" onClick={() => setDlg({ t: "period-new" })}><Plus size={17} /> Buat periode pertama</button></div>
        {dlg?.t === "period-new" && <PeriodNewSheet periods={[]} onClose={() => setDlg(null)} onDone={(l) => { setChosen(l); setDlg(null); refresh(); }} />}
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Kepengurusan" subtitle="Setiap periode punya susunannya sendiri. Tambah bidang atau departemen sesuka hati, lalu isi pengurusnya dengan jabatan apa saja.">
        <button className="ad-btn ad-btn-primary" onClick={() => setDlg({ t: "period-new" })}><Plus size={16} strokeWidth={2.4} /> Periode baru</button>
      </PageHeader>

      {/* Pemilih periode */}
      <Card className="mb-6 p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-3">
          <label className="flex items-center gap-2.5">
            <span className="text-[13px] font-medium text-[var(--ad-mute)]">Periode</span>
            <select
              value={sel.label}
              onChange={(e) => { setChosen(e.target.value); setQuery(""); }}
              className="ad-input !h-[38px] !w-auto !pr-9 !text-[14px] !font-semibold tnum"
              aria-label="Pilih periode"
            >
              {sortedPeriods.map((p) => <option key={p.label} value={p.label}>{p.label}{p.is_current ? " · aktif" : ""}</option>)}
            </select>
          </label>
          {sel.is_current ? (
            <Badge tone="blue">Tampil di website</Badge>
          ) : (
            <button className="ad-btn ad-btn-sm" disabled={busy === "cur"} onClick={() => run("cur", () => setCurrentPeriod(sel.label), `Periode ${sel.label} kini tampil sebagai kepengurusan saat ini.`)}>
              {busy === "cur" ? <Loader2 size={14} className="animate-spin" /> : <Star size={14} />} Jadikan periode aktif
            </button>
          )}
          <span className="text-[13px] text-[var(--ad-mute)] tnum">{divs.length} bidang · {total} pengurus</span>
          <div className="ml-auto flex items-center gap-1">
            <button className="ad-icon-btn" aria-label={`Ubah nama periode ${sel.label}`} title="Ubah nama periode" onClick={() => setDlg({ t: "period-rename" })}><Pencil size={16} /></button>
            <button className="ad-icon-btn danger" aria-label={`Hapus periode ${sel.label}`} title="Hapus periode" disabled={periods.length <= 1} onClick={() => setDlg({ t: "period-delete" })}><Trash2 size={16} /></button>
          </div>
        </div>
        <div className="relative mt-3 max-w-sm">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--ad-faint)]" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari nama atau jabatan" aria-label="Cari pengurus" className="ad-input ad-input-search" />
        </div>
      </Card>

      {pending && <div className="mb-3 flex items-center gap-2 text-[13px] text-[var(--ad-mute)]"><Loader2 size={14} className="animate-spin text-[var(--ad-blue)]" /> Memperbarui…</div>}

      <div className="space-y-5">
        {divs.map((d, di) => {
          const all = byDiv.get(d.name) ?? [];
          const list = all.filter(match);
          if (q && list.length === 0) return null;
          return (
            <Card key={d.id} className="overflow-hidden">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-[var(--ad-line)] px-4 py-3.5 sm:px-5">
                {!q && <Mover label={`bidang ${d.name}`} upOff={di === 0 || !!busy} downOff={di === divs.length - 1 || !!busy} onUp={() => run(`dm${d.id}`, () => moveDivision(d.id, "up"))} onDown={() => run(`dm${d.id}`, () => moveDivision(d.id, "down"))} />}
                <div className="min-w-0 flex-1">
                  <h2 className="ad-h2 truncate">{d.name}</h2>
                  {d.description && <p className="truncate text-[13px] text-[var(--ad-mute)]">{d.description}</p>}
                </div>
                <span className="text-[13px] text-[var(--ad-mute)] tnum">{all.length} orang</span>
                <div className="flex items-center gap-1">
                  <button className="ad-btn ad-btn-sm" onClick={() => setDlg({ t: "member", member: null, division: d.name })}><Plus size={14} strokeWidth={2.4} /> Tambah pengurus</button>
                  <button className="ad-icon-btn" aria-label={`Ubah bidang ${d.name}`} onClick={() => setDlg({ t: "division", div: d })}><Pencil size={16} /></button>
                  <button className="ad-icon-btn danger" aria-label={`Hapus bidang ${d.name}`} onClick={() => setDlg({ t: "division-delete", div: d })}><Trash2 size={16} /></button>
                </div>
              </div>

              {list.length === 0 ? (
                <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-5 text-[14px] text-[var(--ad-mute)]">
                  <span>Belum ada pengurus di bidang ini.</span>
                  <button className="ad-btn ad-btn-plain ad-btn-sm" onClick={() => setDlg({ t: "member", member: null, division: d.name })}>Tambah {positionSuggestions(d.name)[0]}</button>
                </div>
              ) : (
                <ul className="ad-divide">
                  {list.map((m, mi) => (
                    <li key={m.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                      {!q && <Mover label={m.name} upOff={mi === 0 || !!busy} downOff={mi === list.length - 1 || !!busy} onUp={() => run(`mm${m.id}`, () => moveMember(m.id, "up"))} onDown={() => run(`mm${m.id}`, () => moveMember(m.id, "down"))} />}
                      <Avatar src={m.photo_url} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-[var(--ad-ink)]">{m.name}</p>
                        <p className="truncate text-[13px] text-[var(--ad-mute)]">{m.position}</p>
                      </div>
                      <div className="flex items-center gap-0.5">
                        <button className="ad-icon-btn" aria-label={`Edit ${m.name}`} onClick={() => setDlg({ t: "member", member: m, division: m.division })}><Pencil size={16} /></button>
                        <button className="ad-icon-btn danger" aria-label={`Hapus ${m.name}`} onClick={() => setDlg({ t: "member-delete", member: m })}><Trash2 size={16} /></button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          );
        })}

        {!q && (
          <button onClick={() => setDlg({ t: "division", div: null })} className="flex w-full items-center justify-center gap-2 rounded-[16px] border border-dashed border-[var(--ad-line-strong)] py-5 text-[14px] font-medium text-[var(--ad-blue)] transition-colors hover:bg-[var(--ad-blue-soft)]">
            <Plus size={16} strokeWidth={2.4} /> Tambah bidang / departemen
          </button>
        )}
        {q && divs.every((d) => (byDiv.get(d.name) ?? []).filter(match).length === 0) && <Card><EmptyState icon={Search} title="Tidak ada hasil" text="Coba kata kunci lain." /></Card>}
      </div>

      {dlg?.t === "period-new" && <PeriodNewSheet periods={sortedPeriods} current={sel.label} onClose={() => setDlg(null)} onDone={(l) => { setChosen(l); setDlg(null); refresh(); }} />}
      {dlg?.t === "period-rename" && <PeriodRenameSheet label={sel.label} onClose={() => setDlg(null)} onDone={(l) => { setChosen(l); setDlg(null); refresh(); }} />}
      {dlg?.t === "division" && <DivisionSheet period={sel.label} div={dlg.div} onClose={() => setDlg(null)} onDone={() => { setDlg(null); refresh(); }} />}
      {dlg?.t === "member" && <MemberSheet period={sel.label} divisions={divs} member={dlg.member} division={dlg.division} onClose={() => setDlg(null)} onDone={() => { setDlg(null); refresh(); }} />}

      {dlg?.t === "period-delete" && (
        <ConfirmDialog
          title={`Hapus periode ${sel.label}?`}
          text={`Seluruh ${divs.length} bidang dan ${total} pengurus di periode ini ikut terhapus permanen, termasuk foto. Tindakan ini tidak bisa dibatalkan.`}
          confirmLabel="Hapus periode" busy={busy === "pdel"}
          onCancel={() => setDlg(null)}
          onConfirm={async () => { const ok = await run("pdel", async () => { const r = await deletePeriod(sel.label); if (r.ok) setChosen(r.next); return r; }, "Periode dihapus."); if (ok) setDlg(null); }}
        />
      )}
      {dlg?.t === "division-delete" && (
        <ConfirmDialog
          title={`Hapus bidang “${dlg.div.name}”?`}
          text={`${(byDiv.get(dlg.div.name)?.length ?? 0) ? `${byDiv.get(dlg.div.name)!.length} pengurus di dalamnya ikut terhapus permanen. ` : ""}Tindakan ini tidak bisa dibatalkan.`}
          confirmLabel="Hapus bidang" busy={busy === "ddel"}
          onCancel={() => setDlg(null)}
          onConfirm={async () => { const ok = await run("ddel", () => deleteDivision((dlg as { div: Division }).div.id), "Bidang dihapus."); if (ok) setDlg(null); }}
        />
      )}
      {dlg?.t === "member-delete" && (
        <ConfirmDialog
          title="Hapus pengurus ini?"
          text={`“${dlg.member.name}” (${dlg.member.position}) akan dihapus permanen, termasuk fotonya.`}
          confirmLabel="Hapus" busy={busy === "mdel"}
          onCancel={() => setDlg(null)}
          onConfirm={async () => { const ok = await run("mdel", () => deleteMember((dlg as { member: Member }).member.id), "Pengurus dihapus."); if (ok) setDlg(null); }}
        />
      )}
    </div>
  );
}

/* ----------------------------------------------------------- lembar-lembar */

function PeriodNewSheet({ periods, current, onClose, onDone }: { periods: Period[]; current?: string; onClose: () => void; onDone: (label: string) => void }) {
  const toast = useToast();
  const [label, setLabel] = useState("");
  const [mode, setMode] = useState<"kmkc" | "salin" | "kosong">(periods.length ? "salin" : "kmkc");
  const [from, setFrom] = useState(current ?? periods[0]?.label ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setError(""); setSaving(true);
    const r = await createPeriod({ label, preset: mode, copyFrom: mode === "salin" ? from : undefined });
    setSaving(false);
    if (!r.ok) return setError(r.error);
    toast("success", `Periode ${r.label} dibuat.`);
    onDone(r.label);
  }

  const opts: { key: "kmkc" | "salin" | "kosong"; title: string; text: string; off?: boolean }[] = [
    { key: "kmkc", title: ORG_PRESETS.kmkc.label, text: "Presidium, Pendidikan, PKMB, Humas, Medinfo, Kewirausahaan, Kesehatan." },
    { key: "salin", title: "Salin bidang dari periode lain", text: "Nama bidangnya disalin, pengurusnya dikosongkan untuk diisi orang baru.", off: periods.length === 0 },
    { key: "kosong", title: "Mulai dari kosong", text: "Tambah bidang sendiri satu per satu." },
  ];

  return (
    <FormSheet title="Periode baru" onClose={onClose} onSubmit={submit} saving={saving} error={error} submitLabel="Buat periode" small>
      <div>
        <label className="ad-label" htmlFor="pl">Nama periode <span className="text-[var(--ad-red)]" aria-hidden>*</span></label>
        <input id="pl" className="ad-input" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="2026/2027" maxLength={40} autoFocus />
      </div>
      <fieldset>
        <legend className="ad-label">Susunan awal</legend>
        <div className="ad-card ad-divide overflow-hidden">
          {opts.filter((o) => !o.off).map((o) => (
            <label key={o.key} className="flex cursor-pointer items-start gap-3 px-4 py-3">
              <input type="radio" name="mode" className="mt-1 accent-[var(--ad-blue)]" checked={mode === o.key} onChange={() => setMode(o.key)} />
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{o.title}</span>
                <span className="block text-[13px] text-[var(--ad-mute)]">{o.text}</span>
                {o.key === "salin" && mode === "salin" && (
                  <select className="ad-input mt-2 !h-[38px]" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="Salin dari periode">
                    {periods.map((p) => <option key={p.label} value={p.label}>{p.label}</option>)}
                  </select>
                )}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
    </FormSheet>
  );
}

function PeriodRenameSheet({ label, onClose, onDone }: { label: string; onClose: () => void; onDone: (label: string) => void }) {
  const toast = useToast();
  const [value, setValue] = useState(label);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  async function submit() {
    setError(""); setSaving(true);
    const r = await renamePeriod(label, value);
    setSaving(false);
    if (!r.ok) return setError(r.error);
    toast("success", "Nama periode diubah.");
    onDone(r.label);
  }
  return (
    <FormSheet title="Ubah nama periode" onClose={onClose} onSubmit={submit} saving={saving} error={error} small>
      <div>
        <label className="ad-label" htmlFor="pr">Nama periode</label>
        <input id="pr" className="ad-input" value={value} onChange={(e) => setValue(e.target.value)} maxLength={40} autoFocus />
        <p className="ad-help">Bidang dan pengurus di periode ini ikut mengikuti nama barunya.</p>
      </div>
    </FormSheet>
  );
}

function DivisionSheet({ period, div, onClose, onDone }: { period: string; div: Division | null; onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const [name, setName] = useState(div?.name ?? "");
  const [description, setDescription] = useState(div?.description ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  async function submit() {
    setError(""); setSaving(true);
    const r = await saveDivision({ id: div?.id, period, name, description });
    setSaving(false);
    if (!r.ok) return setError(r.error);
    toast("success", div ? "Bidang diperbarui." : "Bidang ditambahkan.");
    onDone();
  }
  return (
    <FormSheet title={div ? "Ubah bidang" : "Tambah bidang"} onClose={onClose} onSubmit={submit} saving={saving} error={error} small>
      <div>
        <label className="ad-label" htmlFor="dn">Nama bidang / departemen <span className="text-[var(--ad-red)]" aria-hidden>*</span></label>
        <input id="dn" className="ad-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Departemen Olahraga" maxLength={100} autoFocus />
      </div>
      <div>
        <label className="ad-label" htmlFor="dd">Keterangan singkat</label>
        <input id="dd" className="ad-input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Opsional, tampil di bawah nama bidang" maxLength={300} />
      </div>
    </FormSheet>
  );
}

function MemberSheet({ period, divisions, member, division, onClose, onDone }: { period: string; divisions: Division[]; member: Member | null; division: string; onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const [name, setName] = useState(member?.name ?? "");
  const [position, setPosition] = useState(member?.position ?? "");
  const [div, setDiv] = useState(division);
  const [photo, setPhoto] = useState(member?.photo_url ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  async function submit() {
    setError(""); setSaving(true);
    const r = await saveMember({ id: member?.id, period, division: div, name, position, photo_url: photo });
    setSaving(false);
    if (!r.ok) return setError(r.error);
    toast("success", member ? "Perubahan disimpan." : "Pengurus ditambahkan.");
    onDone();
  }
  return (
    <FormSheet title={member ? "Edit pengurus" : "Tambah pengurus"} onClose={onClose} onSubmit={submit} saving={saving} error={error}>
      <div>
        <span className="ad-label">Foto</span>
        <ImageField value={photo} onChange={setPhoto} folder="members" maxSize={800} square />
        <p className="ad-help">Rasio persegi paling bagus.</p>
      </div>
      <div>
        <label className="ad-label" htmlFor="mn">Nama lengkap <span className="text-[var(--ad-red)]" aria-hidden>*</span></label>
        <input id="mn" className="ad-input" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} autoFocus={!member} />
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label className="ad-label" htmlFor="mdv">Bidang / departemen</label>
          <select id="mdv" className="ad-input" value={div} onChange={(e) => setDiv(e.target.value)}>
            {divisions.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}
          </select>
        </div>
        <div>
          <label className="ad-label" htmlFor="mp">Jabatan <span className="text-[var(--ad-red)]" aria-hidden>*</span></label>
          <input id="mp" className="ad-input" value={position} onChange={(e) => setPosition(e.target.value)} list="posisi-saran" maxLength={100} placeholder={positionSuggestions(div)[0]} />
          <datalist id="posisi-saran">{positionSuggestions(div).map((p) => <option key={p} value={p} />)}</datalist>
        </div>
      </div>
      <p className="ad-help !mt-0 flex items-center gap-1.5"><Check size={13} className="text-[var(--ad-blue)]" /> Jabatan bebas diketik; saran di atas hanya membantu mengisi lebih cepat.</p>
    </FormSheet>
  );
}
