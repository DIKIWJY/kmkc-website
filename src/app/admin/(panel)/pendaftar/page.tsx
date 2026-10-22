import { Download, FileText } from "lucide-react";
import Link from "next/link";
import { getAdmin } from "@/lib/admin/guard";
import { RESOURCES } from "@/lib/admin/schema";
import ResourceManager from "@/components/admin/ResourceManager";

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
          <Link href="/admin/pendaftar/laporan" className="ad-btn ad-btn-primary"><FileText size={16} /> Laporan PDF</Link>
          <a href="/admin/pendaftar/export" className="ad-btn"><Download size={16} /> Unduh CSV</a>
        </>
      }
    />
  );
}
