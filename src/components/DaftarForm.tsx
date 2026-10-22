"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { CheckCircle2, ImagePlus, Loader2, Send, ArrowUpRight, X, Wallet } from "lucide-react";
import { registerMember } from "@/lib/register-action";
import { uploadProof } from "@/lib/proof";
import { rupiah } from "@/lib/money";
import { IconInstagram } from "@/components/icons/SocialIcons";

const field =
  "w-full px-0 py-2.5 bg-transparent border-0 border-b border-neutral-300 text-[15px] text-neutral-900 placeholder:text-neutral-300 focus:outline-none focus:ring-0 focus:border-primary transition-colors";
const lbl = "block text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-1";
const MIN_REASON = 20;

interface Props {
  name?: string;
  instagramUrl?: string;
  /** HTM dalam rupiah; 0 = tanpa HTM (tidak ada bagian pembayaran). */
  fee?: number;
  paymentInfo?: string;
  paymentQr?: string;
}

/** Pemilih gambar bukti (tangkapan layar): kompres di browser, unggah ke bucket privat, simpan nama berkasnya. */
function ProofPicker({ value, onChange, onBusyChange, label, hint, previewAlt }: {
  value: string;
  onChange: (fileName: string) => void;
  onBusyChange: (busy: boolean) => void;
  label: string;
  hint: string;
  previewAlt: string;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  async function pick(file?: File) {
    if (!file) return;
    setError("");
    setBusy(true);
    onBusyChange(true);
    try {
      const objectUrl = URL.createObjectURL(file);
      const fileName = await uploadProof(file);
      setPreview(objectUrl);
      onChange(fileName);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal mengunggah gambar.");
    } finally {
      setBusy(false);
      onBusyChange(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  return (
    <>
      <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={(e) => pick(e.target.files?.[0])} aria-label={label} />
      {value && preview ? (
        <div className="mt-3 flex items-center gap-4 rounded-2xl bg-surface p-3">
          { }
          <img src={preview} alt={previewAlt} className="h-20 w-20 rounded-xl object-cover" />
          <div className="min-w-0 flex-1 text-sm">
            <p className="font-semibold text-primary-dark">Bukti terunggah</p>
            <button type="button" onClick={() => fileInput.current?.click()} className="mt-0.5 text-accent hover:underline">Ganti gambar</button>
          </div>
          <button type="button" onClick={() => { onChange(""); setPreview(""); }} aria-label="Hapus bukti" className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-400 hover:bg-black/5 hover:text-neutral-700"><X size={18} /></button>
        </div>
      ) : (
        <button
          type="button" onClick={() => fileInput.current?.click()} disabled={busy}
          className="mt-3 flex w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-neutral-300 px-4 py-8 text-sm text-neutral-500 transition-colors hover:border-accent hover:bg-surface hover:text-primary disabled:opacity-60"
        >
          {busy ? <Loader2 size={24} className="animate-spin text-accent" /> : <ImagePlus size={24} className="text-accent" />}
          <span className="font-semibold text-primary-dark">{busy ? "Mengunggah…" : "Pilih tangkapan layar"}</span>
          <span className="text-xs text-neutral-400">{hint}</span>
        </button>
      )}
      {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
    </>
  );
}

const stepNo = "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-dark text-xs font-bold text-white";

export default function DaftarForm({ name = "KMKC", instagramUrl = "", fee = 0, paymentInfo = "", paymentQr = "" }: Props) {
  const [state, action, pending] = useActionState(registerMember, undefined);
  const t = useRef<HTMLInputElement>(null);
  const [follow, setFollow] = useState("");
  const [pay, setPay] = useState("");
  const [busyN, setBusyN] = useState(0);
  const [reason, setReason] = useState("");
  const paysFee = fee > 0;
  const onBusy = (b: boolean) => setBusyN((n) => Math.max(0, n + (b ? 1 : -1)));

  useEffect(() => {
    if (t.current) t.current.value = String(Date.now());
  }, []);

  const handle = (instagramUrl.match(/instagram\.com\/([^/?#]+)/i)?.[1] ?? "").replace(/^@/, "");
  const ready = !!follow && (!paysFee || !!pay);

  if (state?.ok) {
    return (
      <div className="py-10 text-center animate-fade-in-up" role="status">
        <CheckCircle2 className="mx-auto text-accent" size={48} />
        <h2 className="mt-5 text-2xl font-extrabold text-primary-dark">Pendaftaran terkirim</h2>
        <p className="mt-2 text-neutral-500 max-w-sm mx-auto">
          Terima kasih! Pengurus {name} akan memeriksa data, bukti follow{state.paid ? ", dan pembayaran HTM" : ""}-mu, lalu menghubungimu lewat WhatsApp dalam beberapa hari.
          {state.demo && " (Mode demo: data belum disimpan karena database belum terhubung.)"}
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-9">
      <input type="hidden" name="t" ref={t} />
      <input type="hidden" name="follow_proof" value={follow} />
      <input type="hidden" name="payment_proof" value={pay} />
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />

      <div className="grid sm:grid-cols-2 gap-x-8 gap-y-7">
        <div className="sm:col-span-2">
          <label htmlFor="full_name" className={lbl}>Nama lengkap</label>
          <input id="full_name" name="full_name" required maxLength={120} autoComplete="name" className={field} />
        </div>
        <div>
          <label htmlFor="phone" className={lbl}>Nomor WhatsApp</label>
          <input id="phone" name="phone" required inputMode="tel" autoComplete="tel" placeholder="08xx xxxx xxxx" maxLength={24} className={field} />
        </div>
        <div>
          <label htmlFor="email" className={lbl}>Email</label>
          <input id="email" name="email" type="email" required autoComplete="email" maxLength={200} className={field} />
        </div>
        <div>
          <label htmlFor="village" className={lbl}>Desa asal</label>
          <input id="village" name="village" required maxLength={120} className={field} />
        </div>
        <div>
          <label htmlFor="batch" className={lbl}>Angkatan</label>
          <input id="batch" name="batch" required inputMode="numeric" pattern="\d{4}" title="Empat digit tahun, contoh 2025" placeholder="2025" maxLength={4} className={field} />
        </div>
        <div>
          <label htmlFor="campus" className={lbl}>Perguruan tinggi</label>
          <input id="campus" name="campus" required maxLength={160} className={field} />
        </div>
        <div>
          <label htmlFor="major" className={lbl}>Program studi</label>
          <input id="major" name="major" required maxLength={160} className={field} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="message" className={lbl}>Alasan bergabung di {name}</label>
          <textarea
            id="message" name="message" rows={4} required minLength={MIN_REASON} maxLength={1000}
            value={reason} onChange={(e) => setReason(e.target.value)}
            placeholder="Ceritakan alasanmu ingin bergabung dan apa yang ingin kamu kontribusikan…"
            className={`${field} resize-none leading-relaxed`}
          />
          <p className={`mt-1.5 text-xs ${reason.trim().length >= MIN_REASON ? "text-accent" : "text-neutral-400"}`}>
            {reason.trim().length >= MIN_REASON ? "Siap dikirim" : `Minimal ${MIN_REASON} karakter (${reason.trim().length}/${MIN_REASON})`}
          </p>
        </div>
      </div>

      {/* Bukti follow Instagram */}
      <fieldset>
        <legend className={lbl}>Bukti follow Instagram {name}</legend>
        <ol className="mt-3 space-y-5 text-[15px] text-neutral-600">
          <li className="flex gap-4">
            <span className={stepNo}>1</span>
            <div className="min-w-0">
              <p>Follow akun Instagram {name}{handle && <> <b className="font-semibold text-primary-dark">@{handle}</b></>}.</p>
              {instagramUrl && (
                <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="mt-2.5 inline-flex h-10 items-center gap-2 rounded-full bg-primary-dark px-5 text-sm font-semibold text-white transition-colors hover:bg-primary">
                  <IconInstagram size={16} /> Buka Instagram <ArrowUpRight size={15} />
                </a>
              )}
            </div>
          </li>
          <li className="flex gap-4">
            <span className={stepNo}>2</span>
            <div className="min-w-0 flex-1">
              <p>Tangkap layar profil yang menunjukkan tombol <b className="font-semibold text-primary-dark">Mengikuti</b>, lalu unggah di sini.</p>
              <ProofPicker
                value={follow} onChange={setFollow} onBusyChange={onBusy}
                label="Unggah bukti follow" previewAlt="Pratinjau bukti follow"
                hint="JPG, PNG, atau WebP. Otomatis dikecilkan."
              />
            </div>
          </li>
        </ol>
      </fieldset>

      {/* HTM + bukti pembayaran (hanya bila admin menetapkan HTM) */}
      {paysFee && (
        <fieldset>
          <legend className={lbl}>Pembayaran HTM</legend>
          <div className="mt-3 flex items-end justify-between gap-4 border-b border-border pb-5">
            <div>
              <p className="text-[13px] text-neutral-500">Total yang dibayarkan</p>
              <p className="mt-1 text-4xl font-extrabold tracking-tight text-primary-dark tabular-nums">{rupiah(fee)}</p>
            </div>
            <Wallet size={30} className="mb-1 shrink-0 text-accent" aria-hidden />
          </div>
          <ol className="mt-5 space-y-5 text-[15px] text-neutral-600">
            <li className="flex gap-4">
              <span className={stepNo}>1</span>
              <div className="min-w-0 flex-1">
                <p>Transfer tepat <b className="font-semibold text-primary-dark">{rupiah(fee)}</b> ke salah satu tujuan berikut.</p>
                {paymentInfo && <p className="mt-2.5 whitespace-pre-line rounded-2xl bg-surface px-4 py-3.5 text-[15px] font-medium leading-relaxed text-primary-dark">{paymentInfo}</p>}
                {paymentQr && (
                  <div className="mt-3 w-fit overflow-hidden rounded-2xl bg-white p-3 ring-1 ring-black/10">
                    { }
                    <img src={paymentQr} alt={`QRIS pembayaran HTM ${name}`} className="h-56 w-56 object-contain sm:h-60 sm:w-60" loading="lazy" />
                  </div>
                )}
                {!paymentInfo && !paymentQr && <p className="mt-2 text-sm text-neutral-400">Petunjuk pembayaran belum diisi pengurus. Hubungi pengurus lewat halaman kontak.</p>}
              </div>
            </li>
            <li className="flex gap-4">
              <span className={stepNo}>2</span>
              <div className="min-w-0 flex-1">
                <p>Unggah <b className="font-semibold text-primary-dark">bukti transfer</b> (tangkapan layar atau foto struk) yang menampilkan nominal dan waktu pembayaran.</p>
                <ProofPicker
                  value={pay} onChange={setPay} onBusyChange={onBusy}
                  label="Unggah bukti pembayaran" previewAlt="Pratinjau bukti pembayaran"
                  hint="JPG, PNG, atau WebP. Otomatis dikecilkan."
                />
              </div>
            </li>
          </ol>
        </fieldset>
      )}

      {state?.error && <p role="alert" className="text-sm text-red-700 border-l-2 border-red-500 bg-red-50/60 pl-3 py-2">{state.error}</p>}

      <button disabled={pending || busyN > 0 || !ready} className="group h-12 px-7 rounded-full bg-primary-dark text-white text-sm font-semibold inline-flex items-center gap-2.5 transition-colors hover:bg-primary disabled:opacity-50 disabled:cursor-not-allowed">
        {pending ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} className="transition-transform group-hover:translate-x-0.5" />}
        {pending ? "Mengirim…" : "Kirim pendaftaran"}
      </button>
      {!ready && <p className="-mt-6 text-xs text-neutral-400">{paysFee ? "Tombol aktif setelah bukti follow dan bukti pembayaran terunggah." : "Tombol aktif setelah bukti follow terunggah."}</p>}
    </form>
  );
}
