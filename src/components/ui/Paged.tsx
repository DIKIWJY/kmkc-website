"use client";

import { Children, useRef } from "react";
import Pagination, { usePaged } from "@/components/ui/Pagination";

/**
 * Membungkus daftar yang dirender di server menjadi berhalaman. Anak-anaknya dipotong per halaman di klien
 * dan nomor halaman muncul di bawahnya. Isi wadah diteruskan lewat className / stagger.
 */
export default function Paged({ size, className, stagger, noun, param, children }: {
  size: number;
  className?: string;
  stagger?: number;
  noun?: string;
  param?: string;
  children: React.ReactNode;
}) {
  const items = Children.toArray(children);
  const anchor = useRef<HTMLDivElement>(null);
  const p = usePaged(items.length, size, anchor, param);
  return (
    <div>
      <div ref={anchor} className="scroll-mt-28" />
      <div data-stagger={stagger} className={className}>{items.slice(p.start, p.end)}</div>
      <Pagination page={p.page} pages={p.pages} total={items.length} size={size} onChange={p.go} noun={noun} />
    </div>
  );
}
