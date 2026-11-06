"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, Mail, MailOpen, Trash2, Reply, Download, CheckCheck, ArrowLeft, Inbox as InboxIcon } from "lucide-react";
import { setMessagesRead, deleteRecord } from "@/lib/admin/actions";
import { cn } from "@/lib/utils";
import Pagination from "@/components/ui/Pagination";
import RelTime from "@/components/ui/RelTime";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "./Toast";
import { ConfirmDialog } from "./ConfirmDialog";
import { PageHeader, Card, EmptyState } from "./ui";
import type { ContactMessage } from "@/lib/types";

const PER_PAGE = 20; // pesan per halaman pada daftar

const when = (iso: string) => new Date(iso).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });

export default function Inbox({ messages }: { messages: ContactMessage[] }) {
  const router = useRouter();
  const toast = useToast();
  const [, startTransition] = useTransition();
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [confirmDel, setConfirmDel] = useState(false);
  const [busy, setBusy] = useState(false);
  const [localRead, setLocalRead] = useState<Record<string, boolean>>({});
  const [page, setPage] = useState(1);
  const [oldest, setOldest] = useState(false);

  const isRead = (m: ContactMessage) => localRead[m.id] ?? m.is_read;
  const unreadCount = messages.filter((m) => !isRead(m)).length;

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const out = messages.filter((m) => {
      if (filter === "unread" && isRead(m)) return false;
      return !q || [m.name, m.email, m.subject, m.message].some((x) => x.toLowerCase().includes(q));
    });
    return [...out].sort((a, b) => (a.created_at < b.created_at ? -1 : a.created_at > b.created_at ? 1 : 0) * (oldest ? 1 : -1));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, filter, query, localRead, oldest]);

  const pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
  const cur = Math.min(page, pages);
  const visible = list.slice((cur - 1) * PER_PAGE, cur * PER_PAGE);
  const current = messages.find((m) => m.id === openId) ?? null;
  const refresh = () => startTransition(() => router.refresh());

  async function mark(ids: string[], read: boolean) {
    setLocalRead((s) => ({ ...s, ...Object.fromEntries(ids.map((i) => [i, read])) }));
    const r = await setMessagesRead(ids, read);
    if (!r.ok) toast("error", r.error);
    else refresh();
  }

  function open(m: ContactMessage) {
    setOpenId(m.id);
    setConfirmDel(false);
    if (!isRead(m)) mark([m.id], true);
  }

  async function remove() {
    if (!current) return;
    setBusy(true);
    const r = await deleteRecord("messages", current.id);
    setBusy(false);
    if (!r.ok) return toast("error", r.error);
    toast("success", "Pesan dihapus.");
    setOpenId(null);
    setConfirmDel(false);
    refresh();
  }

  function exportCsv() {
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const rows = [["Waktu", "Nama", "Email", "Subjek", "Pesan", "Dibaca"], ...messages.map((m) => [m.created_at, m.name, m.email, m.subject, m.message, isRead(m) ? "ya" : "tidak"])];
    const blob = new Blob(["﻿" + rows.map((r) => r.map(esc).join(",")).join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `pesan-kmkc-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div>
      <PageHeader title="Pesan Masuk" subtitle={`${messages.length} pesan · ${unreadCount} belum dibaca`}>
        <Button variant="outline" onClick={() => mark(messages.filter((m) => !isRead(m)).map((m) => m.id), true)} disabled={!unreadCount}>
          <CheckCheck /> Tandai semua dibaca
        </Button>
        <Button variant="outline" onClick={exportCsv} disabled={!messages.length}>
          <Download /> Ekspor CSV
        </Button>
      </PageHeader>

      <Card className="grid overflow-hidden lg:h-[calc(100dvh-14rem)] lg:min-h-[30rem] lg:grid-cols-[360px_1fr]">
        {/* daftar */}
        <div className={cn("min-h-0 flex-col border-r", current ? "hidden lg:flex" : "flex")}>
          <div className="space-y-3 border-b p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input type="search" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} placeholder="Cari pesan" aria-label="Cari pesan" className="pl-9" />
            </div>
            <Tabs value={oldest ? "old" : "new"} onValueChange={(v) => { setOldest(v === "old"); setPage(1); }}>
              <TabsList className="w-full" aria-label="Urutan">
                <TabsTrigger value="new" className="flex-1">Terbaru</TabsTrigger>
                <TabsTrigger value="old" className="flex-1">Terlama</TabsTrigger>
              </TabsList>
            </Tabs>
            <Tabs value={filter} onValueChange={(v) => { setFilter(v as "all" | "unread"); setPage(1); }}>
              <TabsList className="w-full" aria-label="Filter">
                <TabsTrigger value="all" className="flex-1">Semua</TabsTrigger>
                <TabsTrigger value="unread" className="flex-1">Belum dibaca{unreadCount ? ` (${unreadCount})` : ""}</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="max-h-[60dvh] min-h-0 flex-1 divide-y overflow-y-auto lg:max-h-none">
            {list.length === 0 ? (
              <EmptyState icon={InboxIcon} title="Tidak ada pesan" />
            ) : (
              visible.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => open(m)}
                  aria-current={openId === m.id ? "true" : undefined}
                  className={cn("flex w-full gap-3 px-4 py-3.5 text-left outline-none transition-colors hover:bg-accent/60 focus-visible:bg-accent/60", openId === m.id && "bg-accent hover:bg-accent")}
                >
                  <span className={cn("mt-[7px] size-2 shrink-0 rounded-full", isRead(m) ? "bg-transparent" : "bg-primary")} aria-label={isRead(m) ? undefined : "Belum dibaca"} />
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between gap-2">
                      <p className={cn("truncate", isRead(m) ? "text-muted-foreground" : "font-semibold")}>{m.name}</p>
                      <RelTime iso={m.created_at} className="whitespace-nowrap text-xs text-muted-foreground" />
                    </div>
                    <p className="truncate text-sm">{m.subject || "(tanpa subjek)"}</p>
                    <p className="truncate text-[13px] text-muted-foreground">{m.message}</p>
                  </div>
                </button>
              ))
            )}
          </div>
          <Pagination variant="admin" compact page={cur} pages={pages} total={list.length} size={PER_PAGE} onChange={setPage} noun="pesan" />
        </div>

        {/* isi pesan */}
        <div className={cn("min-h-0 overflow-y-auto p-5 sm:p-8", current ? "block" : "hidden items-center justify-center lg:flex")}>
          {!current ? (
            <div className="text-center text-muted-foreground"><MailOpen className="mx-auto mb-3 size-9" strokeWidth={1.4} /><p>Pilih pesan untuk membacanya</p></div>
          ) : (
            <div>
              <Button variant="ghost" size="sm" onClick={() => setOpenId(null)} className="-ml-2 mb-4 lg:hidden"><ArrowLeft /> Semua pesan</Button>
              <h2 className="break-words text-[22px] font-semibold tracking-tight">{current.subject || "(tanpa subjek)"}</h2>
              <p className="mt-1.5 break-words text-sm text-muted-foreground"><b className="font-medium text-foreground">{current.name}</b> · {current.email}</p>
              <p className="mt-0.5 text-[13px] text-muted-foreground">{when(current.created_at)}</p>
              <div className="mt-6 whitespace-pre-wrap break-words rounded-xl bg-muted/60 p-5 text-[15px] leading-relaxed">{current.message}</div>
              <div className="mt-6 flex flex-wrap items-center gap-2">
                <Button asChild>
                  <a href={`mailto:${current.email}?subject=${encodeURIComponent("Re: " + (current.subject || "Pesan untuk KMKC"))}`}><Reply /> Balas lewat email</a>
                </Button>
                <Button variant="outline" onClick={() => mark([current.id], !isRead(current))}>
                  {isRead(current) ? <><Mail /> Tandai belum dibaca</> : <><MailOpen /> Tandai dibaca</>}
                </Button>
                <Button variant="outline" onClick={() => setConfirmDel(true)} className="text-destructive hover:bg-destructive/10 hover:text-destructive sm:ml-auto">
                  <Trash2 /> Hapus
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {confirmDel && current && (
        <ConfirmDialog
          title="Hapus pesan ini?"
          text={`Pesan dari ${current.name} akan dihapus permanen dan tidak bisa dikembalikan.`}
          confirmLabel="Ya, hapus"
          busy={busy}
          onConfirm={remove}
          onCancel={() => setConfirmDel(false)}
        />
      )}
    </div>
  );
}
