"use client";

import { Loader2 } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Konfirmasi tindakan (hapus, buang perubahan, dll.). Dirender bersyarat oleh pemanggil: tampil selama komponen ini ada,
 * ditutup lewat `onCancel` (Batal / Esc / klik di luar). Selama `busy`, dialog tidak bisa ditutup.
 */
export function ConfirmDialog({ title, text, confirmLabel, busy, destructive = true, onConfirm, onCancel }: {
  title: string;
  text: string;
  confirmLabel: string;
  busy?: boolean;
  /** Tombol konfirmasi merah (bawaan). Matikan untuk tindakan yang tidak merusak. */
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <AlertDialog open onOpenChange={(open) => { if (!open && !busy) onCancel(); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription className="break-words">{text}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Batal</AlertDialogCancel>
          <AlertDialogAction
            disabled={busy}
            className={cn(destructive && buttonVariants({ variant: "destructive" }))}
            // Jangan tutup otomatis: pemanggil menutup setelah proses (mis. hapus) berhasil.
            onClick={(e) => { e.preventDefault(); onConfirm(); }}
          >
            {busy && <Loader2 className="animate-spin" />} {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
