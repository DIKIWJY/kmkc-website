import { getAdmin } from "@/lib/admin/guard";
import { PageHeader, Card, EmptyState } from "@/components/admin/ui";
import ActivityList from "@/components/admin/ActivityList";
import { History } from "lucide-react";
import type { AuditEntry } from "@/lib/types";

export const metadata = { title: "Log aktivitas" };

export default async function ActivityPage() {
  const { supabase } = await getAdmin();
  const { data } = await supabase.from("audit_log").select("*").order("created_at", { ascending: false }).limit(200);
  const rows = (data ?? []) as AuditEntry[];
  return (
    <div>
      <PageHeader title="Log aktivitas" subtitle="Catatan siapa mengubah apa, berguna bila admin lebih dari satu orang. Menampilkan 200 aktivitas terakhir, 15 per halaman." />
      <Card className="overflow-hidden">
        {rows.length === 0 ? (
          <EmptyState icon={History} title="Belum ada aktivitas" text="Perubahan konten akan tercatat di sini." />
        ) : (
          <ActivityList rows={rows} />
        )}
      </Card>
    </div>
  );
}
