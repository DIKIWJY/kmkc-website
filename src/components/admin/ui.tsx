import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Badge as UiBadge } from "@/components/ui/badge";

/** Judul halaman + tombol aksi di kanan. Tanpa hook: aman dipakai di server maupun client. */
export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: ReactNode; children?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between lg:mb-8">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {children && <div className="flex shrink-0 flex-wrap items-center gap-2">{children}</div>}
    </header>
  );
}

/** Bagian bertajuk (judul kecil di atas kartu). */
export function Section({ title, hint, action, children, className = "" }: { title: string; hint?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={className}>
      <div className="mb-3 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-base font-semibold tracking-tight">{title}</h2>
          {hint && <p className="mt-0.5 text-sm text-muted-foreground">{hint}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

/** Kartu polos (tanpa padding bawaan; atur lewat className). Daftar bergaris: tambahkan `divide-y`. */
export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={cn("rounded-xl border bg-card text-card-foreground shadow-xs", className)}>{children}</div>;
}

type Tone = "gray" | "blue" | "solid" | "red" | "green" | "amber";
const toneVariant: Record<Tone, "muted" | "info" | "default" | "danger" | "success" | "warning"> = {
  gray: "muted", blue: "info", solid: "default", red: "danger", green: "success", amber: "warning",
};

export function Badge({ tone = "gray", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <UiBadge variant={toneVariant[tone]} className={className}>{children}</UiBadge>;
}

export function EmptyState({ icon: Icon, title, text }: { icon: ElementType; title: string; text?: string }) {
  return (
    <div className="px-6 py-14 text-center">
      <span className="mx-auto mb-4 flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-5" strokeWidth={1.7} />
      </span>
      <p className="font-medium">{title}</p>
      {text && <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{text}</p>}
    </div>
  );
}
