"use client";

import { useActionState, useState } from "react";
import { ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import { signIn } from "@/lib/admin/actions";

const field =
  "peer w-full bg-transparent border-0 border-b border-neutral-300 px-0 py-2.5 text-[15px] text-neutral-900 placeholder:text-neutral-300 focus:outline-none focus:border-primary focus:ring-0 transition-colors";
const label = "block text-xs font-semibold tracking-wide uppercase text-neutral-500 mb-1 peer-focus:text-primary";

export default function LoginForm({ notice }: { notice?: string }) {
  const [state, action, pending] = useActionState(signIn, undefined);
  const [show, setShow] = useState(false);
  const error = state?.error ?? notice;

  return (
    <form action={action} className="space-y-7" noValidate={false}>
      <div>
        <label htmlFor="email" className={label}>Email</label>
        <input id="email" name="email" type="email" required autoComplete="username" autoFocus placeholder="nama@email.com" className={field} />
      </div>
      <div>
        <label htmlFor="password" className={label}>Kata sandi</label>
        <div className="relative">
          <input id="password" name="password" type={show ? "text" : "password"} required autoComplete="current-password" placeholder="••••••••" className={`${field} pr-10`} />
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-0 top-1/2 -translate-y-1/2 p-1.5 text-neutral-400 hover:text-primary transition-colors"
            aria-label={show ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
          >
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-700 border-l-2 border-red-500 bg-red-50/60 pl-3 py-2">
          {error}
        </p>
      )}

      <button
        disabled={pending}
        className="group w-full h-12 rounded-lg bg-primary-dark hover:bg-primary text-white text-sm font-semibold inline-flex items-center justify-between px-5 transition-colors disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <span>{pending ? "Memeriksa…" : "Masuk ke dashboard"}</span>
        {pending ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />}
      </button>
    </form>
  );
}
