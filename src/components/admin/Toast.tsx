"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

type Kind = "success" | "error";
interface T { id: number; kind: Kind; text: string }
const Ctx = createContext<(kind: Kind, text: string) => void>(() => {});

export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<T[]>([]);
  const push = useCallback((kind: Kind, text: string) => {
    const id = Date.now() + Math.random();
    setItems((l) => [...l, { id, kind, text }]);
    setTimeout(() => setItems((l) => l.filter((x) => x.id !== id)), kind === "error" ? 6000 : 3200);
  }, []);

  return (
    <Ctx.Provider value={push}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-[92vw] sm:max-w-sm" aria-live="polite">
        {items.map((t) => (
          <div
            key={t.id}
            className={`flex items-start gap-3 rounded-xl px-4 py-3 shadow-xl text-sm animate-fade-in-up ${
              t.kind === "success" ? "bg-white text-neutral-800 ring-1 ring-sky-200" : "bg-white text-neutral-800 ring-1 ring-red-200"
            }`}
          >
            {t.kind === "success" ? <CheckCircle2 size={18} className="text-sky-500 shrink-0 mt-0.5" /> : <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />}
            <span className="flex-1">{t.text}</span>
            <button onClick={() => setItems((l) => l.filter((x) => x.id !== t.id))} className="text-neutral-400 hover:text-neutral-700" aria-label="Tutup">
              <X size={15} />
            </button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
