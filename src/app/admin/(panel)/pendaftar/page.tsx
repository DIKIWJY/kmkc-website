import { Download, FileText } from "lucide-react";
import Link from "next/link";
import { getAdmin } from "@/lib/admin/guard";
import { RESOURCES } from "@/lib/admin/schema";
import ResourceManager from "@/components/admin/ResourceManager";
import RegistrationSettings from "@/components/admin/RegistrationSettings";
import { sampleSettings } from "@/lib/sample-data";
import { Button } from "@/components/ui/button";

export default async function Page() {
  const { supabase } = await getAdmin();
  const res = RESOURCES["registrations"];
  const [{ data }, { data: cfg }] = await Promise.all([
    supabase.from(res.table).select("*").order(res.order.col, { ascending: res.order.asc }),
    supabase.from("site_settings").select("registration_open,registration_mode,gform_url,registration_note,registration_fee,payment_info,payment_qr").eq("id", 1).maybeSingle(),
  ]);
  const reg = {
    registration_open: sampleSettings.registration_open, registration_mode: sampleSettings.registration_mode, gform_url: "",
    registration_note: "", registration_fee: 0, payment_info: "", payment_qr: "", ...(cfg ?? {}),
  };
  return (
    <ResourceManager
      resourceKey="registrations"
      rows={data ?? []}
      headerExtra={
        <>
          <RegistrationSettings initial={reg} />
          <Button asChild variant="outline"><Link href="/admin/pendaftar/laporan"><FileText /> Laporan PDF</Link></Button>
          <Button asChild variant="outline"><a href="/api/admin/pendaftar/export"><Download /> Unduh CSV</a></Button>
        </>
      }
    />
  );
}