"use client";

import { useState } from "react";
import { Loader2, Save, SlidersHorizontal } from "lucide-react";
import { saveRegistrationSettings } from "@/lib/admin/actions";
import { rupiah, parseRupiah } from "@/lib/money";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import ImageField from "./ImageField";
import { useToast } from "./Toast";
import type { SiteSettings } from "@/lib/types";

export type RegistrationValues = Pick<
  SiteSettings,
  "registration_open" | "registration_mode" | "gform_url" | "registration_note" | "registration_fee" | "payment_info" | "payment_qr"
>;

/** Tombol "Pengaturan pendaftaran" di halaman Pendaftar. Formulirnya muncul sebagai pop-up. */
export default function RegistrationSettings({ initial }: { initial: RegistrationValues }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [s, setS] = useState<RegistrationValues>(initial);
  const [saved, setSaved] = useState<RegistrationValues>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = <K extends keyof RegistrationValues>(k: K, v: RegistrationValues[K]) => setS((p) => ({ ...p, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const r = await saveRegistrationSettings({ ...s });
    setSaving(false);
    if (!r.ok) {
      setError(r.error);
      return toast("error", r.error);
    }
    setSaved(s);
    setOpen(false);
    toast("success", s.registration_open ? "Pengaturan disimpan. Pendaftaran dibuka." : "Pengaturan disimpan. Pendaftaran ditutup.");
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant={saved.registration_open ? "success" : "muted"}>{saved.registration_open ? "Pendaftaran dibuka" : "Pendaftaran ditutup"}</Badge>
      <Dialog
        open={open}
        onOpenChange={(o) => {
          if (saving) return;
          if (o) { setS(saved); setError(""); }
          setOpen(o);
        }}
      >
        <DialogTrigger asChild>
          <Button type="button" variant="outline"><SlidersHorizontal /> Pengaturan pendaftaran</Button>
        </DialogTrigger>
        <DialogContent className="flex max-h-[90dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl">
          <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
            <DialogHeader className="border-b px-6 py-5 pr-14 text-left">
              <DialogTitle className="text-lg">Pengaturan pendaftaran</DialogTitle>
              <DialogDescription>Atur apakah halaman /daftar menerima pendaftar, dan formulir mana yang dipakai.</DialogDescription>
            </DialogHeader>

            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-6">
              <div className="flex items-center justify-between gap-4 rounded-lg border px-4 py-3">
                <div>
                  <Label htmlFor="r-open" className="text-sm font-medium">Pendaftaran dibuka</Label>
                  <p className="mt-1 text-xs text-muted-foreground">Bila ditutup, halaman /daftar menampilkan pemberitahuan dan tidak ada formulir.</p>
                </div>
                <Switch id="r-open" checked={s.registration_open} onCheckedChange={(v) => set("registration_open", v)} />
              </div>

              <div className="space-y-2">
                <Label>Formulir yang dipakai</Label>
                <Tabs value={s.registration_mode} onValueChange={(v) => set("registration_mode", v as RegistrationValues["registration_mode"])}>
                  <TabsList aria-label="Mode formulir">
                    <TabsTrigger value="builtin" className="px-3">Formulir bawaan website</TabsTrigger>
                    <TabsTrigger value="gform" className="px-3">Google Form</TabsTrigger>
                  </TabsList>
                </Tabs>
                <p className="text-xs text-muted-foreground">
                  {s.registration_mode === "builtin"
                    ? "Data masuk ke menu Pendaftar (lengkap dengan bukti follow Instagram dan, bila ada HTM, bukti pembayaran)."
                    : "Pendaftar mengisi Google Form kamu; data tersimpan di Google Sheets, bukan di menu Pendaftar."}
                </p>
              </div>

              {s.registration_mode === "gform" && (
                <div className="space-y-2">
                  <Label htmlFor="r-gform">Tautan Google Form</Label>
                  <Input id="r-gform" value={s.gform_url} onChange={(e) => set("gform_url", e.target.value)} placeholder="https://docs.google.com/forms/d/e/…/viewform" inputMode="url" />
                  <p className="text-xs text-muted-foreground">Salin dari Google Form → Kirim → ikon tautan. Mendukung docs.google.com/forms/… dan forms.gle/…</p>
                </div>
              )}

              {s.registration_mode === "builtin" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="r-fee">HTM / biaya pendaftaran (Rp)</Label>
                    <Input
                      id="r-fee" inputMode="numeric" placeholder="Contoh: 25000" maxLength={11}
                      value={s.registration_fee ? String(s.registration_fee) : ""}
                      onChange={(e) => set("registration_fee", parseRupiah(e.target.value))}
                    />
                    <p className="text-xs text-muted-foreground">
                      {s.registration_fee > 0
                        ? `Tampil di /daftar sebagai ${rupiah(s.registration_fee)}. Pendaftar wajib mengunggah bukti pembayaran.`
                        : "Kosongkan atau isi 0 bila tidak ada biaya."}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="r-pay">Petunjuk pembayaran</Label>
                    <Textarea id="r-pay" rows={3} maxLength={600} value={s.payment_info} onChange={(e) => set("payment_info", e.target.value)} placeholder={"BRI 1234 5678 9012 a.n. Nama Bendahara\nDANA 0812 3456 7890 a.n. Nama Bendahara"} />
                    <p className="text-xs text-muted-foreground">Nomor rekening / e-wallet beserta nama pemilik, satu per baris. Tampil di formulir bila ada HTM.</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Gambar QRIS (opsional)</Label>
                    <ImageField value={s.payment_qr} onChange={(v) => set("payment_qr", v)} folder="site" maxSize={1000} />
                    <p className="text-xs text-muted-foreground">Unggah QRIS organisasi agar pendaftar bisa membayar dengan memindai. Tampil di formulir bila ada HTM.</p>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="r-note">Catatan pendaftaran</Label>
                <Textarea id="r-note" rows={2} maxLength={300} value={s.registration_note} onChange={(e) => set("registration_note", e.target.value)} placeholder="Contoh: Pendaftaran anggota baru dibuka 1–30 September." />
                <p className="text-xs text-muted-foreground">Tampil di halaman /daftar, misalnya jadwal buka atau syarat. Saat ditutup, catatan ini menjadi penjelasan utama.</p>
              </div>

              {error && <Alert variant="destructive" role="alert"><AlertDescription>{error}</AlertDescription></Alert>}
            </div>

            <DialogFooter className="mt-0 flex-row items-center justify-end gap-2 border-t bg-card px-6 py-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={saving}>Batal</Button>
              <Button type="submit" disabled={saving} className="min-w-24">
                {saving ? <Loader2 className="animate-spin" /> : <Save />} Simpan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}