import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_URL, SUPABASE_KEY, isSupabaseConfigured } from "./env";

/** Menyegarkan session Supabase + melindungi seluruh /admin (kecuali /admin/login). */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  if (!isSupabaseConfigured) return response;

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(list) {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // Klaim JWT diverifikasi lokal (tanpa perjalanan jaringan); jatuh ke server Auth jika tak tersedia.
  let signedIn = false;
  try {
    const { data } = await supabase.auth.getClaims();
    signedIn = !!data?.claims?.sub;
  } catch {
    signedIn = !!(await supabase.auth.getUser()).data.user;
  }
  const path = request.nextUrl.pathname;
  const isLogin = path === "/admin/login";

  if (!signedIn && !isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = "";
    return NextResponse.redirect(url);
  }
  if (signedIn && isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return response;
}
