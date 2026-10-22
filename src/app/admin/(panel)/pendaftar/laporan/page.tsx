import { getAdmin } from "@/lib/admin/guard";
import { PageHeader } from "@/components/admin/ui";
import RegistrantReportBuilder from "@/components/admin/RegistrantReportBuilder";
import { distinct, type RegLite } from "@/lib/admin/registrant-report";

export const metadata = { title: "Laporan pendaftar" };

export default async function Page() {
  const { supabase } = await getAdmin();
  const { data } = await supabase
    .from("registrations")
    .select("id,status,village,campus,batch,created_at")
    .order("created_at", { ascending: false })
    .limit(3000);
  const rows = (data ?? []) as RegLite[];
  return (
    <div className="mx-auto max-w-3xl pb-16">
      <PageHeader title="Laporan pendaftar" subtitle="Susun laporan PDF khusus pendaftar anggota: saring, kelompokkan, lalu pilih isinya." />
      <RegistrantReportBuilder
        rows={rows}
        villages={distinct(rows.map((r) => r.village))}
        campuses={distinct(rows.map((r) => r.campus))}
        batches={distinct(rows.map((r) => r.batch))}
      />
    </div>
  );
}
