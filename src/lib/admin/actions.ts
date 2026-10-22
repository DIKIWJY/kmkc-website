"use server";

import { cleanWaUrl } from "@/lib/whatsapp";
import { isGoogleFormUrl } from "@/lib/gform";
import { parseRupiah } from "@/lib/money";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "./guard";
import { RESOURCES, ADMIN_PATH, type Resource } from "./schema";
import { createServerSupabase } from "@/lib/supabase/server";
import { isSupabaseConfigured, MEDIA_BUCKET, PROOF_BUCKET } from "@/lib/supabase/env";
import { slugify } from "@/lib/slug";

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };
type Raw = Record<string, unknown>;

/* ------------------------------------------------------------ helpers */

function refresh(paths: string[]) {
  for (const p of paths) {
    if (p.includes("[")) revalidatePath(p, "page");
    else revalidatePath(p);
  }
}

function storagePathFromUrl(url: unknown): string | null {
  if (typeof url !== "string") return null;
  const marker = `/storage/v1/object/public/${MEDIA_BUCKET}/`;
  const i = url.indexOf(marker);
  return i === -1 ? null : decodeURIComponent(url.slice(i + marker.length).split("?")[0]);
}

const isHttpsUrl = (v: string) => /^https:\/\/[^\s]+$/i.test(v) || /^http:\/\/localhost[^\s]*$/i.test(v) || /^http:\/\/127\.0\.0\.1[^\s]*$/i.test(v);

function sanitize(res: Resource, raw: Raw): { values: Record<string, unknown> } | { error: string } {
  const values: Record<string, unknown> = {};
  for (const f of res.fields) {
    const v = raw[f.name];
    const err = (msg: string) => ({ error: `${f.label}: ${msg}` });
    switch (f.type) {
      case "proof":
        break; // hanya-baca: diunggah pendaftar, tidak diubah lewat form admin
      case "toggle":
        values[f.name] = v === true || v === "true";
        break;
      case "number": {
        const n = Number(v);
        values[f.name] = Number.isFinite(n) ? Math.trunc(n) : 0;
        break;
      }
      case "date": {
        const s = typeof v === "string" ? v.trim() : "";
        if (s && !/^\d{4}-\d{2}-\d{2}$/.test(s)) return err("format tanggal tidak valid");
        values[f.name] = s || null;
        break;
      }
      case "select": {
        const s = typeof v === "string" ? v : "";
        if (!f.options?.some((o) => o.value === s)) {
          if (f.required) return err("pilihan tidak valid");
          values[f.name] = f.options?.[0]?.value ?? "";
        } else values[f.name] = s;
        break;
      }
      case "image": {
        const s = typeof v === "string" ? v.trim() : "";
        if (s && !isHttpsUrl(s)) return err("URL gambar tidak valid");
        if (f.required && !s) return err("wajib diisi");
        values[f.name] = s;
        break;
      }
      case "url": {
        const s = typeof v === "string" ? v.trim() : "";
        if (s && (!isHttpsUrl(s) || s.length > (f.max ?? 300))) return err("harus diawali https://");
        values[f.name] = s;
        break;
      }
      case "slug": {
        const s = slugify(typeof v === "string" ? v : "");
        if (!s) return err("wajib diisi");
        values[f.name] = s;
        break;
      }
      default: {
        const s = typeof v === "string" ? v.trim() : "";
        const max = f.max ?? 500;
        if (f.required && !s) return err("wajib diisi");
        if (s.length > max) return err(`maksimal ${max} karakter`);
        values[f.name] = s;
      }
    }
  }
  return { values };
}

async function audit(supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"], email: string, action: string, entity: string, label: string) {
  await supabase.from("audit_log").insert({ user_email: email, action, entity, label: label.slice(0, 160) });
}

/* --------------------------------------------------------------- auth */

export async function signIn(_prev: { error?: string } | undefined, formData: FormData): Promise<{ error?: string }> {
  if (!isSupabaseConfigured) return { error: "Supabase belum dikonfigurasi." };
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Email dan password wajib diisi." };

  const supabase = await createServerSupabase();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return { error: "Email atau password salah." };

  const { data: admin } = await supabase.from("admins").select("user_id").eq("user_id", data.user.id).maybeSingle();
  if (!admin) {
    await supabase.auth.signOut();
    return { error: "Akun ini belum terdaftar sebagai admin." };
  }
  redirect("/admin");
}

