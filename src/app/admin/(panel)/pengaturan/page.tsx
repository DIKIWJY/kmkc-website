import { getAdmin } from "@/lib/admin/guard";
import SettingsForm from "@/components/admin/SettingsForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { sampleSettings } from "@/lib/sample-data";
import { Download } from "lucide-react";
import type { SiteSettings } from "@/lib/types";

export const metadata = { title: "Pengaturan" };

export default async function SettingsPage() {
  const { supabase } = await getAdmin();
  const { data } = await supabase.from("site_settings").select("*").eq("id", 1).maybeSingle();
  return (
    <SettingsForm initial={{ ...sampleSettings, ...(data ?? {}) } as SiteSettings}>
      <Card>
        <CardHeader>
          <CardTitle>Cadangan data</CardTitle>
          <CardDescription>
            Unduh seluruh konten (pengaturan, pengurus, program, agenda, galeri, berita, pesan) sebagai satu berkas JSON. Simpan sebelum melakukan perubahan besar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <a href="/api/admin/backup" download><Download /> Unduh cadangan</a>
          </Button>
        </CardContent>
      </Card>
    </SettingsForm>
  );
}
