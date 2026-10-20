import { requireAdmin } from "@/lib/admin/guard";
import type { AuditEntry } from "@/lib/types";

export default async function ActivityPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("audit_log").select("*").order("created_at", { ascending: false }).limit(200);
  const rows = (data ?? []) as AuditEntry[];
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-primary-dark">Log Aktivitas</h1>
        <p className="text-neutral-500 text-sm mt-1">Catatan siapa mengubah apa — berguna jika admin lebih dari satu orang. Menampilkan 200 aktivitas terakhir.</p>
      </div>
      <div className="bg-white rounded-2xl ring-1 ring-border overflow-hidden">
        {rows.length === 0 ? (
          <p className="text-center text-sm text-neutral-400 py-16">Belum ada aktivitas.</p>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs uppercase tracking-wide text-neutral-400 bg-surface/60"><th className="px-4 py-3">Waktu</th><th className="px-4 py-3">Admin</th><th className="px-4 py-3">Aktivitas</th></tr></thead>
            <tbody className="divide-y divide-border">
              {rows.map((a) => (
                <tr key={a.id}>
                  <td className="px-4 py-3 whitespace-nowrap text-neutral-500">{new Date(a.created_at).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}</td>
                  <td className="px-4 py-3 text-neutral-700">{a.user_email}</td>
                  <td className="px-4 py-3 text-neutral-600">{a.action} <b className="text-neutral-800">{a.entity.toLowerCase()}</b> {a.label && <span>“{a.label}”</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
