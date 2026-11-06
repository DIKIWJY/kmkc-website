import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

// Hanya jalan di area admin dan endpoint admin — halaman publik tetap statis & cepat.
export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
