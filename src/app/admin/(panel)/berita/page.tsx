import { requireAdmin } from "@/lib/admin/guard";
import { RESOURCES } from "@/lib/admin/schema";
import ResourceManager from "@/components/admin/ResourceManager";

export default async function Page() {
  const { supabase } = await requireAdmin();
  const res = RESOURCES["articles"];
  let q = supabase.from(res.table).select("*").order(res.order.col, { ascending: res.order.asc });
  if (res.order.then) q = q.order(res.order.then.col, { ascending: res.order.then.asc });
  const { data } = await q;
  return <ResourceManager resourceKey="articles" rows={data ?? []} />;
}
