"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { purgeOldProofs } from "@/lib/admin/actions";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "./Toast";
import { ConfirmDialog } from "./ConfirmDialog";

/** Hapus bukti follow lama untuk melonggarkan penyimpanan. Dua langkah: pilih rentang → konfirmasi. */
export default function PurgeProofs({ files }: { files: number }) {
  const toast = useToast();
  const [days, setDays] = useState(180);
  const [confirm, setConfirm] = useState(false);
  const [pending, start] = useTransition();

  const run = () =>
    start(async () => {
      const r = await purgeOldProofs(days);
      setConfirm(false);
      if (!r.ok) return toast("error", r.error);
      toast("success", r.removed ? `${r.removed} berkas bukti dihapus.` : "Tidak ada bukti yang memenuhi rentang tersebut.");
    });

  return (
    <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">Hapus bukti follow yang lebih lama dari</p>
        <p className="mt-1 text-xs text-muted-foreground">Saat ini ada {files.toLocaleString("id-ID")} berkas bukti. Data pendaftar tetap ada; hanya gambarnya yang dihapus permanen. Buat laporan PDF dengan bukti terlebih dahulu.</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
          <SelectTrigger className="w-28" aria-label="Rentang usia bukti"><SelectValue /></SelectTrigger>
          <SelectContent>
            {[30, 90, 180, 365].map((d) => <SelectItem key={d} value={String(d)}>{d} hari</SelectItem>)}
          </SelectContent>
        </Select>
        <Button type="button" variant="outline" onClick={() => setConfirm(true)} disabled={!files} className="text-destructive hover:bg-destructive/10 hover:text-destructive">
          <Trash2 /> Hapus bukti lama
        </Button>
      </div>

      {confirm && (
        <ConfirmDialog
          title="Hapus bukti lama?"
          text={`Semua gambar bukti yang lebih tua dari ${days} hari akan dihapus permanen. Data pendaftar tetap tersimpan. Tindakan ini tidak bisa dibatalkan.`}
          confirmLabel="Ya, hapus permanen"
          busy={pending}
          onConfirm={run}
          onCancel={() => setConfirm(false)}
        />
      )}
    </div>
  );
}
