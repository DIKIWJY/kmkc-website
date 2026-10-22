"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { signIn } from "@/lib/admin/actions";

export default function LoginForm({ notice }: { notice?: string }) {
  const [state, action, pending] = useActionState(signIn, undefined);
  const [show, setShow] = useState(false);
  const error = state?.error ?? notice;

  return (
    <form action={action} className="space-y-4">
      <div className="ad-card overflow-hidden">
        <label htmlFor="email" className="sr-only">Email</label>
        <input
          id="email" name="email" type="email" required autoComplete="username" autoFocus placeholder="Email"
          className="block h-14 w-full bg-transparent px-4 text-[16px] outline-none placeholder:text-[#a1a1a6] focus:bg-[var(--ad-blue-soft)]/40"
        />
        <div className="relative border-t border-[var(--ad-line)]">
          <label htmlFor="password" className="sr-only">Kata sandi</label>
          <input
            id="password" name="password" type={show ? "text" : "password"} required autoComplete="current-password" placeholder="Kata sandi"
            className="block h-14 w-full bg-transparent px-4 pr-12 text-[16px] outline-none placeholder:text-[#a1a1a6] focus:bg-[var(--ad-blue-soft)]/40"
          />
          <button
            type="button" onClick={() => setShow(!show)}
            className="ad-icon-btn absolute right-2 top-1/2 -translate-y-1/2"
            aria-label={show ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
          >
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      {error && <p role="alert" className="rounded-[10px] bg-[var(--ad-red-soft)] px-3.5 py-2.5 text-[13.5px] text-[var(--ad-red)]">{error}</p>}

      <button disabled={pending} className="ad-btn ad-btn-primary ad-btn-lg w-full">
        {pending ? <><Loader2 size={18} className="animate-spin" /> Memeriksa…</> : "Masuk"}
      </button>
    </form>
  );
}
