"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Bilah atas laporan (tidak ikut tercetak). Bila auto, dialog cetak dibuka setelah semua gambar selesai dimuat. */
export default function PrintBar({ auto, title, back = "/admin/arsip" }: { auto: boolean; title: string; back?: string }) {
  const done = useRef(false);

  useEffect(() => {
    const prev = document.title;
    document.title = title; // Chrome memakai judul halaman sebagai nama berkas PDF
    return () => { document.title = prev; };
  }, [title]);

  useEffect(() => {
    if (!auto || done.current) return;
    done.current = true;
    const imgs = Array.from(document.images);
    Promise.all(imgs.map((i) => (i.complete ? Promise.resolve() : new Promise<void>((r) => { i.onload = i.onerror = () => r(); }))))
      .then(() => new Promise((r) => setTimeout(r, 400)))
      .then(() => window.print());
  }, [auto]);

  return (
    // Kelas rpt-bar dipakai report.css untuk menyembunyikan bilah ini saat dicetak.
    <div className="rpt-bar sticky top-0 z-10 flex items-center gap-3 border-b bg-background px-4 py-2.5">
      <Button asChild variant="ghost"><Link href={back}><ArrowLeft /> Kembali</Link></Button>
      <p className="hidden flex-1 text-[13px] text-muted-foreground sm:block">Pada dialog cetak, pilih tujuan <b className="font-semibold text-foreground">Simpan sebagai PDF</b>. Matikan opsi “Header dan footer” bila muncul.</p>
      <Button type="button" onClick={() => window.print()} className="ml-auto sm:ml-0"><Printer /> Cetak / Simpan PDF</Button>
    </div>
  );
}
