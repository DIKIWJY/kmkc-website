import { requireAdmin } from "@/lib/admin/guard";
import { PROOF_BUCKET } from "@/lib/supabase/env";
import { PROOF_NAME } from "@/lib/proof";

export const dynamic = "force-dynamic";

/** Menayangkan bukti follow Instagram (bucket privat) hanya untuk admin yang sudah login. */
export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  if (!PROOF_NAME.test(name)) return new Response("Not found", { status: 404 });
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.storage.from(PROOF_BUCKET).download(name);
  if (error || !data) return new Response("Not found", { status: 404 });
  return new Response(data, {
    headers: {
      "Content-Type": data.type || "image/webp",
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
      "Content-Disposition": "inline",
    },
  });
}
