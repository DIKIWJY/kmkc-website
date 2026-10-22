import { getAdmin } from "@/lib/admin/guard";
import SettingsForm from "@/components/admin/SettingsForm";
import { Section, Card } from "@/components/admin/ui";
import { sampleSettings } from "@/lib/sample-data";
import { Download } from "lucide-react";
import type { SiteSettings } from "@/lib/types";

export const metadata = { title: "Pengaturan" };

export default async function SettingsPage() {
  const { supabase } = await getAdmin();
  const { data } = await supabase.from("site_settings").select("*").eq("id", 1).maybeSingle();
  return (
    <SettingsForm initial={{ ...sampleSettings, ...(data ?? {}) } as SiteSettings}>
      <Section title="Cadangan data">
        <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
          <p className="flex-1 text-[14px] text-[var(--ad-mute)]">
            Unduh seluruh konten (pengaturan, pengurus, program, agenda, galeri, berita, pesan) sebagai satu berkas JSON. Simpan sebelum melakukan perubahan besar.
          </p>
          <a href="/admin/backup" download className="ad-btn ad-btn-primary self-start sm:self-auto">
            <Download size={16} /> Unduh cadangan
          </a>
        </Card>
      </Section>
    </SettingsForm>
  );
}
