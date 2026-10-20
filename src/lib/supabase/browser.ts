import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_URL, SUPABASE_KEY } from "./env";

export function createBrowserSupabase() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_KEY);
}
