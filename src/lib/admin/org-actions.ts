"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "./guard";
import { MEDIA_BUCKET } from "@/lib/supabase/env";
import { ORG_PRESETS, type OrgPresetKey } from "@/lib/org";

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };
type Db = Awaited<ReturnType<typeof requireAdmin>>["supabase"];
type Row = Record<string, unknown>;

/* ---------------------------------------------------------- pembantu */

const PUBLIC_PATHS = ["/", "/kepengurusan"];
const refreshPublic = () => PUBLIC_PATHS.forEach((p) => revalidatePath(p));

const isHttpsUrl = (v: string) => /^https:\/\/[^\s]+$/i.test(v) || /^http:\/\/localhost[^\s]*$/i.test(v) || /^http:\/\/127\.0\.0\.1[^\s]*$/i.test(v);

function storagePathFromUrl(url: unknown): string | null {
  if (typeof url !== "string") return null;
  const marker = `/storage/v1/object/public/${MEDIA_BUCKET}/`;
  const i = url.indexOf(marker);
  return i === -1 ? null : decodeURIComponent(url.slice(i + marker.length).split("?")[0]);
}

async function removeFiles(db: Db, urls: unknown[]) {
  const paths = urls.map(storagePathFromUrl).filter(Boolean) as string[];
  if (paths.length) await db.storage.from(MEDIA_BUCKET).remove(paths);
}

async function audit(db: Db, email: string, action: string, label: string) {
  await db.from("audit_log").insert({ user_email: email, action, entity: "Kepengurusan", label: label.slice(0, 160) });
}

function friendly(error: { code?: string; message?: string } | null | undefined): string {
  if (!error) return "Terjadi kesalahan.";
  if (error.code === "42P01" || /relation .* does not exist|Could not find the table/i.test(error.message ?? "")) return "Database belum diperbarui. Jalankan ulang seluruh supabase/schema.sql di SQL Editor Supabase (aman diulang), lalu coba lagi.";
  if (error.code === "23505") return "Nama tersebut sudah dipakai di sini. Gunakan nama lain.";
  if (error.code === "23503") return "Bidang atau periode tidak ditemukan. Muat ulang halaman lalu coba lagi.";
  if (error.code === "42501") return "Akses ditolak. Pastikan akunmu terdaftar di tabel admins.";
  if (error.code === "23514") return "Ada isian yang tidak memenuhi aturan database.";
  return error.message ?? "Terjadi kesalahan.";
}

const clean = (v: unknown, max: number) => (typeof v === "string" ? v.trim().replace(/\s+/g, " ").slice(0, max) : "");

/** Menyamakan nomor urut 1..n dalam satu daftar; hanya baris yang berubah yang ditulis. */
async function renumber(db: Db, table: "members" | "divisions", list: { id: string; order_index: number }[]) {
  await Promise.all(list.map((r, i) => (r.order_index === i + 1 ? null : db.from(table).update({ order_index: i + 1 }).eq("id", r.id))));
}

/* ------------------------------------------------------------ periode */

export async function createPeriod(input: { label: string; preset: OrgPresetKey | "salin"; copyFrom?: string }): Promise<Result<{ label: string }>> {
  const { supabase: db, email } = await requireAdmin();
  const label = clean(input.label, 40);
  if (!label) return { ok: false, error: "Nama periode wajib diisi, contoh: 2026/2027." };

  const { data: existing, error: e0 } = await db.from("periods").select("label, is_current");
  if (e0) return { ok: false, error: friendly(e0) };
  if ((existing ?? []).some((p) => String(p.label).toLowerCase() === label.toLowerCase())) return { ok: false, error: `Periode ${label} sudah ada.` };

  let divisions: { name: string; description: string }[] = [];
  if (input.preset === "salin") {
    const src = clean(input.copyFrom, 40);
    const { data } = await db.from("divisions").select("name, description, order_index").eq("period", src).order("order_index", { ascending: true });
    divisions = ((data ?? []) as Row[]).map((d) => ({ name: String(d.name), description: String(d.description ?? "") }));
  } else if (input.preset in ORG_PRESETS) {
    divisions = [...ORG_PRESETS[input.preset].divisions];
  }

  const first = (existing ?? []).length === 0;
  const { error } = await db.from("periods").insert({ label, is_current: first });
  if (error) return { ok: false, error: friendly(error) };
  if (divisions.length) {
    const { error: e2 } = await db.from("divisions").insert(divisions.map((d, i) => ({ period: label, name: d.name, description: d.description, order_index: i + 1 })));
    if (e2) return { ok: false, error: friendly(e2) };
  }
  await audit(db, email, "menambah", `periode ${label}`);
  refreshPublic();
  return { ok: true, label };
}

