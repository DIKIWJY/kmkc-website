"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, Mail, MailOpen, Trash2, Reply, Download, CheckCheck, ArrowLeft, Loader2, Inbox as InboxIcon } from "lucide-react";
import { setMessagesRead, deleteRecord } from "@/lib/admin/actions";
import { useToast } from "./Toast";
import Pagination from "@/components/ui/Pagination";
import RelTime from "@/components/ui/RelTime";
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
        <button onClick={() => mark(messages.filter((m) => !isRead(m)).map((m) => m.id), true)} disabled={!unreadCount} className="ad-btn">
          <CheckCheck size={16} /> Tandai semua dibaca
        </button>
        <button onClick={exportCsv} disabled={!messages.length} className="ad-btn">
          <Download size={16} /> Ekspor CSV
        </button>
      </PageHeader>

      <Card className="overflow-hidden grid lg:grid-cols-[360px_1fr] lg:h-[calc(100dvh-15rem)] lg:min-h-[30rem]">
        {/* daftar */}
        <div className={`min-h-0 flex-col border-r border-[var(--ad-line)] ${current ? "hidden lg:flex" : "flex"}`}>
          <div className="space-y-3 border-b border-[var(--ad-line)] p-3">
            <div className="relative">
              <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--ad-faint)]" />
              <input value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} placeholder="Cari pesan" aria-label="Cari pesan" className="ad-input ad-input-search" />
            </div>
            <div className="ad-seg w-full" role="group" aria-label="Urutan">
              {([false, true] as const).map((o) => (
                <button key={String(o)} aria-pressed={oldest === o} onClick={() => { setOldest(o); setPage(1); }} className="flex-1">
                  {o ? "Terlama" : "Terbaru"}
                </button>
              ))}
            </div>
            <div className="ad-seg w-full" role="group" aria-label="Filter">
              {(["all", "unread"] as const).map((f) => (
                <button key={f} aria-pressed={filter === f} onClick={() => { setFilter(f); setPage(1); }} className="flex-1">
                  {f === "all" ? "Semua" : `Belum dibaca${unreadCount ? ` (${unreadCount})` : ""}`}
                </button>
              ))}
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto ad-divide max-h-[60dvh] lg:max-h-none">
            {list.length === 0 ? (
              <EmptyState icon={InboxIcon} title="Tidak ada pesan" />
            ) : (
              visible.map((m) => (
                <button key={m.id} onClick={() => open(m)} className={`flex w-full gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[rgba(0,0,0,0.03)] ${openId === m.id ? "bg-[var(--ad-blue-soft)] hover:bg-[var(--ad-blue-soft)]" : ""}`}>
                  <span className={`mt-[7px] h-2 w-2 shrink-0 rounded-full ${isRead(m) ? "bg-transparent" : "bg-[var(--ad-blue)]"}`} aria-label={isRead(m) ? undefined : "Belum dibaca"} />
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between gap-2">
                      <p className={`truncate ${isRead(m) ? "text-[var(--ad-ink-2)]" : "font-semibold"}`}>{m.name}</p>
                      <RelTime iso={m.created_at} className="whitespace-nowrap text-[12px] text-[var(--ad-faint)]" />
                    </div>
                    <p className="truncate text-[14px]">{m.subject || "(tanpa subjek)"}</p>
                    <p className="truncate text-[13px] text-[var(--ad-mute)]">{m.message}</p>
                  </div>
                </button>
              ))
            )}
          </div>
          <Pagination variant="admin" compact page={cur} pages={pages} total={list.length} size={PER_PAGE} onChange={setPage} noun="pesan" />
        </div>

        {/* isi pesan */}
        <div className={`min-h-0 overflow-y-auto p-5 sm:p-8 ${current ? "block" : "hidden lg:flex items-center justify-center"}`}>
          {!current ? (
            <div className="text-center text-[var(--ad-faint)]"><MailOpen size={36} strokeWidth={1.4} className="mx-auto mb-3" /><p>Pilih pesan untuk membacanya</p></div>
          ) : (
            <div>
              <button onClick={() => setOpenId(null)} className="ad-btn ad-btn-plain mb-4 -ml-2 lg:hidden"><ArrowLeft size={16} /> Semua pesan</button>
              <h2 className="break-words text-[22px] font-semibold tracking-tight">{current.subject || "(tanpa subjek)"}</h2>
              <p className="mt-1.5 break-words text-[14px] text-[var(--ad-mute)]"><b className="font-medium text-[var(--ad-ink)]">{current.name}</b> · {current.email}</p>
              <p className="mt-0.5 text-[13px] text-[var(--ad-faint)]">{when(current.created_at)}</p>
              <div className="mt-6 whitespace-pre-wrap break-words rounded-xl bg-[rgba(0,0,0,0.03)] p-5 text-[15px] leading-relaxed">{current.message}</div>
              <div className="mt-6 flex flex-wrap items-center gap-2">
                <a href={`mailto:${current.email}?subject=${encodeURIComponent("Re: " + (current.subject || "Pesan untuk KMKC"))}`} className="ad-btn ad-btn-primary"><Reply size={16} /> Balas lewat email</a>
                <button onClick={() => mark([current.id], !isRead(current))} className="ad-btn">
                  {isRead(current) ? <><Mail size={16} /> Tandai belum dibaca</> : <><MailOpen size={16} /> Tandai dibaca</>}
                </button>
                {!confirmDel ? (
                  <button onClick={() => setConfirmDel(true)} className="ad-btn ad-btn-danger sm:ml-auto"><Trash2 size={16} /> Hapus</button>
                ) : (
                  <div className="flex items-center gap-2 text-[14px] sm:ml-auto">
                    <span className="text-[var(--ad-mute)]">Hapus permanen?</span>
                    <button onClick={remove} disabled={busy} className="ad-btn ad-btn-sm ad-btn-danger-solid">{busy && <Loader2 size={13} className="animate-spin" />} Ya, hapus</button>
                    <button onClick={() => setConfirmDel(false)} className="ad-btn ad-btn-sm">Batal</button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
