"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

/** Baris saklar dengan judul dan keterangan (dipakai di dalam kartu bergaris `divide-y`). */
export function SwitchRow({ id, label, desc, checked, onChange, disabled }: {
  id: string; label: string; desc: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-4 px-4 py-3", disabled && "opacity-50")}>
      <div className="min-w-0">
        <Label htmlFor={id} className="text-sm font-normal">{label}</Label>
        <p className="mt-0.5 text-[13px] text-muted-foreground">{desc}</p>
      </div>
      <Switch id={id} checked={checked && !disabled} disabled={disabled} onCheckedChange={onChange} />
    </div>
  );
}

/** Baris kotak centang dengan judul dan keterangan; seluruh baris bisa diklik. */
export function CheckRow({ id, label, desc, checked, onChange }: {
  id: string; label: string; desc: React.ReactNode; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-3 px-4 py-3 transition-colors hover:bg-accent/40">
      <Checkbox id={id} checked={checked} onCheckedChange={(v) => onChange(v === true)} className="mt-0.5 rounded-[5px]" />
      <span className="min-w-0 flex-1">
        <span className="block text-sm">{label}</span>
        <span className="block text-[13px] text-muted-foreground">{desc}</span>
      </span>
    </label>
  );
}

/** Pilihan satu dari beberapa (segmen) dengan judul di atasnya. */
export function Seg<T extends string>({ label, value, options, onChange }: {
  label: string; value: T; options: [T, string][]; onChange: (v: T) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm leading-none font-medium">{label}</p>
      <Tabs value={value} onValueChange={(v) => onChange(v as T)}>
        <TabsList aria-label={label} className="h-auto flex-wrap justify-start">
          {options.map(([v, t]) => <TabsTrigger key={v} value={v} className="px-3 py-1.5">{t}</TabsTrigger>)}
        </TabsList>
      </Tabs>
    </div>
  );
}
