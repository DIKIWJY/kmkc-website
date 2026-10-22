"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";

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
    <div className="rpt-bar">
      <Link href={back} className="ad-btn ad-btn-plain"><ArrowLeft size={16} /> Kembali</Link>
      <p className="hidden flex-1 text-[13px] text-[var(--ad-mute)] sm:block">Pada dialog cetak, pilih tujuan <b className="font-semibold">Simpan sebagai PDF</b>. Matikan opsi “Header dan footer” bila muncul.</p>
      <button type="button" onClick={() => window.print()} className="ad-btn ad-btn-primary"><Printer size={16} /> Cetak / Simpan PDF</button>
    </div>
  );
}
