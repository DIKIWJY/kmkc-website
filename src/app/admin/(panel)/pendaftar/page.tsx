import { Download } from "lucide-react";
import { requireAdmin } from "@/lib/admin/guard";
import { RESOURCES } from "@/lib/admin/schema";
import ResourceManager from "@/components/admin/ResourceManager";

export default async function Page() {
  const { supabase } = await requireAdmin();
  const res = RESOURCES["registrations"];
  const { data } = await supabase.from(res.table).select("*").order(res.order.col, { ascending: res.order.asc });
  return (
    <ResourceManager
      resourceKey="registrations"
      rows={data ?? []}
      headerExtra={
        <a
          href="/admin/pendaftar/export"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white ring-1 ring-border text-sm font-semibold text-primary hover:ring-accent/50"
        >
          <Download size={16} /> Unduh CSV
        </a>
      }
    />
  );
}
