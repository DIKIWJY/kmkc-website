import { Download, FileText } from "lucide-react";
import Link from "next/link";
import { getAdmin } from "@/lib/admin/guard";
import { RESOURCES } from "@/lib/admin/schema";
import ResourceManager from "@/components/admin/ResourceManager";
import { Button } from "@/components/ui/button";

export default async function Page() {
  const { supabase } = await getAdmin();
  const res = RESOURCES["registrations"];
  const { data } = await supabase.from(res.table).select("*").order(res.order.col, { ascending: res.order.asc });
  return (
    <ResourceManager
      resourceKey="registrations"
      rows={data ?? []}
      headerExtra={
        <>
          <Button asChild variant="outline"><Link href="/admin/pendaftar/laporan"><FileText /> Laporan PDF</Link></Button>
          <Button asChild variant="outline"><a href="/api/admin/pendaftar/export"><Download /> Unduh CSV</a></Button>
        </>
      }
    />
  );
}
