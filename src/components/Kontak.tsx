"use client";

import { useActionState, useEffect, useRef } from "react";
import { Mail, Phone, MapPin, Send, CheckCircle2, Loader2 } from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";
import { waHref } from "@/lib/whatsapp";
import { IconInstagram, IconTiktok, IconYoutube, IconWhatsapp } from "@/components/icons/SocialIcons";
import { sendMessage } from "@/lib/contact-action";

interface KontakProps {
  page?: boolean;
  email: string;
  phone: string;
  address: string;
  instagram?: string;
  tiktok?: string;
  youtube?: string;
  whatsapp?: string;
}

const field =
  "w-full px-4 py-3.5 rounded-xl bg-white border border-border text-[15px] focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all";

export default function Kontak({ page, email, phone, address, instagram, tiktok, youtube, whatsapp }: KontakProps) {
  const [state, action, pending] = useActionState(sendMessage, undefined);
  const startedAt = useRef<HTMLInputElement>(null);

  // Cap waktu diisi di browser (halaman ini statis/ISR, jadi tidak boleh dihitung saat render)
  useEffect(() => {
    if (startedAt.current) startedAt.current.value = String(Date.now());
  }, []);

  const info = [
    { icon: Mail, label: "Email", value: email, href: email ? `mailto:${email}` : "" },
    { icon: Phone, label: "Telepon", value: phone, href: phone ? `tel:${phone.replace(/\s/g, "")}` : "" },
    { icon: MapPin, label: "Sekretariat", value: address, href: "" },
  ].filter((i) => i.value);

  const socials = [
    { href: waHref(whatsapp), icon: IconWhatsapp, label: "WhatsApp" },
    { href: instagram, icon: IconInstagram, label: "Instagram" },
    { href: tiktok, icon: IconTiktok, label: "TikTok" },
    { href: youtube, icon: IconYoutube, label: "YouTube" },
  ].filter((s) => s.href);

  return (
    <section className="py-24 lg:py-32 bg-surface/70">
      <div className="max-w-7xl mx-auto px-6 sm:px-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
          <div>
            <SectionHeading title="Hubungi Kami" className="mb-6" page={page} />
            <p className="text-neutral-500 text-lg mb-10 max-w-md leading-relaxed">
              Punya pertanyaan, saran, atau ingin berkolaborasi? Kami senang mendengar dari kamu.
            </p>

            <div className="space-y-6">
              {info.map(({ icon: Icon, label, value, href }) => (
                <div key={label} className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon size={22} className="text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-neutral-400 mb-0.5">{label}</p>
                    {href ? (
                      <a href={href} className="font-medium text-primary-dark hover:text-accent break-words">{value}</a>
                    ) : (
                      <p className="font-medium text-primary-dark leading-relaxed">{value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {socials.length > 0 && (
              <div className="flex gap-2.5 mt-10">
                {socials.map(({ href, icon: Icon, label }) => (
                  <a key={label} href={href} target="_blank" rel="noopener noreferrer" title={label} aria-label={label}
                    className="w-11 h-11 rounded-xl bg-white ring-1 ring-border flex items-center justify-center text-neutral-500 hover:text-accent hover:ring-accent/40 hover:-translate-y-0.5 transition-all">
                    <Icon size={18} />
                  </a>
                ))}
              </div>
            )}
          </div>

          <div className="soft-card p-6 sm:p-8">
            {state?.ok ? (
              <div className="py-12 text-center">
                <CheckCircle2 size={48} className="mx-auto text-sky-500 mb-4" />
                <h3 className="text-xl font-bold text-neutral-900 mb-1">Pesan terkirim!</h3>
                <p className="text-neutral-500">
                  {state.demo ? "Mode pratinjau: pesan belum tersimpan karena database belum terhubung." : "Terima kasih, pengurus akan segera membalas."}
                </p>
              </div>
            ) : (
              <form action={action} className="space-y-4">
                <input ref={startedAt} type="hidden" name="t" defaultValue="0" />
                {/* honeypot anti-bot: disembunyikan dari manusia */}
                <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 opacity-0" />
                <div className="grid sm:grid-cols-2 gap-4">
                  <input name="name" placeholder="Nama" required maxLength={120} className={field} />
                  <input name="email" type="email" placeholder="Email" required maxLength={200} className={field} />
                </div>
                <input name="subject" placeholder="Subjek" maxLength={200} className={field} />
                <textarea name="message" placeholder="Pesan" required rows={5} maxLength={5000} className={`${field} resize-none`} />
                {state?.error && <p role="alert" className="text-sm text-red-600">{state.error}</p>}
                <button disabled={pending} className="inline-flex items-center gap-2 px-7 py-3.5 bg-brand-gradient animate-gradient text-white font-semibold rounded-full shadow-lg shadow-blue-500/25 hover:scale-[1.03] transition-all disabled:opacity-60">
                  {pending ? <><Loader2 size={16} className="animate-spin" /> Mengirim…</> : <>Kirim Pesan <Send size={16} /></>}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
