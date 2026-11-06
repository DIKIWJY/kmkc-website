"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Pencil, Trash2, Loader2, ChevronUp, ChevronDown, Search, User, Star, Check, Users } from "lucide-react";
import {
  createPeriod, renamePeriod, setCurrentPeriod, deletePeriod, saveDivision, deleteDivision, moveDivision, saveMember, deleteMember, moveMember,
} from "@/lib/admin/org-actions";
import { ORG_PRESETS, positionSuggestions } from "@/lib/org";
import { cn } from "@/lib/utils";
import type { Division, Member, Period } from "@/lib/types";
import Photo from "@/components/ui/Photo";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import ImageField from "./ImageField";
import { PageHeader, Card, EmptyState } from "./ui";
import { ConfirmDialog } from "./ConfirmDialog";
import { useToast } from "./Toast";

type Dlg =
  | { t: "period-new" }
  | { t: "period-rename" }
  | { t: "period-delete" }
  | { t: "division"; div: Division | null }
  | { t: "division-delete"; div: Division }
  | { t: "member"; member: Member | null; division: string }
  | { t: "member-delete"; member: Member };

/** Lembar formulir di sisi kanan (sama dengan formulir data lain di admin). Dirender bersyarat oleh pemanggil. */
function FormSheet({ title, description, onClose, onSubmit, saving, error, submitLabel = "Simpan", children, small }: {
  title: string; description?: string; onClose: () => void; onSubmit: () => void; saving: boolean; error: string; submitLabel?: string; children: React.ReactNode; small?: boolean;
}) {
  return (
    <Sheet open onOpenChange={(o) => { if (!o && !saving) onClose(); }}>
      <SheetContent className={cn("w-full gap-0 p-0", small ? "sm:max-w-md" : "sm:max-w-lg")}>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="flex min-h-0 flex-1 flex-col">
          <SheetHeader className="border-b px-6 py-5 pr-14">
            <SheetTitle className="text-lg">{title}</SheetTitle>
            <SheetDescription className={description ? undefined : "sr-only"}>{description ?? title}</SheetDescription>
          </SheetHeader>
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-6">
            {children}
            {error && <Alert variant="destructive" role="alert"><AlertDescription>{error}</AlertDescription></Alert>}
          </div>
          <SheetFooter className="mt-0 flex-row items-center justify-end gap-2 border-t bg-card px-6 py-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>Batal</Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="animate-spin" />} {submitLabel}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function MemberPhoto({ src, size = 44 }: { src: string; size?: number }) {
  return (
    <span className="relative shrink-0 overflow-hidden rounded-full bg-muted ring-1 ring-inset ring-border" style={{ width: size, height: size }}>
      {src ? <Photo src={src} alt="" sizes={`${size * 2}px`} /> : <span className="absolute inset-0 flex items-center justify-center text-muted-foreground/60"><User style={{ width: size * 0.46, height: size * 0.46 }} strokeWidth={1.7} /></span>}
    </span>
  );
}

function Mover({ onUp, onDown, upOff, downOff, label }: { onUp: () => void; onDown: () => void; upOff: boolean; downOff: boolean; label: string }) {
  return (
    <div className="flex flex-col">
      <Button variant="ghost" size="icon" className="h-5 w-7 text-muted-foreground" disabled={upOff} onClick={onUp} aria-label={`Naikkan ${label}`.trim()}><ChevronUp /></Button>
      <Button variant="ghost" size="icon" className="h-5 w-7 text-muted-foreground" disabled={downOff} onClick={onDown} aria-label={`Turunkan ${label}`.trim()}><ChevronDown /></Button>
    </div>
  );
}

const iconBtn = "size-8 text-muted-foreground";
const dangerIconBtn = "size-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive";

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
        <div className="mt-5 flex justify-center"><Button size="lg" onClick={() => setDlg({ t: "period-new" })}><Plus /> Buat periode pertama</Button></div>
        {dlg?.t === "period-new" && <PeriodNewSheet periods={[]} onClose={() => setDlg(null)} onDone={(l) => { setChosen(l); setDlg(null); refresh(); }} />}
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Kepengurusan" subtitle="Setiap periode punya susunannya sendiri. Tambah bidang atau departemen sesuka hati, lalu isi pengurusnya dengan jabatan apa saja.">
        <Button onClick={() => setDlg({ t: "period-new" })}><Plus /> Periode baru</Button>
      </PageHeader>

      {/* Pemilih periode */}
      <Card className="mb-6 p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-3">
          <div className="flex items-center gap-2.5">
            <span className="text-[13px] font-medium text-muted-foreground" id="periode-label">Periode</span>
            <Select value={sel.label} onValueChange={(v) => { setChosen(v); setQuery(""); }}>
              <SelectTrigger className="w-auto min-w-40 font-semibold tabular-nums" aria-labelledby="periode-label">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sortedPeriods.map((p) => <SelectItem key={p.label} value={p.label}>{p.label}{p.is_current ? " · aktif" : ""}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {sel.is_current ? (
            <Badge variant="info">Tampil di website</Badge>
          ) : (
            <Button variant="outline" size="sm" disabled={busy === "cur"} onClick={() => run("cur", () => setCurrentPeriod(sel.label), `Periode ${sel.label} kini tampil sebagai kepengurusan saat ini.`)}>
              {busy === "cur" ? <Loader2 className="animate-spin" /> : <Star />} Jadikan periode aktif
            </Button>
          )}
          <span className="text-[13px] tabular-nums text-muted-foreground">{divs.length} bidang · {total} pengurus</span>
          <div className="ml-auto flex items-center gap-1">
            <Button variant="ghost" size="icon" className={iconBtn} aria-label={`Ubah nama periode ${sel.label}`} title="Ubah nama periode" onClick={() => setDlg({ t: "period-rename" })}><Pencil /></Button>
            <Button variant="ghost" size="icon" className={dangerIconBtn} aria-label={`Hapus periode ${sel.label}`} title="Hapus periode" disabled={periods.length <= 1} onClick={() => setDlg({ t: "period-delete" })}><Trash2 /></Button>
          </div>
        </div>
        <div className="relative mt-3 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari nama atau jabatan" aria-label="Cari pengurus" className="pl-9" />
        </div>
      </Card>

      {pending && <div className="mb-3 flex items-center gap-2 text-[13px] text-muted-foreground"><Loader2 className="size-3.5 animate-spin text-primary" /> Memperbarui…</div>}

      <div className="space-y-5">
        {divs.map((d, di) => {
          const all = byDiv.get(d.name) ?? [];
          const list = all.filter(match);
          if (q && list.length === 0) return null;
          return (
            <Card key={d.id} className="overflow-hidden">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b px-4 py-3.5 sm:px-5">
                {!q && <Mover label={`bidang ${d.name}`} upOff={di === 0 || !!busy} downOff={di === divs.length - 1 || !!busy} onUp={() => run(`dm${d.id}`, () => moveDivision(d.id, "up"))} onDown={() => run(`dm${d.id}`, () => moveDivision(d.id, "down"))} />}
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-base font-semibold tracking-tight">{d.name}</h2>
                  {d.description && <p className="truncate text-[13px] text-muted-foreground">{d.description}</p>}
                </div>
                <span className="text-[13px] tabular-nums text-muted-foreground">{all.length} orang</span>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" onClick={() => setDlg({ t: "member", member: null, division: d.name })}><Plus /> Tambah pengurus</Button>
                  <Button variant="ghost" size="icon" className={iconBtn} aria-label={`Ubah bidang ${d.name}`} onClick={() => setDlg({ t: "division", div: d })}><Pencil /></Button>
                  <Button variant="ghost" size="icon" className={dangerIconBtn} aria-label={`Hapus bidang ${d.name}`} onClick={() => setDlg({ t: "division-delete", div: d })}><Trash2 /></Button>
                </div>
              </div>

              {list.length === 0 ? (
                <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-5 text-sm text-muted-foreground">
                  <span>Belum ada pengurus di bidang ini.</span>
                  <Button variant="ghost" size="sm" onClick={() => setDlg({ t: "member", member: null, division: d.name })}>Tambah {positionSuggestions(d.name)[0]}</Button>
                </div>
              ) : (
                <ul className="divide-y">
                  {list.map((m, mi) => (
                    <li key={m.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                      {!q && <Mover label={m.name} upOff={mi === 0 || !!busy} downOff={mi === list.length - 1 || !!busy} onUp={() => run(`mm${m.id}`, () => moveMember(m.id, "up"))} onDown={() => run(`mm${m.id}`, () => moveMember(m.id, "down"))} />}
                      <MemberPhoto src={m.photo_url} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{m.name}</p>
                        <p className="truncate text-[13px] text-muted-foreground">{m.position}</p>
                      </div>
                      <div className="flex items-center gap-0.5">
                        <Button variant="ghost" size="icon" className={iconBtn} aria-label={`Edit ${m.name}`} onClick={() => setDlg({ t: "member", member: m, division: m.division })}><Pencil /></Button>
                        <Button variant="ghost" size="icon" className={dangerIconBtn} aria-label={`Hapus ${m.name}`} onClick={() => setDlg({ t: "member-delete", member: m })}><Trash2 /></Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          );
        })}

        {!q && (
          <button
            type="button"
            onClick={() => setDlg({ t: "division", div: null })}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed py-5 text-sm font-medium text-primary outline-none transition-colors hover:bg-primary/5 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <Plus className="size-4" /> Tambah bidang / departemen
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

function Req() {
  return <span className="text-destructive" aria-hidden>*</span>;
}

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
    <FormSheet title="Periode baru" description="Buat periode kepengurusan baru beserta susunan awalnya." onClose={onClose} onSubmit={submit} saving={saving} error={error} submitLabel="Buat periode" small>
      <div className="space-y-2">
        <Label htmlFor="pl">Nama periode <Req /></Label>
        <Input id="pl" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="2026/2027" maxLength={40} autoFocus />
      </div>
      <fieldset className="space-y-2">
        <legend className="mb-2 text-sm leading-none font-medium">Susunan awal</legend>
        <div className="divide-y overflow-hidden rounded-lg border">
          {opts.filter((o) => !o.off).map((o) => (
            <label key={o.key} className={cn("flex cursor-pointer items-start gap-3 px-4 py-3 transition-colors hover:bg-accent/40", mode === o.key && "bg-accent/60")}>
              <input type="radio" name="mode" className="mt-1 accent-primary" checked={mode === o.key} onChange={() => setMode(o.key)} />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">{o.title}</span>
                <span className="block text-[13px] text-muted-foreground">{o.text}</span>
              </span>
            </label>
          ))}
        </div>
        {mode === "salin" && periods.length > 0 && (
          <div className="flex items-center gap-3 pt-1">
            <span className="text-[13px] text-muted-foreground" id="salin-label">Salin dari</span>
            <Select value={from} onValueChange={setFrom}>
              <SelectTrigger className="w-auto min-w-36" aria-labelledby="salin-label"><SelectValue /></SelectTrigger>
              <SelectContent>{periods.map((p) => <SelectItem key={p.label} value={p.label}>{p.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        )}
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
      <div className="space-y-2">
        <Label htmlFor="pr">Nama periode</Label>
        <Input id="pr" value={value} onChange={(e) => setValue(e.target.value)} maxLength={40} autoFocus />
        <p className="text-xs text-muted-foreground">Bidang dan pengurus di periode ini ikut mengikuti nama barunya.</p>
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
      <div className="space-y-2">
        <Label htmlFor="dn">Nama bidang / departemen <Req /></Label>
        <Input id="dn" value={name} onChange={(e) => setName(e.target.value)} placeholder="Departemen Olahraga" maxLength={100} autoFocus />
      </div>
      <div className="space-y-2">
        <Label htmlFor="dd">Keterangan singkat</Label>
        <Input id="dd" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Opsional, tampil di bawah nama bidang" maxLength={300} />
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
    <FormSheet title={member ? "Edit pengurus" : "Tambah pengurus"} description="Foto, nama, bidang, dan jabatan pengurus." onClose={onClose} onSubmit={submit} saving={saving} error={error}>
      <div className="space-y-2">
        <span className="block text-sm leading-none font-medium">Foto</span>
        <ImageField value={photo} onChange={setPhoto} folder="members" maxSize={800} square />
        <p className="text-xs text-muted-foreground">Rasio persegi paling bagus.</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="mn">Nama lengkap <Req /></Label>
        <Input id="mn" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} autoFocus={!member} />
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="mdv">Bidang / departemen</Label>
          <Select value={div} onValueChange={setDiv}>
            <SelectTrigger id="mdv" className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>{divisions.filter((d) => d.name).map((d) => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="mp">Jabatan <Req /></Label>
          <Input id="mp" value={position} onChange={(e) => setPosition(e.target.value)} list="posisi-saran" maxLength={100} placeholder={positionSuggestions(div)[0]} />
          <datalist id="posisi-saran">{positionSuggestions(div).map((p) => <option key={p} value={p} />)}</datalist>
        </div>
      </div>
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Check className="size-3.5 text-primary" /> Jabatan bebas diketik; saran di atas hanya membantu mengisi lebih cepat.</p>
    </FormSheet>
  );
}
