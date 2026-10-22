"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { Check, X, AlertCircle } from "lucide-react";

type Kind = "success" | "error";
interface T { id: number; kind: Kind; text: string }
const Ctx = createContext<(kind: Kind, text: string) => void>(() => {});

export const useToast = () => useContext(Ctx);

let seq = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<T[]>([]);
  const push = useCallback((kind: Kind, text: string) => {
    const id = ++seq;
    setItems((l) => [...l.slice(-3), { id, kind, text }]);
    setTimeout(() => setItems((l) => l.filter((x) => x.id !== id)), kind === "error" ? 6500 : 3200);
  }, []);

  return (
    <Ctx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:pb-6" role="status" aria-live="polite">
        {items.map((t) => (
          <div
            key={t.id}
            className="ad-toast pointer-events-auto flex max-w-[min(92vw,460px)] items-start gap-3 rounded-2xl bg-[rgba(29,29,31,0.94)] py-3 pl-3.5 pr-2.5 text-[14px] leading-snug text-white shadow-[0_12px_40px_rgba(0,0,0,0.3)] backdrop-blur-xl"
          >
            <span className={`mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${t.kind === "success" ? "bg-[#0a84ff]" : "bg-[#ff453a]"}`}>
              {t.kind === "success" ? <Check size={13} strokeWidth={3} /> : <AlertCircle size={13} strokeWidth={2.6} />}
            </span>
            <span className="flex-1 py-px">{t.text}</span>
            <button onClick={() => setItems((l) => l.filter((x) => x.id !== t.id))} className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white/55 hover:bg-white/10 hover:text-white" aria-label="Tutup">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
