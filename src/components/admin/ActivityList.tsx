"use client";

import { useState } from "react";
import Pagination from "@/components/ui/Pagination";
import RelTime from "@/components/ui/RelTime";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AuditEntry } from "@/lib/types";

const PER_PAGE = 15; // aktivitas per halaman

export default function ActivityList({ rows }: { rows: AuditEntry[] }) {
  const [page, setPage] = useState(1);
  const [oldest, setOldest] = useState(false);
  const sorted = oldest ? [...rows].reverse() : rows; // data dari server sudah terbaru → terlama
  const pages = Math.max(1, Math.ceil(sorted.length / PER_PAGE));
  const cur = Math.min(page, pages);
  const visible = sorted.slice((cur - 1) * PER_PAGE, cur * PER_PAGE);

  return (
    <>
      <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
        <span className="text-[13px] tabular-nums text-muted-foreground">{rows.length} aktivitas</span>
        <Tabs value={oldest ? "old" : "new"} onValueChange={(v) => { setOldest(v === "old"); setPage(1); }}>
          <TabsList aria-label="Urutan">
            <TabsTrigger value="new" className="px-3">Terbaru</TabsTrigger>
            <TabsTrigger value="old" className="px-3">Terlama</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Ponsel: daftar */}
      <ul className="divide-y md:hidden">
        {visible.map((a) => (
          <li key={a.id} className="px-4 py-3">
            <p className="text-sm">
              <b className="font-semibold">{a.user_email.split("@")[0]}</b> <span className="text-muted-foreground">{a.action} {a.entity.toLowerCase()}</span> {a.label && <span>“{a.label}”</span>}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground"><RelTime iso={a.created_at} /></p>
          </li>
        ))}
      </ul>

      {/* Tablet & desktop: tabel */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead>Waktu</TableHead>
              <TableHead>Admin</TableHead>
              <TableHead>Aktivitas</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="whitespace-nowrap text-muted-foreground"><RelTime iso={a.created_at} /></TableCell>
                <TableCell>{a.user_email}</TableCell>
                <TableCell className="whitespace-normal text-muted-foreground">
                  {a.action} <b className="font-semibold text-foreground">{a.entity.toLowerCase()}</b> {a.label && <span className="text-foreground">“{a.label}”</span>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Pagination variant="admin" page={cur} pages={pages} total={rows.length} size={PER_PAGE} onChange={setPage} noun="aktivitas" />
    </>
  );
}
