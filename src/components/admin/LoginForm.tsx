"use client";

import { useActionState, useState } from "react";
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { signIn } from "@/lib/admin/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginForm({ notice }: { notice?: string }) {
  const [state, action, pending] = useActionState(signIn, undefined);
  const [show, setShow] = useState(false);
  const error = state?.error ?? notice;

  return (
    <form action={action} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required autoComplete="username" autoFocus placeholder="nama@email.com" className="h-10" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Kata sandi</Label>
        <div className="relative">
          <Input
            id="password" name="password" type={show ? "text" : "password"} required autoComplete="current-password"
            placeholder="Kata sandi" className="h-10 pe-11"
          />
          <Button
            type="button" variant="ghost" size="icon" onClick={() => setShow(!show)}
            className="absolute end-1 top-1/2 size-8 -translate-y-1/2 text-muted-foreground"
            aria-label={show ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
          >
            {show ? <EyeOff /> : <Eye />}
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" role="alert">
          <AlertCircle />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" disabled={pending} size="lg" className="w-full">
        {pending ? <><Loader2 className="animate-spin" /> Memeriksa…</> : "Masuk"}
      </Button>
    </form>
  );
}
