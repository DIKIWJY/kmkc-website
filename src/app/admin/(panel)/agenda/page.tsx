import { getAdmin } from "@/lib/admin/guard";
import { RESOURCES } from "@/lib/admin/schema";
import ResourceManager from "@/components/admin/ResourceManager";

export default async function Page() {
  const { supabase } = await getAdmin();
  const res = RESOURCES["events"];
  const { data } = await supabase.from(res.table).select("*").order(res.order.col, { ascending: res.order.asc });
  return <ResourceManager resourceKey="events" rows={data ?? []} />;
}
