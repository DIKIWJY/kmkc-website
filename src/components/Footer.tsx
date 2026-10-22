import Link from "next/link";
import Logo from "@/components/ui/Logo";
import { IconInstagram, IconTiktok, IconYoutube, IconWhatsapp } from "@/components/icons/SocialIcons";
import { MAIN_NAV, MORE_NAV, ADMIN_LOGIN } from "@/lib/routes";
import { waHref } from "@/lib/whatsapp";
import type { SiteSettings } from "@/lib/types";

type FooterProps = Pick<SiteSettings, "name" | "full_name" | "email" | "phone" | "address" | "instagram" | "tiktok" | "youtube" | "whatsapp">;

export default function Footer({ name, full_name, email, phone, address, instagram, tiktok, youtube, whatsapp }: FooterProps) {
  const year = new Date().getFullYear();
  const socials = [
    { href: instagram, label: "Instagram", Icon: IconInstagram },
    { href: tiktok, label: "TikTok", Icon: IconTiktok },
    { href: youtube, label: "YouTube", Icon: IconYoutube },
    { href: waHref(whatsapp), label: "WhatsApp", Icon: IconWhatsapp },
  ].filter((s) => s.href);
  const links = [...MAIN_NAV, MORE_NAV[1]];

  return (
    <footer className="bg-primary-dark text-white/65 mt-auto">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 pt-14 pb-8">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr]">
          <div className="max-w-sm">
            <Link href="/" className="inline-flex items-center gap-3" aria-label={`${name} — beranda`}>
              <Logo size={44} mono />
              <span className="text-lg font-extrabold tracking-tight text-white">{name}</span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed">{full_name}. Rumah bersama mahasiswa Kecamatan Cempaka di perantauan.</p>
            {socials.length > 0 && (
              <ul className="mt-6 flex gap-2.5">
                {socials.map(({ href, label, Icon }) => (
                  <li key={label}>
                    <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="w-10 h-10 rounded-full bg-white/8 hover:bg-white/15 text-white/80 hover:text-white flex items-center justify-center transition-colors">
                      <Icon size={18} />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <nav aria-label="Peta situs">
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-white/45">Jelajahi</h2>
            <ul className="mt-4 grid grid-cols-2 md:grid-cols-1 gap-x-6 gap-y-2.5 text-sm">
              {links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-white transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-white/45">Hubungi kami</h2>
            <ul className="mt-4 space-y-2.5 text-sm break-words">
              {address && <li>{address}</li>}
              {email && <li><a href={`mailto:${email}`} className="hover:text-white transition-colors">{email}</a></li>}
              {phone && <li>{phone}</li>}
              <li><Link href="/kontak" className="text-sky-300 hover:text-white transition-colors">Kirim pesan →</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 text-xs text-white/50">
          <span>&copy; {year} {name}. Seluruh hak dilindungi.</span>
          <Link href={ADMIN_LOGIN} className="hover:text-white transition-colors" rel="nofollow">Masuk admin</Link>
        </div>
      </div>
    </footer>
  );
}
