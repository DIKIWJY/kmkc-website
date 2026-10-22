import { IconWhatsapp } from "@/components/icons/SocialIcons";
import { waHref } from "@/lib/whatsapp";

/** Tombol WhatsApp melayang (server component, tanpa JS). Hanya tampil bila nomor diisi di Pengaturan. */
export default function WhatsAppButton({ number, name = "KMKC" }: { number?: string; name?: string }) {
  const href = waHref(number, `Halo ${name}, saya ingin bertanya…`);
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat WhatsApp pengurus"
      className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2.5 h-14 pl-4 pr-4 sm:pr-5 rounded-full bg-primary-dark text-white shadow-xl shadow-blue-900/30 hover:bg-primary transition-colors"
    >
      <IconWhatsapp size={22} />
      <span className="hidden sm:inline text-sm font-semibold">Chat pengurus</span>
    </a>
  );
}