export async function signOut() {
  if (isSupabaseConfigured) {
    const supabase = await createServerSupabase();
    await supabase.auth.signOut();
  }
  redirect("/admin/login");
}

/* ----------------------------------------------------------- CRUD umum */

export async function saveRecord(key: string, id: string | null, raw: Raw): Promise<Result<{ id: string }>> {
  const { supabase, email } = await requireAdmin();
  const res = RESOURCES[key];
  if (!res) return { ok: false, error: "Resource tidak dikenal." };

  const parsed = sanitize(res, raw);
  if ("error" in parsed) return { ok: false, error: parsed.error };
  const values = parsed.values;

  if (key === "articles" && values.published && !values.published_at) {
    values.published_at = new Date().toISOString().slice(0, 10);
  }

  let savedId = id ?? "";
  if (id) {
    const { data: old } = await supabase.from(res.table).select(res.imageFields.join(",") || "id").eq("id", id).maybeSingle();
    const { error } = await supabase.from(res.table).update(values).eq("id", id);
    if (error) return { ok: false, error: friendly(error) };
    // hapus file lama yang sudah diganti
    const stale = res.imageFields
      .map((f) => ((old as Raw | null)?.[f] !== values[f] ? storagePathFromUrl((old as Raw | null)?.[f]) : null))
      .filter(Boolean) as string[];
    if (stale.length) await supabase.storage.from(MEDIA_BUCKET).remove(stale);
  } else {
    if (res.reorder) {
      const { data: last } = await supabase.from(res.table).select("order_index").order("order_index", { ascending: false }).limit(1).maybeSingle();
      values.order_index = ((last as { order_index?: number } | null)?.order_index ?? 0) + 1;
    }
    const { data, error } = await supabase.from(res.table).insert(values).select("id").single();
    if (error) return { ok: false, error: friendly(error) };
    savedId = (data as { id: string }).id;
  }

  await audit(supabase, email, id ? "mengubah" : "menambah", res.singular, String(values[res.labelField] ?? ""));
  refresh(res.revalidate);
  return { ok: true, id: savedId };
}

/** Ubah satu saklar (mis. "Tampil di website", "Sorotan") langsung dari tabel. Hanya kolom bertipe toggle di RESOURCES yang boleh. */
export async function setFlag(key: string, id: string, field: string, value: boolean): Promise<Result> {
  const { supabase, email } = await requireAdmin();
  const res = RESOURCES[key];
  const f = res?.fields.find((x) => x.name === field && x.type === "toggle");
  if (!res || !f) return { ok: false, error: "Kolom tidak dapat diubah." };
  const { data, error } = await supabase.from(res.table).update({ [field]: !!value }).eq("id", id).select(res.labelField).maybeSingle();
  if (error) return { ok: false, error: friendly(error) };
  await audit(supabase, email, "mengubah", res.singular, `${String((data as Raw | null)?.[res.labelField] ?? "")} · ${f.label}: ${value ? "ya" : "tidak"}`);
  refresh(res.revalidate);
  return { ok: true };
}

