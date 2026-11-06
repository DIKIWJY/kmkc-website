import { TriangleAlert } from "lucide-react";
import { getAdmin } from "@/lib/admin/guard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import KepengurusanManager from "@/components/admin/KepengurusanManager";
import { buildOrg } from "@/lib/org";
import type { Division, Member, Period } from "@/lib/types";

export default async function Page() {
  const { supabase } = await getAdmin();
  const [m, p, d] = await Promise.all([
    supabase.from("members").select("*").order("order_index", { ascending: true }),
    supabase.from("periods").select("*"),
    supabase.from("divisions").select("*").order("order_index", { ascending: true }),
  ]);
  const members = (m.data ?? []) as Member[];
  const tablesMissing = !!(p.error || d.error);
  // Database lama (belum menjalankan schema.sql v11): tampilkan struktur turunan dari data pengurus agar halaman tetap bisa dibuka.
  const org = buildOrg(members, (p.error ? [] : p.data ?? []) as Period[], (d.error ? [] : d.data ?? []) as Division[]);
  const periods: Period[] = org.map((x) => ({ label: x.label, is_current: x.isCurrent }));
  const divisions: Division[] = org.flatMap((x) => x.divisions.map((dv, i) => ({ id: (d.data as Division[] | null)?.find((r) => r.period === x.label && r.name === dv.name)?.id ?? `${x.label}|${dv.name}`, period: x.label, name: dv.name, description: dv.description, order_index: i + 1 })));
  return (
    <>
      {tablesMissing && (
        <Alert variant="destructive" className="mb-5">
          <TriangleAlert />
          <AlertTitle>Database belum diperbarui</AlertTitle>
          <AlertDescription>
            Fitur susunan kepengurusan butuh tabel baru. Jalankan ulang seluruh <code className="rounded bg-muted px-1 text-foreground">supabase/schema.sql</code> di SQL Editor Supabase (aman diulang), lalu muat ulang halaman ini.
          </AlertDescription>
        </Alert>
      )}
      <KepengurusanManager periods={periods} divisions={divisions} members={members} />
    </>
  );
}
