import { getAdmin } from "@/lib/admin/guard";
import Inbox from "@/components/admin/Inbox";
import type { ContactMessage } from "@/lib/types";

export default async function MessagesPage() {
  const { supabase } = await getAdmin();
  const { data } = await supabase.from("contact_messages").select("*").order("created_at", { ascending: false }).limit(500);
  return <Inbox messages={(data ?? []) as ContactMessage[]} />;
}
