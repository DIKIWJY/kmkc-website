"use client";

import { useActionState, useEffect, useRef } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { registerMember } from "@/lib/register-action";

const field =
  "w-full px-0 py-2.5 bg-transparent border-0 border-b border-neutral-300 text-[15px] text-neutral-900 placeholder:text-neutral-300 focus:outline-none focus:ring-0 focus:border-primary transition-colors";
const lbl = "block text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-1";

export default function DaftarForm({ name = "KMKC" }: { name?: string }) {
  const [state, action, pending] = useActionState(registerMember, undefined);
  const t = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (t.current) t.current.value = String(Date.now());
  }, []);

  if (state?.ok) {
    return (
      <div className="py-10 text-center animate-fade-in-up" role="status">
        <CheckCircle2 className="mx-auto text-accent" size={48} />
        <h2 className="mt-5 text-2xl font-extrabold text-primary-dark">Pendaftaran terkirim</h2>
        <p className="mt-2 text-neutral-500 max-w-sm mx-auto">
          Terima kasih! Pengurus {name} akan menghubungimu lewat WhatsApp dalam beberapa hari.
          {state.demo && " (Mode demo: data belum disimpan karena database belum terhubung.)"}
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-7">
      <input type="hidden" name="t" ref={t} />
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />

      <div className="grid sm:grid-cols-2 gap-x-8 gap-y-7">
        <div className="sm:col-span-2">
          <label htmlFor="full_name" className={lbl}>Nama lengkap *</label>
          <input id="full_name" name="full_name" required maxLength={120} autoComplete="name" className={field} />
        </div>
        <div>
          <label htmlFor="phone" className={lbl}>Nomor WhatsApp *</label>
          <input id="phone" name="phone" required inputMode="tel" autoComplete="tel" placeholder="08xx xxxx xxxx" maxLength={24} className={field} />
        </div>
        <div>
          <label htmlFor="email" className={lbl}>Email</label>
          <input id="email" name="email" type="email" autoComplete="email" maxLength={200} className={field} />
        </div>
        <div>
          <label htmlFor="village" className={lbl}>Desa asal</label>
          <input id="village" name="village" maxLength={120} className={field} />
        </div>
        <div>
          <label htmlFor="batch" className={lbl}>Angkatan</label>
          <input id="batch" name="batch" inputMode="numeric" placeholder="2025" maxLength={20} className={field} />
        </div>
        <div>
          <label htmlFor="campus" className={lbl}>Perguruan tinggi</label>
          <input id="campus" name="campus" maxLength={160} className={field} />
        </div>
        <div>
          <label htmlFor="major" className={lbl}>Program studi</label>
          <input id="major" name="major" maxLength={160} className={field} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="message" className={lbl}>Pesan (opsional)</label>
          <textarea id="message" name="message" rows={3} maxLength={1000} placeholder="Ceritakan singkat harapanmu bergabung…" className={`${field} resize-none`} />
        </div>
      </div>

      {state?.error && <p role="alert" className="text-sm text-red-700 border-l-2 border-red-500 bg-red-50/60 pl-3 py-2">{state.error}</p>}

      <button disabled={pending} className="group h-12 px-7 rounded-full bg-brand-gradient animate-gradient text-white text-sm font-semibold inline-flex items-center gap-2.5 shadow-lg shadow-blue-600/25 disabled:opacity-60">
        {pending ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} className="transition-transform group-hover:translate-x-0.5" />}
        {pending ? "Mengirim…" : "Kirim pendaftaran"}
      </button>
    </form>
  );
}