export async function renamePeriod(oldLabel: string, newLabelRaw: string): Promise<Result<{ label: string }>> {
  const { supabase: db, email } = await requireAdmin();
  const newLabel = clean(newLabelRaw, 40);
  if (!newLabel) return { ok: false, error: "Nama periode wajib diisi." };
  if (newLabel === oldLabel) return { ok: true, label: newLabel };
  const { error } = await db.from("periods").update({ label: newLabel }).eq("label", oldLabel);
  if (error) return { ok: false, error: friendly(error) };
  // Di database sungguhan perubahan merambat otomatis (ON UPDATE CASCADE); dua baris ini hanya memastikan bila belum.
  await db.from("divisions").update({ period: newLabel }).eq("period", oldLabel);
  await db.from("members").update({ period: newLabel }).eq("period", oldLabel);
  await audit(db, email, "mengubah", `periode ${oldLabel} → ${newLabel}`);
  refreshPublic();
  return { ok: true, label: newLabel };
}

export async function setCurrentPeriod(label: string): Promise<Result> {
  const { supabase: db, email } = await requireAdmin();
  const { data: found } = await db.from("periods").select("label").eq("label", label).maybeSingle();
  if (!found) return { ok: false, error: "Periode tidak ditemukan." };
  const a = await db.from("periods").update({ is_current: false }).eq("is_current", true);
  if (a.error) return { ok: false, error: friendly(a.error) };
  const b = await db.from("periods").update({ is_current: true }).eq("label", label);
  if (b.error) return { ok: false, error: friendly(b.error) };
  await audit(db, email, "mengubah", `periode aktif: ${label}`);
  refreshPublic();
  return { ok: true };
}

export async function deletePeriod(label: string): Promise<Result<{ next: string | null }>> {
  const { supabase: db, email } = await requireAdmin();
  const { data: periods } = await db.from("periods").select("label, is_current");
  const list = (periods ?? []) as { label: string; is_current: boolean }[];
  if (list.length <= 1) return { ok: false, error: "Periode terakhir tidak bisa dihapus. Buat periode baru dulu bila ingin menggantinya." };
  const target = list.find((p) => p.label === label);
  if (!target) return { ok: false, error: "Periode tidak ditemukan." };

  const { data: members } = await db.from("members").select("photo_url").eq("period", label);
  // Urutan eksplisit (pengurus → bidang → periode) supaya berfungsi walau cascade tidak aktif.
  await db.from("members").delete().eq("period", label);
  await db.from("divisions").delete().eq("period", label);
  const { error } = await db.from("periods").delete().eq("label", label);
  if (error) return { ok: false, error: friendly(error) };
  await removeFiles(db, ((members ?? []) as Row[]).map((m) => m.photo_url));

  let next: string | null = null;
  if (target.is_current) {
    next = list.filter((p) => p.label !== label).map((p) => p.label).sort((a, b) => b.localeCompare(a, "id", { numeric: true }))[0] ?? null;
    if (next) await db.from("periods").update({ is_current: true }).eq("label", next);
  }
  await audit(db, email, "menghapus", `periode ${label}`);
  refreshPublic();
  return { ok: true, next };
}

/* -------------------------------------------------------------- bidang */

export async function saveDivision(input: { id?: string | null; period: string; name: string; description?: string }): Promise<Result<{ id: string }>> {
  const { supabase: db, email } = await requireAdmin();
  const name = clean(input.name, 100);
  const description = clean(input.description, 300);
  if (!name) return { ok: false, error: "Nama bidang wajib diisi, contoh: Departemen Pendidikan." };

  if (input.id) {
    const { data: old } = await db.from("divisions").select("name, period").eq("id", input.id).maybeSingle();
    if (!old) return { ok: false, error: "Bidang tidak ditemukan." };
    const o = old as { name: string; period: string };
    const { error } = await db.from("divisions").update({ name, description }).eq("id", input.id);
    if (error) return { ok: false, error: friendly(error) };
    if (o.name !== name) await db.from("members").update({ division: name }).eq("period", o.period).eq("division", o.name); // cascade-nya database; ini pengaman
    await audit(db, email, "mengubah", `bidang ${o.name}${o.name !== name ? ` → ${name}` : ""} (${o.period})`);
    refreshPublic();
    return { ok: true, id: input.id };
  }

  const period = clean(input.period, 40);
  const { data: last } = await db.from("divisions").select("order_index").eq("period", period).order("order_index", { ascending: false }).limit(1).maybeSingle();
  const order = ((last as { order_index?: number } | null)?.order_index ?? 0) + 1;
  const { data, error } = await db.from("divisions").insert({ period, name, description, order_index: order }).select("id").single();
  if (error) return { ok: false, error: friendly(error) };
  await audit(db, email, "menambah", `bidang ${name} (${period})`);
  refreshPublic();
  return { ok: true, id: (data as { id: string }).id };
}

export async function deleteDivision(id: string): Promise<Result<{ removedMembers: number }>> {
  const { supabase: db, email } = await requireAdmin();
  const { data: div } = await db.from("divisions").select("name, period").eq("id", id).maybeSingle();
  if (!div) return { ok: false, error: "Bidang tidak ditemukan." };
  const d = div as { name: string; period: string };
  const { data: members } = await db.from("members").select("photo_url").eq("period", d.period).eq("division", d.name);
  await db.from("members").delete().eq("period", d.period).eq("division", d.name);
  const { error } = await db.from("divisions").delete().eq("id", id);
  if (error) return { ok: false, error: friendly(error) };
  await removeFiles(db, ((members ?? []) as Row[]).map((m) => m.photo_url));
  await audit(db, email, "menghapus", `bidang ${d.name} (${d.period})`);
  refreshPublic();
  return { ok: true, removedMembers: (members ?? []).length };
}