export async function deleteRecord(key: string, id: string): Promise<Result> {
  const { supabase, email } = await requireAdmin();

  if (key === "messages") {
    const { data: row } = await supabase.from("contact_messages").select("name").eq("id", id).maybeSingle();
    const { error } = await supabase.from("contact_messages").delete().eq("id", id);
    if (error) return { ok: false, error: friendly(error) };
    await audit(supabase, email, "menghapus", "Pesan", `dari ${(row as { name?: string } | null)?.name ?? ""}`);
    revalidatePath("/admin/pesan");
    return { ok: true };
  }

  const res = RESOURCES[key];
  if (!res) return { ok: false, error: "Resource tidak dikenal." };

  const { data: row } = await supabase.from(res.table).select("*").eq("id", id).maybeSingle();
  const { error } = await supabase.from(res.table).delete().eq("id", id);
  if (error) return { ok: false, error: friendly(error) };

  const files = res.imageFields.map((f) => storagePathFromUrl((row as Raw | null)?.[f])).filter(Boolean) as string[];
  if (files.length) await supabase.storage.from(MEDIA_BUCKET).remove(files);
  // Bukti follow milik pendaftar ikut dihapus agar ruang penyimpanan tidak terbuang.
  if (res.key === "registrations") {
    const proofs = [String((row as Raw | null)?.follow_proof ?? ""), String((row as Raw | null)?.payment_proof ?? "")].filter(Boolean);
    if (proofs.length) await supabase.storage.from(PROOF_BUCKET).remove(proofs);
  }

  await audit(supabase, email, "menghapus", res.singular, String((row as Raw | null)?.[res.labelField] ?? ""));
  refresh(res.revalidate);
  return { ok: true };
}

/** Geser urutan (khusus resource `reorder`, mis. pengurus). */
export async function moveRecord(key: string, id: string, dir: "up" | "down"): Promise<Result> {
  const { supabase } = await requireAdmin();
  const res = RESOURCES[key];
  if (!res?.reorder) return { ok: false, error: "Resource tidak bisa diurutkan." };

  const { data, error } = await supabase.from(res.table).select("id, order_index").order("order_index", { ascending: true }).order("created_at", { ascending: true });
  if (error || !data) return { ok: false, error: friendly(error) };
  const list = data as { id: string; order_index: number }[];
  const i = list.findIndex((r) => r.id === id);
  const j = dir === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= list.length) return { ok: true };
  [list[i], list[j]] = [list[j], list[i]];

  await Promise.all(
    list.map((r, idx) => (r.order_index === idx + 1 ? null : supabase.from(res.table).update({ order_index: idx + 1 }).eq("id", r.id)))
  );
  refresh(res.revalidate);
  return { ok: true };
}

/* -------------------------------------------------------------- pesan */

export async function setMessagesRead(ids: string[], read: boolean): Promise<Result> {
  const { supabase } = await requireAdmin();
  if (!ids.length) return { ok: true };
  const { error } = await supabase.from("contact_messages").update({ is_read: read }).in("id", ids.slice(0, 500));
  if (error) return { ok: false, error: friendly(error) };
  revalidatePath("/admin", "layout");
  return { ok: true };
}

/* ---------------------------------------------------------- pengaturan */

