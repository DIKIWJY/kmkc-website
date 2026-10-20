import { requireAdmin } from "@/lib/admin/guard";
import SettingsForm from "@/components/admin/SettingsForm";
import { sampleSettings } from "@/lib/sample-data";
import { Download, ShieldCheck } from "lucide-react";
import type { SiteSettings } from "@/lib/types";

export default async function SettingsPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("site_settings").select("*").eq("id", 1).maybeSingle();
  return (
    <SettingsForm initial={{ ...sampleSettings, ...(data ?? {}) } as SiteSettings}>
      <section className="bg-white rounded-2xl ring-1 ring-border p-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <span className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0"><ShieldCheck size={20} /></span>
        <div className="flex-1">
          <h2 className="font-bold text-primary-dark">Cadangan data</h2>
          <p className="text-sm text-neutral-500">Unduh seluruh konten (pengaturan, pengurus, program, agenda, galeri, berita, pesan) sebagai satu berkas JSON. Simpan sebelum perubahan besar.</p>
        </div>
        <a href="/admin/backup" download className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-dark text-white text-sm font-semibold px-5 py-3 hover:bg-primary transition">
          <Download size={16} /> Unduh cadangan
        </a>
      </section>
    </SettingsForm>
  );
}