export async function moveDivision(id: string, dir: "up" | "down"): Promise<Result> {
  const { supabase: db } = await requireAdmin();
  const { data: div } = await db.from("divisions").select("period").eq("id", id).maybeSingle();
  if (!div) return { ok: false, error: "Bidang tidak ditemukan." };
  const { data, error } = await db.from("divisions").select("id, order_index").eq("period", (div as { period: string }).period).order("order_index", { ascending: true }).order("created_at", { ascending: true });
  if (error || !data) return { ok: false, error: friendly(error) };
  const list = data as { id: string; order_index: number }[];
  const i = list.findIndex((r) => r.id === id), j = dir === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= list.length) return { ok: true };
  [list[i], list[j]] = [list[j], list[i]];
  await renumber(db, "divisions", list);
  refreshPublic();
  return { ok: true };
}

/* ------------------------------------------------------------ pengurus */

export async function saveMember(input: { id?: string | null; period: string; division: string; name: string; position: string; photo_url?: string }): Promise<Result<{ id: string }>> {
  const { supabase: db, email } = await requireAdmin();
  const name = clean(input.name, 120);
  const position = clean(input.position, 100);
  const period = clean(input.period, 40);
  const division = clean(input.division, 100);
  const photo = typeof input.photo_url === "string" ? input.photo_url.trim() : "";
  if (!name) return { ok: false, error: "Nama lengkap wajib diisi." };
  if (!position) return { ok: false, error: "Jabatan wajib diisi, contoh: Ketua Umum." };
  if (photo && !isHttpsUrl(photo)) return { ok: false, error: "URL foto tidak valid." };

  const { data: div } = await db.from("divisions").select("id").eq("period", period).eq("name", division).maybeSingle();
  if (!div) return { ok: false, error: "Pilih bidang yang tersedia pada periode ini." };

  const nextOrder = async () => {
    const { data: last } = await db.from("members").select("order_index").eq("period", period).eq("division", division).order("order_index", { ascending: false }).limit(1).maybeSingle();
    return ((last as { order_index?: number } | null)?.order_index ?? 0) + 1;
  };

  if (input.id) {
    const { data: old } = await db.from("members").select("photo_url, period, division").eq("id", input.id).maybeSingle();
    if (!old) return { ok: false, error: "Pengurus tidak ditemukan." };
    const o = old as { photo_url: string; period: string; division: string };
    const moved = o.period !== period || o.division !== division;
    const values: Row = { name, position, period, division, photo_url: photo };
    if (moved) values.order_index = await nextOrder();
    const { error } = await db.from("members").update(values).eq("id", input.id);
    if (error) return { ok: false, error: friendly(error) };
    if (o.photo_url && o.photo_url !== photo) await removeFiles(db, [o.photo_url]);
    await audit(db, email, "mengubah", `${name} · ${position}`);
    refreshPublic();
    return { ok: true, id: input.id };
  }

  const { data, error } = await db.from("members").insert({ name, position, period, division, photo_url: photo, order_index: await nextOrder() }).select("id").single();
  if (error) return { ok: false, error: friendly(error) };
  await audit(db, email, "menambah", `${name} · ${position}`);
  refreshPublic();
  return { ok: true, id: (data as { id: string }).id };
}

export async function deleteMember(id: string): Promise<Result> {
  const { supabase: db, email } = await requireAdmin();
  const { data: row } = await db.from("members").select("name, position, photo_url").eq("id", id).maybeSingle();
  const { error } = await db.from("members").delete().eq("id", id);
  if (error) return { ok: false, error: friendly(error) };
  await removeFiles(db, [(row as Row | null)?.photo_url]);
  await audit(db, email, "menghapus", `${(row as Row | null)?.name ?? ""} · ${(row as Row | null)?.position ?? ""}`);
  refreshPublic();
  return { ok: true };
}

/** Geser urutan pengurus dalam bidangnya sendiri. */
export async function moveMember(id: string, dir: "up" | "down"): Promise<Result> {
  const { supabase: db } = await requireAdmin();
  const { data: me } = await db.from("members").select("period, division").eq("id", id).maybeSingle();
  if (!me) return { ok: false, error: "Pengurus tidak ditemukan." };
  const m = me as { period: string; division: string };
  const { data, error } = await db.from("members").select("id, order_index").eq("period", m.period).eq("division", m.division).order("order_index", { ascending: true }).order("created_at", { ascending: true });
  if (error || !data) return { ok: false, error: friendly(error) };
  const list = data as { id: string; order_index: number }[];
  const i = list.findIndex((r) => r.id === id), j = dir === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= list.length) return { ok: true };
  [list[i], list[j]] = [list[j], list[i]];
  await renumber(db, "members", list);
  refreshPublic();
  return { ok: true };
}