export async function saveSettings(raw: Raw): Promise<Result> {
  const { supabase, email } = await requireAdmin();

  const str = (k: string, max: number) => String(raw[k] ?? "").trim().slice(0, max);
  const url = (k: string): string | { error: string } => {
    const v = str(k, 300);
    if (v && !/^https?:\/\/[^\s]+$/i.test(v)) return { error: `${k}: harus diawali https://` };
    return v;
  };

  const social: Record<string, string> = {};
  for (const k of ["instagram", "tiktok", "youtube"]) {
    const v = url(k);
    if (typeof v !== "string") return { ok: false, error: `Tautan ${k} harus diawali https://` };
    social[k] = v;
  }

  // WhatsApp: nomor (0812… → 62812…) atau tautan resmi wa.me / api.whatsapp.com
  const waRaw = str("whatsapp", 200);
  let wa: string;
  if (/^https?:\/\//i.test(waRaw)) {
    wa = cleanWaUrl(waRaw);
    if (!wa) return { ok: false, error: "Tautan WhatsApp harus berupa https://wa.me/… atau https://api.whatsapp.com/…" };
  } else {
    wa = waRaw.replace(/[^\d]/g, "");
    if (wa.startsWith("0")) wa = "62" + wa.slice(1);
  }

  const em = str("email", 200);
  if (em && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) return { ok: false, error: "Format email tidak valid." };

  const photo = str("about_photo", 600);
  if (photo && !isHttpsUrl(photo)) return { ok: false, error: "URL foto tidak valid." };

  const mission = (Array.isArray(raw.mission) ? raw.mission : [])
    .map((m) => String(m ?? "").trim().slice(0, 300))
    .filter(Boolean)
    .slice(0, 12);
  const stats = (Array.isArray(raw.stats) ? raw.stats : [])
    .map((s) => ({ value: String((s as Raw)?.value ?? "").trim().slice(0, 12), label: String((s as Raw)?.label ?? "").trim().slice(0, 24) }))
    .filter((s) => s.value && s.label)
    .slice(0, 4);

  const founders = (Array.isArray(raw.founders) ? raw.founders : [])
    .map((f) => ({
      name: String((f as Raw)?.name ?? "").trim().slice(0, 80),
      campus: String((f as Raw)?.campus ?? "").trim().slice(0, 80),
      role: String((f as Raw)?.role ?? "").trim().slice(0, 60),
    }))
    .filter((f) => f.name)
    .slice(0, 20);

  const timeline = (Array.isArray(raw.timeline) ? raw.timeline : [])
    .map((t) => ({
      date: String((t as Raw)?.date ?? "").trim().slice(0, 40),
      title: String((t as Raw)?.title ?? "").trim().slice(0, 120),
      desc: String((t as Raw)?.desc ?? "").trim().slice(0, 600),
    }))
    .filter((t) => t.title)
    .slice(0, 30);

  const name = str("name", 40);
  if (!name) return { ok: false, error: "Nama singkat organisasi wajib diisi." };

  const mode = raw.registration_mode === "gform" ? "gform" : "builtin";
  const gform = str("gform_url", 500);
  if (gform && !isGoogleFormUrl(gform)) return { ok: false, error: "Tautan Google Form harus berupa tautan docs.google.com/forms/… atau forms.gle/…" };
  if (mode === "gform" && !gform) return { ok: false, error: "Mode Google Form dipilih, tetapi tautan Google Form belum diisi." };

  // HTM: nominal rupiah (0 = tanpa HTM). Bila ada HTM, pendaftar perlu tahu ke mana membayar.
  const fee = parseRupiah(raw.registration_fee);
  const payInfo = String(raw.payment_info ?? "").replace(/[ \t]+/g, " ").trim().slice(0, 600);
  const payQr = str("payment_qr", 600);
  if (payQr && !isHttpsUrl(payQr)) return { ok: false, error: "URL gambar QRIS tidak valid." };
  if (fee > 0 && mode === "builtin" && !payInfo && !payQr) return { ok: false, error: "HTM sudah diisi, tetapi petunjuk pembayaran (rekening / QRIS) belum. Isi salah satunya agar pendaftar tahu ke mana membayar." };

  const { data: old } = await supabase.from("site_settings").select("about_photo,payment_qr").eq("id", 1).maybeSingle();

  const { error } = await supabase.from("site_settings").upsert({
    id: 1,
    name,
    full_name: str("full_name", 150),
    tagline: str("tagline", 300),
    about: str("about", 3000),
    vision: str("vision", 800),
    mission,
    stats,
    email: em,
    phone: str("phone", 30),
    address: str("address", 300),
    ...social,
    whatsapp: wa,
    about_photo: photo,
    history: str("history", 5000),
    founders,
    timeline,
    registration_open: raw.registration_open !== false && raw.registration_open !== "false",
    registration_mode: mode,
    gform_url: gform,
    registration_note: str("registration_note", 300),
    registration_fee: fee,
    payment_info: payInfo,
    payment_qr: payQr,
    updated_at: new Date().toISOString(),
  });
  if (error) return { ok: false, error: friendly(error) };

  const oldPath = storagePathFromUrl((old as Raw | null)?.about_photo);
  if (oldPath && (old as Raw).about_photo !== photo) await supabase.storage.from(MEDIA_BUCKET).remove([oldPath]);
  const oldQr = storagePathFromUrl((old as Raw | null)?.payment_qr);
  if (oldQr && (old as Raw).payment_qr !== payQr) await supabase.storage.from(MEDIA_BUCKET).remove([oldQr]);

  await audit(supabase, email, "mengubah", "Pengaturan", "informasi organisasi");
  revalidatePath("/", "layout");
  return { ok: true };
}

/* ----------------------------------------------------- arsip */

