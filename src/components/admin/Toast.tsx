"use client";

import { toast as sonner } from "sonner";

type Kind = "success" | "error";

/** Fungsi stabil (bukan hook berstate): aman dipakai di dependency array maupun callback. */
function notify(kind: Kind, text: string) {
  if (kind === "success") sonner.success(text, { duration: 3200 });
  else sonner.error(text, { duration: 6500 });
}

/** API lama tetap: const toast = useToast(); toast("success" | "error", "pesan"). Tampilannya kini sonner (<Toaster /> ada di AdminShell). */
export const useToast = () => notify;
