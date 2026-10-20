"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, Mail, MailOpen, Trash2, Reply, Download, CheckCheck, ArrowLeft, Loader2, Inbox as InboxIcon } from "lucide-react";
import { setMessagesRead, deleteRecord } from "@/lib/admin/actions";
import { useToast } from "./Toast";
import type { ContactMessage } from "@/lib/types";

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

  const isRead = (m: ContactMessage) => localRead[m.id] ?? m.is_read;
  const unreadCount = messages.filter((m) => !isRead(m)).length;

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return messages.filter((m) => {
      if (filter === "unread" && isRead(m)) return false;
      return !q || [m.name, m.email, m.subject, m.message].some((x) => x.toLowerCase().includes(q));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, filter, query, localRead]);

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
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary-dark">Pesan Masuk</h1>
          <p className="text-neutral-500 text-sm mt-1">{messages.length} pesan · {unreadCount} belum dibaca</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => mark(messages.filter((m) => !isRead(m)).map((m) => m.id), true)} disabled={!unreadCount} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white ring-1 ring-border text-sm font-semibold text-primary hover:ring-accent/50 disabled:opacity-40">
            <CheckCheck size={16} /> Tandai semua dibaca
          </button>
          <button onClick={exportCsv} disabled={!messages.length} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white ring-1 ring-border text-sm font-semibold text-primary hover:ring-accent/50 disabled:opacity-40">
            <Download size={16} /> Ekspor CSV
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl ring-1 ring-border overflow-hidden grid lg:grid-cols-[380px_1fr] min-h-[32rem]">
        {/* list */}
        <div className={`border-r border-border flex-col ${current ? "hidden lg:flex" : "flex"}`}>
          <div className="p-3 space-y-3 border-b border-border">
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari pesan…" className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent" />
            </div>
            <div className="flex gap-1.5 text-sm">
              {(["all", "unread"] as const).map((f) => (
                <button key={f} onClick={() => setFilter(f)} className={`px-3.5 py-1.5 rounded-full font-medium ${filter === f ? "bg-primary text-white" : "text-neutral-500 hover:bg-surface"}`}>
                  {f === "all" ? "Semua" : `Belum dibaca (${unreadCount})`}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[36rem] divide-y divide-border">
            {list.length === 0 ? (
              <div className="py-16 text-center text-neutral-400"><InboxIcon className="mx-auto mb-2 opacity-50" size={30} /><p className="text-sm">Tidak ada pesan.</p></div>
            ) : (
              list.map((m) => (
                <button key={m.id} onClick={() => open(m)} className={`w-full text-left px-4 py-3.5 flex gap-3 hover:bg-surface/60 transition ${openId === m.id ? "bg-surface" : ""}`}>
                  <span className={`w-2 h-2 rounded-full mt-2 shrink-0 ${isRead(m) ? "bg-transparent" : "bg-accent"}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between gap-2">
                      <p className={`text-sm truncate ${isRead(m) ? "text-neutral-600" : "font-bold text-neutral-900"}`}>{m.name}</p>
                      <span className="text-[11px] text-neutral-400 whitespace-nowrap">{new Date(m.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}</span>
                    </div>
                    <p className="text-sm text-neutral-700 truncate">{m.subject || "(tanpa subjek)"}</p>
                    <p className="text-xs text-neutral-400 truncate">{m.message}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* detail */}
        <div className={`p-6 sm:p-8 ${current ? "block" : "hidden lg:flex items-center justify-center"}`}>
          {!current ? (
            <div className="text-center text-neutral-400"><MailOpen size={40} className="mx-auto mb-3 opacity-40" /><p className="text-sm">Pilih pesan untuk membacanya</p></div>
          ) : (
            <div>
              <button onClick={() => setOpenId(null)} className="lg:hidden inline-flex items-center gap-1.5 text-sm text-accent mb-4"><ArrowLeft size={16} /> Kembali</button>
              <div className="flex items-start justify-between gap-4 mb-6">
                <div className="min-w-0">
                  <h2 className="text-xl font-bold text-neutral-900 break-words">{current.subject || "(tanpa subjek)"}</h2>
                  <p className="text-sm text-neutral-500 mt-1 break-words"><b className="text-neutral-700">{current.name}</b> · {current.email}</p>
                  <p className="text-xs text-neutral-400 mt-0.5">{when(current.created_at)}</p>
                </div>
              </div>
              <div className="rounded-xl bg-surface/70 p-5 text-neutral-700 leading-relaxed whitespace-pre-wrap break-words">{current.message}</div>
              <div className="flex flex-wrap gap-2 mt-6">
                <a href={`mailto:${current.email}?subject=${encodeURIComponent("Re: " + (current.subject || "Pesan untuk KMKC"))}`} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-gradient text-white text-sm font-semibold shadow-md shadow-blue-500/25"><Reply size={16} /> Balas via email</a>
                <button onClick={() => mark([current.id], !isRead(current))} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl ring-1 ring-border text-sm font-medium text-neutral-600 hover:ring-accent/50">
                  {isRead(current) ? <><Mail size={16} /> Tandai belum dibaca</> : <><MailOpen size={16} /> Tandai dibaca</>}
                </button>
                {!confirmDel ? (
                  <button onClick={() => setConfirmDel(true)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl ring-1 ring-border text-sm font-medium text-red-500 hover:ring-red-200 ml-auto"><Trash2 size={16} /> Hapus</button>
                ) : (
                  <div className="ml-auto flex items-center gap-2 text-sm">
                    <span className="text-neutral-500">Hapus permanen?</span>
                    <button onClick={remove} disabled={busy} className="px-3.5 py-2 rounded-lg bg-red-500 text-white font-semibold inline-flex items-center gap-1.5">{busy && <Loader2 size={13} className="animate-spin" />} Ya</button>
                    <button onClick={() => setConfirmDel(false)} className="px-3.5 py-2 rounded-lg text-neutral-500 hover:bg-surface">Batal</button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
