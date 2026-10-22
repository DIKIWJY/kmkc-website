import type { ElementType, ReactNode } from "react";

/** Judul halaman besar ala Apple + tombol aksi di kanan. Tanpa hook: aman dipakai di server maupun client. */
export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: ReactNode; children?: ReactNode }) {
  return (
    <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 lg:gap-8 mb-6 lg:mb-9">
      <div className="min-w-0">
        <h1 className="ad-title">{title}</h1>
        {subtitle && <p className="ad-sub">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2 shrink-0">{children}</div>}
    </header>
  );
}

/** Bagian dengan judul di luar kartu (seperti Pengaturan iOS). */
export function Section({ title, hint, action, children, className = "" }: { title: string; hint?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={className}>
      <div className="flex items-end justify-between gap-4 mb-2.5 px-1">
        <div className="min-w-0">
          <h2 className="ad-h2">{title}</h2>
          {hint && <p className="text-[13px] text-[var(--ad-mute)] mt-0.5">{hint}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`ad-card ${className}`}>{children}</div>;
}

type Tone = "gray" | "blue" | "solid" | "red";
const toneClass: Record<Tone, string> = { gray: "", blue: "ad-badge-blue", solid: "ad-badge-solid", red: "ad-badge-red" };

export function Badge({ tone = "gray", children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`ad-badge ${toneClass[tone]}`}>{children}</span>;
}

export function EmptyState({ icon: Icon, title, text }: { icon: ElementType; title: string; text?: string }) {
  return (
    <div className="py-16 px-6 text-center">
      <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--ad-fill)] text-[var(--ad-faint)]">
        <Icon size={22} strokeWidth={1.7} />
      </span>
      <p className="font-semibold text-[var(--ad-ink)]">{title}</p>
      {text && <p className="mt-1 text-[var(--ad-mute)] max-w-sm mx-auto">{text}</p>}
    </div>
  );
}