/** Hapus berkas bukti follow milik pendaftar yang masuk lebih dari N hari lalu (setelah diarsipkan ke PDF). */
export async function purgeOldProofs(days: number): Promise<{ ok: true; removed: number } | { ok: false; error: string }> {
  const { supabase, email } = await requireAdmin();
  if (![30, 90, 180, 365].includes(days)) return { ok: false, error: "Rentang tidak valid." };
  const cutoff = new Date(Date.now() - days * 86400000).toISOString();
  const { data, error } = await supabase.from("registrations").select("id,follow_proof").lt("created_at", cutoff).neq("follow_proof", "").limit(2000);
  if (error) return { ok: false, error: friendly(error) };
  const rows = (data ?? []) as { id: string; follow_proof: string }[];
  if (!rows.length) return { ok: true, removed: 0 };

  let removed = 0;
  for (let i = 0; i < rows.length; i += 100) {
    const batch = rows.slice(i, i + 100);
    const { error: rmErr } = await supabase.storage.from(PROOF_BUCKET).remove(batch.map((r) => r.follow_proof));
    if (rmErr) return { ok: false, error: "Gagal menghapus sebagian berkas. Coba lagi." };
    const { error: upErr } = await supabase.from("registrations").update({ follow_proof: "" }).in("id", batch.map((r) => r.id));
    if (upErr) return { ok: false, error: friendly(upErr) };
    removed += batch.length;
  }
  await audit(supabase, email, "menghapus", "Bukti follow", `${removed} berkas lebih dari ${days} hari`);
  revalidatePath("/admin/arsip");
  revalidatePath("/admin/pendaftar");
  return { ok: true, removed };
}

/* ----------------------------------------------------- pencarian global */

export interface SearchHit { type: string; label: string; sub: string; href: string }

/** Cari lintas konten untuk command palette (Ctrl+K). Data organisasi kecil → disaring di server, aman & sederhana. */
export async function searchAdmin(query: string): Promise<SearchHit[]> {
  const { supabase } = await requireAdmin();
  const q = String(query ?? "").trim().toLowerCase().slice(0, 60);
  if (q.length < 2) return [];

  const hits: SearchHit[] = [];
  await Promise.all(
    Object.values(RESOURCES).map(async (res) => {
      const cols = Array.from(new Set(["id", res.labelField, ...res.searchFields])).join(",");
      const { data } = await supabase.from(res.table).select(cols).limit(500);
      const rows = (data ?? []) as unknown as Raw[];
      rows
        .filter((r) => res.searchFields.some((f) => String(r[f] ?? "").toLowerCase().includes(q)))
        .slice(0, 3)
        .forEach((r) => {
          const label = String(r[res.labelField] ?? "");
          hits.push({ type: res.singular, label, sub: res.title, href: `${ADMIN_PATH[res.key]}?q=${encodeURIComponent(label)}` });
        });
    })
  );

  const { data: msgs } = await supabase.from("contact_messages").select("id,name,subject,message").order("created_at", { ascending: false }).limit(200);
  ((msgs ?? []) as unknown as Raw[])
    .filter((m) => `${m.name} ${m.subject} ${m.message}`.toLowerCase().includes(q))
    .slice(0, 3)
    .forEach((m) => hits.push({ type: "Pesan", label: String(m.subject || m.message).slice(0, 80), sub: `dari ${m.name}`, href: "/admin/pesan" }));

  return hits.slice(0, 12);
}

/* ------------------------------------------------------------- errors */

function friendly(error: { code?: string; message?: string } | null | undefined): string {
  if (!error) return "Terjadi kesalahan.";
  if (error.code === "PGRST204" || error.code === "42703" || /column .* does not exist|Could not find the .* column/i.test(error.message ?? "")) return "Database belum diperbarui. Jalankan ulang seluruh supabase/schema.sql di SQL Editor Supabase (aman diulang), lalu coba lagi.";
  if (error.code === "23505") return "Data dengan nilai tersebut sudah ada (mis. slug kembar).";
  if (error.code === "42501") return "Akses ditolak. Pastikan akunmu terdaftar di tabel admins.";
  if (error.code === "23514") return "Ada isian yang tidak memenuhi aturan database.";
  return error.message ?? "Terjadi kesalahan.";
}
