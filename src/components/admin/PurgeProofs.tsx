"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { purgeOldProofs } from "@/lib/admin/actions";
import { useToast } from "./Toast";

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
        <p className="text-[15px]">Hapus bukti follow yang lebih lama dari</p>
        <p className="ad-help !mt-1">Saat ini ada {files.toLocaleString("id-ID")} berkas bukti. Data pendaftar tetap ada; hanya gambarnya yang dihapus permanen. Buat laporan PDF dengan bukti terlebih dahulu.</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <select aria-label="Rentang usia bukti" value={days} onChange={(e) => { setDays(Number(e.target.value)); setConfirm(false); }} className="ad-input !h-9 !w-auto !text-[14px]">
          {[30, 90, 180, 365].map((d) => <option key={d} value={d}>{d} hari</option>)}
        </select>
        {confirm ? (
          <>
            <button type="button" onClick={run} disabled={pending} className="ad-btn ad-btn-danger-solid">{pending ? "Menghapus…" : "Ya, hapus permanen"}</button>
            <button type="button" onClick={() => setConfirm(false)} disabled={pending} className="ad-btn">Batal</button>
          </>
        ) : (
          <button type="button" onClick={() => setConfirm(true)} disabled={!files} className="ad-btn ad-btn-danger"><Trash2 size={15} /> Hapus bukti lama</button>
        )}
      </div>
    </div>
  );
}
